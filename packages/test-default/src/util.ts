import AWSXRay from "aws-xray-sdk";
import { parse } from "url";
import https from "https";
import aws4, { Request } from "aws4";
import {
  AttributeValue,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { getDynamoDBClient } from "./dynamodb";
import { UserItem } from "./events/types";

async function awsFetch<T>(
  url: string,
  options: {
    method?: string;
    body?: string;
    headers?: { [key: string]: string };
  }
): Promise<{ statusCode: number; data?: T }> {
  const parsed = parse(url, true);

  if (!parsed.host) {
    throw new Error("Invalid URL");
  }

  const requestOptions: Request = {
    host: parsed.host || "",
    path: parsed.path || "",
    method: options.method || "GET",
    body: options.body,
    service: "execute-api",
    headers: {
      ...options.headers,
    },
  };

  const signed = aws4.sign(requestOptions);
  let capturedHttps = AWSXRay.captureHTTPs(https);

  return new Promise((resolve, reject) => {
    const req = capturedHttps.request(signed, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => {
        chunks.push(chunk);
      });
      res.on("end", () => {
        const data = Buffer.concat(chunks).toString();

        if (!data) {
          return resolve({
            statusCode: res.statusCode || 0,
          });
        }

        let parsed: T;
        try {
          parsed = JSON.parse(data) as T;
        } catch (e) {
          parsed = undefined as T;
          console.error(e, data);
        }

        resolve({
          statusCode: res.statusCode || 0,
          data: parsed,
        });
      });
    });
    req.on("error", (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

export async function sendMessageToConnection(
  event: APIGatewayProxyWebsocketEventV2,
  connectionId: string,
  message: string
) {
  return await awsFetch(
    `https://${event.requestContext.domainName}/${event.requestContext.stage}/@connections/${connectionId}`,
    {
      method: "POST",
      body: message,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export async function sendMessageToAllUsers(
  event: APIGatewayProxyWebsocketEventV2,
  message: string
) {
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

  const connections = await Promise.all(
    users.Items?.map(async (u) => {
      const results = await getDynamoDBClient().send(
        new QueryCommand({
          TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#sk": "sk",
          },
          ExpressionAttributeValues: {
            ":pk": { S: u.pk.S as string },
            ":sk": { S: "CONN#" },
          },
        })
      );

      return results.Items?.map((i) => i.sk.S as string) ?? [];
    }) ?? []
  );

  await Promise.allSettled(
    connections.flat().map(async (i) => {
      await sendMessageToConnection(event, i.replace("CONN#", ""), message);
    })
  );
}

export async function getUserByConnectionId(
  event: APIGatewayProxyWebsocketEventV2,
  connectionId: string
): Promise<Record<string, AttributeValue>> {
  const userConnections = await getDynamoDBClient().send(
    new QueryCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      IndexName: "sk-index",
      KeyConditionExpression: "#sk = :sk",
      ExpressionAttributeNames: {
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":sk": { S: `CONN#${connectionId}` },
      },
    })
  );

  try {
    const userPk = (userConnections.Items as UserItem[])
      .filter((i) => i.pk.S.startsWith("USER#"))
      .at(0);
    if (!userPk) {
      throw new Error(`No user found with connection Id ${connectionId}`);
    }

    const user = await getDynamoDBClient().send(
      new GetItemCommand({
        TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
        Key: {
          pk: { S: userPk.pk.S },
          sk: { S: "USER" },
        },
      })
    );

    return user.Item as UserItem;
  } catch (e) {
    throw new Error(`No user found with connection Id ${connectionId}`);
  }
}

export async function getUserIdByConnectionId(
  event: APIGatewayProxyWebsocketEventV2,
  connectionId: string
): Promise<string> {
  const userConnections = await getDynamoDBClient().send(
    new QueryCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      IndexName: "sk-index",
      KeyConditionExpression: "#sk = :sk",
      ExpressionAttributeNames: {
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":sk": { S: `CONN#${connectionId}` },
      },
    })
  );

  try {
    return (
      userConnections.Items?.filter((i) => i.pk.S?.startsWith("USER#")).map(
        (i) => i.pk.S?.replace("USER#", "")
      )[0] || ""
    );
  } catch (e) {
    throw new Error(`No user found with connection Id ${connectionId}`);
  }
}

export async function enforceRateLimit(
  event: APIGatewayProxyWebsocketEventV2,
  user: Record<string, AttributeValue>
) {
  console.log(JSON.stringify(user, null, 2));

  const now = Math.floor(Date.now() / 1000);
  const ttl = parseInt(user.sendMessageTtl?.N ?? "0", 10) ?? 0;
  const limit = parseInt(user.sendMessageLimit?.N ?? "1", 10) ?? 1;

  if (!ttl || ttl < now) {
    // re-set TTL and limit, then return
    getDynamoDBClient().send(
      new UpdateItemCommand({
        TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
        Key: {
          pk: { ...user.pk },
          sk: { ...user.sk },
        },
        UpdateExpression: "SET #ttl = :ttl, #limit = :limit",
        ExpressionAttributeNames: {
          "#ttl": "sendMessageTtl",
          "#limit": "sendMessageLimit",
        },
        ExpressionAttributeValues: {
          ":ttl": { N: `${Math.floor(Date.now() / 1000) + 60}` },
          ":limit": { N: "60" },
        },
      })
    );
  }

  if (ttl >= now && limit <= 0) {
    throw new Error("Rate limit exceeded");
  }

  // decrement limit
  getDynamoDBClient().send(
    new UpdateItemCommand({
      TableName: event.stageVariables?.DYNAMODB_TABLE_NAME,
      Key: {
        pk: { ...user.pk },
        sk: { ...user.sk },
      },
      UpdateExpression: "SET #limit = #limit - :one",
      ExpressionAttributeNames: {
        "#limit": "sendMessageLimit",
      },
      ExpressionAttributeValues: {
        ":one": { N: "1" },
      },
    })
  );
}
