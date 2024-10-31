import { Stack, StackProps, CfnOutput, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getVpcId, getVpcSubnets, LandingZoneAccountType } from "./network";
import { Vpc, SubnetType, SecurityGroup, Port } from "aws-cdk-lib/aws-ec2";
import {
  DatabaseClusterEngine,
  ServerlessClusterFromSnapshot,
  // DatabaseInstance,
  // DatabaseInstanceEngine,
  // DatabaseSecret,
  // MariaDbEngineVersion,
  // ParameterGroup,
} from "aws-cdk-lib/aws-rds";
// import { InstanceType, InstanceClass, InstanceSize } from "aws-cdk-lib/aws-ec2";

export interface AuroraStackProps extends StackProps {
  readonly landingZoneAccountType: LandingZoneAccountType;
  // readonly environment: string;
}

export class AuroraStack extends Stack {
  constructor(scope: Construct, id: string, props: AuroraStackProps) {
    super(scope, id, props);

    Object.entries(Tags).forEach(([name, value]) => {
      Tags.of(this).add(name, value);
    });

    // `getVpcSubnets()` must only be called once per subnet type
    const isolatedSubnets = getVpcSubnets(
      this,
      id,
      SubnetType.PRIVATE_ISOLATED,
      props.landingZoneAccountType
    );

    // Vpc.
    const vpc = Vpc.fromLookup(this, `${id}-vpc`, {
      vpcId: getVpcId(props.landingZoneAccountType),
    });

    const sourceSecurityGroup = new SecurityGroup(this, `${id}-source-db-sg`, {
      securityGroupName: `${id}-source-db-sg`,
      description: "Aurora DB source database access",
      vpc,
    });

    // const targetSecurityGroup = new SecurityGroup(this, `${id}-target-db-sg`, {
    //   securityGroupName: `${id}-target-db-sg`,
    //   description: "Aurora Sandbox target database access",
    //   vpc,
    // });

    const appstreamSecurityGroup = SecurityGroup.fromLookupById(
      this,
      "appstream-sg",
      "sg-0a2604684c21586c1"
    );

    // AppStream RDS Client access to both Databases
    sourceSecurityGroup.connections.allowFrom(appstreamSecurityGroup, Port.tcp(3306));
    // targetSecurityGroup.connections.allowFrom(appstreamSecurityGroup, Port.tcp(3306));

    // const targetDatabaseCredentials = new DatabaseSecret(
    //   this,
    //   `${id}-target-database-credentials`,
    //   {
    //     username: "drupal",
    //   }
    // );

    // Source Database: serverless cluster from SnapShot
    const sourceDatabase = new ServerlessClusterFromSnapshot(this, `${id}-source-db-cluster`, {
      clusterIdentifier: `${id}-source`,
      engine: DatabaseClusterEngine.AURORA_MYSQL, // current engine: AuroraMysqlEngineVersion.VER_2_11_4
      snapshotIdentifier:
        "arn:aws:rds:eu-west-2:651948078005:cluster-snapshot:ofr-admin-integration-aurora-migration",
      vpc,
      vpcSubnets: { subnets: isolatedSubnets },
      securityGroups: [sourceSecurityGroup],
    });

    // // Target Database: Maria DB version 10.4, then 10.5 then 10.11
    // const parameterGroup_10_4 = new ParameterGroup(this, `${id}-mariadb-10-4`, {
    //   // Only the major version needs to be pinned here.
    //   engine: DatabaseInstanceEngine.mariaDb({ version: MariaDbEngineVersion.VER_10_4 }),
    //   name: `${id}-mariadb-10-4`,
    // });

    // const parameterGroupDefault = ParameterGroup.fromParameterGroupName(
    //   this,
    //   `${id}-parameter-group-default`,
    //   "default.mariadb10.4"
    // );

    // const targetDatabase = new DatabaseInstance(this, `${id}-target-db-instance`, {
    //   instanceIdentifier: `${id}-target`,
    //   instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
    //   // engine: DatabaseInstanceEngine.mariaDb({ version: MariaDbEngineVersion.VER_10_4_33 }),
    //   engine: DatabaseInstanceEngine.mariaDb({ version: MariaDbEngineVersion.VER_10_6 }),
    //   databaseName: "cruk_fundraising",
    //   credentials: { username: "drupal" },
    //   securityGroups: [targetSecurityGroup],
    //   vpc,
    //   vpcSubnets: {
    //     subnets: isolatedSubnets,
    //   },
    //   multiAz: true,
    //   parameterGroup: parameterGroupDefault,
    //   allowMajorVersionUpgrade: true,
    // });

    // new CfnOutput(this, "sourceDatabaseEndpoint", {
    //   value: sourceDatabase.clusterEndpoint.hostname,
    // });

    // new CfnOutput(this, "targetDatabaseEndpoint", {
    //   value: targetDatabase.instanceEndpoint.hostname,
    // });

    // new CfnOutput(this, `targettargetDatabaseCredentials`, {
    //   value: targetDatabaseCredentials.secretName,
    // });
    new CfnOutput(this, "sourceDatabaseEndpoint", {
      value: sourceDatabase.clusterEndpoint.hostname,
    });
  }
}
