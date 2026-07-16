#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AgentStack } from "../lib/agent-stack";

const app = new cdk.App();

new AgentStack(app, "GoalCoachStack", {
  env: {
    region: process.env.AWS_REGION || "us-east-1",
  },
});