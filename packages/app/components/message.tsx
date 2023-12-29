import { ReactNode } from "react";
import { UserAvatar, UserDisplayName } from "./users";

export default function Message({
  message,
  sender,
  timestamp,
  unconfirmed,
}: {
  message: ReactNode;
  sender: string;
  timestamp: Date;
  unconfirmed?: boolean;
}) {
  const onlyEmojis: boolean =
    typeof message === "string" &&
    !!message.match(
      /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+?$/
    );

  return (
    <div className="py-2 px-4 flex gap-2 hover:bg-gray-50">
      <div>
        <UserAvatar id={sender} />
      </div>
      <div>
        <div className="mb-1 leading-none">
          <span className="font-bold inline-block mr-3">
            <UserDisplayName id={sender} />
          </span>
          <span
            className="text-xs text-gray-400"
            title={timestamp.toLocaleString()}
          >
            {timestamp.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div
          className={`${unconfirmed ? "text-gray-400" : ""} ${
            onlyEmojis ? "text-2xl" : ""
          }`}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
