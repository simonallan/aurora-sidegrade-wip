import { Construct } from "constructs";
import { ISubnet, Subnet, SubnetType } from "aws-cdk-lib/aws-ec2";

// export const DEVELOPMENT_ENVIRONMENT_NAME = "development";
// export const INTEGRATION_ENVIRONMENT_NAME = "integration";

/**
 * Return the VPC Id that we're using in this Landing Zone account. This would be nicer if it had a constant name, but
 * this will do for now.
 *
 * @param landingZoneAccountType
 */
export const getVpcId = (
  landingZoneAccountType: LandingZoneAccountType
): string => {
  return landingZoneAccountType === LandingZoneAccountType.PROD
    ? "vpc-09d085203fb33443c"
    : "vpc-0ed78d1d0d9b9015e";
};

/**
 * Takes a subnet type (Isolated, Private, Public) and returns an array of subnet IDs as strings.
 *
 * @param subnetType
 * @param landingZoneAccountType
 */
export const getVpcSubnetIds = (
  subnetType: SubnetType,
  landingZoneAccountType?: LandingZoneAccountType
): string[] => {
  if (landingZoneAccountType === LandingZoneAccountType.PROD) {
    switch (subnetType) {
      case SubnetType.PRIVATE_ISOLATED:
        return [
          "subnet-0127a3f87148a6ffb",
          "subnet-06e9a77bc14119049",
          "subnet-0348348a7fd409b22",
        ];
      case SubnetType.PRIVATE_WITH_EGRESS:
        return [
          "subnet-0db22575f00e3afba",
          "subnet-074ae8b99aa890b73",
          "subnet-0cd7853a189a25b3e",
        ];
      case SubnetType.PUBLIC:
        return [
          "subnet-087955f9693c1b027",
          "subnet-09fa749ff66ebd9e5",
          "subnet-0f9820e03b2671900",
        ];
    }
  }
  switch (subnetType) {
    case SubnetType.PRIVATE_ISOLATED:
      return [
        "subnet-09ed352d9d898e0df",
        "subnet-06fe1cd03cc58c16e",
        "subnet-0d1b561775e6d9ca0",
      ];
    case SubnetType.PRIVATE_WITH_EGRESS:
      return [
        "subnet-05516e70e29d6b66a",
        "subnet-00c176d9edad2e786",
        "subnet-0735a5fdfd3e5e54e",
      ];
    case SubnetType.PUBLIC:
      return [
        "subnet-0133a1b6a752f6d33",
        "subnet-0163e0360a91727b5",
        "subnet-0cf378548f5ab6b3c",
      ];
  }

  return [];
};

/**
 * Takes a subnet type (Isolated, Private, Public) and returns an array of Subnets. This is required, because our
 * Isolated subnet is actually a private subnet.
 *
 * NOTE, this should be called ONCE per stack/SubnetType.
 *
 * @param scope
 * @param id
 * @param landingZoneAccountType
 * @param subnetType
 */
export const getVpcSubnets = (
  scope: Construct,
  id: string,
  subnetType: SubnetType,
  landingZoneAccountType?: LandingZoneAccountType
): ISubnet[] => {
  const subnets: ISubnet[] = [];
  getVpcSubnetIds(subnetType, landingZoneAccountType).forEach(
    (subnetId: string) => {
      subnets.push(
        Subnet.fromSubnetId(scope, `${id}-subnet-${subnetId}`, subnetId)
      );
    }
  );

  return subnets;
};

/**
 * Attributes required for loading/finding the private dns namespace.
 *
 * @param landingZoneAccountType
 */
// export const getPrivateDnsNamespaceAttributes = (
//   landingZoneAccountType?: LandingZoneAccountType
// ): PrivateDnsNamespaceAttributes => {
//   if (landingZoneAccountType === LandingZoneAccountType.PROD) {
//     return {
//       namespaceName: "fws.ofr.cruk.private",
//       namespaceId: "ns-zqptbyi24mee2cca",
//       namespaceArn:
//         "arn:aws:servicediscovery:eu-west-2:921806190493:namespace/ns-zqptbyi24mee2cca",
//     };
//   }
//   return {
//     namespaceName: "fws.ofr.cruk.private",
//     namespaceId: "ns-7sl2wvtrkgsm7xwo",
//     namespaceArn:
//       "arn:aws:servicediscovery:eu-west-2:651948078005:namespace/ns-7sl2wvtrkgsm7xwo",
//   };
// };

/**
 * IP addresses and hostnames of the hosts used by the reporting/Business Inteligence team.
 */
export const reportingHosts: IpsAndDescriptions = {
  "192.168.99.98/32": "example-host-1",
  "192.168.99.99/32": "example-host-2",
  // "10.200.236.99/32": "rea-inf-dsql08",
  // "10.200.236.36/32": "rea-inf-tsql03",
  // "10.200.236.106/32": "rea-inf-usql06",
  // "10.200.239.54/32": "LON-INF-LRDS12",
  // "10.200.239.55/32": "LON-INF-LRDS11",
  // "10.200.239.7/32": "AZU-INF-DRDS02",
  // "10.200.239.6/32": "REA-INF-DRDS01",
  // "10.200.239.52/32": "LON-INF-LRDS10",
  // "10.200.236.45/32": "AZU-INF-DRDS03",
  // "10.200.239.36/32": "AZU-INF-DRDS04",
  // "10.61.238.86/32": "LON-INF-LSQL22",
  // "10.61.239.133/32": "LON-APP-LPEG01",
  // "10.61.239.134/32": "LON-APP-LPEG02",
  // "10.200.239.4/32": "REA-APP-TPEG02",
  // "10.200.236.27/32": "AZU-INF-LSQL11",
  // "10.200.236.59/32": "AZU-INF-LSQL12",
};

/**
 * IP addresses and hostnames of the hosts used by the reporting/Business Inteligence team.
 */
export const sshToJumpBoxHosts: IpsAndDescriptions = {
  "192.168.99.97/32": "SSH from CRUK",
};

/**
 * SubnetType for requesting an array of subnets for specific purposes.
 */
export enum LandingZoneAccountType {
  INT = "int",
  PROD = "prod",
}

/**
 * Simple type for reportingHosts
 */
export interface IpsAndDescriptions {
  [key: string]: string;
}
