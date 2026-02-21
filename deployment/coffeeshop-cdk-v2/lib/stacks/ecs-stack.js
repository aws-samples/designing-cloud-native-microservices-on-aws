"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcsStack = void 0;
const cdk = require("aws-cdk-lib");
const ecs = require("aws-cdk-lib/aws-ecs");
const ecsPatterns = require("aws-cdk-lib/aws-ecs-patterns");
const ecr = require("aws-cdk-lib/aws-ecr");
const iam = require("aws-cdk-lib/aws-iam");
const logs = require("aws-cdk-lib/aws-logs");
const ssm = require("aws-cdk-lib/aws-ssm");
const events = require("aws-cdk-lib/aws-events");
class EcsStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // ECR Repository
        this.ecrRepository = new ecr.Repository(this, 'OrdersWebRepository', {
            repositoryName: 'coffeeshop/orders-web',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            lifecycleRules: [
                {
                    maxImageAge: cdk.Duration.days(30),
                    description: 'Delete images older than 30 days',
                },
                {
                    maxImageCount: 10,
                    description: 'Keep only 10 most recent images',
                },
            ],
        });
        // ECS Cluster
        this.cluster = new ecs.Cluster(this, 'CoffeeShopCluster', {
            clusterName: 'coffeeshop',
            vpc: props.vpc,
            containerInsights: true,
        });
        // Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'OrdersWebTaskDefinition', {
            memoryLimitMiB: 512,
            cpu: 256,
        });
        // Task Role - permissions for the application
        const taskRole = taskDefinition.taskRole;
        // Grant DynamoDB permissions
        props.orderTable.grantFullAccess(taskRole);
        props.coffeeTable.grantFullAccess(taskRole);
        // Grant EventBridge permissions
        taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'events:PutEvents',
            ],
            resources: ['*'],
        }));
        // Grant SSM Parameter Store permissions
        taskRole.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
            ],
            resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/coffeeshop/*`,
            ],
        }));
        // Container Definition
        const container = taskDefinition.addContainer('OrdersWebContainer', {
            image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'coffeeshop-orders-web',
                logRetention: logs.RetentionDays.ONE_WEEK,
            }),
            environment: {
                ORDER_TABLE_NAME: props.orderTable.tableName,
                COFFEE_TABLE_NAME: props.coffeeTable.tableName,
                AWS_REGION: this.region,
            },
        });
        container.addPortMappings({
            containerPort: 8080,
            protocol: ecs.Protocol.TCP,
        });
        // Fargate Service with Application Load Balancer
        const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'OrdersWebService', {
            cluster: this.cluster,
            taskDefinition,
            publicLoadBalancer: true,
            desiredCount: 2,
            serviceName: 'orders-web',
            assignPublicIp: false,
            platformVersion: ecs.FargatePlatformVersion.LATEST,
        });
        this.fargateService = fargateService.service;
        this.loadBalancer = fargateService.loadBalancer;
        // Configure health check
        fargateService.targetGroup.configureHealthCheck({
            path: '/health',
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 3,
            healthyHttpCodes: '200',
        });
        // Reduce deregistration delay for faster deployments
        fargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30');
        // Auto Scaling
        const scalableTarget = this.fargateService.autoScaleTaskCount({
            minCapacity: 1,
            maxCapacity: 10,
        });
        scalableTarget.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 70,
            scaleInCooldown: cdk.Duration.seconds(300),
            scaleOutCooldown: cdk.Duration.seconds(300),
        });
        scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
            targetUtilizationPercent: 80,
            scaleInCooldown: cdk.Duration.seconds(300),
            scaleOutCooldown: cdk.Duration.seconds(300),
        });
        // EventBridge Rule for Order Processing
        const orderProcessingRule = new events.Rule(this, 'OrderProcessingRule', {
            eventPattern: {
                source: ['solid.humank.coffeeshop.order'],
                detailType: ['customevent'],
            },
            ruleName: 'OrderProcessingRule',
        });
        // SSM Parameters for EventBridge configuration
        const eventSourceParam = new ssm.StringParameter(this, 'EventSourceParam', {
            parameterName: '/coffeeshop/events/ordercreated/event_source',
            stringValue: 'solid.humank.coffeeshop.order',
            description: 'EventBridge event source for order created events',
        });
        const eventArnParam = new ssm.StringParameter(this, 'EventArnParam', {
            parameterName: '/coffeeshop/events/ordercreated/event_arn',
            stringValue: orderProcessingRule.ruleArn,
            description: 'EventBridge rule ARN for order created events',
        });
        // Grant ECR pull permissions to execution role
        this.ecrRepository.grantPull(taskDefinition.executionRole);
        // Outputs
        new cdk.CfnOutput(this, 'LoadBalancerDNS', {
            value: fargateService.loadBalancer.loadBalancerDnsName,
            description: 'Load Balancer DNS Name',
            exportName: `${this.stackName}-LoadBalancerDNS`,
        });
        new cdk.CfnOutput(this, 'ServiceURL', {
            value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
            description: 'Service URL',
        });
        new cdk.CfnOutput(this, 'ECRRepositoryURI', {
            value: this.ecrRepository.repositoryUri,
            description: 'ECR Repository URI',
            exportName: `${this.stackName}-ECRRepositoryURI`,
        });
        new cdk.CfnOutput(this, 'ClusterName', {
            value: this.cluster.clusterName,
            description: 'ECS Cluster Name',
            exportName: `${this.stackName}-ClusterName`,
        });
    }
}
exports.EcsStack = EcsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQywyQ0FBMkM7QUFDM0MsNERBQTREO0FBQzVELDJDQUEyQztBQUUzQywyQ0FBMkM7QUFDM0MsNkNBQTZDO0FBQzdDLDJDQUEyQztBQUMzQyxpREFBaUQ7QUFVakQsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFNckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixpQkFBaUI7UUFDakIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ25FLGNBQWMsRUFBRSx1QkFBdUI7WUFDdkMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDbEMsV0FBVyxFQUFFLGtDQUFrQztpQkFDaEQ7Z0JBQ0Q7b0JBQ0UsYUFBYSxFQUFFLEVBQUU7b0JBQ2pCLFdBQVcsRUFBRSxpQ0FBaUM7aUJBQy9DO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxjQUFjO1FBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3hELFdBQVcsRUFBRSxZQUFZO1lBQ3pCLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztZQUNkLGlCQUFpQixFQUFFLElBQUk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLHFCQUFxQixDQUFD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Q0FBQyxXQUFXO1lBQy9CLFdBQVcsRUFBRSxrQkFBa0I7WUFDL0IsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsY0FBYztTQUM1QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwTEQsNEJBb0xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGVjcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNzJztcbmltcG9ydCAqIGFzIGVjc1BhdHRlcm5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3MtcGF0dGVybnMnO1xuaW1wb3J0ICogYXMgZWNyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3InO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zc20nO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgZWxidjIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWNzU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgdnBjOiBlYzIuVnBjO1xuICBvcmRlclRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbiAgY29mZmVlVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgRWNzU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1c3RlcjogZWNzLkNsdXN0ZXI7XG4gIHB1YmxpYyByZWFkb25seSBmYXJnYXRlU2VydmljZTogZWNzLkZhcmdhdGVTZXJ2aWNlO1xuICBwdWJsaWMgcmVhZG9ubHkgZWNyUmVwb3NpdG9yeTogZWNyLlJlcG9zaXRvcnk7XG4gIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXI6IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBFY3NTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBFQ1IgUmVwb3NpdG9yeVxuICAgIHRoaXMuZWNyUmVwb3NpdG9yeSA9IG5ldyBlY3IuUmVwb3NpdG9yeSh0aGlzLCAnT3JkZXJzV2ViUmVwb3NpdG9yeScsIHtcbiAgICAgIHJlcG9zaXRvcnlOYW1lOiAnY29mZmVlc2hvcC9vcmRlcnMtd2ViJyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIFVzZSBSRVRBSU4gZm9yIHByb2R1Y3Rpb25cbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBtYXhJbWFnZUFnZTogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVsZXRlIGltYWdlcyBvbGRlciB0aGFuIDMwIGRheXMnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbWF4SW1hZ2VDb3VudDogMTAsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdLZWVwIG9ubHkgMTAgbW9zdCByZWNlbnQgaW1hZ2VzJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBFQ1MgQ2x1c3RlclxuICAgIHRoaXMuY2x1c3RlciA9IG5ldyBlY3MuQ2x1c3Rlcih0aGlzLCAnQ29mZmVlU2hvcENsdXN0ZXInLCB7XG4gICAgICBjbHVzdGVyTmFtZTogJ2NvZmZlZXNob3AnLFxuICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICBjb250YWluZXJJbnNpZ2h0czogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIFRhc2sgRGVmaW5pdGlvblxuICAgIGNvbnN0IHRhc2tEZWZpbml0aW9uID0gbmV3IGVjcy5GYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgJ09yZGVyc1dlYlRhc2tEZWZpbml0aW9uJywge1xuICAgICAgbWVtb3J5TGltaXRNaUI6IDUxMixcbiAgICAgIGNwdTogMjU2LFxuICAgIH0pO1xuXG4gICAgLy8gVGFzayBSb2xlIC0gcGVybWlzc2lvbnMgZm9yIHRoZSBhcHBsaWNhdGlvblxuICAgIGNvbnN0IHRhc2tSb2xlID0gdGFza0RlZmluaXRpb24udGFza1JvbGU7XG4gICAgXG4gICAgLy8gR3JhbnQgRHluYW1vREIgcGVybWlzc2lvbnNcbiAgICBwcm9wcy5vcmRlclRhYmxlLmdyYW50RnVsbEFjY2Vzcyh0YXNrUm9sZSk7XG4gICAgcHJvcHMuY29mZmVlVGFibGUuZ3JhbnRGdWxsQWNjZXNzKHRhc2tSb2xlKTtcblxuICAgIC8vIEdyYW50IEV2ZW50QnJpZGdlIHBlcm1pc3Npb25zXG4gICAgdGFza1JvbGUuYWRkVG9QcmluY2lwYWxQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnZXZlbnRzOlB1dEV2ZW50cycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBHcmFudCBTU00gUGFyYW1ldGVyIFN0b3JlIHBlcm1pc3Npb25zXG4gICAgdGFza1JvbGUuYWRkVG9QcmluY2lwYWxQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnc3NtOkdldFBhcmFtZXRlcicsXG4gICAgICAgICdzc206R2V0UGFyYW1ldGVycycsXG4gICAgICAgICdzc206R2V0UGFyYW1ldGVyc0J5UGF0aCcsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgIGBhcm46YXdzOnNzbToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06cGFyYW1ldGVyL2NvZmZlZXNob3AvKmAsXG4gICAgICBdLFxuICAgIH0pKTtcblxuICAgIC8vIENvbnRhaW5lciBEZWZpbml0aW9uXG4gICAgY29uc3QgY29udGFpbmVyID0gdGFza0RlZmluaXRpb24uYWRkQ29udGFpbmVyKCdPcmRlcnNXZWJDb250YWluZXInLCB7XG4gICAgICBpbWFnZTogZWNzLkNvbnRhaW5lckltYWdlLmZyb21SZWdpc3RyeSgnYW1hem9uL2FtYXpvbi1lY3Mtc2FtcGxlJyksIC8vIERlZmF1bHQgaW1hZ2UsIHdpbGwgYmUgdXBkYXRlZCBieSBwaXBlbGluZVxuICAgICAgbG9nZ2luZzogZWNzLkxvZ0RyaXZlcnMuYXdzTG9ncyh7XG4gICAgICAgIHN0cmVhbVByZWZpeDogJ2NvZmZlZXNob3Atb3JkZXJzLXdlYicsXG4gICAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBPUkRFUl9UQUJMRV9OQU1FOiBwcm9wcy5vcmRlclRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQ09GRkVFX1RBQkxFX05BTUU6IHByb3BzLmNvZmZlZVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQVdTX1JFR0lPTjogdGhpcy5yZWdpb24sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29udGFpbmVyLmFkZFBvcnRNYXBwaW5ncyh7XG4gICAgICBjb250YWluZXJQb3J0OiA4MDgwLFxuICAgICAgcHJvdG9jb2w6IGVjcy5Qcm90b2NvbC5UQ1AsXG4gICAgfSk7XG5cbiAgICAvLyBGYXJnYXRlIFNlcnZpY2Ugd2l0aCBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyXG4gICAgY29uc3QgZmFyZ2F0ZVNlcnZpY2UgPSBuZXcgZWNzUGF0dGVybnMuQXBwbGljYXRpb25Mb2FkQmFsYW5jZWRGYXJnYXRlU2VydmljZSh0aGlzLCAnT3JkZXJzV2ViU2VydmljZScsIHtcbiAgICAgIGNsdXN0ZXI6IHRoaXMuY2x1c3RlcixcbiAgICAgIHRhc2tEZWZpbml0aW9uLFxuICAgICAgcHVibGljTG9hZEJhbGFuY2VyOiB0cnVlLFxuICAgICAgZGVzaXJlZENvdW50OiAyLFxuICAgICAgc2VydmljZU5hbWU6ICdvcmRlcnMtd2ViJyxcbiAgICAgIGFzc2lnblB1YmxpY0lwOiBmYWxzZSwgLy8gUGxhY2UgaW4gcHJpdmF0ZSBzdWJuZXRzXG4gICAgICBwbGF0Zm9ybVZlcnNpb246IGVjcy5GYXJnYXRlUGxhdGZvcm1WZXJzaW9uLkxBVEVTVCxcbiAgICB9KTtcblxuICAgIHRoaXMuZmFyZ2F0ZVNlcnZpY2UgPSBmYXJnYXRlU2VydmljZS5zZXJ2aWNlO1xuICAgIHRoaXMubG9hZEJhbGFuY2VyID0gZmFyZ2F0ZVNlcnZpY2UubG9hZEJhbGFuY2VyO1xuXG4gICAgLy8gQ29uZmlndXJlIGhlYWx0aCBjaGVja1xuICAgIGZhcmdhdGVTZXJ2aWNlLnRhcmdldEdyb3VwLmNvbmZpZ3VyZUhlYWx0aENoZWNrKHtcbiAgICAgIHBhdGg6ICcvaGVhbHRoJyxcbiAgICAgIGludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcyg1KSxcbiAgICAgIGhlYWx0aHlUaHJlc2hvbGRDb3VudDogMixcbiAgICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiAzLFxuICAgICAgaGVhbHRoeUh0dHBDb2RlczogJzIwMCcsXG4gICAgfSk7XG5cbiAgICAvLyBSZWR1Y2UgZGVyZWdpc3RyYXRpb24gZGVsYXkgZm9yIGZhc3RlciBkZXBsb3ltZW50c1xuICAgIGZhcmdhdGVTZXJ2aWNlLnRhcmdldEdyb3VwLnNldEF0dHJpYnV0ZSgnZGVyZWdpc3RyYXRpb25fZGVsYXkudGltZW91dF9zZWNvbmRzJywgJzMwJyk7XG5cbiAgICAvLyBBdXRvIFNjYWxpbmdcbiAgICBjb25zdCBzY2FsYWJsZVRhcmdldCA9IHRoaXMuZmFyZ2F0ZVNlcnZpY2UuYXV0b1NjYWxlVGFza0NvdW50KHtcbiAgICAgIG1pbkNhcGFjaXR5OiAxLFxuICAgICAgbWF4Q2FwYWNpdHk6IDEwLFxuICAgIH0pO1xuXG4gICAgc2NhbGFibGVUYXJnZXQuc2NhbGVPbkNwdVV0aWxpemF0aW9uKCdDcHVTY2FsaW5nJywge1xuICAgICAgdGFyZ2V0VXRpbGl6YXRpb25QZXJjZW50OiA3MCxcbiAgICAgIHNjYWxlSW5Db29sZG93bjogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzAwKSxcbiAgICAgIHNjYWxlT3V0Q29vbGRvd246IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwMCksXG4gICAgfSk7XG5cbiAgICBzY2FsYWJsZVRhcmdldC5zY2FsZU9uTWVtb3J5VXRpbGl6YXRpb24oJ01lbW9yeVNjYWxpbmcnLCB7XG4gICAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IDgwLFxuICAgICAgc2NhbGVJbkNvb2xkb3duOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMDApLFxuICAgICAgc2NhbGVPdXRDb29sZG93bjogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzAwKSxcbiAgICB9KTtcblxuICAgIC8vIEV2ZW50QnJpZGdlIFJ1bGUgZm9yIE9yZGVyIFByb2Nlc3NpbmdcbiAgICBjb25zdCBvcmRlclByb2Nlc3NpbmdSdWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdPcmRlclByb2Nlc3NpbmdSdWxlJywge1xuICAgICAgZXZlbnRQYXR0ZXJuOiB7XG4gICAgICAgIHNvdXJjZTogWydzb2xpZC5odW1hbmsuY29mZmVlc2hvcC5vcmRlciddLFxuICAgICAgICBkZXRhaWxUeXBlOiBbJ2N1c3RvbWV2ZW50J10sXG4gICAgICB9LFxuICAgICAgcnVsZU5hbWU6ICdPcmRlclByb2Nlc3NpbmdSdWxlJyxcbiAgICB9KTtcblxuICAgIC8vIFNTTSBQYXJhbWV0ZXJzIGZvciBFdmVudEJyaWRnZSBjb25maWd1cmF0aW9uXG4gICAgY29uc3QgZXZlbnRTb3VyY2VQYXJhbSA9IG5ldyBzc20uU3RyaW5nUGFyYW1ldGVyKHRoaXMsICdFdmVudFNvdXJjZVBhcmFtJywge1xuICAgICAgcGFyYW1ldGVyTmFtZTogJy9jb2ZmZWVzaG9wL2V2ZW50cy9vcmRlcmNyZWF0ZWQvZXZlbnRfc291cmNlJyxcbiAgICAgIHN0cmluZ1ZhbHVlOiAnc29saWQuaHVtYW5rLmNvZmZlZXNob3Aub3JkZXInLFxuICAgICAgZGVzY3JpcHRpb246ICdFdmVudEJyaWRnZSBldmVudCBzb3VyY2UgZm9yIG9yZGVyIGNyZWF0ZWQgZXZlbnRzJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGV2ZW50QXJuUGFyYW0gPSBuZXcgc3NtLlN0cmluZ1BhcmFtZXRlcih0aGlzLCAnRXZlbnRBcm5QYXJhbScsIHtcbiAgICAgIHBhcmFtZXRlck5hbWU6ICcvY29mZmVlc2hvcC9ldmVudHMvb3JkZXJjcmVhdGVkL2V2ZW50X2FybicsXG4gICAgICBzdHJpbmdWYWx1ZTogb3JkZXJQcm9jZXNzaW5nUnVsZS5ydWxlQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdFdmVudEJyaWRnZSBydWxlIEFSTiBmb3Igb3JkZXIgY3JlYXRlZCBldmVudHMnLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgRUNSIHB1bGwgcGVybWlzc2lvbnMgdG8gZXhlY3V0aW9uIHJvbGVcbiAgICB0aGlzLmVjclJlcG9zaXRvcnkuZ3JhbnRQdWxsKHRhc2tEZWZpbml0aW9uLmV4ZWN1dGlvblJvbGUhKTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTG9hZEJhbGFuY2VyRE5TJywge1xuICAgICAgdmFsdWU6IGZhcmdhdGVTZXJ2aWNlLmxvYWRCYWxhbmNlci5sb2FkQmFsYW5jZXJEbnNOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdMb2FkIEJhbGFuY2VyIEROUyBOYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1Mb2FkQmFsYW5jZXJETlNgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NlcnZpY2VVUkwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHA6Ly8ke2ZhcmdhdGVTZXJ2aWNlLmxvYWRCYWxhbmNlci5sb2FkQmFsYW5jZXJEbnNOYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlcnZpY2UgVVJMJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFQ1JSZXBvc2l0b3J5VVJJJywge1xuICAgICAgdmFsdWU6IHRoaXMuZWNyUmVwb3NpdG9yeS5yZXBvc2l0b3J5VXJpLFxuICAgICAgZGVzY3JpcHRpb246ICdFQ1IgUmVwb3NpdG9yeSBVUkknLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUVDUlJlcG9zaXRvcnlVUklgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NsdXN0ZXJOYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuY2x1c3Rlci5jbHVzdGVyTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRUNTIENsdXN0ZXIgTmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tQ2x1c3Rlck5hbWVgLFxuICAgIH0pO1xuICB9XG59Il19