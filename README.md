# Goal Coach AI – AI-Powered Daily Goal Planning Assistant

Goal Coach AI is a serverless AI-powered application that helps users achieve long-term goals through personalized daily coaching. Built with **Amazon Bedrock Agents**, **Amazon Nova**, **AWS Lambda**, **Amazon API Gateway**, **Amazon DynamoDB**, **Amazon EventBridge**, **Amazon SNS**, **AWS CDK**, and **Next.js**, the application automatically transforms a user's goal into focused daily actions.

Users simply describe their goal, deadline, and available study time in natural language. The AI creates a personalized coaching plan, stores the goal in DynamoDB, and every morning automatically generates a new daily task and delivers it by email using Amazon SNS.

---

## Table of Contents

- [What You Will Build](#what-you-will-build)
- [Why This Project Uses Bedrock Agents](#why-this-project-uses-bedrock-agents)
- [Current UI Flow](#current-ui-flow)
- [Tech Stack](#tech-stack)
- [AWS Services Used](#aws-services-used)
- [Repository Structure](#repository-structure)
- [Cost Awareness](#cost-awareness)
- [Prerequisites](#prerequisites)
- [Create an AWS Account](#create-an-aws-account)
- [Create an IAM User and Sign In With `aws login`](#create-an-iam-user-and-sign-in-with-aws-login)
- [Important AWS Region](#important-aws-region)
- [Enable Amazon Bedrock Model Access](#enable-amazon-bedrock-model-access)
- [Clone the Repository](#clone-the-repository)
- [Install Frontend Dependencies](#install-frontend-dependencies)
- [Run the Frontend Locally](#run-the-frontend-locally)
- [Deploy the Backend](#deploy-the-backend)
- [Connect the Frontend to the Backend](#connect-the-frontend-to-the-backend)
- [Test the Application](#test-the-application)
- [Push Code to GitHub](#push-code-to-github)
- [Deploy Frontend With AWS Amplify](#deploy-frontend-with-aws-amplify)
- [IAM / Least Privilege](#iam--least-privilege)
- [Common Issues and Fixes](#common-issues-and-fixes)
- [Destroy AWS Resources](#destroy-aws-resources)
- [Current MVP Features](#current-mvp-features)
- [Future Improvements](#future-improvements)

---

## What You Will Build

```
User
↓
Next.js Frontend
↓
Amazon API Gateway
↓
Proxy Lambda
↓
Amazon Bedrock Agent
↓
Action Group Lambda
↓
Amazon DynamoDB
↓
Amazon EventBridge (Scheduled Every Morning)
↓
Morning Coach Lambda
↓
Amazon Nova
↓
Amazon SNS
↓
User Email
```

Example user input:

```
Pass the AWS Solutions Architect Associate exam by September 15, 2026.
I can study 60 minutes per day.
```

Example goal stored in DynamoDB:

```json
{
  "goal": "Pass the AWS Solutions Architect Associate exam",
  "deadline": "2026-09-15",
  "dailyMinutes": 60,
  "status": "active",
  "createdAt": "2026-07-17T14:30:00Z"
}
```

Example daily coaching email:

```
Today's Goal Coach Task

Spend 60 minutes reviewing Amazon VPC fundamentals.

Focus on:
• CIDR blocks
• Public vs Private Subnets
• Route Tables
```
---

## Why This Project Uses Bedrock Agents

The goal of this project is not just to generate AI text.

The goal is to build an **agentic workflow** where the AI understands a user's goal, decides what action to take, and interacts with backend services automatically.

```text
Understand the goal → choose the appropriate tool → save the goal → automate daily coaching
```

Amazon Bedrock Agent acts as the reasoning layer. It understands the user's natural language request and determines when to:

- create a new goal
- save goal details
- generate a personalized coaching plan
- prepare the daily coaching workflow

The agent uses an **Action Group** to call backend tools. The goal information is stored in Amazon DynamoDB, where it is later used by the scheduled morning workflow to generate personalized daily coaching.

---

## Current UI Flow

The application is divided into two pages to provide a simple and intuitive user experience.

### Page 1: Home

The home page includes:

- application overview
- active goal summary
- coaching status
- daily coaching information
- architecture highlights
- button to create or manage a goal

### Page 2: Goal Workspace

The workspace page includes:

- Amazon Bedrock Agent chat interface
- quick goal examples
- AI-powered goal creation
- coaching workflow status
- goal management
- automatic morning coaching setup

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- AWS CDK
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon Bedrock Agent
- Amazon Bedrock Action Group
- Amazon Nova
- Amazon EventBridge
- Amazon SNS
- OpenAPI schema
- CloudWatch Logs

### Deployment

- AWS CDK for infrastructure deployment
- AWS Amplify for frontend hosting
- GitHub for source control

---

## AWS Services Used

### Amazon Bedrock Agent

Acts as the AI reasoning engine that understands the user's goal and determines how to process the request.

### Amazon Bedrock Action Group

Provides the backend tools the agent can invoke through an OpenAPI schema to create and manage user goals.

### AWS Lambda

The project uses three Lambda functions:

- **Proxy Lambda**: receives frontend requests and invokes the Amazon Bedrock Agent.
- **Action Group Lambda**: processes agent requests and stores goal information in DynamoDB.
- **Morning Coach Lambda**: runs every morning, generates a personalized daily coaching task, and sends it by email.

### Amazon API Gateway

Provides a secure REST API that connects the Next.js frontend with the backend.

### Amazon DynamoDB

Stores user goals, deadlines, study time, and coaching status.

### Amazon EventBridge

Triggers the Morning Coach Lambda automatically every morning.

### Amazon Nova

Generates personalized daily coaching tasks based on the user's goal and progress.

### Amazon SNS

Delivers the generated coaching task to the user's email.

### AWS CDK

Defines and deploys the complete serverless infrastructure as code.

### Amazon CloudWatch

Stores logs for monitoring and debugging Lambda functions.

### AWS Amplify

Hosts the Next.js frontend application.

---

## Repository Structure

```text
goal-coach-ai/
├── src/
│   ├── app/
│   │   ├── workspace/
│   │   │   └── page.tsx           # Goal Workspace
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Home page
│   │
│   ├── components/
│   │   ├── ChatPanel.tsx          # Bedrock Agent chat interface
│   │   ├── SiteHeader.tsx         # Navigation bar
│   │   └── TaskList.tsx           # Goal dashboard
│   │
│   ├── lib/
│   │   └── api.ts                 # Frontend API helper functions
│   │
│   └── types/
│       └── task.ts                # Goal and chat types
│
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
│
└── backend/
    ├── bin/
    │   └── backend.ts             # CDK application entry point
│
    ├── lib/
    │   └── agent-stack.ts         # AWS infrastructure definition
│
    ├── schemas/
    │   └── tasks-api.json         # OpenAPI schema for Bedrock Action Group
│
    ├── lambda/
    │   ├── proxy/
    │   │   ├── index.mjs          # API Gateway → Bedrock Agent
    │   │   ├── task-intent.mjs    # Intent helper
    │   │   └── tasks-db.mjs       # DynamoDB helper functions
│   │
    │   ├── action-group/
    │   │   ├── index.mjs          # Goal management tools
    │   │   └── tasks-db.mjs
│   │
    │   └── morning-coach/
    │       └── index.mjs          # Generates and emails daily coaching tasks
│
    ├── cdk.json
    ├── package.json
    └── tsconfig.json
```

`.env.example` contains the template for `NEXT_PUBLIC_API_URL`. Copy it to `.env.local`, update it with your deployed API Gateway URL, and never commit `.env.local`.

---

## Cost Awareness

This project uses several AWS serverless services. For personal projects and testing, the cost is typically very low, but some services are not covered by the AWS Free Tier.

Typical cost sources include:

- **Amazon Bedrock (Nova Lite)** – charged per input and output token.
- **Amazon SNS** – small charge for email notifications after the Free Tier.
- **Amazon EventBridge** – minimal cost for scheduled events.
- **AWS Lambda, Amazon API Gateway, and Amazon DynamoDB** – usually remain within the AWS Free Tier for light usage.
- **AWS Amplify Hosting** – low cost for personal projects with minimal traffic.
- **Amazon CloudWatch** – small charges for log storage and monitoring.

Before deploying the project, it is recommended to create an AWS Billing Budget so you receive email notifications if your spending exceeds a chosen threshold.

Always destroy unused backend resources when you finish testing:

```bash
cd backend
cdk destroy
```

This helps prevent unexpected AWS charges.

---

## Prerequisites

Install the following software before deploying the project.

| Tool | Minimum Version | Download |
|---|---|---|
| Node.js | **22.x LTS** | https://nodejs.org/en/download |
| Git | Latest version | https://git-scm.com/downloads |
| Visual Studio Code | Latest version | https://code.visualstudio.com/download |
| AWS CLI v2 | **2.32.0 or later** | https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html |
| AWS CDK | v2 | Installed with npm |
| GitHub Account | Required | https://github.com/join |
| AWS Account | Required | See **Create an AWS Account** |

If you need multiple Node.js versions, it is recommended to use **nvm (Node Version Manager)**.

**macOS/Linux**

https://github.com/nvm-sh/nvm

**Windows**

https://github.com/coreybutler/nvm-windows

```bash
nvm install 22
nvm use 22
```

Install the AWS CDK CLI globally:

```bash
npm install -g aws-cdk
```

Verify the installation:

```bash
node -v
npm -v
git --version
aws --version
cdk --version
```

`node -v` should display **v22.x LTS** (recommended).

If the CDK command is unavailable, try:

```bash
npx cdk --version
```

---

## Create an AWS Account

If you do not already have an AWS account:

1. Visit https://aws.amazon.com/free/.
2. Select **Create an AWS Account**.
3. Complete the registration process. A payment method is required, but you are only charged if your usage exceeds the AWS Free Tier or uses paid services such as Amazon Bedrock.
4. After signing in, avoid using the root account for everyday work. Instead, create an IAM user with the required permissions, as described in the next section.

---

## Create an IAM User and Sign In With `aws login`

The AWS CLI and AWS CDK require credentials to deploy resources to your AWS account.

This project uses the AWS CLI `aws login` command instead of long-term access keys. It securely authenticates using your AWS Management Console credentials and provides temporary credentials that automatically expire.

### 1. Verify your AWS CLI version

The `aws login` command requires AWS CLI **2.32.0 or later**.

```bash
aws --version
```

If your version is older, reinstall the AWS CLI from the link provided in the **Prerequisites** section.

### 2. Create an IAM User

Sign in to your AWS account as the root user (first time only) and open the IAM console:

https://console.aws.amazon.com/iam/home#/users

Create a new IAM user:

- Select **Users → Create user**
- Enable **Provide user access to the AWS Management Console**
- Create or generate a password

### 3. Attach Permissions

Attach the following AWS managed policies:

- **AdministratorAccess** – simplifies deployment by allowing the project to create AWS resources such as Lambda, API Gateway, DynamoDB, IAM roles, Amazon Bedrock resources, Amazon EventBridge, and Amazon SNS.
- **SignInLocalDevelopmentAccess** – enables the use of the `aws login` command.

For more information:

https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html

### 4. Sign in as the IAM User

Sign out of the root account and sign back in using your IAM user credentials.

### 5. Authenticate the AWS CLI

Run:

```bash
aws login
```

If prompted, choose your default region:

```text
us-east-1
```

Your browser will open the AWS sign-in page.

After authentication, verify the login:

```bash
aws sts get-caller-identity
```

You should see your AWS account ID and IAM user ARN.

### Additional Notes

- Credentials created by `aws login` are temporary and automatically expire (typically within 12 hours).
- To authenticate again, simply run:

```bash
aws login
```

- To sign out:

```bash
aws logout
```

- To use multiple AWS accounts:

```bash
aws login --profile <profile-name>
```

Later, deploy using:

```bash
cdk deploy --profile <profile-name>
```

---

## Important AWS Region

This project is designed to run in the following AWS region:

```text
us-east-1
```

For macOS/Linux:

```bash
export AWS_REGION=us-east-1
```

For Windows PowerShell:

```powershell
$env:AWS_REGION="us-east-1"
```

---

## Enable Amazon Bedrock Model Access

Before deploying or testing the application, enable access to the Amazon Nova model in Amazon Bedrock.

1. Sign in to the AWS Console.
2. Open **Amazon Bedrock**.
3. Verify that the selected region is **us-east-1**.
4. Navigate to **Model access**.
5. Select **Manage model access**.
6. Enable the Amazon Nova model used by this project.
7. Save your changes.

Depending on your AWS account, the model may appear as:

- Amazon Nova Lite
- Amazon Nova 2 Lite

This project uses **Amazon Nova 2 Lite** to provide fast responses while keeping inference costs low.

> **Note:** On new AWS accounts, model access may take several minutes before becoming available. If deployment or testing fails immediately after enabling access, wait a few minutes and try again.

---

## Clone the Repository

Clone the repository and open it in Visual Studio Code.

```bash
git clone https://github.com/khvostiv/goal-coach-ai.git
cd goal-coach-ai
code .
```

If `code .` does not work, open the project folder manually in Visual Studio Code.

---

## Install Frontend Dependencies

From the project root, install the frontend dependencies:

```bash
npm install
```

---

## Run the Frontend Locally

Start the development server:

```bash
npm run dev
```

Open your browser:

```text
http://localhost:3000
```

The Home page should appear.

The AI features will become available after the backend is deployed and `NEXT_PUBLIC_API_URL` is configured.

To stop the development server:

```text
Ctrl + C
```

---

## Deploy the Backend

Navigate to the backend directory:

```bash
cd backend
```

Install the backend dependencies:

```bash
npm install
```

Install the Lambda dependencies:

```bash
npm run package:lambdas
```

Set the AWS region.

macOS/Linux:

```bash
export AWS_REGION=us-east-1
```

Windows PowerShell:

```powershell
$env:AWS_REGION="us-east-1"
```

If required, install **esbuild**:

```bash
npm install --save-dev esbuild
```

Bootstrap AWS CDK (only once per AWS account and region):

```bash
npx cdk bootstrap
```

Deploy the infrastructure:

```bash
npx cdk deploy
```

When prompted:

```text
Do you wish to deploy these changes?
```

Type:

```text
y
```

After deployment, copy the API URL from the CDK output:

```text
GoalCoachStack.ApiUrl = https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

---

## Connect the Frontend to the Backend

Return to the project root:

```bash
cd ..
```

Create the local environment file:

macOS/Linux:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
copy .env.example .env.local
```

Open `.env.local` and set:

```text
NEXT_PUBLIC_API_URL=https://your-api-url.execute-api.us-east-1.amazonaws.com/prod
```

Example:

```text
NEXT_PUBLIC_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

Restart the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Then navigate to:

```text
http://localhost:3000/workspace
```

---

## Test the Application

Try entering a goal such as:

```text
I want to pass the AWS Solutions Architect Associate exam by September 15. I can study 60 minutes every day.
```

or

```text
Help me prepare for a Java Spring Boot interview in two months.
```

Expected behavior:

- The Amazon Bedrock Agent understands your goal.
- A personalized coaching plan is generated.
- Goal information is stored in Amazon DynamoDB.
- The morning coaching workflow is prepared.
- A personalized daily coaching email is automatically sent according to the scheduled EventBridge rule.

---

## Push Code to GitHub

Before pushing your changes, verify the repository status:

```bash
git status
```

Ensure the following folders are **not** committed:

```text
node_modules
.next
backend/cdk.out
backend/lambda/proxy/node_modules
backend/lambda/action-group/node_modules
backend/lambda/morning-coach/node_modules
```

Commit and push your changes:

```bash
git add .
git commit -m "Complete Goal Coach AI application"
git push origin main
```

If GitHub prompts for a password, use a **GitHub Personal Access Token (PAT)** instead.

---

## Deploy Frontend With AWS Amplify

1. Open **AWS Amplify** in the AWS Console.
2. Select the **us-east-1** region.
3. Choose **Create new app**.
4. Select **Host web app**.
5. Choose **GitHub** and authorize the AWS Amplify GitHub App if prompted.
6. Select the repository:

```text
khvostiv/goal-coach-ai
```

7. Select the **main** branch.
8. Use the default build settings (or update them if required by your project).
9. Under **Environment variables**, add:

```text
NEXT_PUBLIC_API_URL
```

Value:

```text
https://your-api-url.execute-api.us-east-1.amazonaws.com/prod
```

10. Choose **Save and deploy**.

After deployment, AWS Amplify will provide a public URL where the application is available.

---

## IAM / Least Privilege

For development and testing, the IAM user should have permissions for the AWS services used by this project.

Required service areas include:

- AWS CloudFormation
- IAM Roles and Policies
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon Bedrock
- Amazon Bedrock Agents
- Amazon EventBridge
- Amazon SNS
- Amazon CloudWatch
- Amazon S3 (CDK bootstrap assets)
- AWS Amplify (if hosting the frontend)

For learning or personal projects, **AdministratorAccess** is the simplest option.

For production environments, grant only the minimum permissions required.

---

## Common Issues and Fixes

### `aws command not found`

Restart your terminal or reinstall the AWS CLI.

Verify the installation:

```bash
aws --version
```

---

### AWS credentials expired

Temporary credentials created with `aws login` expire after several hours.

Authenticate again:

```bash
aws login
```

Verify the current identity:

```bash
aws sts get-caller-identity
```

If the `aws login` command is unavailable, install AWS CLI **2.32.0 or later**.

---

### Bedrock model access error

If deployment succeeds but requests to Amazon Bedrock fail, verify that:

- Amazon Nova 2 Lite is enabled in **Amazon Bedrock → Model access**
- The project is deployed in **us-east-1**
- Model access has finished provisioning (this may take several minutes on new AWS accounts)

---

### Frontend cannot connect to the backend

Verify that `.env.local` contains the correct API Gateway URL:

```text
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

After updating the file, restart the development server:

```bash
npm run dev
```

### Wrong AWS Region

This project must be deployed in:

```text
us-east-1
```

For macOS/Linux:

```bash
export AWS_REGION=us-east-1
```

For Windows PowerShell:

```powershell
$env:AWS_REGION="us-east-1"
```

---

### Amazon Bedrock Access Denied

Make sure the required Amazon Nova model is enabled in:

```text
Amazon Bedrock → Model access
```

Also verify that the AWS Console is set to `us-east-1`.

If model access was enabled recently, wait a few minutes and try again.

---

### CDK Deployment Fails

From the `backend` directory, reinstall dependencies and package the Lambda functions:

```bash
npm install
npm run package:lambdas
npx cdk deploy
```

If this is the first deployment in the AWS account and region, run:

```bash
npx cdk bootstrap
npx cdk deploy
```

---

### Frontend Says the API URL Is Missing

Make sure `.env.local` exists in the project root and contains:

```text
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

Do not add quotation marks or spaces.

Restart the frontend after changing the environment file:

```bash
npm run dev
```

---

### Failed to Fetch

Check the following:

- the backend deployed successfully
- the API Gateway URL was copied correctly
- `.env.local` contains the correct value
- the frontend was restarted after editing `.env.local`
- the API URL includes `https://` and `/prod`
- the browser console does not show CORS errors
- CloudWatch Logs do not show Lambda or Bedrock errors

---

### CORS Error in the Browser Console

If the browser displays a message such as `blocked by CORS policy`:

1. Confirm that the API URL in `.env.local` matches the `ApiUrl` output from `npx cdk deploy`.
2. Include `/prod` but avoid an extra trailing slash.
3. Confirm that the frontend is calling the deployed API Gateway endpoint.
4. Redeploy the backend from the `backend` directory:

```bash
npx cdk deploy
```

The CORS configuration is defined in the AWS CDK stack and is applied during deployment.

---

### Daily Coaching Email Is Not Received

Check the following:

- the Amazon SNS email subscription was confirmed
- the confirmation email is not in the spam folder
- the goal is stored in DynamoDB with an active status
- the EventBridge schedule is enabled
- the Morning Coach Lambda has permission to invoke Amazon Bedrock and publish to SNS
- CloudWatch Logs do not show errors for the Morning Coach Lambda

Amazon SNS will not send coaching emails until the recipient confirms the subscription.

---

### Amplify Build Fails

Make sure AWS Amplify uses Node.js 20 or later. Node.js 22 is recommended for this project.

The version can be configured in the Amplify build settings or through the build configuration file.

Also confirm that the following environment variable exists in Amplify:

```text
NEXT_PUBLIC_API_URL
```

After changing an environment variable, redeploy the Amplify application.

---

### GitHub Password Does Not Work

GitHub no longer accepts a normal account password for Git operations over HTTPS.

Use a GitHub Personal Access Token instead:

https://github.com/settings/tokens

---

## Destroy AWS Resources

To prevent unnecessary AWS charges, destroy the backend infrastructure when it is no longer needed.

From the project root:

```bash
cd backend
npx cdk destroy
```

When prompted:

```text
Are you sure you want to delete?
```

Enter:

```text
y
```

This removes the resources created by the AWS CDK stack, including:

- Amazon API Gateway
- Proxy Lambda
- Action Group Lambda
- Morning Coach Lambda
- Amazon DynamoDB table
- Amazon Bedrock Agent resources
- Amazon EventBridge schedule
- Amazon SNS resources created by the stack
- IAM roles and policies created by CDK
- AWS CloudFormation stack resources

Some resources may require manual cleanup.

Check and remove the following if they are no longer needed:

- AWS Amplify application
- CloudWatch log groups
- CDK bootstrap assets
- manually created IAM users or policies
- manually created SNS subscriptions
- local `.env.local` files containing deployment URLs

Destroying the CDK stack does not automatically delete the AWS Amplify application.

---

## Current MVP Features

- Modern two-page interface with a Home page and Goal Workspace
- Natural-language goal creation through an Amazon Bedrock Agent
- Goal, deadline, and daily study-time extraction
- Personalized coaching-plan generation
- Goal storage in Amazon DynamoDB
- Bedrock Action Group tool invocation
- Scheduled morning workflow using Amazon EventBridge
- Personalized daily task generation using Amazon Nova
- Email delivery through Amazon SNS
- Serverless backend deployment using AWS CDK
- Frontend hosting using AWS Amplify

---

## Future Improvements

- User authentication with Amazon Cognito
- Multiple goals per user
- Daily progress tracking
- Complete, skip, or reschedule daily tasks
- Automatic adjustment when a user misses a day
- Study streaks, achievements, and gamification
- Progress charts and weekly summaries
- Calendar integration
- SMS or mobile push notifications
- User-selected coaching time and timezone
- Improved personalization based on completed tasks
- Goal editing and deletion
- Export coaching plans to PDF or calendar