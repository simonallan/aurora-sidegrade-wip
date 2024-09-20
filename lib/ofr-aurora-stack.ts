import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getVpcId, getVpcSubnets, LandingZoneAccountType } from "./network";
import { Vpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import {
  AuroraMysqlEngineVersion,
  DatabaseCluster,
  DatabaseClusterEngine,
  ClusterInstance,
  CaCertificate,
  ServerlessClusterFromSnapshot,
} from "aws-cdk-lib/aws-rds";
import { InstanceType, InstanceClass, InstanceSize } from "aws-cdk-lib/aws-ec2";
import { Credentials } from "aws-cdk-lib/aws-rds";

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

    // Database
    const databasePasswordSecret = new Secret(this, `${id}-wip-database-password`, {
      description: `WIP :: Aurora :: ${props.landingZoneAccountType} :: Database password`,
      generateSecretString: {
        excludePunctuation: true,
        excludeCharacters: `!@#$%^&*/"`,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    /**
     * Let's try a serverless cluster from SnapShot, same settings as below:
     */

    // const database = new ServerlessCluster(this, `${id}-aurora-serverless`, {
    //   clusterIdentifier: `${id}-aurora-serverless`,
    //   engine: DatabaseClusterEngine.auroraMysql({
    //     version: AuroraMysqlEngineVersion.VER_2_11_4,
    //   }),
    //   vpc,
    //   vpcSubnets: {
    //     subnets: isolatedSubnets,
    //   },
    //   credentials: Credentials.fromPassword("drupal", databasePasswordSecret.secretValue),
    //   defaultDatabaseName: "aurora-wip",
    //   removalPolicy: props.landingZoneAccountType === "integration" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    //   backupRetention: Duration.days(3),
    //   scaling: {
    //     minCapacity: AuroraCapacityUnit.ACU_1,
    //     maxCapacity: AuroraCapacityUnit.ACU_2,
    //     autoPause: Duration.minutes(60),
    //   },
    // });

    const databaseFromSnapshot = new ServerlessClusterFromSnapshot(this, `${id}-snapshot-db`, {
      clusterIdentifier: `${id}-serverless-snapshot-db`,
      engine: DatabaseClusterEngine.AURORA_MYSQL, // version: AuroraMysqlEngineVersion.VER_2_11_4
      snapshotIdentifier:
        "arn:aws:rds:eu-west-2:651948078005:cluster-snapshot:ofr-admin-sandbox-20240918",
      vpc: vpc,
      vpcSubnets: { subnets: isolatedSubnets },
    });

    // New DB Aurora MySQL provisioned instance as Aurora Serverless V1 is going EoL
    const databaseInstance = new DatabaseCluster(this, `${id}-provisioned-db`, {
      clusterIdentifier: `${id}-provisioned-cluster`,
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_2_11_4,
      }),
      writer: ClusterInstance.provisioned(`${id}-writer`, {
        instanceIdentifier: `${id}-writer`,
        caCertificate: CaCertificate.RDS_CA_RSA2048_G1,
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      }),
      credentials: Credentials.fromPassword("drupal", databasePasswordSecret.secretValue),
      vpc,
      vpcSubnets: {
        subnets: isolatedSubnets,
      },
      removalPolicy:
        props.landingZoneAccountType === LandingZoneAccountType.PROD
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      backup: {
        retention:
          props.landingZoneAccountType === LandingZoneAccountType.PROD
            ? Duration.days(30)
            : Duration.days(1),
        preferredWindow: "04:30-05:00",
      },
    });

    new CfnOutput(this, `${id} Aurora-Provisioned new instance Endpoint`, {
      value: databaseInstance.clusterEndpoint.hostname,
    });

    new CfnOutput(this, `${id} Aurora-Serverless from snapshot Endpoint`, {
      value: databaseFromSnapshot.clusterEndpoint.hostname,
    });
  }
}
