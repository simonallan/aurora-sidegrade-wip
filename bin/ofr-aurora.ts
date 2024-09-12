#!/usr/bin/env node
import "source-map-support/register";
import { App, Aws } from "aws-cdk-lib";
import { AuroraStack } from "../lib/ofr-aurora-stack";
import {
  LandingZoneAccountType,
  // DEVELOPMENT_ENVIRONMENT_NAME,
  // INTEGRATION_ENVIRONMENT_NAME,
} from "../lib/network";

const environments: LandingZoneAccountType[] = [
  LandingZoneAccountType.INT,
  // LandingZoneAccountType.PROD, // Disable that shiz
];

const app = new App();

const env = {
  account:
    process.env.CDK_DEPLOY_ACCOUNT ||
    process.env.CDK_DEFAULT_ACCOUNT ||
    Aws.ACCOUNT_ID,
  region: "eu-west-2",
};

// No Prod deploys
if (!["651948078005"].includes(env.account)) {
  throw new Error(
    'Please ensure this script is being used with the following AWS account: "651948078005": Integration'
  );
}

// if (
//   process.env.ENVIRONMENT_NAME !== "development" &&
//   process.env.ENVIRONMENT_NAME !== "integration"
// )
//   throw new Error(
//     "Environment variable ENVIRONMENT_NAME must be defined. Please use `export ENVIRONMENT_NAME=(development/integration)`"
//   );
// const environment: string = process.env.ENVIRONMENT_NAME;

environments.forEach((landingZoneAccountType: LandingZoneAccountType) => {
  const auroraStack = new AuroraStack(
    app,
    `poc-aurora-${landingZoneAccountType}`,
    {
      description: "Aurora :: WIP :: DB Sidegrade",
      env,
      landingZoneAccountType,
      // environment,
      terminationProtection: true,
      tags: {
        Product: "Online Fundraising",
        Environment: landingZoneAccountType,
        "Cost-Centre": "TC7003",
        "Sub-Project-Code": "SO00002-0000",
        "Support-Level": "0",
        Name: `Stack: poc-aurora-${landingZoneAccountType}`,
        id: `poc-aurora-${landingZoneAccountType}`,
      },
    }
  );
});
