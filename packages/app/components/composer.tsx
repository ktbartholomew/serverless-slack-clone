"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRealtime } from "./realtime";
import { useCurrentUser, useUsers } from "./users";

const SendIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4 block">
    <path
      fill="currentColor"
      d="M1.5 2.25a.755.755 0 0 1 1-.71l15.596 7.807a.73.73 0 0 1 0 1.306L2.5 18.46l-.076.018a.749.749 0 0 1-.924-.728v-4.54c0-1.21.97-2.229 2.21-2.25l6.54-.17c.27-.01.75-.24.75-.79s-.5-.79-.75-.79l-6.54-.17A2.253 2.253 0 0 1 1.5 6.789v-4.54Z"
    ></path>
  </svg>
);

export default function Composer({
  channel,
  channelName,
  onSend,
  latestMessage,
}: {
  channel: string;
  /**
   * A display name for the channel, e.g. `#general` or `Alice`.
   */
  channelName: string;
  latestMessage?: { timestamp: Date };
  onSend?: (message: string) => void;
}) {
  const [currentUser] = useCurrentUser();
  const users = useUsers();
  const { socket, readyState } = useRealtime();

  const [draftMessage, setDraftMessage] = useState("");
  const [draftRows, setDraftRows] = useState(1);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [typingEventSent, setTypingEventSet] = useState(0);
  const [userTypingMessage, setUserTypingMessage] = useState("");
  const [userTypingTimeout, setUserTypingTimeout] = useState<NodeJS.Timeout>();

  useEffect(() => {
    if (!draftMessage) return;
    if (Date.now() - typingEventSent < 15000) return;

    setTypingEventSet(Date.now());

    socket?.send(
      JSON.stringify({
        event: "userTyping",
        detail: { room: channel },
      })
    );
  }, [draftMessage, typingEventSent]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = JSON.parse(e.data) as {
        event: string;
        detail: {
          room: string;
          user: string;
          timestamp: number;
        };
      };

      if (
        data.event !== "userTyping" ||
        data.detail.room !== channel ||
        data.detail.user === currentUser?.id
      )
        return;

      clearTimeout(userTypingTimeout);
      setUserTypingMessage(
        `${
          users.find((u) => u.id === data.detail.user)?.displayName ??
          "somebody"
        } is typing…`
      );

      const to = setTimeout(() => setUserTypingMessage(""), 20000);
      setUserTypingTimeout(to);
    };

    socket?.addEventListener("message", handler);

    return () => socket?.removeEventListener("message", handler);
  }, [readyState, userTypingTimeout, latestMessage?.timestamp]);

  useEffect(() => {
    setUserTypingMessage("");
    clearTimeout(userTypingTimeout);
  }, [latestMessage?.timestamp]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    socket?.send(
      JSON.stringify({
        event: "sendMessage",
        detail: { room: channel, message: draftMessage },
      })
    );

    if (typeof onSend === "function") {
      onSend(draftMessage);
    }

    setDraftMessage("");
    setTypingEventSet(0);
    setDraftRows(1);
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <div className="composer-frame rounded-md border-gray-300 border flex">
        <textarea
          name="message"
          id="message"
          rows={draftRows}
          placeholder={`Message ${channelName}`}
          className="w-full p-2 rounded-lg outline-none resize-none"
          value={draftMessage}
          onChange={(e) => {
            setDraftMessage(e.target.value);
            setDraftRows(Math.min(e.target.value.split("\n").length, 10));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        ></textarea>
        <div className="p-2 flex items-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded-md ${
              draftMessage ? "bg-emerald-700 text-white" : "text-gray-300"
            }`}
          >
            <SendIcon />
          </button>
        </div>
      </div>
      <div className="h-6 text-xs text-gray-400 px-2">
        {readyState !== WebSocket.OPEN ? "Connecting…" : null}
        {userTypingMessage && <div className="pt-1">{userTypingMessage}</div>}
      </div>
    </form>
  );
}
