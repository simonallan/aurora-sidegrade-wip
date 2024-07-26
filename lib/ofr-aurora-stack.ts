import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getVpcId, getVpcSubnets, LandingZoneAccountType } from "./network";
import { Vpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import {
  ServerlessCluster,
  AuroraMysqlEngineVersion,
  AuroraCapacityUnit,
  DatabaseCluster,
  DatabaseClusterEngine,
  ClusterInstance,
  CaCertificate,
} from "aws-cdk-lib/aws-rds";
import { InstanceType, InstanceClass, InstanceSize } from "aws-cdk-lib/aws-ec2";
import { Credentials } from "aws-cdk-lib/aws-rds";

export interface OfrAuroraStackProps extends StackProps {
  readonly landingZoneAccountType: LandingZoneAccountType;
  readonly commitId?: string;
}

export class OfrAuroraStack extends Stack {
  constructor(scope: Construct, id: string, props: OfrAuroraStackProps) {
    super(scope, id, props);

    // `getVpcSubnets()` must only be called once per subnet type
    const isolatedSubnets = getVpcSubnets(this, id, SubnetType.PRIVATE_ISOLATED, props.landingZoneAccountType);

    // Vpc.
    const vpc = Vpc.fromLookup(this, `${id}-vpc`, {
      vpcId: getVpcId(props.landingZoneAccountType),
    });

    // Database
    const databasePasswordSecret = new Secret(this, `${id}-database-password`, {
      description: `OFR Aurora :: WIP :: ${props.landingZoneAccountType} :: Database password`,
      generateSecretString: {
        excludePunctuation: true,
        excludeCharacters: `!@#$%^&*/"`,
        includeSpace: false,
        passwordLength: 32,
      },
    });
    const database = new ServerlessCluster(this, `${id}-aurora-serverless`, {
      clusterIdentifier: `${id}-aurora-serverless`,
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_2_11_4,
      }),
      vpc,
      vpcSubnets: {
        subnets: isolatedSubnets,
      },
      credentials: Credentials.fromPassword("drupal", databasePasswordSecret.secretValue),
      defaultDatabaseName: "cruk_fundraising",
      removalPolicy: props.landingZoneAccountType === "integration" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      backupRetention: Duration.days(3),
      scaling: {
        minCapacity: AuroraCapacityUnit.ACU_1,
        maxCapacity: AuroraCapacityUnit.ACU_2,
        autoPause: Duration.minutes(60),
      },
    });

    // // New DB Aurora MySQL provisioned instance as Aurora Serverless V1 is going EoL
    const databaseInstance = new DatabaseCluster(this, `${id}-aurora-provisioned`, {
      clusterIdentifier: `${id}-aurora-provisioned`,
      engine: DatabaseClusterEngine.auroraMysql({ version: AuroraMysqlEngineVersion.VER_2_11_4 }),
      writer: ClusterInstance.provisioned(`${id}-rds-provisioned-writer`, {
        // This cert will need updating to `CaCertificate.RDS_CA_RSA2048_G1` by August 22 2024
        caCertificate: CaCertificate.RDS_CA_2019,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      }),
      credentials: Credentials.fromPassword("drupal", databasePasswordSecret.secretValue),
      vpc,
      vpcSubnets: {
        subnets: isolatedSubnets,
      },
      removalPolicy:
        props.landingZoneAccountType === LandingZoneAccountType.PROD ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      backup: {
        retention: props.landingZoneAccountType === LandingZoneAccountType.PROD ? Duration.days(30) : Duration.days(1),
        preferredWindow: "04:30-05:00",
      },
    });

    new CfnOutput(this, `${id} Aurora-Serverless Endpoint`, {
      value: database.clusterEndpoint.hostname,
    });

    new CfnOutput(this, `${id} Aurora-Provisioned Endpoint`, {
      value: databaseInstance.clusterEndpoint.hostname,
    });
  }
}
