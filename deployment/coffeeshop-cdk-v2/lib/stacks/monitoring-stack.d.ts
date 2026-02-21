import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
export interface MonitoringStackProps extends cdk.StackProps {
    lambdaFunctions: {
        [key: string]: lambda.Function;
    };
    eksCluster: eks.Cluster;
}
export declare class MonitoringStack extends cdk.Stack {
    readonly dashboard: cloudwatch.Dashboard;
    readonly alarmTopic: sns.Topic;
    constructor(scope: Construct, id: string, props: MonitoringStackProps);
}
