"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineStack = void 0;
const cdk = require("aws-cdk-lib");
const codebuild = require("aws-cdk-lib/aws-codebuild");
const codepipeline = require("aws-cdk-lib/aws-codepipeline");
const codepipeline_actions = require("aws-cdk-lib/aws-codepipeline-actions");
const codecommit = require("aws-cdk-lib/aws-codecommit");
const iam = require("aws-cdk-lib/aws-iam");
const s3 = require("aws-cdk-lib/aws-s3");
const logs = require("aws-cdk-lib/aws-logs");
class PipelineStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // S3 Bucket for artifacts
        this.artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
            bucketName: `coffeeshop-artifacts-${this.account}-${this.region}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
        });
        // CodeCommit Repository
        const repository = new codecommit.Repository(this, 'CoffeeShopRepository', {
            repositoryName: 'designing-cloud-native-microservices-on-aws',
            description: 'CoffeeShop microservices source code',
        });
        // CodeBuild Service Role
        const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayAdministrator'),
            ],
        });
        // Grant permissions to CodeBuild
        codeBuildRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'cloudformation:*',
                'iam:*',
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'ecr:BatchImportLayerPart',
                'ecr:CompleteLayerUpload',
                'ecr:InitiateLayerUpload',
                'ecr:PutImage',
                'ecr:UploadLayerPart',
            ],
            resources: ['*'],
        }));
        // Grant S3 permissions
        this.artifactBucket.grantReadWrite(codeBuildRole);
        // Grant ECR permissions
        props.ecrRepository.grantPullPush(codeBuildRole);
        // CodeBuild Project
        const buildProject = new codebuild.Project(this, 'CoffeeShopBuildProject', {
            projectName: 'CoffeeShop-Build',
            role: codeBuildRole,
            source: codebuild.Source.codeCommit({
                repository,
                branchOrRef: 'main',
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
                privileged: true,
                computeType: codebuild.ComputeType.MEDIUM,
                environmentVariables: {
                    AWS_DEFAULT_REGION: {
                        value: this.region,
                    },
                    AWS_ACCOUNT_ID: {
                        value: this.account,
                    },
                    IMAGE_REPO_NAME: {
                        value: props.ecrRepository.repositoryName,
                    },
                    IMAGE_URI: {
                        value: props.ecrRepository.repositoryUri,
                    },
                    ARTIFACT_BUCKET: {
                        value: this.artifactBucket.bucketName,
                    },
                },
            },
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER, codebuild.LocalCacheMode.CUSTOM),
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                cache: {
                    paths: ['/root/.m2/**/*'],
                },
                phases: {
                    install: {
                        'runtime-versions': {
                            java: 'corretto17',
                            docker: '20',
                        },
                    },
                    pre_build: {
                        commands: [
                            'echo Logging in to Amazon ECR...',
                            'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
                            'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
                            'IMAGE_TAG=${COMMIT_HASH:=latest}',
                        ],
                    },
                    build: {
                        commands: [
                            'echo Build started on `date`',
                            'echo Building Java applications...',
                            'cd sources/coffeeshop',
                            'mvn clean install -Dmaven.test.skip=true',
                            'echo Building Docker image for orders-web...',
                            'cd orders-web',
                            'mvn package -Dmaven.test.skip=true',
                            'docker build -f src/main/docker/Dockerfile.jvm -t $IMAGE_URI:latest .',
                            'docker tag $IMAGE_URI:latest $IMAGE_URI:$IMAGE_TAG',
                        ],
                    },
                    post_build: {
                        commands: [
                            'echo Build completed on `date`',
                            'echo Pushing Docker images...',
                            'docker push $IMAGE_URI:latest',
                            'docker push $IMAGE_URI:$IMAGE_TAG',
                            'echo Creating imagedefinitions.json...',
                            'printf \'[{"name":"OrdersWebContainer","imageUri":"%s"}]\' $IMAGE_URI:$IMAGE_TAG > imagedefinitions.json',
                            'cat imagedefinitions.json',
                            'echo Building Lambda functions...',
                            'cd ../coffee-sls',
                            'sam build',
                            'sam package --s3-bucket $ARTIFACT_BUCKET --output-template-file packaged.yaml',
                            'sam deploy --template-file packaged.yaml --stack-name coffee-sls --capabilities CAPABILITY_IAM --no-fail-on-empty-changeset',
                        ],
                    },
                },
                artifacts: {
                    files: [
                        'sources/coffeeshop/orders-web/imagedefinitions.json',
                    ],
                },
            }),
            logging: {
                cloudWatch: {
                    logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
                        logGroupName: '/aws/codebuild/coffeeshop-build',
                        retention: logs.RetentionDays.ONE_WEEK,
                        removalPolicy: cdk.RemovalPolicy.DESTROY,
                    }),
                },
            },
        });
        // CodePipeline
        this.pipeline = new codepipeline.Pipeline(this, 'CoffeeShopPipeline', {
            pipelineName: 'CoffeeShop-Pipeline',
            artifactBucket: this.artifactBucket,
        });
        // Pipeline artifacts
        const sourceOutput = new codepipeline.Artifact('SourceOutput');
        const buildOutput = new codepipeline.Artifact('BuildOutput');
        // Source stage
        this.pipeline.addStage({
            stageName: 'Source',
            actions: [
                new codepipeline_actions.CodeCommitSourceAction({
                    actionName: 'Source',
                    repository,
                    branch: 'main',
                    output: sourceOutput,
                }),
            ],
        });
        // Build stage
        this.pipeline.addStage({
            stageName: 'Build',
            actions: [
                new codepipeline_actions.CodeBuildAction({
                    actionName: 'Build',
                    project: buildProject,
                    input: sourceOutput,
                    outputs: [buildOutput],
                }),
            ],
        });
        // Deploy stage
        this.pipeline.addStage({
            stageName: 'Deploy',
            actions: [
                new codepipeline_actions.EcsDeployAction({
                    actionName: 'Deploy',
                    service: props.ecsService,
                    input: buildOutput,
                }),
            ],
        });
        // Outputs
        new cdk.CfnOutput(this, 'PipelineName', {
            value: this.pipeline.pipelineName,
            description: 'CodePipeline Name',
            exportName: `${this.stackName}-PipelineName`,
        });
        new cdk.CfnOutput(this, 'RepositoryCloneUrl', {
            value: repository.repositoryCloneUrlHttp,
            description: 'CodeCommit Repository Clone URL',
        });
        new cdk.CfnOutput(this, 'ArtifactBucketName', {
            value: this.artifactBucket.bucketName,
            description: 'S3 Artifact Bucket Name',
            exportName: `${this.stackName}-ArtifactBucket`,
        });
        // Instructions for setting up the repository
        const setupInstructions = `
