#!/usr/bin/env node
import "source-map-support/register";
import { App, Aws } from "aws-cdk-lib";
import { AuroraStack } from "../lib/ofr-aurora-stack";
import { LandingZoneAccountType } from "../lib/network";

const landingZoneAccountType: LandingZoneAccountType = LandingZoneAccountType.INT;

const app = new App();

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT || Aws.ACCOUNT_ID,
  region: "eu-west-2",
};

// Only Int, no Prod.
if (!["651948078005"].includes(env.account)) {
  throw new Error(
    'Please ensure this script is being used with the following AWS account: "651948078005"'
  );
}

const auroraProps = {
  description: "Aurora :: DB Migration",
  terminationProtection: false,
  env,
  landingZoneAccountType,
  tags: {
    Product: "Online Fundraising",
    Environment: landingZoneAccountType,
    "Cost-Centre": "TC7003",
    "Sub-Project-Code": "SO00002-0000",
    "Support-Level": "0",
    Name: `Stack: db-migration-${landingZoneAccountType}`,
    id: `db-migration-${landingZoneAccountType}`,
  },
};

new AuroraStack(app, `aurora-${landingZoneAccountType}`, auroraProps);
