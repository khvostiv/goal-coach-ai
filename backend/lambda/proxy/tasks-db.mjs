import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function tableName() {
  const name = process.env.TASKS_TABLE_NAME;

  if (!name) {
    throw new Error("TASKS_TABLE_NAME is not configured");
  }

  return name;
}

export async function listGoalPlans() {
  const result = await dynamo.send(
    new ScanCommand({
      TableName: tableName(),
    })
  );

  return (result.Items || []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}