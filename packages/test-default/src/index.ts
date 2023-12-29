import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyWebsocketHandlerV2,
} from "aws-lambda";
import { joinRoom } from "./events/join-room";
import { sendMessageToConnection } from "./util";
import { EchoEvent, WebSocketEvent } from "./events/types";
import { listUsers } from "./events/list-users";
import { userTyping } from "./events/user-typing";
import { updatePresence } from "./events/update-presence";
import { listMessages } from "./events/list-messages";
import { sendMessage } from "./events/send-message";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async function (
  event
) {
  console.log(JSON.stringify(event, null, 2));

  try {
    const body: WebSocketEvent<string, any> = JSON.parse(event.body || "");

    switch (body.event) {
      case "echo":
        return await echo(event);
      case "joinRoom":
        return await joinRoom(event);
      case "sendMessage":
        return await sendMessage(event);
      case "listMessages":
        return await listMessages(event);
      case "updatePresence":
        return await updatePresence(event);
      case "userTyping":
        return await userTyping(event);
      case "listUsers":
        return await listUsers(event);
    }
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: (e as Error).message };
  }

  return { statusCode: 200 };
};

async function echo(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const body: EchoEvent = JSON.parse(event.body || "");

  await sendMessageToConnection(
    event,
    event.requestContext.connectionId,
    JSON.stringify({
      event: "echo",
      detail: { message: body.detail.message },
    })
  );

  return { statusCode: 200 };
}
