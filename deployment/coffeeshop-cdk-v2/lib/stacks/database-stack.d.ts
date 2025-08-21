import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export declare class DatabaseStack extends cdk.Stack {
    readonly orderTable: dynamodb.ITable;
    readonly coffeeTable: dynamodb.ITable;
    readonly inventoryTable: dynamodb.ITable;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
