import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { getDynamoDBClient } from "../dynamodb";
import {
  enforceRateLimit,
  getUserByConnectionId,
  sendMessageToConnection,
} from "../util";
import { SendMessageEvent } from "./types";
import { PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

let a: APIGatewayProxyResultV2;

export async function sendMessage(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const body: SendMessageEvent = JSON.parse(event.body || "");

  const user = await getUserByConnectionId(
    event,
    event.requestContext.connectionId
  );

  try {
    await enforceRateLimit(event, user);
  } catch (e) {
    console.error(e);
    return { statusCode: 429 };
  }

  const roomPK = `ROOM#${body.detail.room}`;

  if (body.detail.room.includes("#")) {
    const members = body.detail.room.split("#").sort();

    const results = await Promise.allSettled([
      getDynamoDBClient().send(
        new PutItemCommand({
          TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
          Item: {
            pk: { S: roomPK },
            sk: { S: `ROOM` },
          },
        })
      ),
      getDynamoDBClient().send(
        new PutItemCommand({
          TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
          Item: {
            pk: { S: roomPK },
            sk: { S: `USER#${members[0]}` },
          },
        })
      ),
      getDynamoDBClient().send(
        new PutItemCommand({
          TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
          Item: {
            pk: { S: roomPK },
            sk: { S: `USER#${members[1]}` },
          },
        })
      ),
    ]);

    console.log(results);
  }

  const messageTimestamp = Date.now();
  getDynamoDBClient().send(
    new PutItemCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      Item: {
        pk: { S: roomPK },
        sk: { S: `MESSAGE#${messageTimestamp}` },
        message: { S: body.detail.message },
        user: { ...user.pk },
        ttl: { N: `${Math.floor(messageTimestamp / 1000) + 60 * 60 * 24}` },
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
    connections.Items?.map(async (i) => {
      return sendMessageToConnection(
        event,
        (i.conn.S as string).replace("CONN#", ""),
        JSON.stringify({
          event: "sendMessage",
          detail: {
            message: body.detail.message,
            room: body.detail.room,
            sender: (user.pk.S as string).replace("USER#", ""),
            timestamp: messageTimestamp,
          },
        })
      );
    })
  );

  return { statusCode: 200 };
}
