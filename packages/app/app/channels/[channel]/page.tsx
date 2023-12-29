"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import ChannelsSidebar from "../../../components/channels-sidebar";
import Composer from "../../../components/composer";
import Message from "../../../components/message";
import { useRealtime } from "../../../components/realtime";
import { useCurrentUser } from "../../../components/users";
import { useChannelName } from "../../../components/channels";

export default function Page({ params }: { params: { channel: string } }) {
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const { socket } = useRealtime();
  const [currentUser] = useCurrentUser();
  const channelName = useChannelName(params.channel);

  const [messages, setMessages] = useState<
    {
      sender: string;
      message: ReactNode;
      timestamp: Date;
      unconfirmed?: boolean;
    }[]
  >([]);

  useEffect(() => {
    if (socket?.readyState !== WebSocket.OPEN) return;

    const onMessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data) as {
        event: string;
        detail: {
          room: string;
          message: string;
          messages?: any[];
          sender: string;
          timestamp: number;
        };
      };

      if (
        data.event === "listMessages" &&
        data.detail.room === decodeURIComponent(params.channel)
      ) {
        setMessages(
          data.detail.messages?.map((message: any) => ({
            sender: message.sender,
            message: message.message,
            timestamp: new Date(message.timestamp),
          })) || []
        );
        return;
      }

      if (
        data.event !== "sendMessage" ||
        data.detail.room !== decodeURIComponent(params.channel)
      )
        return;

      setMessages((prev) => {
        const next = [...prev.filter((message) => !message.unconfirmed)];

        next.push({
          sender: data.detail.sender,
          message: data.detail.message,
          timestamp: new Date(data.detail.timestamp),
        });

        return next;
      });
    };

    socket?.addEventListener("message", onMessage);

    socket?.send(
      JSON.stringify({
        event: "listMessages",
        detail: { room: decodeURIComponent(params.channel) },
      })
    );

    return () => {
      socket?.removeEventListener("message", onMessage);
    };
  }, [socket?.readyState, params.channel]);

  useEffect(() => {
    messageScrollRef.current?.scrollTo({
      top: messageScrollRef.current?.scrollHeight,
    });
  }, [messages.length]);

  const onSend = (message: string) => {
    setMessages((prev) => {
      const next = [...prev];

      next.push({
        sender: currentUser?.id || "",
        message,
        timestamp: new Date(),
        unconfirmed: true,
      });

      return next;
    });
  };

  return (
    <div className="grid grid-cols-[20%,auto]">
      <div className="bg-gray-950/55 rounded-l-md text-gray-200">
        <ChannelsSidebar activeChannel={params.channel} />
      </div>
      <div className="bg-white rounded-r-md flex flex-col max-h-[calc(100vh-44px)]">
        <div id="channel-header" className="p-4 border-gray-300 border-b">
          <span className="font-bold">{channelName}</span>
        </div>
        <div
          id="channel-messages"
          className="flex-auto overflow-y-scroll"
          ref={messageScrollRef}
        >
          {messages.map((message, i) => (
            <Message
              key={message.timestamp.getTime()}
              message={message.message}
              sender={message.sender}
              timestamp={message.timestamp}
              unconfirmed={message.unconfirmed}
            />
          ))}
        </div>
        <div id="channel-composer" className="p-4 pb-0">
          <Composer
            channel={decodeURIComponent(params.channel)}
            channelName={channelName}
            onSend={onSend}
            latestMessage={messages[messages.length - 1]}
          />
        </div>
      </div>
    </div>
  );
}
