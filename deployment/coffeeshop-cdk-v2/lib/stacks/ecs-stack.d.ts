import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
export interface EcsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    orderTable: dynamodb.Table;
    coffeeTable: dynamodb.Table;
}
export declare class EcsStack extends cdk.Stack {
    readonly cluster: ecs.Cluster;
    readonly fargateService: ecs.FargateService;
    readonly ecrRepository: ecr.Repository;
    readonly loadBalancer: elbv2.ApplicationLoadBalancer;
    constructor(scope: Construct, id: string, props: EcsStackProps);
}
