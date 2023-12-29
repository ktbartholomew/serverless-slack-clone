import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { getDynamoDBClient } from "../dynamodb";
import { sendMessageToConnection } from "../util";
import { ListMessagesEvent } from "./types";
import { QueryCommand } from "@aws-sdk/client-dynamodb";

export async function listMessages(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const body: ListMessagesEvent = JSON.parse(event.body || "");

  const messages = await getDynamoDBClient().send(
    new QueryCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":pk": { S: `ROOM#${body.detail.room}` },
        ":sk": { S: "MESSAGE#" },
      },
    })
  );

  console.log(`Found ${messages.Items?.length} messages`);

  await sendMessageToConnection(
    event,
    event.requestContext.connectionId,
    JSON.stringify({
      event: "listMessages",
      detail: {
        messages: messages.Items?.map((m) => {
          return {
            message: m.message.S,
            sender: m.user.S?.replace("USER#", ""),
            timestamp: parseInt(m.sk.S?.replace("MESSAGE#", "") ?? "0"),
          };
        }),
        room: body.detail.room,
      },
    })
  );

  return { statusCode: 200 };
}
