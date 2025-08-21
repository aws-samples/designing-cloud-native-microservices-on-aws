"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EksPipelineStack = void 0;
const cdk = require("aws-cdk-lib");
const codebuild = require("aws-cdk-lib/aws-codebuild");
const codepipeline = require("aws-cdk-lib/aws-codepipeline");
const codepipeline_actions = require("aws-cdk-lib/aws-codepipeline-actions");
const codecommit = require("aws-cdk-lib/aws-codecommit");
const iam = require("aws-cdk-lib/aws-iam");
const s3 = require("aws-cdk-lib/aws-s3");
const logs = require("aws-cdk-lib/aws-logs");
class EksPipelineStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // S3 Bucket for artifacts
        this.artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
            bucketName: `coffeeshop-eks-artifacts-${this.account}-${this.region}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
        });
        // CodeCommit Repository
        const repository = new codecommit.Repository(this, 'CoffeeShopRepository', {
            repositoryName: 'designing-cloud-native-microservices-on-aws-eks',
            description: 'CoffeeShop microservices source code for EKS',
        });
        // CodeBuild Service Role
        const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        });
        // Add CodeBuild basic permissions
        codeBuildRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: ['arn:aws:logs:*:*:*'],
        }));
        // Add Lambda permissions
        codeBuildRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'lambda:*',
            ],
            resources: ['*'],
        }));
        // Add API Gateway permissions
        codeBuildRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'apigateway:*',
            ],
            resources: ['*'],
        }));
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
                // EKS permissions
                'eks:DescribeCluster',
                'eks:DescribeNodegroup',
                'eks:ListClusters',
                'eks:ListNodegroups',
            ],
            resources: ['*'],
        }));
        // Grant S3 permissions
        this.artifactBucket.grantReadWrite(codeBuildRole);
        // Grant ECR permissions for all repositories
        Object.values(props.ecrRepositories).forEach(repo => {
            repo.grantPullPush(codeBuildRole);
        });
        // Note: EKS cluster access will be configured via kubectl commands in the build process
        // CodeBuild Project for building and deploying to EKS
        const buildProject = new codebuild.Project(this, 'CoffeeShopEKSBuildProject', {
            projectName: 'CoffeeShop-EKS-Build',
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
                    ORDERS_WEB_IMAGE_URI: {
                        value: props.ecrRepositories['orders-web'].repositoryUri,
                    },
                    COFFEE_WEB_IMAGE_URI: {
                        value: props.ecrRepositories['coffee-web'].repositoryUri,
                    },
                    INVENTORY_WEB_IMAGE_URI: {
                        value: props.ecrRepositories['inventory-web'].repositoryUri,
                    },
                    EKS_CLUSTER_NAME: {
                        value: props.eksCluster.clusterName,
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
                        commands: [
                            'echo Installing kubectl...',
                            'curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.28.3/2023-11-14/bin/linux/amd64/kubectl',
                            'chmod +x ./kubectl',
                            'mv ./kubectl /usr/local/bin',
                            'kubectl version --client',
                            'echo Installing helm...',
                            'curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash',
                            'helm version',
                        ],
                    },
                    pre_build: {
                        commands: [
                            'echo Logging in to Amazon ECR...',
                            'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
                            'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
                            'IMAGE_TAG=${COMMIT_HASH:=latest}',
                            'echo Configuring kubectl for EKS...',
                            'aws eks update-kubeconfig --region $AWS_DEFAULT_REGION --name $EKS_CLUSTER_NAME',
                            'kubectl get nodes',
                        ],
                    },
                    build: {
                        commands: [
                            'echo Build started on `date`',
                            'echo Building Java applications...',
                            'cd sources/coffeeshop',
                            'mvn clean install -Dmaven.test.skip=true',
                            'echo Building Docker images for all microservices...',
                            'cd orders-web',
                            'mvn package -Dmaven.test.skip=true',
                            'docker build -t $ORDERS_WEB_IMAGE_URI:latest .',
                            'docker tag $ORDERS_WEB_IMAGE_URI:latest $ORDERS_WEB_IMAGE_URI:$IMAGE_TAG',
                            'cd ../coffee-web',
                            'mvn package -Dmaven.test.skip=true',
                            'docker build -t $COFFEE_WEB_IMAGE_URI:latest .',
                            'docker tag $COFFEE_WEB_IMAGE_URI:latest $COFFEE_WEB_IMAGE_URI:$IMAGE_TAG',
                            'cd ../inventory-web',
                            'mvn package -Dmaven.test.skip=true',
                            'docker build -t $INVENTORY_WEB_IMAGE_URI:latest .',
                            'docker tag $INVENTORY_WEB_IMAGE_URI:latest $INVENTORY_WEB_IMAGE_URI:$IMAGE_TAG',
                            'cd ..',
                            'echo Building Lambda functions...',
                            'cd ../coffee-sls',
                            'sam build',
                            'sam package --s3-bucket $ARTIFACT_BUCKET --output-template-file packaged.yaml',
                        ],
                    },
                    post_build: {
                        commands: [
                            'echo Build completed on `date`',
                            'echo Pushing Docker images for all microservices...',
                            'docker push $ORDERS_WEB_IMAGE_URI:latest',
                            'docker push $ORDERS_WEB_IMAGE_URI:$IMAGE_TAG',
                            'docker push $COFFEE_WEB_IMAGE_URI:latest',
                            'docker push $COFFEE_WEB_IMAGE_URI:$IMAGE_TAG',
                            'docker push $INVENTORY_WEB_IMAGE_URI:latest',
                            'docker push $INVENTORY_WEB_IMAGE_URI:$IMAGE_TAG',
                            'echo Deploying Lambda functions...',
                            'cd ../coffee-sls',
                            'sam deploy --template-file packaged.yaml --stack-name coffee-sls --capabilities CAPABILITY_IAM --no-fail-on-empty-changeset',
                            'echo Deploying to EKS...',
                            'cd ../../..',
                            'echo Updating Kubernetes manifests for all microservices...',
                            'sed -i "s|<ORDERS_WEB_ECR_URI>|$ORDERS_WEB_IMAGE_URI|g" k8s-manifests/orders-web-deployment.yaml',
                            'sed -i "s|<COFFEE_WEB_ECR_URI>|$COFFEE_WEB_IMAGE_URI|g" k8s-manifests/coffee-web-deployment.yaml',
                            'sed -i "s|<INVENTORY_WEB_ECR_URI>|$INVENTORY_WEB_IMAGE_URI|g" k8s-manifests/inventory-web-deployment.yaml',
                            'echo Applying Kubernetes manifests for all microservices...',
                            'kubectl apply -f k8s-manifests/orders-web-deployment.yaml',
                            'kubectl apply -f k8s-manifests/coffee-web-deployment.yaml',
                            'kubectl apply -f k8s-manifests/inventory-web-deployment.yaml',
                            'kubectl apply -f k8s-manifests/ingress.yaml',
                            'kubectl apply -f k8s-manifests/network-policies.yaml',
                            'echo Waiting for deployments to complete...',
                            'kubectl rollout status deployment/orders-web -n coffeeshop --timeout=300s',
                            'kubectl rollout status deployment/coffee-web -n coffeeshop --timeout=300s',
                            'kubectl rollout status deployment/inventory-web -n coffeeshop --timeout=300s',
                            'echo Getting service information...',
                            'kubectl get services -n coffeeshop',
                            'kubectl get ingress -n coffeeshop',
                        ],
                    },
                },
                artifacts: {
                    files: [
                        'k8s-manifests/**/*',
                    ],
                },
            }),
            logging: {
                cloudWatch: {
                    logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
                        logGroupName: '/aws/codebuild/coffeeshop-eks-build',
                        retention: logs.RetentionDays.ONE_WEEK,
                        removalPolicy: cdk.RemovalPolicy.DESTROY,
                    }),
                },
            },
        });
        // CodePipeline
        this.pipeline = new codepipeline.Pipeline(this, 'CoffeeShopEKSPipeline', {
            pipelineName: 'CoffeeShop-EKS-Pipeline',
            artifactBucket: this.artifactBucket,
            pipelineType: codepipeline.PipelineType.V2, // Specify V2 pipeline type
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
        // Build and Deploy stage
        this.pipeline.addStage({
            stageName: 'BuildAndDeploy',
            actions: [
                new codepipeline_actions.CodeBuildAction({
                    actionName: 'BuildAndDeploy',
                    project: buildProject,
                    input: sourceOutput,
                    outputs: [buildOutput],
                }),
            ],
        });
        // Optional: Manual approval stage for production
        // this.pipeline.addStage({
        //   stageName: 'ManualApproval',
        //   actions: [
        //     new codepipeline_actions.ManualApprovalAction({
        //       actionName: 'ManualApproval',
        //       additionalInformation: 'Please review the changes and approve for production deployment',
        //     }),
        //   ],
        // });
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
To set up the EKS repository:
1. Clone the repository: git clone ${repository.repositoryCloneUrlHttp}
2. Copy your source code and k8s-manifests to the repository
3. Update k8s-manifests/ingress.yaml with your domain name
4. Commit and push to trigger the pipeline:
   git add .
   git commit -m "Initial EKS deployment"
   git push origin main

To access your application:
1. Get the ALB DNS name: kubectl get ingress -n coffeeshop
2. Update your DNS to point to the ALB
3. Access your application at https://your-domain.com
`;
        new cdk.CfnOutput(this, 'SetupInstructions', {
            value: setupInstructions,
            description: 'EKS setup instructions',
        });
    }
}
exports.EksPipelineStack = EksPipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWtzLXBpcGVsaW5lLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWtzLXBpcGVsaW5lLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyx1REFBdUQ7QUFDdkQsNkRBQTZEO0FBQzdELDZFQUE2RTtBQUM3RSx5REFBeUQ7QUFHekQsMkNBQTJDO0FBQzNDLHlDQUF5QztBQUN6Qyw2Q0FBNkM7QUFRN0MsTUFBYSxnQkFBaUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUk3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTRCO1FBQ3BFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDBCQUEwQjtRQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDMUQsVUFBVSxFQUFFLDRCQUE0QixJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDckUsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1NBQzNDLENBQUMsQ0FBQztRQUVILHdCQUF3QjtRQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQ3pFLGNBQWMsRUFBRSxpREFBaUQ7WUFDakUsV0FBVyxFQUFFLDhDQUE4QztTQUM1RCxDQUFDLENBQUM7UUFFSCx5QkFBeUI7UUFDekIsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDeEQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFn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QjtZQUN4QixXQUFXLEVBQUUsd0JBQXdCO1NBQ3RDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpVRCw0Q0F5VUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgY29kZWJ1aWxkIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlYnVpbGQnO1xuaW1wb3J0ICogYXMgY29kZXBpcGVsaW5lIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0ICogYXMgY29kZXBpcGVsaW5lX2FjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGNvZGVjb21taXQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVjb21taXQnO1xuaW1wb3J0ICogYXMgZWNyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3InO1xuaW1wb3J0ICogYXMgZWtzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWtzUGlwZWxpbmVTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBlY3JSZXBvc2l0b3JpZXM6IHsgW2tleTogc3RyaW5nXTogZWNyLklSZXBvc2l0b3J5IH07XG4gIGVrc0NsdXN0ZXI6IGVrcy5DbHVzdGVyO1xufVxuXG5leHBvcnQgY2xhc3MgRWtzUGlwZWxpbmVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBwaXBlbGluZTogY29kZXBpcGVsaW5lLlBpcGVsaW5lO1xuICBwdWJsaWMgcmVhZG9ubHkgYXJ0aWZhY3RCdWNrZXQ6IHMzLkJ1Y2tldDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRWtzUGlwZWxpbmVTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBTMyBCdWNrZXQgZm9yIGFydGlmYWN0c1xuICAgIHRoaXMuYXJ0aWZhY3RCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdBcnRpZmFjdEJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBjb2ZmZWVzaG9wLWVrcy1hcnRpZmFjdHMtJHt0aGlzLmFjY291bnR9LSR7dGhpcy5yZWdpb259YCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vIENvZGVDb21taXQgUmVwb3NpdG9yeVxuICAgIGNvbnN0IHJlcG9zaXRvcnkgPSBuZXcgY29kZWNvbW1pdC5SZXBvc2l0b3J5KHRoaXMsICdDb2ZmZWVTaG9wUmVwb3NpdG9yeScsIHtcbiAgICAgIHJlcG9zaXRvcnlOYW1lOiAnZGVzaWduaW5nLWNsb3VkLW5hdGl2ZS1taWNyb3NlcnZpY2VzLW9uLWF3cy1la3MnLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2ZmZWVTaG9wIG1pY3Jvc2VydmljZXMgc291cmNlIGNvZGUgZm9yIEVLUycsXG4gICAgfSk7XG5cbiAgICAvLyBDb2RlQnVpbGQgU2VydmljZSBSb2xlXG4gICAgY29uc3QgY29kZUJ1aWxkUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQ29kZUJ1aWxkUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdjb2RlYnVpbGQuYW1hem9uYXdzLmNvbScpLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIENvZGVCdWlsZCBiYXNpYyBwZXJtaXNzaW9uc1xuICAgIGNvZGVCdWlsZFJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJ2Fybjphd3M6bG9nczoqOio6KiddLFxuICAgIH0pKTtcblxuICAgIC8vIEFkZCBMYW1iZGEgcGVybWlzc2lvbnNcbiAgICBjb2RlQnVpbGRSb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2xhbWJkYToqJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEFkZCBBUEkgR2F0ZXdheSBwZXJtaXNzaW9uc1xuICAgIGNvZGVCdWlsZFJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYXBpZ2F0ZXdheToqJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIHRvIENvZGVCdWlsZFxuICAgIGNvZGVCdWlsZFJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnY2xvdWRmb3JtYXRpb246KicsXG4gICAgICAgICdpYW06KicsXG4gICAgICAgICdlY3I6R2V0QXV0aG9yaXphdGlvblRva2VuJyxcbiAgICAgICAgJ2VjcjpCYXRjaENoZWNrTGF5ZXJBdmFpbGFiaWxpdHknLFxuICAgICAgICAnZWNyOkdldERvd25sb2FkVXJsRm9yTGF5ZXInLFxuICAgICAgICAnZWNyOkJhdGNoR2V0SW1hZ2UnLFxuICAgICAgICAnZWNyOkJhdGNoSW1wb3J0TGF5ZXJQYXJ0JyxcbiAgICAgICAgJ2VjcjpDb21wbGV0ZUxheWVyVXBsb2FkJyxcbiAgICAgICAgJ2VjcjpJbml0aWF0ZUxheWVyVXBsb2FkJyxcbiAgICAgICAgJ2VjcjpQdXRJbWFnZScsXG4gICAgICAgICdlY3I6VXBsb2FkTGF5ZXJQYXJ0JyxcbiAgICAgICAgLy8gRUtTIHBlcm1pc3Npb25zXG4gICAgICAgICdla3M6RGVzY3JpYmVDbHVzdGVyJyxcbiAgICAgICAgJ2VrczpEZXNjcmliZU5vZGVncm91cCcsXG4gICAgICAgICdla3M6TGlzdENsdXN0ZXJzJyxcbiAgICAgICAgJ2VrczpMaXN0Tm9kZWdyb3VwcycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBHcmFudCBTMyBwZXJtaXNzaW9uc1xuICAgIHRoaXMuYXJ0aWZhY3RCdWNrZXQuZ3JhbnRSZWFkV3JpdGUoY29kZUJ1aWxkUm9sZSk7XG5cbiAgICAvLyBHcmFudCBFQ1IgcGVybWlzc2lvbnMgZm9yIGFsbCByZXBvc2l0b3JpZXNcbiAgICBPYmplY3QudmFsdWVzKHByb3BzLmVjclJlcG9zaXRvcmllcykuZm9yRWFjaChyZXBvID0+IHtcbiAgICAgIHJlcG8uZ3JhbnRQdWxsUHVzaChjb2RlQnVpbGRSb2xlKTtcbiAgICB9KTtcblxuICAgIC8vIE5vdGU6IEVLUyBjbHVzdGVyIGFjY2VzcyB3aWxsIGJlIGNvbmZpZ3VyZWQgdmlhIGt1YmVjdGwgY29tbWFuZHMgaW4gdGhlIGJ1aWxkIHByb2Nlc3NcblxuICAgIC8vIENvZGVCdWlsZCBQcm9qZWN0IGZvciBidWlsZGluZyBhbmQgZGVwbG95aW5nIHRvIEVLU1xuICAgIGNvbnN0IGJ1aWxkUHJvamVjdCA9IG5ldyBjb2RlYnVpbGQuUHJvamVjdCh0aGlzLCAnQ29mZmVlU2hvcEVLU0J1aWxkUHJvamVjdCcsIHtcbiAgICAgIHByb2plY3ROYW1lOiAnQ29mZmVlU2hvcC1FS1MtQnVpbGQnLFxuICAgICAgcm9sZTogY29kZUJ1aWxkUm9sZSxcbiAgICAgIHNvdXJjZTogY29kZWJ1aWxkLlNvdXJjZS5jb2RlQ29tbWl0KHtcbiAgICAgICAgcmVwb3NpdG9yeSxcbiAgICAgICAgYnJhbmNoT3JSZWY6ICdtYWluJyxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5BTUFaT05fTElOVVhfMl80LFxuICAgICAgICBwcml2aWxlZ2VkOiB0cnVlLFxuICAgICAgICBjb21wdXRlVHlwZTogY29kZWJ1aWxkLkNvbXB1dGVUeXBlLk1FRElVTSxcbiAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHtcbiAgICAgICAgICBBV1NfREVGQVVMVF9SRUdJT046IHtcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICB9LFxuICAgICAgICAgIEFXU19BQ0NPVU5UX0lEOiB7XG4gICAgICAgICAgICB2YWx1ZTogdGhpcy5hY2NvdW50LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgT1JERVJTX1dFQl9JTUFHRV9VUkk6IHtcbiAgICAgICAgICAgIHZhbHVlOiBwcm9wcy5lY3JSZXBvc2l0b3JpZXNbJ29yZGVycy13ZWInXS5yZXBvc2l0b3J5VXJpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgQ09GRkVFX1dFQl9JTUFHRV9VUkk6IHtcbiAgICAgICAgICAgIHZhbHVlOiBwcm9wcy5lY3JSZXBvc2l0b3JpZXNbJ2NvZmZlZS13ZWInXS5yZXBvc2l0b3J5VXJpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgSU5WRU5UT1JZX1dFQl9JTUFHRV9VUkk6IHtcbiAgICAgICAgICAgIHZhbHVlOiBwcm9wcy5lY3JSZXBvc2l0b3JpZXNbJ2ludmVudG9yeS13ZWInXS5yZXBvc2l0b3J5VXJpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgRUtTX0NMVVNURVJfTkFNRToge1xuICAgICAgICAgICAgdmFsdWU6IHByb3BzLmVrc0NsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBBUlRJRkFDVF9CVUNLRVQ6IHtcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLmFydGlmYWN0QnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBjYWNoZTogY29kZWJ1aWxkLkNhY2hlLmxvY2FsKFxuICAgICAgICBjb2RlYnVpbGQuTG9jYWxDYWNoZU1vZGUuRE9DS0VSX0xBWUVSLFxuICAgICAgICBjb2RlYnVpbGQuTG9jYWxDYWNoZU1vZGUuQ1VTVE9NXG4gICAgICApLFxuICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgY2FjaGU6IHtcbiAgICAgICAgICBwYXRoczogWycvcm9vdC8ubTIvKiovKiddLFxuICAgICAgICB9LFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICAncnVudGltZS12ZXJzaW9ucyc6IHtcbiAgICAgICAgICAgICAgamF2YTogJ2NvcnJldHRvMTcnLFxuICAgICAgICAgICAgICBkb2NrZXI6ICcyMCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2VjaG8gSW5zdGFsbGluZyBrdWJlY3RsLi4uJyxcbiAgICAgICAgICAgICAgJ2N1cmwgLW8ga3ViZWN0bCBodHRwczovL2FtYXpvbi1la3MuczMudXMtd2VzdC0yLmFtYXpvbmF3cy5jb20vMS4yOC4zLzIwMjMtMTEtMTQvYmluL2xpbnV4L2FtZDY0L2t1YmVjdGwnLFxuICAgICAgICAgICAgICAnY2htb2QgK3ggLi9rdWJlY3RsJyxcbiAgICAgICAgICAgICAgJ212IC4va3ViZWN0bCAvdXNyL2xvY2FsL2JpbicsXG4gICAgICAgICAgICAgICdrdWJlY3RsIHZlcnNpb24gLS1jbGllbnQnLFxuICAgICAgICAgICAgICAnZWNobyBJbnN0YWxsaW5nIGhlbG0uLi4nLFxuICAgICAgICAgICAgICAnY3VybCBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vaGVsbS9oZWxtL21haW4vc2NyaXB0cy9nZXQtaGVsbS0zIHwgYmFzaCcsXG4gICAgICAgICAgICAgICdoZWxtIHZlcnNpb24nLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByZV9idWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2VjaG8gTG9nZ2luZyBpbiB0byBBbWF6b24gRUNSLi4uJyxcbiAgICAgICAgICAgICAgJ2F3cyBlY3IgZ2V0LWxvZ2luLXBhc3N3b3JkIC0tcmVnaW9uICRBV1NfREVGQVVMVF9SRUdJT04gfCBkb2NrZXIgbG9naW4gLS11c2VybmFtZSBBV1MgLS1wYXNzd29yZC1zdGRpbiAkQVdTX0FDQ09VTlRfSUQuZGtyLmVjci4kQVdTX0RFRkFVTFRfUkVHSU9OLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICAnQ09NTUlUX0hBU0g9JChlY2hvICRDT0RFQlVJTERfUkVTT0xWRURfU09VUkNFX1ZFUlNJT04gfCBjdXQgLWMgMS03KScsXG4gICAgICAgICAgICAgICdJTUFHRV9UQUc9JHtDT01NSVRfSEFTSDo9bGF0ZXN0fScsXG4gICAgICAgICAgICAgICdlY2hvIENvbmZpZ3VyaW5nIGt1YmVjdGwgZm9yIEVLUy4uLicsXG4gICAgICAgICAgICAgICdhd3MgZWtzIHVwZGF0ZS1rdWJlY29uZmlnIC0tcmVnaW9uICRBV1NfREVGQVVMVF9SRUdJT04gLS1uYW1lICRFS1NfQ0xVU1RFUl9OQU1FJyxcbiAgICAgICAgICAgICAgJ2t1YmVjdGwgZ2V0IG5vZGVzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2VjaG8gQnVpbGQgc3RhcnRlZCBvbiBgZGF0ZWAnLFxuICAgICAgICAgICAgICAnZWNobyBCdWlsZGluZyBKYXZhIGFwcGxpY2F0aW9ucy4uLicsXG4gICAgICAgICAgICAgICdjZCBzb3VyY2VzL2NvZmZlZXNob3AnLFxuICAgICAgICAgICAgICAnbXZuIGNsZWFuIGluc3RhbGwgLURtYXZlbi50ZXN0LnNraXA9dHJ1ZScsXG4gICAgICAgICAgICAgICdlY2hvIEJ1aWxkaW5nIERvY2tlciBpbWFnZXMgZm9yIGFsbCBtaWNyb3NlcnZpY2VzLi4uJyxcbiAgICAgICAgICAgICAgJ2NkIG9yZGVycy13ZWInLFxuICAgICAgICAgICAgICAnbXZuIHBhY2thZ2UgLURtYXZlbi50ZXN0LnNraXA9dHJ1ZScsXG4gICAgICAgICAgICAgICdkb2NrZXIgYnVpbGQgLXQgJE9SREVSU19XRUJfSU1BR0VfVVJJOmxhdGVzdCAuJyxcbiAgICAgICAgICAgICAgJ2RvY2tlciB0YWcgJE9SREVSU19XRUJfSU1BR0VfVVJJOmxhdGVzdCAkT1JERVJTX1dFQl9JTUFHRV9VUkk6JElNQUdFX1RBRycsXG4gICAgICAgICAgICAgICdjZCAuLi9jb2ZmZWUtd2ViJyxcbiAgICAgICAgICAgICAgJ212biBwYWNrYWdlIC1EbWF2ZW4udGVzdC5za2lwPXRydWUnLFxuICAgICAgICAgICAgICAnZG9ja2VyIGJ1aWxkIC10ICRDT0ZGRUVfV0VCX0lNQUdFX1VSSTpsYXRlc3QgLicsXG4gICAgICAgICAgICAgICdkb2NrZXIgdGFnICRDT0ZGRUVfV0VCX0lNQUdFX1VSSTpsYXRlc3QgJENPRkZFRV9XRUJfSU1BR0VfVVJJOiRJTUFHRV9UQUcnLFxuICAgICAgICAgICAgICAnY2QgLi4vaW52ZW50b3J5LXdlYicsXG4gICAgICAgICAgICAgICdtdm4gcGFja2FnZSAtRG1hdmVuLnRlc3Quc2tpcD10cnVlJyxcbiAgICAgICAgICAgICAgJ2RvY2tlciBidWlsZCAtdCAkSU5WRU5UT1JZX1dFQl9JTUFHRV9VUkk6bGF0ZXN0IC4nLFxuICAgICAgICAgICAgICAnZG9ja2VyIHRhZyAkSU5WRU5UT1JZX1dFQl9JTUFHRV9VUkk6bGF0ZXN0ICRJTlZFTlRPUllfV0VCX0lNQUdFX1VSSTokSU1BR0VfVEFHJyxcbiAgICAgICAgICAgICAgJ2NkIC4uJyxcbiAgICAgICAgICAgICAgJ2VjaG8gQnVpbGRpbmcgTGFtYmRhIGZ1bmN0aW9ucy4uLicsXG4gICAgICAgICAgICAgICdjZCAuLi9jb2ZmZWUtc2xzJyxcbiAgICAgICAgICAgICAgJ3NhbSBidWlsZCcsXG4gICAgICAgICAgICAgICdzYW0gcGFja2FnZSAtLXMzLWJ1Y2tldCAkQVJUSUZBQ1RfQlVDS0VUIC0tb3V0cHV0LXRlbXBsYXRlLWZpbGUgcGFja2FnZWQueWFtbCcsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcG9zdF9idWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2VjaG8gQnVpbGQgY29tcGxldGVkIG9uIGBkYXRlYCcsXG4gICAgICAgICAgICAgICdlY2hvIFB1c2hpbmcgRG9ja2VyIGltYWdlcyBmb3IgYWxsIG1pY3Jvc2VydmljZXMuLi4nLFxuICAgICAgICAgICAgICAnZG9ja2VyIHB1c2ggJE9SREVSU19XRUJfSU1BR0VfVVJJOmxhdGVzdCcsXG4gICAgICAgICAgICAgICdkb2NrZXIgcHVzaCAkT1JERVJTX1dFQl9JTUFHRV9VUkk6JElNQUdFX1RBRycsXG4gICAgICAgICAgICAgICdkb2NrZXIgcHVzaCAkQ09GRkVFX1dFQl9JTUFHRV9VUkk6bGF0ZXN0JyxcbiAgICAgICAgICAgICAgJ2RvY2tlciBwdXNoICRDT0ZGRUVfV0VCX0lNQUdFX1VSSTokSU1BR0VfVEFHJyxcbiAgICAgICAgICAgICAgJ2RvY2tlciBwdXNoICRJTlZFTlRPUllfV0VCX0lNQUdFX1VSSTpsYXRlc3QnLFxuICAgICAgICAgICAgICAnZG9ja2VyIHB1c2ggJElOVkVOVE9SWV9XRUJfSU1BR0VfVVJJOiRJTUFHRV9UQUcnLFxuICAgICAgICAgICAgICAnZWNobyBEZXBsb3lpbmcgTGFtYmRhIGZ1bmN0aW9ucy4uLicsXG4gICAgICAgICAgICAgICdjZCAuLi9jb2ZmZWUtc2xzJyxcbiAgICAgICAgICAgICAgJ3NhbSBkZXBsb3kgLS10ZW1wbGF0ZS1maWxlIHBhY2thZ2VkLnlhbWwgLS1zdGFjay1uYW1lIGNvZmZlZS1zbHMgLS1jYXBhYmlsaXRpZXMgQ0FQQUJJTElUWV9JQU0gLS1uby1mYWlsLW9uLWVtcHR5LWNoYW5nZXNldCcsXG4gICAgICAgICAgICAgICdlY2hvIERlcGxveWluZyB0byBFS1MuLi4nLFxuICAgICAgICAgICAgICAnY2QgLi4vLi4vLi4nLFxuICAgICAgICAgICAgICAnZWNobyBVcGRhdGluZyBLdWJlcm5ldGVzIG1hbmlmZXN0cyBmb3IgYWxsIG1pY3Jvc2VydmljZXMuLi4nLFxuICAgICAgICAgICAgICAnc2VkIC1pIFwic3w8T1JERVJTX1dFQl9FQ1JfVVJJPnwkT1JERVJTX1dFQl9JTUFHRV9VUkl8Z1wiIGs4cy1tYW5pZmVzdHMvb3JkZXJzLXdlYi1kZXBsb3ltZW50LnlhbWwnLFxuICAgICAgICAgICAgICAnc2VkIC1pIFwic3w8Q09GRkVFX1dFQl9FQ1JfVVJJPnwkQ09GRkVFX1dFQl9JTUFHRV9VUkl8Z1wiIGs4cy1tYW5pZmVzdHMvY29mZmVlLXdlYi1kZXBsb3ltZW50LnlhbWwnLFxuICAgICAgICAgICAgICAnc2VkIC1pIFwic3w8SU5WRU5UT1JZX1dFQl9FQ1JfVVJJPnwkSU5WRU5UT1JZX1dFQl9JTUFHRV9VUkl8Z1wiIGs4cy1tYW5pZmVzdHMvaW52ZW50b3J5LXdlYi1kZXBsb3ltZW50LnlhbWwnLFxuICAgICAgICAgICAgICAnZWNobyBBcHBseWluZyBLdWJlcm5ldGVzIG1hbmlmZXN0cyBmb3IgYWxsIG1pY3Jvc2VydmljZXMuLi4nLFxuICAgICAgICAgICAgICAna3ViZWN0bCBhcHBseSAtZiBrOHMtbWFuaWZlc3RzL29yZGVycy13ZWItZGVwbG95bWVudC55YW1sJyxcbiAgICAgICAgICAgICAgJ2t1YmVjdGwgYXBwbHkgLWYgazhzLW1hbmlmZXN0cy9jb2ZmZWUtd2ViLWRlcGxveW1lbnQueWFtbCcsXG4gICAgICAgICAgICAgICdrdWJlY3RsIGFwcGx5IC1mIGs4cy1tYW5pZmVzdHMvaW52ZW50b3J5LXdlYi1kZXBsb3ltZW50LnlhbWwnLFxuICAgICAgICAgICAgICAna3ViZWN0bCBhcHBseSAtZiBrOHMtbWFuaWZlc3RzL2luZ3Jlc3MueWFtbCcsXG4gICAgICAgICAgICAgICdrdWJlY3RsIGFwcGx5IC1mIGs4cy1tYW5pZmVzdHMvbmV0d29yay1wb2xpY2llcy55YW1sJyxcbiAgICAgICAgICAgICAgJ2VjaG8gV2FpdGluZyBmb3IgZGVwbG95bWVudHMgdG8gY29tcGxldGUuLi4nLFxuICAgICAgICAgICAgICAna3ViZWN0bCByb2xsb3V0IHN0YXR1cyBkZXBsb3ltZW50L29yZGVycy13ZWIgLW4gY29mZmVlc2hvcCAtLXRpbWVvdXQ9MzAwcycsXG4gICAgICAgICAgICAgICdrdWJlY3RsIHJvbGxvdXQgc3RhdHVzIGRlcGxveW1lbnQvY29mZmVlLXdlYiAtbiBjb2ZmZWVzaG9wIC0tdGltZW91dD0zMDBzJyxcbiAgICAgICAgICAgICAgJ2t1YmVjdGwgcm9sbG91dCBzdGF0dXMgZGVwbG95bWVudC9pbnZlbnRvcnktd2ViIC1uIGNvZmZlZXNob3AgLS10aW1lb3V0PTMwMHMnLFxuICAgICAgICAgICAgICAnZWNobyBHZXR0aW5nIHNlcnZpY2UgaW5mb3JtYXRpb24uLi4nLFxuICAgICAgICAgICAgICAna3ViZWN0bCBnZXQgc2VydmljZXMgLW4gY29mZmVlc2hvcCcsXG4gICAgICAgICAgICAgICdrdWJlY3RsIGdldCBpbmdyZXNzIC1uIGNvZmZlZXNob3AnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgJ2s4cy1tYW5pZmVzdHMvKiovKicsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgbG9nZ2luZzoge1xuICAgICAgICBjbG91ZFdhdGNoOiB7XG4gICAgICAgICAgbG9nR3JvdXA6IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdCdWlsZExvZ0dyb3VwJywge1xuICAgICAgICAgICAgbG9nR3JvdXBOYW1lOiAnL2F3cy9jb2RlYnVpbGQvY29mZmVlc2hvcC1la3MtYnVpbGQnLFxuICAgICAgICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENvZGVQaXBlbGluZVxuICAgIHRoaXMucGlwZWxpbmUgPSBuZXcgY29kZXBpcGVsaW5lLlBpcGVsaW5lKHRoaXMsICdDb2ZmZWVTaG9wRUtTUGlwZWxpbmUnLCB7XG4gICAgICBwaXBlbGluZU5hbWU6ICdDb2ZmZWVTaG9wLUVLUy1QaXBlbGluZScsXG4gICAgICBhcnRpZmFjdEJ1Y2tldDogdGhpcy5hcnRpZmFjdEJ1Y2tldCxcbiAgICAgIHBpcGVsaW5lVHlwZTogY29kZXBpcGVsaW5lLlBpcGVsaW5lVHlwZS5WMiwgLy8gU3BlY2lmeSBWMiBwaXBlbGluZSB0eXBlXG4gICAgfSk7XG5cbiAgICAvLyBQaXBlbGluZSBhcnRpZmFjdHNcbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCdTb3VyY2VPdXRwdXQnKTtcbiAgICBjb25zdCBidWlsZE91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoJ0J1aWxkT3V0cHV0Jyk7XG5cbiAgICAvLyBTb3VyY2Ugc3RhZ2VcbiAgICB0aGlzLnBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgIHN0YWdlTmFtZTogJ1NvdXJjZScsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQ29tbWl0U291cmNlQWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnU291cmNlJyxcbiAgICAgICAgICByZXBvc2l0b3J5LFxuICAgICAgICAgIGJyYW5jaDogJ21haW4nLFxuICAgICAgICAgIG91dHB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBCdWlsZCBhbmQgRGVwbG95IHN0YWdlXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdCdWlsZEFuZERlcGxveScsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6ICdCdWlsZEFuZERlcGxveScsXG4gICAgICAgICAgcHJvamVjdDogYnVpbGRQcm9qZWN0LFxuICAgICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgICAgb3V0cHV0czogW2J1aWxkT3V0cHV0XSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gT3B0aW9uYWw6IE1hbnVhbCBhcHByb3ZhbCBzdGFnZSBmb3IgcHJvZHVjdGlvblxuICAgIC8vIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgIC8vICAgc3RhZ2VOYW1lOiAnTWFudWFsQXBwcm92YWwnLFxuICAgIC8vICAgYWN0aW9uczogW1xuICAgIC8vICAgICBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuTWFudWFsQXBwcm92YWxBY3Rpb24oe1xuICAgIC8vICAgICAgIGFjdGlvbk5hbWU6ICdNYW51YWxBcHByb3ZhbCcsXG4gICAgLy8gICAgICAgYWRkaXRpb25hbEluZm9ybWF0aW9uOiAnUGxlYXNlIHJldmlldyB0aGUgY2hhbmdlcyBhbmQgYXBwcm92ZSBmb3IgcHJvZHVjdGlvbiBkZXBsb3ltZW50JyxcbiAgICAvLyAgICAgfSksXG4gICAgLy8gICBdLFxuICAgIC8vIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQaXBlbGluZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5waXBlbGluZS5waXBlbGluZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZGVQaXBlbGluZSBOYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1QaXBlbGluZU5hbWVgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1JlcG9zaXRvcnlDbG9uZVVybCcsIHtcbiAgICAgIHZhbHVlOiByZXBvc2l0b3J5LnJlcG9zaXRvcnlDbG9uZVVybEh0dHAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZGVDb21taXQgUmVwb3NpdG9yeSBDbG9uZSBVUkwnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FydGlmYWN0QnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFydGlmYWN0QnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEFydGlmYWN0IEJ1Y2tldCBOYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1BcnRpZmFjdEJ1Y2tldGAsXG4gICAgfSk7XG5cbiAgICAvLyBJbnN0cnVjdGlvbnMgZm9yIHNldHRpbmcgdXAgdGhlIHJlcG9zaXRvcnlcbiAgICBjb25zdCBzZXR1cEluc3RydWN0aW9ucyA9IGBcblRvIHNldCB1cCB0aGUgRUtTIHJlcG9zaXRvcnk6XG4xLiBDbG9uZSB0aGUgcmVwb3NpdG9yeTogZ2l0IGNsb25lICR7cmVwb3NpdG9yeS5yZXBvc2l0b3J5Q2xvbmVVcmxIdHRwfVxuMi4gQ29weSB5b3VyIHNvdXJjZSBjb2RlIGFuZCBrOHMtbWFuaWZlc3RzIHRvIHRoZSByZXBvc2l0b3J5XG4zLiBVcGRhdGUgazhzLW1hbmlmZXN0cy9pbmdyZXNzLnlhbWwgd2l0aCB5b3VyIGRvbWFpbiBuYW1lXG40LiBDb21taXQgYW5kIHB1c2ggdG8gdHJpZ2dlciB0aGUgcGlwZWxpbmU6XG4gICBnaXQgYWRkIC5cbiAgIGdpdCBjb21taXQgLW0gXCJJbml0aWFsIEVLUyBkZXBsb3ltZW50XCJcbiAgIGdpdCBwdXNoIG9yaWdpbiBtYWluXG5cblRvIGFjY2VzcyB5b3VyIGFwcGxpY2F0aW9uOlxuMS4gR2V0IHRoZSBBTEIgRE5TIG5hbWU6IGt1YmVjdGwgZ2V0IGluZ3Jlc3MgLW4gY29mZmVlc2hvcFxuMi4gVXBkYXRlIHlvdXIgRE5TIHRvIHBvaW50IHRvIHRoZSBBTEJcbjMuIEFjY2VzcyB5b3VyIGFwcGxpY2F0aW9uIGF0IGh0dHBzOi8veW91ci1kb21haW4uY29tXG5gO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NldHVwSW5zdHJ1Y3Rpb25zJywge1xuICAgICAgdmFsdWU6IHNldHVwSW5zdHJ1Y3Rpb25zLFxuICAgICAgZGVzY3JpcHRpb246ICdFS1Mgc2V0dXAgaW5zdHJ1Y3Rpb25zJyxcbiAgICB9KTtcbiAgfVxufSJdfQ==