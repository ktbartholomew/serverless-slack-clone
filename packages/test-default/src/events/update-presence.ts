import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { getDynamoDBClient } from "../dynamodb";
import { getUserByConnectionId, sendMessageToAllUsers } from "../util";
import { UpdatePresenceEvent } from "./types";
import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";

export async function updatePresence(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const user = await getUserByConnectionId(
    event,
    event.requestContext.connectionId
  );

  const presence = Math.floor(Date.now() / 1000);

  await getDynamoDBClient().send(
    new UpdateItemCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      Key: {
        pk: { ...user.pk },
        sk: { ...user.sk },
      },
      UpdateExpression: "SET #presence = :presence",
      ExpressionAttributeNames: {
        "#presence": "presence",
      },
      ExpressionAttributeValues: {
        ":presence": { N: `${presence}` },
      },
    })
  );

  const ev: UpdatePresenceEvent = {
    event: "updatePresence",
    detail: {
      user: user.pk.S?.replace("USER#", "") as string,
      presence: presence,
    },
  };
  await sendMessageToAllUsers(event, JSON.stringify(ev));

  return { statusCode: 200 };
}
