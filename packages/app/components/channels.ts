import { useCurrentUser, useUser } from "./users";

export function useChannels() {
  return ["general", "quotes", "random"];
}

export function useChannelName(param: string): string {
  const [currentUser] = useCurrentUser();

  if (decodeURIComponent(param).includes("#")) {
    const members = decodeURIComponent(param)
      .split("#")
      .sort()
      .filter((m) => m !== currentUser?.id);

    if (members.length === 0) {
      return currentUser?.displayName || "myself";
    }

    return members.map((m) => useUser(m)?.displayName).join(", ");
  }

  return `#${param}`;
}
