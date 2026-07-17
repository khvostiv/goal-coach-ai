import { createGoalPlan, listGoalPlans } from "./tasks-db.mjs";

function getBodyProperties(event) {
  const properties =
    event.requestBody?.content?.["application/json"]?.properties ?? [];

  const result = {};

  for (const property of properties) {
    if (property.name && property.value !== undefined) {
      result[property.name] = property.value;
    }
  }

  return result;
}

function actionResponse(event, statusCode, body) {
  return {
    messageVersion: "1.0",
    response: {
      actionGroup: event.actionGroup,
      apiPath: event.apiPath,
      httpMethod: event.httpMethod,
      httpStatusCode: statusCode,
      responseBody: {
        "application/json": {
          body: JSON.stringify(body),
        },
      },
    },
    sessionAttributes: event.sessionAttributes ?? {},
    promptSessionAttributes: event.promptSessionAttributes ?? {},
  };
}

export async function handler(event) {
  try {
    const { apiPath, httpMethod } = event;

    if (apiPath === "/goals" && httpMethod === "POST") {
      const body = getBodyProperties(event);

      if (!body.goal?.trim()) {
        return actionResponse(event, 400, {
          error: "goal is required",
        });
      }

      const goalPlan = await createGoalPlan({
        goal: body.goal.trim(),
        deadline: body.deadline,
        dailyMinutes: Number(body.dailyMinutes),
        plan: "[]",
      });

      return actionResponse(event, 200, {
        message: `Goal plan created: ${goalPlan.goal}`,
        goalPlan,
      });
    }

    if (apiPath === "/goals" && httpMethod === "GET") {
      const goalPlans = await listGoalPlans();

      return actionResponse(event, 200, {
        count: goalPlans.length,
        goalPlans,
      });
    }

    return actionResponse(event, 404, {
      error: `Unsupported route: ${httpMethod} ${apiPath}`,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error ? error.message : "Unknown action group error";

    return actionResponse(event, 500, {
      error: message,
    });
  }
}