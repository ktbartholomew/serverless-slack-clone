import { AttributeValue } from "@aws-sdk/client-dynamodb";

export type WebSocketEvent<E, D> = {
  event: E;
  detail: D;
};

export type UserItem = {
  pk: { S: string };
  sk: { S: string };
  presence?: { N: string };
  sendMessageTtl?: { N: string };
  sendMessageLimit?: { N: string };
} & Record<string, AttributeValue>;

export type EchoEvent = WebSocketEvent<"echo", { message: string }>;
export type WatchRoomEvent = WebSocketEvent<"watchRoom", { room: string }>;
export type UnwatchRoomEvent = WebSocketEvent<"unwatchRoom", { room: string }>;
export type SendMessageEvent = WebSocketEvent<
  "sendMessage",
  { room: string; message: string }
>;
export type ListMessagesEvent = WebSocketEvent<
  "listMessages",
  { room: string }
>;
export type UpdatePresenceEvent = WebSocketEvent<
  "updatePresence",
  { user: string; presence: number }
>;
export type UserTypingEvent = WebSocketEvent<
  "userTyping",
  { user: string; room: string; timestamp: number }
>;
export type ListUsersEvent = WebSocketEvent<"listUsers", {}>;
