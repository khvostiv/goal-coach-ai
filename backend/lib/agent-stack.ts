import * as fs from "fs";
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as bedrock from "aws-cdk-lib/aws-bedrock";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

// Use the global inference profile for Nova 2 Lite (required for on-demand use).
export const FOUNDATION_MODEL = "global.amazon.nova-2-lite-v1:0";

const AGENT_INSTRUCTION = `
You are Goal Coach AI.

Your only job is to save user goals.

Required information:
- goal
- deadline (date or duration)
- dailyMinutes

If any information is missing, ask ONLY for the missing information.

When all three values are available:

1. Immediately call createGoalPlan exactly once.
2. Pass:
   - goal
   - deadline
   - dailyMinutes
3. Never explain that you are calling a function.
4. Never generate a plan before calling createGoalPlan.
5. Never output JSON.
6. Never output reasoning.
7. Never say "I will call..."
8. Never say "I will generate..."
9. Never expose tool names.

If createGoalPlan succeeds, respond exactly:

GOAL_CREATED

Your goal has been created successfully.

If createGoalPlan fails, simply apologize.
`;

export class AgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const goalPlansTable = new dynamodb.Table(this, "GoalPlansTable", {
      partitionKey: {
        name: "taskId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const agentRole = new iam.Role(this, "BedrockAgentRole", {
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      description: "Service role for the Goal Coach Bedrock Agent",
    });

    const agentRolePolicy = new iam.Policy(this, "BedrockAgentRolePolicy", {
      statements: [
        new iam.PolicyStatement({
          actions: [
            "bedrock:InvokeModel",
            "bedrock:InvokeModelWithResponseStream",
            "bedrock:GetInferenceProfile",
          ],
          resources: [
            `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/${FOUNDATION_MODEL}`,
            `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/us.amazon.nova-2-lite-v1:0`,
            `arn:aws:bedrock:*::foundation-model/amazon.nova-2-lite-v1:0`,
            `arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0`,
          ],
        }),
      ],
    });
    agentRole.attachInlinePolicy(agentRolePolicy);

    const actionGroupFunction = new lambda.Function(this, "ActionGroupFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/action-group")
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        TASKS_TABLE_NAME: goalPlansTable.tableName,
      },
    });

    goalPlansTable.grantReadWriteData(actionGroupFunction);
    actionGroupFunction.grantInvoke(agentRole);

    actionGroupFunction.addPermission("AllowBedrockAgentInvoke", {
      principal: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceAccount: this.account,
      sourceArn: `arn:aws:bedrock:${this.region}:${this.account}:agent/*`,
    });

    const openApiSchema = fs.readFileSync(
      path.join(__dirname, "../schemas/tasks-api.json"),
      "utf-8"
    );

    const bedrockAgent = new bedrock.CfnAgent(this, "GoalCoachAgentResource", {
      agentName: "GoalCoachAgent",
      description: "Autonomous AI goal coaching assistant",
      foundationModel: FOUNDATION_MODEL,
      instruction: AGENT_INSTRUCTION,
      agentResourceRoleArn: agentRole.roleArn,
      autoPrepare: true,
      idleSessionTtlInSeconds: 600,
      actionGroups: [
        {
          actionGroupName: "GoalPlanning",
          actionGroupState: "ENABLED",
          description:
          "Create and retrieve AI-generated goal plans stored in DynamoDB",
          actionGroupExecutor: {
            lambda: actionGroupFunction.functionArn,
          },
          apiSchema: {
            payload: openApiSchema,
          },
        },
      ],
    });

    bedrockAgent.node.addDependency(actionGroupFunction);
    // Agent must update AFTER the role policy exists (inference profile permissions).
    bedrockAgent.node.addDependency(agentRolePolicy);

    const proxyFunction = new lambda.Function(this, "ProxyFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/proxy")),
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        TASKS_TABLE_NAME: goalPlansTable.tableName,
        AGENT_ID: bedrockAgent.attrAgentId,
        AGENT_ALIAS_ID: "TSTALIASID",
      },
    });

    const morningTopic = new sns.Topic(this, "MorningCoachTopic", {
      displayName: "Goal Coach Daily Messages",
    });

    morningTopic.addSubscription(
      new subscriptions.EmailSubscription("vasilina664@gmail.com")
    );

    const morningCoachFunction = new lambda.Function(this, "MorningCoachFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        path.join(__dirname, "../lambda/morning-coach")
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        TASKS_TABLE_NAME: goalPlansTable.tableName,
        TOPIC_ARN: morningTopic.topicArn,
      },
    });


    morningTopic.grantPublish(morningCoachFunction);

    const morningRule = new events.Rule(this, "MorningCoachSchedule", {
      ruleName: "GoalCoachMorningSchedule",
      schedule: events.Schedule.cron({
        minute: "0",
        hour: "3",
      }),
    });

    morningCoachFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: [
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/${FOUNDATION_MODEL}`,
          `arn:aws:bedrock:*::foundation-model/amazon.nova-2-lite-v1:0`,
        ],
      })
    );
    
    morningRule.addTarget(
      new targets.LambdaFunction(morningCoachFunction)
    );
    
    goalPlansTable.grantReadData(morningCoachFunction);

    goalPlansTable.grantReadWriteData(proxyFunction);

    proxyFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeAgent"],
        resources: [
          bedrockAgent.attrAgentArn,
          `arn:aws:bedrock:${this.region}:${this.account}:agent-alias/${bedrockAgent.attrAgentId}/*`,
        ],
      })
    );

    proxyFunction.node.addDependency(bedrockAgent);

    const api = new apigateway.RestApi(this, "AgentApi", {
      restApiName: "Goal Coach AI API",
      description: "API for Goal Coach AI",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    api.root.addResource("chat").addMethod(
      "POST",
      new apigateway.LambdaIntegration(proxyFunction)
    );

    api.root.addResource("goals").addMethod(
      "GET",
      new apigateway.LambdaIntegration(proxyFunction)
    );

    // RestApi adds a duplicate Endpoint output; keep only our student-facing ApiUrl.
    api.node.tryRemoveChild("Endpoint");

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL — set as NEXT_PUBLIC_API_URL in the frontend",
    });
  }
}
