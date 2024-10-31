import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { AuroraStack } from "../lib/ofr-aurora-stack";
import { LandingZoneAccountType } from "../lib/network";

const env = {
  account: "111122223333",
  region: "eu-west-0",
};

const landingZoneAccountType: LandingZoneAccountType = LandingZoneAccountType.INT;

const mockAuroraProps = {
  description: "Aurora :: Sandbox :: DB Sidegrade",
  env,
  landingZoneAccountType,
  terminationProtection: false,
  tags: {
    Product: "Online Fundraising Sandbox",
    Environment: landingZoneAccountType,
    "Cost-Centre": "TC7003",
    "Sub-Project-Code": "SO00002-0000",
    "Support-Level": "0",
    Name: `Stack: ofr-aurora-${landingZoneAccountType}`,
    id: `ofr-aurora-${landingZoneAccountType}`,
  },
};

// WHEN
test("CDK stacks synthesized successfully", () => {
  // GIVEN
  const app = new App();

  const mockStack = new AuroraStack(app, "mock-sandbox-stack", mockAuroraProps);

  // THEN
  const template = Template.fromStack(mockStack);
  expect(template).toBeTruthy();
});
