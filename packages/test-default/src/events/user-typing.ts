import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";

import { getUserByConnectionId, sendMessageToAllUsers } from "../util";
import { UserTypingEvent } from "./types";

export async function userTyping(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || "{}") as UserTypingEvent;
  const user = await getUserByConnectionId(
    event,
    event.requestContext.connectionId
  );

  const ev: UserTypingEvent = {
    event: "userTyping",
    detail: {
      user: user.pk.S?.replace("USER#", "") as string,
      room: body.detail.room ?? "",
      timestamp: Date.now() / 1000,
    },
  };
  await sendMessageToAllUsers(event, JSON.stringify(ev));

  return { statusCode: 200 };
}
