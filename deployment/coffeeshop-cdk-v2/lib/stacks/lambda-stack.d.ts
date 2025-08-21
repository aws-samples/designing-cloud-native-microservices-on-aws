import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export interface LambdaStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    orderTable: dynamodb.ITable;
    coffeeTable: dynamodb.ITable;
}
export declare class LambdaStack extends cdk.Stack {
    readonly functions: {
        [key: string]: lambda.Function;
    };
    readonly api: apigateway.RestApi;
    constructor(scope: Construct, id: string, props: LambdaStackProps);
}
