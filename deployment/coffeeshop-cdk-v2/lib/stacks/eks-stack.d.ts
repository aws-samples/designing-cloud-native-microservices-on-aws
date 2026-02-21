import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface EksStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    orderTable: dynamodb.ITable;
    coffeeTable: dynamodb.ITable;
}
export declare class EksStack extends cdk.Stack {
    readonly cluster: eks.Cluster;
    readonly ecrRepositories: {
        [key: string]: ecr.IRepository;
    };
    readonly nodeGroup: eks.Nodegroup;
    constructor(scope: Construct, id: string, props: EksStackProps);
}
