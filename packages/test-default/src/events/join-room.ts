import { PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { getDynamoDBClient } from "../dynamodb";
import { getUserIdByConnectionId, sendMessageToConnection } from "../util";
import { WatchRoomEvent } from "./types";

export async function joinRoom(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const body: WatchRoomEvent = JSON.parse(event.body || "");

  const userId = await getUserIdByConnectionId(
    event,
    event.requestContext.connectionId
  );

  await getDynamoDBClient().send(
    new PutItemCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      Item: {
        pk: { S: `ROOM#${body.detail.room}` },
        sk: { S: `USER#${userId}` },
      },
    })
  );

  const connections = await getDynamoDBClient().send(
    new QueryCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":pk": { S: `ROOM#${body.detail.room}` },
        ":sk": { S: "CONN#" },
      },
    })
  );
  if (!connections.Items) {
    return { statusCode: 200 };
  }

  await Promise.allSettled(
    connections.Items.map(async (i) => {
      await sendMessageToConnection(
        event,
        (i.conn.S as string).replace("CONN#", ""),
        JSON.stringify({
          event: "userJoinedRoom",
          detail: {
            room: body.detail.room,
            user: userId,
          },
        })
      );
    })
  );

  return { statusCode: 200 };
}
