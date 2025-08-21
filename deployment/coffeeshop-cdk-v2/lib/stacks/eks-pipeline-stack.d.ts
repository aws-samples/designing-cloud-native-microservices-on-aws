import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
export interface EksPipelineStackProps extends cdk.StackProps {
    ecrRepositories: {
        [key: string]: ecr.IRepository;
    };
    eksCluster: eks.Cluster;
}
export declare class EksPipelineStack extends cdk.Stack {
    readonly pipeline: codepipeline.Pipeline;
    readonly artifactBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props: EksPipelineStackProps);
}
