import AWSXRay from "aws-xray-sdk";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

let ddb: DynamoDBClient;

export function getDynamoDBClient(): DynamoDBClient {
  if (ddb) {
    return ddb;
  }

  ddb = AWSXRay.captureAWSv3Client(new DynamoDBClient({ region: "us-west-2" }));
  return ddb;
}
