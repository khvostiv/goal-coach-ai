import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});
const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const TABLE_NAME = process.env.TASKS_TABLE_NAME;
const TOPIC_ARN = process.env.TOPIC_ARN;
const MODEL_ID = "global.amazon.nova-2-lite-v1:0";

function getDayNumber(startDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const today = new Date();

  const todayUtc = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    )
  );

  const difference = todayUtc.getTime() - start.getTime();

  return Math.floor(difference / 86_400_000) + 1;
}

async function generateMorningMessage(goal, dayNumber) {
  const prompt = `
You are Goal Coach AI.

Create today's personalized coaching lesson.

User goal: ${goal.goal}
Deadline or duration: ${goal.deadline}
Available time today: ${goal.dailyMinutes} minutes
Current day: ${dayNumber}

Progress the lesson logically for day ${dayNumber}.
Do not repeat beginner material every day.

IMPORTANT:
Do not use Markdown.
Do not use **, *, #, dashes, bullet lists, or backticks.
Return plain text only.

Use exactly this structure:

☀️ Good Morning!

🎯 Today's Focus

Topic: [today's topic]

⏱ Time: ${goal.dailyMinutes} minutes

📚 Today's Task:
[one practical task that fits within ${goal.dailyMinutes} minutes]

💡 Tip:
[one short practical tip]

👀 Tomorrow

Topic: [a logical topic for tomorrow]

Do not add any other sections.
Keep the message concise.
`;

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [
            {
              text: prompt,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 350,
        temperature: 0.4,
      },
    }),
  });

  const result = await bedrock.send(command);

  const responseBody = JSON.parse(
    new TextDecoder().decode(result.body)
  );

  const message =
    responseBody.output?.message?.content?.[0]?.text;

  if (!message) {
    throw new Error("Bedrock did not return a morning message");
  }

  return message.trim();
}

export async function handler() {
  console.log("Morning Coach started.");

  if (!TABLE_NAME || !TOPIC_ARN) {
    throw new Error("Required environment variables are missing");
  }

  const result = await dynamo.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  const goals = (result.Items || [])
    .filter((goal) => goal.status === "active")
    .sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );

  if (goals.length === 0) {
    console.log("No active goals found.");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "No active goals found.",
      }),
    };
  }

  const goal = goals[0];
  const dayNumber = getDayNumber(goal.startDate);

  const message = await generateMorningMessage(
    goal,
    dayNumber
  );

  await sns.send(
    new PublishCommand({
      TopicArn: TOPIC_ARN,
      Subject: `Goal Coach AI - Day ${dayNumber}`,
      Message: message,
    })
  );

  console.log(`Morning email sent for day ${dayNumber}.`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      dayNumber,
      goal: goal.goal,
    }),
  };
}