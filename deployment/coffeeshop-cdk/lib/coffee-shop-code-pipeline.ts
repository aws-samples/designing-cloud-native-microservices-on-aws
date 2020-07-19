import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import ec2 = require('@aws-cdk/aws-ec2');
import * as codebuild  from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecsPatterns from '@aws-cdk/aws-ecs-patterns';
import * as codecommit from '@aws-cdk/aws-codecommit';
import {CodeBuildProject} from '@aws-cdk/aws-events-targets';
import {Duration} from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import {Rule} from "@aws-cdk/aws-events";
import * as ssm from '@aws-cdk/aws-ssm';
import { UlimitName } from '@aws-cdk/aws-ecs';

const DOCKER_IMAGE_PREFIX = 'solid-humank-coffeeshop/orders-web'
const CODECOMMIT_REPO_NAME = 'EventStormingWorkshop'

export class CoffeeShopCodePipeline extends cdk.Stack {

    readonly ecrRepository: ecr.Repository
    // @ts-ignore
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create a VPC
        const vpc = new ec2.Vpc(this, 'CoffeeShopVPC', {
            cidr: '10.0.0.0/16',
            natGateways: 1
        });

        this.ecrRepository = new ecr.Repository(this, 'Repository', {
            repositoryName: DOCKER_IMAGE_PREFIX,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        const buildRole = new iam.Role(this, 'CodeBuildIamRole', {
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com')
        });
        buildRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambdaFullAccess"));
        buildRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonAPIGatewayAdministrator"));

        buildRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: ['cloudformation:*']
        }));

        buildRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: ['iam:*']
        }));

        buildRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: ['ecr:GetAuthorizationToken']
        }));

        buildRole.addToPolicy(new iam.PolicyStatement({
            resources: [`${this.ecrRepository.repositoryArn}*`],
            actions: ['ecr:*']
        }));

        // ECR LifeCycles
        // repository.addLifecycleRule({ tagPrefixList: ['prod'], maxImageCount: 9999 });
        this.ecrRepository.addLifecycleRule({maxImageAge: cdk.Duration.days(30)});

        const defaultSource = codebuild.Source.gitHub({
            owner: 'humank',
            repo: 'EventStormingWorkShop',
            webhook: true, // optional, default: true if `webhookFilteres` were provided, false otherwise
            webhookFilters: [
                codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs('master'),
            ], // optional, by default all pushes and Pull Requests will trigger a build
        });

        let bucketName = 'coffeeshop-' + Math.random().toString(36).substring(7);
        const coffeeShopBucket = new s3.Bucket(this, 'CoffeeShopBucket', {
            bucketName: bucketName,
            // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
            // the new bucket, and it will remain in your account until manually deleted. By setting the policy to
            // DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.

            //removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
        });

        coffeeShopBucket.grantPut(buildRole);
        coffeeShopBucket.grantRead(buildRole);
        coffeeShopBucket.grantReadWrite(buildRole);
        coffeeShopBucket.grantWrite(buildRole);

        new codebuild.Project(this, 'CodeBuildProject', {
            role: buildRole,
            source: defaultSource,
            // Enable Docker AND custom caching
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
            environment: {
                buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2,
                privileged: true,
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install:{
                        'runtime-versions': {
                            java: 'corretto11'
                        }
                    },
                    build: {
                        commands: [
                            'echo "Build all modules"',
                            'echo "Run Maven clean install to have all the required jars in local .m2 repository"',
                            'cd sources/coffeeshop',
                            'mvn clean install -Dmaven.test.skip=true'
                        ]
                    },
                    post_build: {
                        commands: [
                            'TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}',
                            'LATEST="latest"',
                            'echo "Pack web modules into docker and push to ECR"',
                            'echo "ECR login now"',
                            '$(aws ecr get-login --no-include-email)',
                            'pwd',
                            'echo "build orders-web docker image"',
                            'cd orders-web',
                            'mvn package -Dmaven.test.skip=true',
                            `docker build -f src/main/docker/Dockerfile.jvm -t ${this.ecrRepository.repositoryUri}:$LATEST .`,
                            `docker images`,
                            `docker tag ${this.ecrRepository.repositoryUri}:$LATEST ${this.ecrRepository.repositoryUri}:$TAG`,
                            'echo "Pushing Orders-web"',
                            `docker images`,
                            `docker push ${this.ecrRepository.repositoryUri}:$TAG`,
                            `docker push ${this.ecrRepository.repositoryUri}:$LATEST`,
                            'echo "finished ECR push"',

                            'echo package coffee serverless lambda function',
                            'cd ../coffee-sls',
                            'sam package --template-file template.yaml --s3-bucket '+ bucketName + ' --output-template-file packaged.yaml',
                            'sam deploy --template-file ./packaged.yaml --stack-name coffee-sls --capabilities CAPABILITY_IAM',
                        ]

                    }
                },
                // cache:{
                //     paths:[
                //         '/root/.m2/**/*',
                //     ]
                // }
            })
        });

        // const vpc = Vpc.fromLookup(this, 'CoffeeShopCdkStack/CoffeeShopVPC',{
        //     vpcName: 'CoffeeShopCdkStack/CoffeeShopVPC',
        //     isDefault: false,
        // });

        const cluster = new ecs.Cluster(this, 'Cluster', {
            clusterName: 'coffeeshop',
            vpc
        });



        const taskDefinition = new ecs.TaskDefinition(this, 'orders-web-Task', {
            compatibility: ecs.Compatibility.FARGATE,
            memoryMiB: '512',
            cpu: '256',
            
        });

        const containerDefinition = taskDefinition.addContainer('defaultContainer', {
            image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
            logging: new ecs.AwsLogDriver({
                streamPrefix: 'coffeeshop',
            })
        });

        containerDefinition.addUlimits({
            name: UlimitName.NOFILE,
            softLimit:102400 ,
            hardLimit: 819200
        });

        containerDefinition.addPortMappings({
            containerPort: 8080
        });

        const fargatesvc = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'AlbSvc', {
            cluster,
            taskDefinition,
        })

        const fargateTaskRole = fargatesvc.service.taskDefinition.taskRole;
        fargateTaskRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: ['events:*']
        }));
        const orderTable = new dynamodb.Table(this, 'Order', {
            partitionKey: { name: 'seqNo', type: dynamodb.AttributeType.NUMBER },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            tableName: 'Order',
        });

        orderTable.grantFullAccess(fargateTaskRole);

        const coffeeTable = new dynamodb.Table(this, 'Coffee', {
            partitionKey: { name: 'seqNo', type: dynamodb.AttributeType.NUMBER },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            tableName: 'Coffee',
        });

        coffeeTable.grantFullAccess(fargateTaskRole);

        const rule = new Rule(this, 'OrderCreatedRule',{
            eventPattern:{
                source:["solid.humank.coffeeshop.order"],
                detailType:['customevent']
            },
            // eventBus: coffeeshop_eventbus,
            ruleName: 'OrderCreatedRule',
        });

        //add ssm parameter store for cloudwatchevent put usage
        const eventSourceParam = new ssm.StringParameter(this, 'eventSourceParam', {
            parameterName: '/coffeeshop/events/ordercreated/event_source',
            stringValue: 'solid.humank.coffeeshop.order',
        });

        // Grant read access to some Role
        eventSourceParam.grantRead(fargateTaskRole);

        //add ssm parameter store for cloudwatchevent put usage
        const eventArnParam = new ssm.StringParameter(this, 'eventArnParam', {
            parameterName: '/coffeeshop/events/ordercreated/event_arn',
            stringValue: rule.ruleArn,
        });

        // Grant read access to some Role
        eventArnParam.grantRead(fargateTaskRole);

        // if the default image is not from ECR, the ECS task execution role will not have ECR pull privileges
        // we need grant the pull for it explicitly
        this.ecrRepository.grantPull({
            grantPrincipal: (fargatesvc.service.taskDefinition.executionRole as iam.IRole)
        })

        // reduce the default deregistration delay timeout from 300 to 30 to accelerate the rolling update
        fargatesvc.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30')
        // customize the healthcheck to speed up the ecs rolling update
        fargatesvc.targetGroup.configureHealthCheck({
            interval: Duration.seconds(5),
            healthyHttpCodes: '200',
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 3,
            timeout: Duration.seconds(4),
        })

        // CodePipeline
        const codePipeline = new codepipeline.Pipeline(this, 'CoffeeShopPipeline', {
            pipelineName: 'CoffeeShopPipeline',
        });

        const sourceOutputEcr = new codepipeline.Artifact();
        const sourceOutputCodeCommit = new codepipeline.Artifact();
        const sourceActionECR = new codepipeline_actions.EcrSourceAction({
            actionName: 'ECR',
            repository: this.ecrRepository,
            imageTag: 'latest', // optional, default: 'latest'
            output: sourceOutputEcr,
        });

        const codecommitRepo = new codecommit.Repository(this, 'GitRepo', {
            repositoryName: CODECOMMIT_REPO_NAME
        });

        const sourceActionCodeCommit = new codepipeline_actions.CodeCommitSourceAction({
            actionName: 'CodeCommit',
            // repository: codecommit.Repository.fromRepositoryName(this, 'GitRepo', CODECOMMIT_REPO_NAME),
            repository: codecommitRepo,
            output: sourceOutputCodeCommit,
        });

        codePipeline.addStage({
            stageName: 'Source',
            actions: [sourceActionCodeCommit, sourceActionECR],
        });

        codePipeline.addStage({
            stageName: 'Deploy',
            actions: [
                new codepipeline_actions.EcsDeployAction({
                    actionName: 'DeployAction',
                    service: fargatesvc.service,
                    // if your file is called imagedefinitions.json,
                    // use the `input` property,
                    // and leave out the `imageFile` property
                    input: sourceOutputCodeCommit,
                    // if your file name is _not_ imagedefinitions.json,
                    // use the `imageFile` property,
                    // and leave out the `input` property
                    // imageFile: sourceOutput.atPath('imageDef.json'),
                }),
            ],
        });
        new cdk.CfnOutput(this, 'ServiceURL', {
            value: `http://${fargatesvc.loadBalancer.loadBalancerDnsName}`
        })

        new cdk.CfnOutput(this, 'StackId', {
            value: this.stackId
        })

        new cdk.CfnOutput(this, 'StackName', {
            value: this.stackName
        })

        new cdk.CfnOutput(this, 'CodeCommitRepoName', {
            value: codecommitRepo.repositoryName
        })

        let codeCommitHint = `
Create a "imagedefinitions.json" file and git add/push into CodeCommit repository "${CODECOMMIT_REPO_NAME}" with the following value:

[
  {
    "name": "defaultContainer",
    "imageUri": "${this.ecrRepository.repositoryUri}:latest"
  }
]
`
        new cdk.CfnOutput(this, 'Hint', {
            value: codeCommitHint
        })

        new cdk.CfnOutput(this, 'CodeBuildProjectName', {
            value: CodeBuildProject.name
        })

        new cdk.CfnOutput(this, 'Bucket', { value: coffeeShopBucket.bucketName });

    }
}