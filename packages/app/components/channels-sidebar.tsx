"use client";

import Link from "next/link";
import { useChannels } from "./channels";
import {
  UserPresenceIndicator,
  useCurrentUser,
  usePresence,
  useUsers,
} from "./users";

export default function ChannelsSidebar({
  activeChannel,
}: {
  activeChannel?: string;
}) {
  const channels = useChannels();
  const users = useUsers();
  const [currentUser] = useCurrentUser();
  const { isPresent } = usePresence();

  return (
    <>
      <h3 className="p-4 font-bold">Channels</h3>
      <ul className="pl-4 pr-2">
        {channels.map((channel) => (
          <li
            className={`p-1 pl-2 rounded-md ${
              activeChannel === channel
                ? `bg-[rgb(var(--dt-color-plt-aubergine-80))]`
                : ""
            }`}
            key={channel}
          >
            <Link href={`/channels/${channel}`} className="block">
              #{channel}
            </Link>
          </li>
        ))}
      </ul>
      <h3 className="p-4 font-bold">DMs</h3>
      <ul className="pl-4 pr-2">
        {users.map((user) => (
          <li
            className={`p-1 pl-2 rounded-md whitespace-nowrap truncate ${
              decodeURIComponent(activeChannel || "") === `@${user.id}`
                ? `bg-[rgb(var(--dt-color-plt-aubergine-80))]`
                : ""
            }`}
            key={user.id}
          >
            <Link
              href={`/channels/${encodeURIComponent(
                [user.id, currentUser?.id].sort().join("#")
              )}`}
              className="block"
            >
              <UserPresenceIndicator
                id={user.id}
                present={isPresent(user.id)}
              />
              <span className="align-middle">{user.displayName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
