import {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { getDynamoDBClient } from "../dynamodb";
import { sendMessageToConnection } from "../util";
import { QueryCommand } from "@aws-sdk/client-dynamodb";

export async function listUsers(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  const users = await getDynamoDBClient().send(
    new QueryCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      IndexName: "sk-index",
      KeyConditionExpression: "#sk = :sk",
      ExpressionAttributeNames: {
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":sk": { S: "USER" },
      },
    })
  );

  await sendMessageToConnection(
    event,
    event.requestContext.connectionId,
    JSON.stringify({
      event: "listUsers",
      detail: {
        users: users.Items?.map((u) => {
          return {
            id: u.pk.S?.replace("USER#", ""),
            handle: u.handle?.S,
            presence: parseInt(u.presence?.N ?? "0"),
          };
        }),
      },
    })
  );

  return { statusCode: 200 };
}
