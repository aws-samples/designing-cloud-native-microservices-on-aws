import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
export interface PipelineStackProps extends cdk.StackProps {
    ecrRepository: ecr.Repository;
    ecsService: ecs.FargateService;
}
export declare class PipelineStack extends cdk.Stack {
    readonly pipeline: codepipeline.Pipeline;
    readonly artifactBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props: PipelineStackProps);
}
