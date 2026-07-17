import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function tableName() {
  const name = process.env.TASKS_TABLE_NAME;

  if (!name) {
    throw new Error("TASKS_TABLE_NAME is not configured");
  }

  return name;
}

export async function createGoalPlan(input) {
  const goalPlan = {
    taskId: randomUUID(),
    goal: input.goal,
    deadline: input.deadline,
    dailyMinutes: Number(input.dailyMinutes),
    plan: input.plan ?? "[]",
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  };

  await dynamo.send(
    new PutCommand({
      TableName: tableName(),
      Item: goalPlan,
    })
  );

  return goalPlan;
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