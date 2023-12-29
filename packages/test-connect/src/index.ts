import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyWebsocketHandlerV2,
} from "aws-lambda";

const ddb = new DynamoDBClient({ region: "us-west-2" });

export const handler: APIGatewayProxyWebsocketHandlerV2 = async function (
  event
) {
  console.log(JSON.stringify(event, null, 2));

  if (event.requestContext.eventType === "CONNECT") {
    const requestEvent = event as APIGatewayProxyWebsocketEventV2 & {
      headers: { [key: string]: string };
      queryStringParameters: { [key: string]: string };
    };
    const authHeader =
      requestEvent.headers["authorization"] ||
      requestEvent.headers["Authorization"];
    const authQuery = requestEvent.queryStringParameters?.authorization;

    if (!authHeader && !authHeader?.startsWith("Bearer ") && !authQuery) {
      return { statusCode: 401 };
    }

    const token = authHeader?.split(" ")?.at(1) || authQuery;

    console.log(`token: ${token}`);

    const allRooms =
      (
        await ddb.send(
          new QueryCommand({
            TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
            IndexName: "sk-index",
            KeyConditionExpression: "#sk = :sk",
            ExpressionAttributeNames: {
              "#sk": "sk",
            },
            ExpressionAttributeValues: {
              ":sk": { S: `USER#${token}` },
            },
          })
        )
      ).Items?.filter((i) => i.pk.S?.startsWith("ROOM#")).map(
        (i) => i.pk.S ?? ""
      ) ?? [];

    await Promise.all([
      ddb.send(
        new UpdateItemCommand({
          TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
          Key: {
            pk: { S: `USER#${token}` },
            sk: { S: "USER" },
          },
          UpdateExpression: "SET #presence = :presence",
          ExpressionAttributeNames: { "#presence": "presence" },
          ExpressionAttributeValues: {
            ":presence": { N: Math.floor(Date.now() / 1000).toString() },
          },
        })
      ),
      ddb.send(
        new PutItemCommand({
          TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
          Item: {
            pk: { S: `USER#${token}` },
            sk: { S: `CONN#${event.requestContext.connectionId}` },
            conn: { S: `CONN#${event.requestContext.connectionId}` },
          },
        })
      ),
      ...allRooms.map((room) =>
        ddb.send(
          new PutItemCommand({
            TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
            Item: {
              pk: { S: room },
              sk: { S: `CONN#${event.requestContext.connectionId}` },
              conn: { S: `CONN#${event.requestContext.connectionId}` },
            },
          })
        )
      ),
    ]);

    return { statusCode: 200 };
  }

  if (event.requestContext.eventType === "DISCONNECT") {
    const connections = await ddb.send(
      new QueryCommand({
        TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
        IndexName: "conn",
        KeyConditionExpression: "#conn = :conn",
        ExpressionAttributeNames: { "#conn": "conn" },
        ExpressionAttributeValues: {
          ":conn": { S: `CONN#${event.requestContext.connectionId}` },
        },
      })
    );

    if (!connections.Items) {
      return { statusCode: 200 };
    }

    console.log(`deleting ${connections.Count} connection records`);
    await Promise.allSettled(
      connections.Items.map(async (i) => {
        return ddb.send(
          new DeleteItemCommand({
            TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
            Key: {
              pk: { S: i.pk.S as string },
              sk: { S: i.sk.S as string },
            },
          })
        );
      })
    );
  }

  return { statusCode: 200 };
};
