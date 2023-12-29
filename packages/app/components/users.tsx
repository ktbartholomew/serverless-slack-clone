import { useCallback, useEffect, useState } from "react";
import { useRealtime } from "./realtime";

type User = { id: string; displayName: string; avatarClassName: string };

const users: { [key: string]: User } = {
  RfapeOt24VhjfJwuzKjur: {
    id: "RfapeOt24VhjfJwuzKjur",
    displayName: "Alice",
    avatarClassName: "bg-sky-300",
  },
  "zwn17MznDSVvJD4Z-KnNF": {
    id: "zwn17MznDSVvJD4Z-KnNF",
    displayName: "Bob",
    avatarClassName: "bg-orange-300",
  },
  jP3WGdnq9bJydLlY3BPxI: {
    id: "jP3WGdnq9bJydLlY3BPxI",
    displayName: "Trudy",
    avatarClassName: "bg-rose-300",
  },
  "DN37h9ZP9EnBvI0XNW-mi": {
    id: "DN37h9ZP9EnBvI0XNW-mi",
    displayName: "Carlos",
    avatarClassName: "bg-emerald-300",
  },
  BreNl8bKwvgzvajnnO8xj: {
    id: "BreNl8bKwvgzvajnnO8xj",
    displayName: "Keith Bartholomew",
    avatarClassName: "bg-purple-300",
  },
};

let sharedCurrentUser = "";

export function useCurrentUser(): [User | undefined, (id: string) => void] {
  const [currentUser, setUser] = useState(sharedCurrentUser);

  return [
    users[currentUser],
    (id: string) => {
      sharedCurrentUser = id;
      setUser(id);
    },
  ];
}

export function useUser(id: string): User | undefined {
  return users[id];
}

export function useUsers(): User[] {
  return Object.values(users);
}

export function usePresence() {
  const users = useUsers();
  const { socket, readyState } = useRealtime();

  const userPresenceMap = users.reduce((acc, user) => {
    acc[user.id] = 0;
    return acc;
  }, {} as { [userId: string]: number });

  const [presence, setPresence] = useState<{ [userId: string]: number }>(
    userPresenceMap
  );

  const isPresent = useCallback(
    (userId: string): boolean => {
      return Date.now() - presence[userId] < 120000;
    },
    [presence]
  );

  useEffect(() => {
    if (readyState !== WebSocket.OPEN) return;

    const onMessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data) as {
        event: string;
        detail: {
          presence: number;
          user: string;
          users?: { id: string; presence: number }[];
        };
      };

      switch (data.event) {
        case "updatePresence":
          setPresence((prev) => {
            const next = { ...prev };
            next[data.detail.user] = Math.floor(data.detail.presence * 1000);
            return next;
          });
          break;
        case "listUsers":
          setPresence((prev) => {
            const next = { ...prev };
            data.detail.users?.forEach((user) => {
              next[user.id] = Math.floor(user.presence * 1000);
            });
            return next;
          });

          break;
      }
    };

    socket?.addEventListener("message", onMessage);

    socket?.send(JSON.stringify({ event: "listUsers" }));

    return () => {
      socket?.removeEventListener("message", onMessage);
    };
  }, [socket, readyState]);

  return {
    isPresent,
  };
}

export function UserDisplayName({ id }: { id: string }) {
  const user = useUser(id);

  if (!user) {
    return "Member";
  }

  return <>{user.displayName}</>;
}

export function UserAvatar({ id }: { id: string }) {
  const user = useUser(id);

  if (!user) {
    return <div className="w-10 h-10 bg-gray-300 rounded-md"></div>;
  }

  return <div className={`w-10 h-10 rounded-md ${user.avatarClassName}`}></div>;
}

export function UserPresenceIndicator({
  id,
  present,
}: {
  id: string;
  present: boolean;
}) {
  const [cu] = useCurrentUser();
  const isPresent = id === cu?.id ? true : present;

  return (
    <span
      className={`inline-block w-2 h-2 mr-2 align-middle rounded-full border ${
        isPresent ? "bg-emerald-700  border-emerald-700" : "border-gray-400"
      }`}
    ></span>
  );
}