To set up the repository:
1. Clone the repository: git clone ${repository.repositoryCloneUrlHttp}
2. Copy your source code to the repository
3. Create imagedefinitions.json in the root with:
[
  {
    "name": "OrdersWebContainer",
    "imageUri": "${props.ecrRepository.repositoryUri}:latest"
  }
]
4. Commit and push to trigger the pipeline
`;
        new cdk.CfnOutput(this, 'SetupInstructions', {
            value: setupInstructions,
            description: 'Repository setup instructions',
        });
    }
}
exports.PipelineStack = PipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsdURBQXVEO0FBQ3ZELDZEQUE2RDtBQUM3RCw2RUFBNkU7QUFDN0UseURBQXlEO0FBR3pELDJDQUEyQztBQUMzQyx5Q0FBeUM7QUFDekMsNkNBQTZDO0FBUTdDLE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSTFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBeUI7UUFDakUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUMxRCxVQUFVLEVBQUUsd0JBQXdCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsU0FBUyxFQUFFLElBQUk7WUFDZixVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsd0JBQXdCO1FBQ3hCLE1BQU0sVUFBVSxHQUFHLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDekUsY0FBYyxFQUFFLDZDQUE2QztZQUM3RCxXQUFXLEVBQUUsc0NBQXNDO1NBQ3BELENBQUMsQ0FBQztRQUVILHlCQUF5QjtRQUN6QixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN4RCxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMseUJB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QixFQUFFO1lBQzVDLEtBQUssRUFBRSxVQUFVLENBQUMsc0JBQXNCO1lBQ3hDLFdBQVcsRUFBRSxpQ0FBaUM7U0FDL0MsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVO1lBQ3JDLFdBQVcsRUFBRSx5QkFBeUI7WUFDdEMsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsaUJBQWlCO1NBQy9DLENBQUMsQ0FBQztRQUVILDZDQUE2QztRQUM3QyxNQUFNLGlCQUFpQixHQUFHOztxQ0FFTyxVQUFVLENBQUMsc0JBQXNCOzs7Ozs7bUJBTW5ELEtBQUssQ0FBQyxhQUFhLENBQUMsYUFBYTs7OztDQUluRCxDQUFDO1FBRUUsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsaUJBQWlCO1lBQ3hCLFdBQVcsRUFBRSwrQkFBK0I7U0FDN0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBblBELHNDQW1QQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb2RlYnVpbGQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVidWlsZCc7XG5pbXBvcnQgKiBhcyBjb2RlcGlwZWxpbmUgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZSc7XG5pbXBvcnQgKiBhcyBjb2RlcGlwZWxpbmVfYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgY29kZWNvbW1pdCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZWNvbW1pdCc7XG5pbXBvcnQgKiBhcyBlY3IgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcic7XG5pbXBvcnQgKiBhcyBlY3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBQaXBlbGluZVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGVjclJlcG9zaXRvcnk6IGVjci5SZXBvc2l0b3J5O1xuICBlY3NTZXJ2aWNlOiBlY3MuRmFyZ2F0ZVNlcnZpY2U7XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlbGluZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHBpcGVsaW5lOiBjb2RlcGlwZWxpbmUuUGlwZWxpbmU7XG4gIHB1YmxpYyByZWFkb25seSBhcnRpZmFjdEJ1Y2tldDogczMuQnVja2V0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBQaXBlbGluZVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgYXJ0aWZhY3RzXG4gICAgdGhpcy5hcnRpZmFjdEJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0FydGlmYWN0QnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYGNvZmZlZXNob3AtYXJ0aWZhY3RzLSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBVc2UgUkVUQUlOIGZvciBwcm9kdWN0aW9uXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSwgLy8gVXNlIGZhbHNlIGZvciBwcm9kdWN0aW9uXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgfSk7XG5cbiAgICAvLyBDb2RlQ29tbWl0IFJlcG9zaXRvcnlcbiAgICBjb25zdCByZXBvc2l0b3J5ID0gbmV3IGNvZGVjb21taXQuUmVwb3NpdG9yeSh0aGlzLCAnQ29mZmVlU2hvcFJlcG9zaXRvcnknLCB7XG4gICAgICByZXBvc2l0b3J5TmFtZTogJ2Rlc2lnbmluZy1jbG91ZC1uYXRpdmUtbWljcm9zZXJ2aWNlcy1vbi1hd3MnLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2ZmZWVTaG9wIG1pY3Jvc2VydmljZXMgc291cmNlIGNvZGUnLFxuICAgIH0pO1xuXG4gICAgLy8gQ29kZUJ1aWxkIFNlcnZpY2UgUm9sZVxuICAgIGNvbnN0IGNvZGVCdWlsZFJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0NvZGVCdWlsZFJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnY29kZWJ1aWxkLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FXU0xhbWJkYV9GdWxsQWNjZXNzJyksXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uQVBJR2F0ZXdheUFkbWluaXN0cmF0b3InKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9ucyB0byBDb2RlQnVpbGRcbiAgICBjb2RlQnVpbGRSb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2Nsb3VkZm9ybWF0aW9uOionLFxuICAgICAgICAnaWFtOionLFxuICAgICAgICAnZWNyOkdldEF1dGhvcml6YXRpb25Ub2tlbicsXG4gICAgICAgICdlY3I6QmF0Y2hDaGVja0xheWVyQXZhaWxhYmlsaXR5JyxcbiAgICAgICAgJ2VjcjpHZXREb3dubG9hZFVybEZvckxheWVyJyxcbiAgICAgICAgJ2VjcjpCYXRjaEdldEltYWdlJyxcbiAgICAgICAgJ2VjcjpCYXRjaEltcG9ydExheWVyUGFydCcsXG4gICAgICAgICdlY3I6Q29tcGxldGVMYXllclVwbG9hZCcsXG4gICAgICAgICdlY3I6SW5pdGlhdGVMYXllclVwbG9hZCcsXG4gICAgICAgICdlY3I6UHV0SW1hZ2UnLFxuICAgICAgICAnZWNyOlVwbG9hZExheWVyUGFydCcsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBHcmFudCBTMyBwZXJtaXNzaW9uc1xuICAgIHRoaXMuYXJ0aWZhY3RCdWNrZXQuZ3JhbnRSZWFkV3JpdGUoY29kZUJ1aWxkUm9sZSk7XG5cbiAgICAvLyBHcmFudCBFQ1IgcGVybWlzc2lvbnNcbiAgICBwcm9wcy5lY3JSZXBvc2l0b3J5LmdyYW50UHVsbFB1c2goY29kZUJ1aWxkUm9sZSk7XG5cbiAgICAvLyBDb2RlQnVpbGQgUHJvamVjdFxuICAgIGNvbnN0IGJ1aWxkUHJvamVjdCA9IG5ldyBjb2RlYnVpbGQuUHJvamVjdCh0aGlzLCAnQ29mZmVlU2hvcEJ1aWxkUHJvamVjdCcsIHtcbiAgICAgIHByb2plY3ROYW1lOiAnQ29mZmVlU2hvcC1CdWlsZCcsXG4gICAgICByb2xlOiBjb2RlQnVpbGRSb2xlLFxuICAgICAgc291cmNlOiBjb2RlYnVpbGQuU291cmNlLmNvZGVDb21taXQoe1xuICAgICAgICByZXBvc2l0b3J5LFxuICAgICAgICBicmFuY2hPclJlZjogJ21haW4nLFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBidWlsZEltYWdlOiBjb2RlYnVpbGQuTGludXhCdWlsZEltYWdlLkFNQVpPTl9MSU5VWF8yXzQsXG4gICAgICAgIHByaXZpbGVnZWQ6IHRydWUsIC8vIFJlcXVpcmVkIGZvciBEb2NrZXIgYnVpbGRzXG4gICAgICAgIGNvbXB1dGVUeXBlOiBjb2RlYnVpbGQuQ29tcHV0ZVR5cGUuTUVESVVNLFxuICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICAgIEFXU19ERUZBVUxUX1JFR0lPTjoge1xuICAgICAgICAgICAgdmFsdWU6IHRoaXMucmVnaW9uLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgQVdTX0FDQ09VTlRfSUQ6IHtcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLmFjY291bnQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBJTUFHRV9SRVBPX05BTUU6IHtcbiAgICAgICAgICAgIHZhbHVlOiBwcm9wcy5lY3JSZXBvc2l0b3J5LnJlcG9zaXRvcnlOYW1lLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgSU1BR0VfVVJJOiB7XG4gICAgICAgICAgICB2YWx1ZTogcHJvcHMuZWNyUmVwb3NpdG9yeS5yZXBvc2l0b3J5VXJpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgQVJUSUZBQ1RfQlVDS0VUOiB7XG4gICAgICAgICAgICB2YWx1ZTogdGhpcy5hcnRpZmFjdEJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgY2FjaGU6IGNvZGVidWlsZC5DYWNoZS5sb2NhbChcbiAgICAgICAgY29kZWJ1aWxkLkxvY2FsQ2FjaGVNb2RlLkRPQ0tFUl9MQVlFUixcbiAgICAgICAgY29kZWJ1aWxkLkxvY2FsQ2FjaGVNb2RlLkNVU1RPTVxuICAgICAgKSxcbiAgICAgIGJ1aWxkU3BlYzogY29kZWJ1aWxkLkJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgIGNhY2hlOiB7XG4gICAgICAgICAgcGF0aHM6IFsnL3Jvb3QvLm0yLyoqLyonXSxcbiAgICAgICAgfSxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgJ3J1bnRpbWUtdmVyc2lvbnMnOiB7XG4gICAgICAgICAgICAgIGphdmE6ICdjb3JyZXR0bzE3JyxcbiAgICAgICAgICAgICAgZG9ja2VyOiAnMjAnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByZV9idWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2VjaG8gTG9nZ2luZyBpbiB0byBBbWF6b24gRUNSLi4uJyxcbiAgICAgICAgICAgICAgJ2F3cyBlY3IgZ2V0LWxvZ2luLXBhc3N3b3JkIC0tcmVnaW9uICRBV1NfREVGQVVMVF9SRUdJT04gfCBkb2NrZXIgbG9naW4gLS11c2VybmFtZSBBV1MgLS1wYXNzd29yZC1zdGRpbiAkQVdTX0FDQ09VTlRfSUQuZGtyLmVjci4kQVdTX0RFRkFVTFRfUkVHSU9OLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICAnQ09NTUlUX0hBU0g9JChlY2hvICRDT0RFQlVJTERfUkVTT0xWRURfU09VUkNFX1ZFUlNJT04gfCBjdXQgLWMgMS03KScsXG4gICAgICAgICAgICAgICdJTUFHRV9UQUc9JHtDT01NSVRfSEFTSDo9bGF0ZXN0fScsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICdlY2hvIEJ1aWxkIHN0YXJ0ZWQgb24gYGRhdGVgJyxcbiAgICAgICAgICAgICAgJ2VjaG8gQnVpbGRpbmcgSmF2YSBhcHBsaWNhdGlvbnMuLi4nLFxuICAgICAgICAgICAgICAnY2Qgc291cmNlcy9jb2ZmZWVzaG9wJyxcbiAgICAgICAgICAgICAgJ212biBjbGVhbiBpbnN0YWxsIC1EbWF2ZW4udGVzdC5za2lwPXRydWUnLFxuICAgICAgICAgICAgICAnZWNobyBCdWlsZGluZyBEb2NrZXIgaW1hZ2UgZm9yIG9yZGVycy13ZWIuLi4nLFxuICAgICAgICAgICAgICAnY2Qgb3JkZXJzLXdlYicsXG4gICAgICAgICAgICAgICdtdm4gcGFja2FnZSAtRG1hdmVuLnRlc3Quc2tpcD10cnVlJyxcbiAgICAgICAgICAgICAgJ2RvY2tlciBidWlsZCAtZiBzcmMvbWFpbi9kb2NrZXIvRG9ja2VyZmlsZS5qdm0gLXQgJElNQUdFX1VSSTpsYXRlc3QgLicsXG4gICAgICAgICAgICAgICdkb2NrZXIgdGFnICRJTUFHRV9VUkk6bGF0ZXN0ICRJTUFHRV9VUkk6JElNQUdFX1RBRycsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcG9zdF9idWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2VjaG8gQnVpbGQgY29tcGxldGVkIG9uIGBkYXRlYCcsXG4gICAgICAgICAgICAgICdlY2hvIFB1c2hpbmcgRG9ja2VyIGltYWdlcy4uLicsXG4gICAgICAgICAgICAgICdkb2NrZXIgcHVzaCAkSU1BR0VfVVJJOmxhdGVzdCcsXG4gICAgICAgICAgICAgICdkb2NrZXIgcHVzaCAkSU1BR0VfVVJJOiRJTUFHRV9UQUcnLFxuICAgICAgICAgICAgICAnZWNobyBDcmVhdGluZyBpbWFnZWRlZmluaXRpb25zLmpzb24uLi4nLFxuICAgICAgICAgICAgICAncHJpbnRmIFxcJ1t7XCJuYW1lXCI6XCJPcmRlcnNXZWJDb250YWluZXJcIixcImltYWdlVXJpXCI6XCIlc1wifV1cXCcgJElNQUdFX1VSSTokSU1BR0VfVEFHID4gaW1hZ2VkZWZpbml0aW9ucy5qc29uJyxcbiAgICAgICAgICAgICAgJ2NhdCBpbWFnZWRlZmluaXRpb25zLmpzb24nLFxuICAgICAgICAgICAgICAnZWNobyBCdWlsZGluZyBMYW1iZGEgZnVuY3Rpb25zLi4uJyxcbiAgICAgICAgICAgICAgJ2NkIC4uL2NvZmZlZS1zbHMnLFxuICAgICAgICAgICAgICAnc2FtIGJ1aWxkJyxcbiAgICAgICAgICAgICAgJ3NhbSBwYWNrYWdlIC0tczMtYnVja2V0ICRBUlRJRkFDVF9CVUNLRVQgLS1vdXRwdXQtdGVtcGxhdGUtZmlsZSBwYWNrYWdlZC55YW1sJyxcbiAgICAgICAgICAgICAgJ3NhbSBkZXBsb3kgLS10ZW1wbGF0ZS1maWxlIHBhY2thZ2VkLnlhbWwgLS1zdGFjay1uYW1lIGNvZmZlZS1zbHMgLS1jYXBhYmlsaXRpZXMgQ0FQQUJJTElUWV9JQU0gLS1uby1mYWlsLW9uLWVtcHR5LWNoYW5nZXNldCcsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAnc291cmNlcy9jb2ZmZWVzaG9wL29yZGVycy13ZWIvaW1hZ2VkZWZpbml0aW9ucy5qc29uJyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICBsb2dnaW5nOiB7XG4gICAgICAgIGNsb3VkV2F0Y2g6IHtcbiAgICAgICAgICBsb2dHcm91cDogbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgJ0J1aWxkTG9nR3JvdXAnLCB7XG4gICAgICAgICAgICBsb2dHcm91cE5hbWU6ICcvYXdzL2NvZGVidWlsZC9jb2ZmZWVzaG9wLWJ1aWxkJyxcbiAgICAgICAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDb2RlUGlwZWxpbmVcbiAgICB0aGlzLnBpcGVsaW5lID0gbmV3IGNvZGVwaXBlbGluZS5QaXBlbGluZSh0aGlzLCAnQ29mZmVlU2hvcFBpcGVsaW5lJywge1xuICAgICAgcGlwZWxpbmVOYW1lOiAnQ29mZmVlU2hvcC1QaXBlbGluZScsXG4gICAgICBhcnRpZmFjdEJ1Y2tldDogdGhpcy5hcnRpZmFjdEJ1Y2tldCxcbiAgICB9KTtcblxuICAgIC8vIFBpcGVsaW5lIGFydGlmYWN0c1xuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoJ1NvdXJjZU91dHB1dCcpO1xuICAgIGNvbnN0IGJ1aWxkT3V0cHV0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgnQnVpbGRPdXRwdXQnKTtcblxuICAgIC8vIFNvdXJjZSBzdGFnZVxuICAgIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNvZGVDb21taXRTb3VyY2VBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6ICdTb3VyY2UnLFxuICAgICAgICAgIHJlcG9zaXRvcnksXG4gICAgICAgICAgYnJhbmNoOiAnbWFpbicsXG4gICAgICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEJ1aWxkIHN0YWdlXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdCdWlsZCcsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6ICdCdWlsZCcsXG4gICAgICAgICAgcHJvamVjdDogYnVpbGRQcm9qZWN0LFxuICAgICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgICAgb3V0cHV0czogW2J1aWxkT3V0cHV0XSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gRGVwbG95IHN0YWdlXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdEZXBsb3knLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuRWNzRGVwbG95QWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnRGVwbG95JyxcbiAgICAgICAgICBzZXJ2aWNlOiBwcm9wcy5lY3NTZXJ2aWNlLFxuICAgICAgICAgIGlucHV0OiBidWlsZE91dHB1dCxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQaXBlbGluZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5waXBlbGluZS5waXBlbGluZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZGVQaXBlbGluZSBOYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1QaXBlbGluZU5hbWVgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1JlcG9zaXRvcnlDbG9uZVVybCcsIHtcbiAgICAgIHZhbHVlOiByZXBvc2l0b3J5LnJlcG9zaXRvcnlDbG9uZVVybEh0dHAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZGVDb21taXQgUmVwb3NpdG9yeSBDbG9uZSBVUkwnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FydGlmYWN0QnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFydGlmYWN0QnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEFydGlmYWN0IEJ1Y2tldCBOYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1BcnRpZmFjdEJ1Y2tldGAsXG4gICAgfSk7XG5cbiAgICAvLyBJbnN0cnVjdGlvbnMgZm9yIHNldHRpbmcgdXAgdGhlIHJlcG9zaXRvcnlcbiAgICBjb25zdCBzZXR1cEluc3RydWN0aW9ucyA9IGBcblRvIHNldCB1cCB0aGUgcmVwb3NpdG9yeTpcbjEuIENsb25lIHRoZSByZXBvc2l0b3J5OiBnaXQgY2xvbmUgJHtyZXBvc2l0b3J5LnJlcG9zaXRvcnlDbG9uZVVybEh0dHB9XG4yLiBDb3B5IHlvdXIgc291cmNlIGNvZGUgdG8gdGhlIHJlcG9zaXRvcnlcbjMuIENyZWF0ZSBpbWFnZWRlZmluaXRpb25zLmpzb24gaW4gdGhlIHJvb3Qgd2l0aDpcbltcbiAge1xuICAgIFwibmFtZVwiOiBcIk9yZGVyc1dlYkNvbnRhaW5lclwiLFxuICAgIFwiaW1hZ2VVcmlcIjogXCIke3Byb3BzLmVjclJlcG9zaXRvcnkucmVwb3NpdG9yeVVyaX06bGF0ZXN0XCJcbiAgfVxuXVxuNC4gQ29tbWl0IGFuZCBwdXNoIHRvIHRyaWdnZXIgdGhlIHBpcGVsaW5lXG5gO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NldHVwSW5zdHJ1Y3Rpb25zJywge1xuICAgICAgdmFsdWU6IHNldHVwSW5zdHJ1Y3Rpb25zLFxuICAgICAgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IHNldHVwIGluc3RydWN0aW9ucycsXG4gICAgfSk7XG4gIH1cbn0iXX0=