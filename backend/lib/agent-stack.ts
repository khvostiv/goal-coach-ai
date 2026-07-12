import * as fs from "fs";
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as bedrock from "aws-cdk-lib/aws-bedrock";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

// Use the global inference profile for Nova 2 Lite (required for on-demand use).
export const FOUNDATION_MODEL = "global.amazon.nova-2-lite-v1:0";

const AGENT_INSTRUCTION = `You are ProjectPilot AI, an engineering project planning assistant.

When the user describes an engineering project:

1. Create a concise implementation plan with 5 numbered steps.
2. Select the first practical step from that plan.
3. Call createTask exactly ONCE to save that first step.
4. Then show the full 5-step plan in friendly plain English.

For the saved task use:
- short clear title
- relevant category
- priority high, medium, or low
- dueDate unknown unless provided
- originalRequest equal to the user's exact message

Never call createTask more than once per message.
Never display tool calls, XML, function tags, JSON, or internal syntax.

When asked to list tasks, call listTasks.
When asked to update a task, call listTasks first and then updateTask.

Keep responses concise and practical.`;

export class AgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tasksTable = new dynamodb.Table(this, "TasksTable", {
      partitionKey: {
        name: "taskId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const agentRole = new iam.Role(this, "BedrockAgentRole", {
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      description: "Service role for the task tracker Bedrock Agent",
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
        TASKS_TABLE_NAME: tasksTable.tableName,
      },
    });

    tasksTable.grantReadWriteData(actionGroupFunction);
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

    const bedrockAgent = new bedrock.CfnAgent(this, "TaskTrackerAgent", {
      agentName: "ProjectPilotAgent",
      description: "AI-powered engineering project planning assistant",
      foundationModel: FOUNDATION_MODEL,
      instruction: AGENT_INSTRUCTION,
      agentResourceRoleArn: agentRole.roleArn,
      autoPrepare: true,
      idleSessionTtlInSeconds: 600,
      actionGroups: [
        {
          actionGroupName: "TaskManagement",
          actionGroupState: "ENABLED",
          description:
          "Create, list, and update engineering project tasks stored in DynamoDB",
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
        TASKS_TABLE_NAME: tasksTable.tableName,
        AGENT_ID: bedrockAgent.attrAgentId,
        AGENT_ALIAS_ID: "TSTALIASID",
      },
    });

    tasksTable.grantReadWriteData(proxyFunction);

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
      restApiName: "ProjectPilot AI API",
      description: "API for ProjectPilot AI",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    api.root.addResource("chat").addMethod(
      "POST",
      new apigateway.LambdaIntegration(proxyFunction)
    );

    const tasksResource = api.root.addResource("tasks");
    tasksResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(proxyFunction)
    );

    const taskResource = tasksResource.addResource("{taskId}");
    taskResource.addMethod(
      "PATCH",
      new apigateway.LambdaIntegration(proxyFunction)
    );
    taskResource.addMethod(
      "DELETE",
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
