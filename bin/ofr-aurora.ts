#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { OfrAuroraStack } from "../lib/ofr-aurora-stack";
import { LandingZoneAccountType } from "../lib/network";

const environments: LandingZoneAccountType[] = [
  LandingZoneAccountType.DEV,
  LandingZoneAccountType.INT,
  LandingZoneAccountType.PROD,
];

const app = new cdk.App();

const env = {
  account: "651948078005",
  region: "eu-west-2",
};

environments.forEach((landingZoneAccountType: LandingZoneAccountType) => {
  new OfrAuroraStack(app, `ofr-aurora-stack-${landingZoneAccountType}`, {
    env,
    description: "Online Fundraising :: Admin :: Application",
    landingZoneAccountType,
    terminationProtection: true,
    commitId: process.env.COMMIT_ID,
    tags: {
      "Cost-Centre": "TC7003",
      "Sub-Project-Code": "SO00002-0000",
      Product: "Online Fundraising",
      Environment: landingZoneAccountType,
      "Support-Level": "2",
      Name: `Stack: ofr-admin-application-${landingZoneAccountType}`,
      id: `ofr-admin-application-${landingZoneAccountType}`,
    },
  });
});
