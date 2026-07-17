import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { randomUUID } from "crypto";
import { listGoalPlans } from "./tasks-db.mjs";

const bedrockAgent = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const AGENT_ID = process.env.AGENT_ID || "";
const AGENT_ALIAS_ID = process.env.AGENT_ALIAS_ID || "TSTALIASID";

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function stripFunctionMarkup(text) {
  return text
    .replace(/<__function[^>]*>[\s\S]*?<\/__function>/gi, "")
    .replace(/<function[^>]*>[\s\S]*?<\/__?function>/gi, "")
    .replace(/<__parameter=\w+>[\s\S]*?<\/__parameter>/gi, "")
    .replace(/<\/?__?function[^>]*>/gi, "")
    .replace(/^\s*thought:\s*$/gim, "")
    .trim();
}

async function invokeBedrockAgent(message, sessionId) {
  const command = new InvokeAgentCommand({
    agentId: AGENT_ID,
    agentAliasId: AGENT_ALIAS_ID,
    sessionId,
    inputText: message,
    enableTrace: false,
  });

  const result = await bedrockAgent.send(command);
  let completion = "";

  if (result.completion) {
    for await (const chunk of result.completion) {
      if (chunk.chunk?.bytes) {
        completion += new TextDecoder().decode(chunk.chunk.bytes);
      }
    }
  }

  return completion.trim();
}

async function getAgentReply(message, sessionId) {
  const rawReply = await invokeBedrockAgent(message, sessionId);
  const cleanedReply = stripFunctionMarkup(rawReply);

  return (
    cleanedReply ||
    "I couldn't complete that request. Please try again."
  );
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return response(200, { message: "OK" });
    }

    const path = event.path?.replace(/\/+$/, "") || "";

    if (event.httpMethod === "GET" && path.endsWith("/goals")) {
      const goals = await listGoalPlans();
      return response(200, { goals });
    }

    if (event.httpMethod === "POST" && path.endsWith("/chat")) {
      if (!AGENT_ID) {
        return response(500, {
          error: "Agent is not configured",
          details: "AGENT_ID environment variable is missing",
        });
      }

      if (!event.body) {
        return response(400, { error: "Missing request body" });
      }

      const body = JSON.parse(event.body);

      if (!body.message?.trim()) {
        return response(400, { error: "Message is required" });
      }

      const sessionId = body.sessionId?.trim() || randomUUID();

      const goalsBefore = await listGoalPlans();
      const existingGoalIds = new Set(
        goalsBefore.map((goal) => goal.taskId)
      );
      
      const agentReply = await getAgentReply(
        body.message.trim(),
        sessionId
      );
      
      let goalCreated = false;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const goalsAfter = await listGoalPlans();
      
        goalCreated = goalsAfter.some(
          (goal) => !existingGoalIds.has(goal.taskId)
        );
      
        if (goalCreated) {
          break;
        }
      
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      
      return response(200, {
        message: agentReply,
        sessionId,
        goalCreated,
      });
    }

    return response(404, { error: "Route not found" });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error ? error.message : "Unknown backend error";

    return response(500, {
      error: "Something went wrong",
      details: message,
    });
  }
}