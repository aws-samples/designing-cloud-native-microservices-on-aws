"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EksStack = void 0;
const cdk = require("aws-cdk-lib");
const eks = require("aws-cdk-lib/aws-eks");
const ec2 = require("aws-cdk-lib/aws-ec2");
const iam = require("aws-cdk-lib/aws-iam");
const ecr = require("aws-cdk-lib/aws-ecr");
const ssm = require("aws-cdk-lib/aws-ssm");
const lambda_layer_kubectl_v29_1 = require("@aws-cdk/lambda-layer-kubectl-v29");
class EksStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // ECR Repositories for all microservices
        const microservices = ['orders-web', 'coffee-web', 'inventory-web'];
        this.ecrRepositories = {};
        const importExistingECR = this.node.tryGetContext('importExistingECR') === 'true';
        microservices.forEach(serviceName => {
            if (importExistingECR) {
                // Import existing ECR repository
                this.ecrRepositories[serviceName] = ecr.Repository.fromRepositoryName(this, `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', '')}Repository`, `coffeeshop/${serviceName}`);
            }
            else {
                // Create new ECR repository
                this.ecrRepositories[serviceName] = new ecr.Repository(this, `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', '')}Repository`, {
                    repositoryName: `coffeeshop/${serviceName}`,
                    removalPolicy: cdk.RemovalPolicy.DESTROY,
                    lifecycleRules: [
                        {
                            maxImageCount: 10,
                            description: 'Keep only 10 most recent images',
                        },
                    ],
                });
            }
        });
        // EKS Cluster - using default configuration
        this.cluster = new eks.Cluster(this, 'CoffeeShopCluster', {
            clusterName: 'coffeeshop-eks',
            version: eks.KubernetesVersion.V1_28,
            vpc: props.vpc,
            defaultCapacity: 2,
            defaultCapacityInstance: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
            // Enable logging
            clusterLogging: [
                eks.ClusterLoggingTypes.API,
                eks.ClusterLoggingTypes.AUDIT,
                eks.ClusterLoggingTypes.AUTHENTICATOR,
                eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
                eks.ClusterLoggingTypes.SCHEDULER,
            ],
            // Use the kubectl layer
            kubectlLayer: new lambda_layer_kubectl_v29_1.KubectlV29Layer(this, 'KubectlLayer'),
        });
        // Add additional managed node group for scaling
        this.nodeGroup = this.cluster.addNodegroupCapacity('CoffeeShopNodeGroup', {
            nodegroupName: 'coffeeshop-nodes',
            instanceTypes: [
                ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
                ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
            ],
            minSize: 1,
            maxSize: 10,
            desiredSize: 2,
            capacityType: eks.CapacityType.ON_DEMAND,
            // Use latest EKS optimized AMI
            amiType: eks.NodegroupAmiType.AL2_X86_64,
            // Labels
            labels: {
                'node-type': 'general-purpose',
                'environment': 'production',
            },
        });
        // AWS Load Balancer Controller
        const awsLoadBalancerController = this.cluster.addHelmChart('AWSLoadBalancerController', {
            chart: 'aws-load-balancer-controller',
            repository: 'https://aws.github.io/eks-charts',
            namespace: 'kube-system',
            values: {
                clusterName: this.cluster.clusterName,
                serviceAccount: {
                    create: false,
                    name: 'aws-load-balancer-controller',
                },
                region: this.region,
                vpcId: props.vpc.vpcId,
            },
        });
        // Service Account for AWS Load Balancer Controller
        const albServiceAccount = this.cluster.addServiceAccount('AWSLoadBalancerControllerServiceAccount', {
            name: 'aws-load-balancer-controller',
            namespace: 'kube-system',
        });
        // IAM Policy for AWS Load Balancer Controller - use direct policy statements instead
        albServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'elasticloadbalancing:*',
            ],
            resources: ['*'],
        }));
        // Additional permissions for ALB Controller
        albServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'iam:CreateServiceLinkedRole',
                'ec2:DescribeAccountAttributes',
                'ec2:DescribeAddresses',
                'ec2:DescribeAvailabilityZones',
                'ec2:DescribeInternetGateways',
                'ec2:DescribeVpcs',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeInstances',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DescribeTags',
                'ec2:GetCoipPoolUsage',
                'ec2:DescribeCoipPools',
                'elasticloadbalancing:DescribeLoadBalancers',
                'elasticloadbalancing:DescribeLoadBalancerAttributes',
                'elasticloadbalancing:DescribeListeners',
                'elasticloadbalancing:DescribeListenerCertificates',
                'elasticloadbalancing:DescribeSSLPolicies',
                'elasticloadbalancing:DescribeRules',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeTargetGroupAttributes',
                'elasticloadbalancing:DescribeTargetHealth',
                'elasticloadbalancing:DescribeTags',
            ],
            resources: ['*'],
        }));
        awsLoadBalancerController.node.addDependency(albServiceAccount);
        // Cluster Autoscaler
        const clusterAutoscaler = this.cluster.addHelmChart('ClusterAutoscaler', {
            chart: 'cluster-autoscaler',
            repository: 'https://kubernetes.github.io/autoscaler',
            namespace: 'kube-system',
            values: {
                autoDiscovery: {
                    clusterName: this.cluster.clusterName,
                },
                awsRegion: this.region,
                rbac: {
                    serviceAccount: {
                        create: false,
                        name: 'cluster-autoscaler',
                    },
                },
            },
        });
        // Service Account for Cluster Autoscaler
        const autoscalerServiceAccount = this.cluster.addServiceAccount('ClusterAutoscalerServiceAccount', {
            name: 'cluster-autoscaler',
            namespace: 'kube-system',
        });
        autoscalerServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'autoscaling:DescribeAutoScalingGroups',
                'autoscaling:DescribeAutoScalingInstances',
                'autoscaling:DescribeLaunchConfigurations',
                'autoscaling:DescribeTags',
                'autoscaling:SetDesiredCapacity',
                'autoscaling:TerminateInstanceInAutoScalingGroup',
                'ec2:DescribeLaunchTemplateVersions',
            ],
            resources: ['*'],
        }));
        clusterAutoscaler.node.addDependency(autoscalerServiceAccount);
        // AWS EBS CSI Driver
        const ebsCSIDriver = this.cluster.addHelmChart('EBSCSIDriver', {
            chart: 'aws-ebs-csi-driver',
            repository: 'https://kubernetes-sigs.github.io/aws-ebs-csi-driver',
            namespace: 'kube-system',
            values: {
                controller: {
                    serviceAccount: {
                        create: false,
                        name: 'ebs-csi-controller-sa',
                    },
                },
            },
        });
        // Service Account for EBS CSI Driver
        const ebsCSIServiceAccount = this.cluster.addServiceAccount('EBSCSIDriverServiceAccount', {
            name: 'ebs-csi-controller-sa',
            namespace: 'kube-system',
        });
        // EBS CSI Driver permissions - use direct policy statements instead
        ebsCSIServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ec2:CreateSnapshot',
                'ec2:AttachVolume',
                'ec2:DetachVolume',
                'ec2:ModifyVolume',
                'ec2:DescribeAvailabilityZones',
                'ec2:DescribeInstances',
                'ec2:DescribeSnapshots',
                'ec2:DescribeTags',
                'ec2:DescribeVolumes',
                'ec2:DescribeVolumesModifications',
            ],
            resources: ['*'],
        }));
        ebsCSIServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ec2:CreateTags',
            ],
            resources: [
                'arn:aws:ec2:*:*:volume/*',
                'arn:aws:ec2:*:*:snapshot/*',
            ],
            conditions: {
                StringEquals: {
                    'ec2:CreateAction': ['CreateVolume', 'CreateSnapshot'],
                },
            },
        }));
        ebsCSIServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ec2:DeleteTags',
            ],
            resources: [
                'arn:aws:ec2:*:*:volume/*',
                'arn:aws:ec2:*:*:snapshot/*',
            ],
        }));
        ebsCSIServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ec2:CreateVolume',
            ],
            resources: ['*'],
            conditions: {
                StringLike: {
                    'aws:RequestedRegion': '*',
                },
            },
        }));
        ebsCSIServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ec2:DeleteVolume',
            ],
            resources: ['*'],
            conditions: {
                StringLike: {
                    'ec2:ResourceTag/ebs.csi.aws.com/cluster': 'true',
                },
            },
        }));
        ebsCSIServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ec2:DeleteSnapshot',
            ],
            resources: ['*'],
            conditions: {
                StringLike: {
                    'ec2:ResourceTag/CSIVolumeSnapshotName': '*',
                },
            },
        }));
        ebsCSIDriver.node.addDependency(ebsCSIServiceAccount);
        // Metrics Server (for HPA)
        this.cluster.addHelmChart('MetricsServer', {
            chart: 'metrics-server',
            repository: 'https://kubernetes-sigs.github.io/metrics-server/',
            namespace: 'kube-system',
            values: {
                args: [
                    '--cert-dir=/tmp',
                    '--secure-port=4443',
                    '--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname',
                    '--kubelet-use-node-status-port',
                ],
            },
        });
        // Create namespace for the application
        const appNamespace = this.cluster.addManifest('CoffeeShopNamespace', {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
                name: 'coffeeshop',
                labels: {
                    name: 'coffeeshop',
                },
            },
        });
        // Service Account for application pods
        const appServiceAccount = this.cluster.addServiceAccount('CoffeeShopServiceAccount', {
            name: 'coffeeshop-sa',
            namespace: 'coffeeshop',
        });
        // Grant DynamoDB permissions to application service account
        props.orderTable.grantFullAccess(appServiceAccount.role);
        props.coffeeTable.grantFullAccess(appServiceAccount.role);
        // Grant EventBridge permissions
        appServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'events:PutEvents',
            ],
            resources: ['*'],
        }));
        // Grant SSM Parameter Store permissions
        appServiceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
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
        appServiceAccount.node.addDependency(appNamespace);
        // SSM Parameters for application configuration
        const orderTableParam = new ssm.StringParameter(this, 'OrderTableParam', {
            parameterName: '/coffeeshop/dynamodb/order-table',
            stringValue: props.orderTable.tableName,
            description: 'DynamoDB Order Table Name',
        });
        const coffeeTableParam = new ssm.StringParameter(this, 'CoffeeTableParam', {
            parameterName: '/coffeeshop/dynamodb/coffee-table',
            stringValue: props.coffeeTable.tableName,
            description: 'DynamoDB Coffee Table Name',
        });
        // Grant ECR access to node groups for all repositories
        Object.values(this.ecrRepositories).forEach(repo => {
            repo.grantPull(this.nodeGroup.role);
            if (this.cluster.defaultNodegroup) {
                repo.grantPull(this.cluster.defaultNodegroup.role);
            }
        });
        // Outputs
        new cdk.CfnOutput(this, 'ClusterName', {
            value: this.cluster.clusterName,
            description: 'EKS Cluster Name',
            exportName: `${this.stackName}-ClusterName`,
        });
        new cdk.CfnOutput(this, 'ClusterEndpoint', {
            value: this.cluster.clusterEndpoint,
            description: 'EKS Cluster Endpoint',
        });
        // Output ECR Repository URIs for all microservices
        Object.entries(this.ecrRepositories).forEach(([serviceName, repo]) => {
            new cdk.CfnOutput(this, `ECR${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', '')}RepositoryURI`, {
                value: repo.repositoryUri,
                description: `ECR Repository URI for ${serviceName}`,
                exportName: `${this.stackName}-ECR${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', '')}RepositoryURI`,
            });
        });
        new cdk.CfnOutput(this, 'KubectlCommand', {
            value: `aws eks update-kubeconfig --region ${this.region} --name ${this.cluster.clusterName}`,
            description: 'Command to configure kubectl',
        });
        // Output for connecting to the cluster
        new cdk.CfnOutput(this, 'ClusterConfigCommand', {
            value: `aws eks update-kubeconfig --region ${this.region} --name ${this.cluster.clusterName} --role-arn ${this.cluster.role.roleArn}`,
            description: 'Command to configure kubectl with cluster role',
        });
    }
}
exports.EksStack = EksStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWtzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWtzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQywyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFFM0MsMkNBQTJDO0FBRTNDLGdGQUFvRTtBQVNwRSxNQUFhLFFBQVMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUtyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQW9CO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHlDQUF5QztRQUN6QyxNQUFNLGFBQWEsR0FBRyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDMUIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLE1BQU0sQ0FBQztRQUVsRixhQUFhLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ2xDLElBQUksaUJBQWlCLEVBQUU7Z0JBQ3JCLGlDQUFpQztnQkFDakMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUNuRSxJQUFJLEVBQ0osR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsWUFBWSxFQUMxRixjQUFjLFdBQVcsRUFBRSxDQUM1QixDQUFDO2FBQ0g7aUJBQU07Z0JBQ0wsNEJBQTRCO2dCQUM1QixJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUks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LEVBQUUsSUFBSSxDQUFDLGFBQWE7Z0JBQ3pCLFdBQVcsRUFBRSwwQkFBMEIsV0FBVyxFQUFFO2dCQUNwRCxVQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxlQUFlO2FBQy9ILENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4QyxLQUFLLEVBQUUsc0NBQXNDLElBQUksQ0FBQyxNQUFNLFdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7WUFDN0YsV0FBVyxFQUFFLDhCQUE4QjtTQUM1QyxDQUFDLENBQUM7UUFFSCx1Q0FBdUM7UUFDdkMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUM5QyxLQUFLLEVBQUUsc0NBQXNDLElBQUksQ0FBQyxNQUFNLFdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLGVBQWUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ3JJLFdBQVcsRUFBRSxnREFBZ0Q7U0FDOUQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBclpELDRCQXFaQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBla3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVrcyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBlY3IgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcic7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgc3NtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zc20nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgS3ViZWN0bFYyOUxheWVyIH0gZnJvbSAnQGF3cy1jZGsvbGFtYmRhLWxheWVyLWt1YmVjdGwtdjI5JztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVrc1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHZwYzogZWMyLlZwYztcbiAgb3JkZXJUYWJsZTogZHluYW1vZGIuSVRhYmxlO1xuICBjb2ZmZWVUYWJsZTogZHluYW1vZGIuSVRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgRWtzU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1c3RlcjogZWtzLkNsdXN0ZXI7XG4gIHB1YmxpYyByZWFkb25seSBlY3JSZXBvc2l0b3JpZXM6IHsgW2tleTogc3RyaW5nXTogZWNyLklSZXBvc2l0b3J5IH07XG4gIHB1YmxpYyByZWFkb25seSBub2RlR3JvdXA6IGVrcy5Ob2RlZ3JvdXA7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEVrc1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIEVDUiBSZXBvc2l0b3JpZXMgZm9yIGFsbCBtaWNyb3NlcnZpY2VzXG4gICAgY29uc3QgbWljcm9zZXJ2aWNlcyA9IFsnb3JkZXJzLXdlYicsICdjb2ZmZWUtd2ViJywgJ2ludmVudG9yeS13ZWInXTtcbiAgICB0aGlzLmVjclJlcG9zaXRvcmllcyA9IHt9O1xuICAgIGNvbnN0IGltcG9ydEV4aXN0aW5nRUNSID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ2ltcG9ydEV4aXN0aW5nRUNSJykgPT09ICd0cnVlJztcbiAgICBcbiAgICBtaWNyb3NlcnZpY2VzLmZvckVhY2goc2VydmljZU5hbWUgPT4ge1xuICAgICAgaWYgKGltcG9ydEV4aXN0aW5nRUNSKSB7XG4gICAgICAgIC8vIEltcG9ydCBleGlzdGluZyBFQ1IgcmVwb3NpdG9yeVxuICAgICAgICB0aGlzLmVjclJlcG9zaXRvcmllc1tzZXJ2aWNlTmFtZV0gPSBlY3IuUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeU5hbWUoXG4gICAgICAgICAgdGhpcywgXG4gICAgICAgICAgYCR7c2VydmljZU5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzZXJ2aWNlTmFtZS5zbGljZSgxKS5yZXBsYWNlKCctJywgJycpfVJlcG9zaXRvcnlgLCBcbiAgICAgICAgICBgY29mZmVlc2hvcC8ke3NlcnZpY2VOYW1lfWBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENyZWF0ZSBuZXcgRUNSIHJlcG9zaXRvcnlcbiAgICAgICAgdGhpcy5lY3JSZXBvc2l0b3JpZXNbc2VydmljZU5hbWVdID0gbmV3IGVjci5SZXBvc2l0b3J5KHRoaXMsIGAke3NlcnZpY2VOYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc2VydmljZU5hbWUuc2xpY2UoMSkucmVwbGFjZSgnLScsICcnKX1SZXBvc2l0b3J5YCwge1xuICAgICAgICAgIHJlcG9zaXRvcnlOYW1lOiBgY29mZmVlc2hvcC8ke3NlcnZpY2VOYW1lfWAsXG4gICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBtYXhJbWFnZUNvdW50OiAxMCxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdLZWVwIG9ubHkgMTAgbW9zdCByZWNlbnQgaW1hZ2VzJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBFS1MgQ2x1c3RlciAtIHVzaW5nIGRlZmF1bHQgY29uZmlndXJhdGlvblxuICAgIHRoaXMuY2x1c3RlciA9IG5ldyBla3MuQ2x1c3Rlcih0aGlzLCAnQ29mZmVlU2hvcENsdXN0ZXInLCB7XG4gICAgICBjbHVzdGVyTmFtZTogJ2NvZmZlZXNob3AtZWtzJyxcbiAgICAgIHZlcnNpb246IGVrcy5LdWJlcm5ldGVzVmVyc2lvbi5WMV8yOCxcbiAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgZGVmYXVsdENhcGFjaXR5OiAyLCAvLyBTdGFydCB3aXRoIDIgbm9kZXNcbiAgICAgIGRlZmF1bHRDYXBhY2l0eUluc3RhbmNlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLlQzLCBlYzIuSW5zdGFuY2VTaXplLk1FRElVTSksXG4gICAgICBcbiAgICAgIC8vIEVuYWJsZSBsb2dnaW5nXG4gICAgICBjbHVzdGVyTG9nZ2luZzogW1xuICAgICAgICBla3MuQ2x1c3RlckxvZ2dpbmdUeXBlcy5BUEksXG4gICAgICAgIGVrcy5DbHVzdGVyTG9nZ2luZ1R5cGVzLkFVRElULFxuICAgICAgICBla3MuQ2x1c3RlckxvZ2dpbmdUeXBlcy5BVVRIRU5USUNBVE9SLFxuICAgICAgICBla3MuQ2x1c3RlckxvZ2dpbmdUeXBlcy5DT05UUk9MTEVSX01BTkFHRVIsXG4gICAgICAgIGVrcy5DbHVzdGVyTG9nZ2luZ1R5cGVzLlNDSEVEVUxFUixcbiAgICAgIF0sXG4gICAgICBcbiAgICAgIC8vIFVzZSB0aGUga3ViZWN0bCBsYXllclxuICAgICAga3ViZWN0bExheWVyOiBuZXcgS3ViZWN0bFYyOUxheWVyKHRoaXMsICdLdWJlY3RsTGF5ZXInKSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBhZGRpdGlvbmFsIG1hbmFnZWQgbm9kZSBncm91cCBmb3Igc2NhbGluZ1xuICAgIHRoaXMubm9kZUdyb3VwID0gdGhpcy5jbHVzdGVyLmFkZE5vZGVncm91cENhcGFjaXR5KCdDb2ZmZWVTaG9wTm9kZUdyb3VwJywge1xuICAgICAgbm9kZWdyb3VwTmFtZTogJ2NvZmZlZXNob3Atbm9kZXMnLFxuICAgICAgaW5zdGFuY2VUeXBlczogW1xuICAgICAgICBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLlQzLCBlYzIuSW5zdGFuY2VTaXplLk1FRElVTSksXG4gICAgICAgIGVjMi5JbnN0YW5jZVR5cGUub2YoZWMyLkluc3RhbmNlQ2xhc3MuVDMsIGVjMi5JbnN0YW5jZVNpemUuTEFSR0UpLFxuICAgICAgXSxcbiAgICAgIG1pblNpemU6IDEsXG4gICAgICBtYXhTaXplOiAxMCxcbiAgICAgIGRlc2lyZWRTaXplOiAyLFxuICAgICAgY2FwYWNpdHlUeXBlOiBla3MuQ2FwYWNpdHlUeXBlLk9OX0RFTUFORCxcbiAgICAgIFxuICAgICAgLy8gVXNlIGxhdGVzdCBFS1Mgb3B0aW1pemVkIEFNSVxuICAgICAgYW1pVHlwZTogZWtzLk5vZGVncm91cEFtaVR5cGUuQUwyX1g4Nl82NCxcbiAgICAgIFxuICAgICAgLy8gTGFiZWxzXG4gICAgICBsYWJlbHM6IHtcbiAgICAgICAgJ25vZGUtdHlwZSc6ICdnZW5lcmFsLXB1cnBvc2UnLFxuICAgICAgICAnZW52aXJvbm1lbnQnOiAncHJvZHVjdGlvbicsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQVdTIExvYWQgQmFsYW5jZXIgQ29udHJvbGxlclxuICAgIGNvbnN0IGF3c0xvYWRCYWxhbmNlckNvbnRyb2xsZXIgPSB0aGlzLmNsdXN0ZXIuYWRkSGVsbUNoYXJ0KCdBV1NMb2FkQmFsYW5jZXJDb250cm9sbGVyJywge1xuICAgICAgY2hhcnQ6ICdhd3MtbG9hZC1iYWxhbmNlci1jb250cm9sbGVyJyxcbiAgICAgIHJlcG9zaXRvcnk6ICdodHRwczovL2F3cy5naXRodWIuaW8vZWtzLWNoYXJ0cycsXG4gICAgICBuYW1lc3BhY2U6ICdrdWJlLXN5c3RlbScsXG4gICAgICB2YWx1ZXM6IHtcbiAgICAgICAgY2x1c3Rlck5hbWU6IHRoaXMuY2x1c3Rlci5jbHVzdGVyTmFtZSxcbiAgICAgICAgc2VydmljZUFjY291bnQ6IHtcbiAgICAgICAgICBjcmVhdGU6IGZhbHNlLFxuICAgICAgICAgIG5hbWU6ICdhd3MtbG9hZC1iYWxhbmNlci1jb250cm9sbGVyJyxcbiAgICAgICAgfSxcbiAgICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgdnBjSWQ6IHByb3BzLnZwYy52cGNJZCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBTZXJ2aWNlIEFjY291bnQgZm9yIEFXUyBMb2FkIEJhbGFuY2VyIENvbnRyb2xsZXJcbiAgICBjb25zdCBhbGJTZXJ2aWNlQWNjb3VudCA9IHRoaXMuY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudCgnQVdTTG9hZEJhbGFuY2VyQ29udHJvbGxlclNlcnZpY2VBY2NvdW50Jywge1xuICAgICAgbmFtZTogJ2F3cy1sb2FkLWJhbGFuY2VyLWNvbnRyb2xsZXInLFxuICAgICAgbmFtZXNwYWNlOiAna3ViZS1zeXN0ZW0nLFxuICAgIH0pO1xuXG4gICAgLy8gSUFNIFBvbGljeSBmb3IgQVdTIExvYWQgQmFsYW5jZXIgQ29udHJvbGxlciAtIHVzZSBkaXJlY3QgcG9saWN5IHN0YXRlbWVudHMgaW5zdGVhZFxuICAgIGFsYlNlcnZpY2VBY2NvdW50LmFkZFRvUHJpbmNpcGFsUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOionLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSkpO1xuXG4gICAgLy8gQWRkaXRpb25hbCBwZXJtaXNzaW9ucyBmb3IgQUxCIENvbnRyb2xsZXJcbiAgICBhbGJTZXJ2aWNlQWNjb3VudC5hZGRUb1ByaW5jaXBhbFBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdpYW06Q3JlYXRlU2VydmljZUxpbmtlZFJvbGUnLFxuICAgICAgICAnZWMyOkRlc2NyaWJlQWNjb3VudEF0dHJpYnV0ZXMnLFxuICAgICAgICAnZWMyOkRlc2NyaWJlQWRkcmVzc2VzJyxcbiAgICAgICAgJ2VjMjpEZXNjcmliZUF2YWlsYWJpbGl0eVpvbmVzJyxcbiAgICAgICAgJ2VjMjpEZXNjcmliZUludGVybmV0R2F0ZXdheXMnLFxuICAgICAgICAnZWMyOkRlc2NyaWJlVnBjcycsXG4gICAgICAgICdlYzI6RGVzY3JpYmVTdWJuZXRzJyxcbiAgICAgICAgJ2VjMjpEZXNjcmliZVNlY3VyaXR5R3JvdXBzJyxcbiAgICAgICAgJ2VjMjpEZXNjcmliZUluc3RhbmNlcycsXG4gICAgICAgICdlYzI6RGVzY3JpYmVOZXR3b3JrSW50ZXJmYWNlcycsXG4gICAgICAgICdlYzI6RGVzY3JpYmVUYWdzJyxcbiAgICAgICAgJ2VjMjpHZXRDb2lwUG9vbFVzYWdlJyxcbiAgICAgICAgJ2VjMjpEZXNjcmliZUNvaXBQb29scycsXG4gICAgICAgICdlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZUxvYWRCYWxhbmNlcnMnLFxuICAgICAgICAnZWxhc3RpY2xvYWRiYWxhbmNpbmc6RGVzY3JpYmVMb2FkQmFsYW5jZXJBdHRyaWJ1dGVzJyxcbiAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlTGlzdGVuZXJzJyxcbiAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlTGlzdGVuZXJDZXJ0aWZpY2F0ZXMnLFxuICAgICAgICAnZWxhc3RpY2xvYWRiYWxhbmNpbmc6RGVzY3JpYmVTU0xQb2xpY2llcycsXG4gICAgICAgICdlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZVJ1bGVzJyxcbiAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlVGFyZ2V0R3JvdXBzJyxcbiAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlVGFyZ2V0R3JvdXBBdHRyaWJ1dGVzJyxcbiAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlVGFyZ2V0SGVhbHRoJyxcbiAgICAgICAgJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlVGFncycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICBhd3NMb2FkQmFsYW5jZXJDb250cm9sbGVyLm5vZGUuYWRkRGVwZW5kZW5jeShhbGJTZXJ2aWNlQWNjb3VudCk7XG5cbiAgICAvLyBDbHVzdGVyIEF1dG9zY2FsZXJcbiAgICBjb25zdCBjbHVzdGVyQXV0b3NjYWxlciA9IHRoaXMuY2x1c3Rlci5hZGRIZWxtQ2hhcnQoJ0NsdXN0ZXJBdXRvc2NhbGVyJywge1xuICAgICAgY2hhcnQ6ICdjbHVzdGVyLWF1dG9zY2FsZXInLFxuICAgICAgcmVwb3NpdG9yeTogJ2h0dHBzOi8va3ViZXJuZXRlcy5naXRodWIuaW8vYXV0b3NjYWxlcicsXG4gICAgICBuYW1lc3BhY2U6ICdrdWJlLXN5c3RlbScsXG4gICAgICB2YWx1ZXM6IHtcbiAgICAgICAgYXV0b0Rpc2NvdmVyeToge1xuICAgICAgICAgIGNsdXN0ZXJOYW1lOiB0aGlzLmNsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIGF3c1JlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgICAgIHJiYWM6IHtcbiAgICAgICAgICBzZXJ2aWNlQWNjb3VudDoge1xuICAgICAgICAgICAgY3JlYXRlOiBmYWxzZSxcbiAgICAgICAgICAgIG5hbWU6ICdjbHVzdGVyLWF1dG9zY2FsZXInLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gU2VydmljZSBBY2NvdW50IGZvciBDbHVzdGVyIEF1dG9zY2FsZXJcbiAgICBjb25zdCBhdXRvc2NhbGVyU2VydmljZUFjY291bnQgPSB0aGlzLmNsdXN0ZXIuYWRkU2VydmljZUFjY291bnQoJ0NsdXN0ZXJBdXRvc2NhbGVyU2VydmljZUFjY291bnQnLCB7XG4gICAgICBuYW1lOiAnY2x1c3Rlci1hdXRvc2NhbGVyJyxcbiAgICAgIG5hbWVzcGFjZTogJ2t1YmUtc3lzdGVtJyxcbiAgICB9KTtcblxuICAgIGF1dG9zY2FsZXJTZXJ2aWNlQWNjb3VudC5hZGRUb1ByaW5jaXBhbFBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdhdXRvc2NhbGluZzpEZXNjcmliZUF1dG9TY2FsaW5nR3JvdXBzJyxcbiAgICAgICAgJ2F1dG9zY2FsaW5nOkRlc2NyaWJlQXV0b1NjYWxpbmdJbnN0YW5jZXMnLFxuICAgICAgICAnYXV0b3NjYWxpbmc6RGVzY3JpYmVMYXVuY2hDb25maWd1cmF0aW9ucycsXG4gICAgICAgICdhdXRvc2NhbGluZzpEZXNjcmliZVRhZ3MnLFxuICAgICAgICAnYXV0b3NjYWxpbmc6U2V0RGVzaXJlZENhcGFjaXR5JyxcbiAgICAgICAgJ2F1dG9zY2FsaW5nOlRlcm1pbmF0ZUluc3RhbmNlSW5BdXRvU2NhbGluZ0dyb3VwJyxcbiAgICAgICAgJ2VjMjpEZXNjcmliZUxhdW5jaFRlbXBsYXRlVmVyc2lvbnMnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSkpO1xuXG4gICAgY2x1c3RlckF1dG9zY2FsZXIubm9kZS5hZGREZXBlbmRlbmN5KGF1dG9zY2FsZXJTZXJ2aWNlQWNjb3VudCk7XG5cbiAgICAvLyBBV1MgRUJTIENTSSBEcml2ZXJcbiAgICBjb25zdCBlYnNDU0lEcml2ZXIgPSB0aGlzLmNsdXN0ZXIuYWRkSGVsbUNoYXJ0KCdFQlNDU0lEcml2ZXInLCB7XG4gICAgICBjaGFydDogJ2F3cy1lYnMtY3NpLWRyaXZlcicsXG4gICAgICByZXBvc2l0b3J5OiAnaHR0cHM6Ly9rdWJlcm5ldGVzLXNpZ3MuZ2l0aHViLmlvL2F3cy1lYnMtY3NpLWRyaXZlcicsXG4gICAgICBuYW1lc3BhY2U6ICdrdWJlLXN5c3RlbScsXG4gICAgICB2YWx1ZXM6IHtcbiAgICAgICAgY29udHJvbGxlcjoge1xuICAgICAgICAgIHNlcnZpY2VBY2NvdW50OiB7XG4gICAgICAgICAgICBjcmVhdGU6IGZhbHNlLFxuICAgICAgICAgICAgbmFtZTogJ2Vicy1jc2ktY29udHJvbGxlci1zYScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBTZXJ2aWNlIEFjY291bnQgZm9yIEVCUyBDU0kgRHJpdmVyXG4gICAgY29uc3QgZWJzQ1NJU2VydmljZUFjY291bnQgPSB0aGlzLmNsdXN0ZXIuYWRkU2VydmljZUFjY291bnQoJ0VCU0NTSURyaXZlclNlcnZpY2VBY2NvdW50Jywge1xuICAgICAgbmFtZTogJ2Vicy1jc2ktY29udHJvbGxlci1zYScsXG4gICAgICBuYW1lc3BhY2U6ICdrdWJlLXN5c3RlbScsXG4gICAgfSk7XG5cbiAgICAvLyBFQlMgQ1NJIERyaXZlciBwZXJtaXNzaW9ucyAtIHVzZSBkaXJlY3QgcG9saWN5IHN0YXRlbWVudHMgaW5zdGVhZFxuICAgIGVic0NTSVNlcnZpY2VBY2NvdW50LmFkZFRvUHJpbmNpcGFsUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2VjMjpDcmVhdGVTbmFwc2hvdCcsXG4gICAgICAgICdlYzI6QXR0YWNoVm9sdW1lJyxcbiAgICAgICAgJ2VjMjpEZXRhY2hWb2x1bWUnLFxuICAgICAgICAnZWMyOk1vZGlmeVZvbHVtZScsXG4gICAgICAgICdlYzI6RGVzY3JpYmVBdmFpbGFiaWxpdHlab25lcycsXG4gICAgICAgICdlYzI6RGVzY3JpYmVJbnN0YW5jZXMnLFxuICAgICAgICAnZWMyOkRlc2NyaWJlU25hcHNob3RzJyxcbiAgICAgICAgJ2VjMjpEZXNjcmliZVRhZ3MnLFxuICAgICAgICAnZWMyOkRlc2NyaWJlVm9sdW1lcycsXG4gICAgICAgICdlYzI6RGVzY3JpYmVWb2x1bWVzTW9kaWZpY2F0aW9ucycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG4gICAgXG4gICAgZWJzQ1NJU2VydmljZUFjY291bnQuYWRkVG9QcmluY2lwYWxQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnZWMyOkNyZWF0ZVRhZ3MnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW1xuICAgICAgICAnYXJuOmF3czplYzI6KjoqOnZvbHVtZS8qJyxcbiAgICAgICAgJ2Fybjphd3M6ZWMyOio6KjpzbmFwc2hvdC8qJyxcbiAgICAgIF0sXG4gICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICdlYzI6Q3JlYXRlQWN0aW9uJzogWydDcmVhdGVWb2x1bWUnLCAnQ3JlYXRlU25hcHNob3QnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSkpO1xuICAgIFxuICAgIGVic0NTSVNlcnZpY2VBY2NvdW50LmFkZFRvUHJpbmNpcGFsUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2VjMjpEZWxldGVUYWdzJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgJ2Fybjphd3M6ZWMyOio6Kjp2b2x1bWUvKicsXG4gICAgICAgICdhcm46YXdzOmVjMjoqOio6c25hcHNob3QvKicsXG4gICAgICBdLFxuICAgIH0pKTtcbiAgICBcbiAgICBlYnNDU0lTZXJ2aWNlQWNjb3VudC5hZGRUb1ByaW5jaXBhbFBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdlYzI6Q3JlYXRlVm9sdW1lJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICBTdHJpbmdMaWtlOiB7XG4gICAgICAgICAgJ2F3czpSZXF1ZXN0ZWRSZWdpb24nOiAnKicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pKTtcbiAgICBcbiAgICBlYnNDU0lTZXJ2aWNlQWNjb3VudC5hZGRUb1ByaW5jaXBhbFBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdlYzI6RGVsZXRlVm9sdW1lJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICBTdHJpbmdMaWtlOiB7XG4gICAgICAgICAgJ2VjMjpSZXNvdXJjZVRhZy9lYnMuY3NpLmF3cy5jb20vY2x1c3Rlcic6ICd0cnVlJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSkpO1xuICAgIFxuICAgIGVic0NTSVNlcnZpY2VBY2NvdW50LmFkZFRvUHJpbmNpcGFsUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2VjMjpEZWxldGVTbmFwc2hvdCcsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgU3RyaW5nTGlrZToge1xuICAgICAgICAgICdlYzI6UmVzb3VyY2VUYWcvQ1NJVm9sdW1lU25hcHNob3ROYW1lJzogJyonLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KSk7XG5cbiAgICBlYnNDU0lEcml2ZXIubm9kZS5hZGREZXBlbmRlbmN5KGVic0NTSVNlcnZpY2VBY2NvdW50KTtcblxuICAgIC8vIE1ldHJpY3MgU2VydmVyIChmb3IgSFBBKVxuICAgIHRoaXMuY2x1c3Rlci5hZGRIZWxtQ2hhcnQoJ01ldHJpY3NTZXJ2ZXInLCB7XG4gICAgICBjaGFydDogJ21ldHJpY3Mtc2VydmVyJyxcbiAgICAgIHJlcG9zaXRvcnk6ICdodHRwczovL2t1YmVybmV0ZXMtc2lncy5naXRodWIuaW8vbWV0cmljcy1zZXJ2ZXIvJyxcbiAgICAgIG5hbWVzcGFjZTogJ2t1YmUtc3lzdGVtJyxcbiAgICAgIHZhbHVlczoge1xuICAgICAgICBhcmdzOiBbXG4gICAgICAgICAgJy0tY2VydC1kaXI9L3RtcCcsXG4gICAgICAgICAgJy0tc2VjdXJlLXBvcnQ9NDQ0MycsXG4gICAgICAgICAgJy0ta3ViZWxldC1wcmVmZXJyZWQtYWRkcmVzcy10eXBlcz1JbnRlcm5hbElQLEV4dGVybmFsSVAsSG9zdG5hbWUnLFxuICAgICAgICAgICctLWt1YmVsZXQtdXNlLW5vZGUtc3RhdHVzLXBvcnQnLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBuYW1lc3BhY2UgZm9yIHRoZSBhcHBsaWNhdGlvblxuICAgIGNvbnN0IGFwcE5hbWVzcGFjZSA9IHRoaXMuY2x1c3Rlci5hZGRNYW5pZmVzdCgnQ29mZmVlU2hvcE5hbWVzcGFjZScsIHtcbiAgICAgIGFwaVZlcnNpb246ICd2MScsXG4gICAgICBraW5kOiAnTmFtZXNwYWNlJyxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIG5hbWU6ICdjb2ZmZWVzaG9wJyxcbiAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgbmFtZTogJ2NvZmZlZXNob3AnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFNlcnZpY2UgQWNjb3VudCBmb3IgYXBwbGljYXRpb24gcG9kc1xuICAgIGNvbnN0IGFwcFNlcnZpY2VBY2NvdW50ID0gdGhpcy5jbHVzdGVyLmFkZFNlcnZpY2VBY2NvdW50KCdDb2ZmZWVTaG9wU2VydmljZUFjY291bnQnLCB7XG4gICAgICBuYW1lOiAnY29mZmVlc2hvcC1zYScsXG4gICAgICBuYW1lc3BhY2U6ICdjb2ZmZWVzaG9wJyxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IER5bmFtb0RCIHBlcm1pc3Npb25zIHRvIGFwcGxpY2F0aW9uIHNlcnZpY2UgYWNjb3VudFxuICAgIHByb3BzLm9yZGVyVGFibGUuZ3JhbnRGdWxsQWNjZXNzKGFwcFNlcnZpY2VBY2NvdW50LnJvbGUpO1xuICAgIHByb3BzLmNvZmZlZVRhYmxlLmdyYW50RnVsbEFjY2VzcyhhcHBTZXJ2aWNlQWNjb3VudC5yb2xlKTtcblxuICAgIC8vIEdyYW50IEV2ZW50QnJpZGdlIHBlcm1pc3Npb25zXG4gICAgYXBwU2VydmljZUFjY291bnQuYWRkVG9QcmluY2lwYWxQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnZXZlbnRzOlB1dEV2ZW50cycsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICB9KSk7XG5cbiAgICAvLyBHcmFudCBTU00gUGFyYW1ldGVyIFN0b3JlIHBlcm1pc3Npb25zXG4gICAgYXBwU2VydmljZUFjY291bnQuYWRkVG9QcmluY2lwYWxQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnc3NtOkdldFBhcmFtZXRlcicsXG4gICAgICAgICdzc206R2V0UGFyYW1ldGVycycsXG4gICAgICAgICdzc206R2V0UGFyYW1ldGVyc0J5UGF0aCcsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgIGBhcm46YXdzOnNzbToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06cGFyYW1ldGVyL2NvZmZlZXNob3AvKmAsXG4gICAgICBdLFxuICAgIH0pKTtcblxuICAgIGFwcFNlcnZpY2VBY2NvdW50Lm5vZGUuYWRkRGVwZW5kZW5jeShhcHBOYW1lc3BhY2UpO1xuXG4gICAgLy8gU1NNIFBhcmFtZXRlcnMgZm9yIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb25cbiAgICBjb25zdCBvcmRlclRhYmxlUGFyYW0gPSBuZXcgc3NtLlN0cmluZ1BhcmFtZXRlcih0aGlzLCAnT3JkZXJUYWJsZVBhcmFtJywge1xuICAgICAgcGFyYW1ldGVyTmFtZTogJy9jb2ZmZWVzaG9wL2R5bmFtb2RiL29yZGVyLXRhYmxlJyxcbiAgICAgIHN0cmluZ1ZhbHVlOiBwcm9wcy5vcmRlclRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRHluYW1vREIgT3JkZXIgVGFibGUgTmFtZScsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjb2ZmZWVUYWJsZVBhcmFtID0gbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgJ0NvZmZlZVRhYmxlUGFyYW0nLCB7XG4gICAgICBwYXJhbWV0ZXJOYW1lOiAnL2NvZmZlZXNob3AvZHluYW1vZGIvY29mZmVlLXRhYmxlJyxcbiAgICAgIHN0cmluZ1ZhbHVlOiBwcm9wcy5jb2ZmZWVUYWJsZS50YWJsZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0R5bmFtb0RCIENvZmZlZSBUYWJsZSBOYW1lJyxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IEVDUiBhY2Nlc3MgdG8gbm9kZSBncm91cHMgZm9yIGFsbCByZXBvc2l0b3JpZXNcbiAgICBPYmplY3QudmFsdWVzKHRoaXMuZWNyUmVwb3NpdG9yaWVzKS5mb3JFYWNoKHJlcG8gPT4ge1xuICAgICAgcmVwby5ncmFudFB1bGwodGhpcy5ub2RlR3JvdXAucm9sZSk7XG4gICAgICBpZiAodGhpcy5jbHVzdGVyLmRlZmF1bHROb2RlZ3JvdXApIHtcbiAgICAgICAgcmVwby5ncmFudFB1bGwodGhpcy5jbHVzdGVyLmRlZmF1bHROb2RlZ3JvdXAucm9sZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NsdXN0ZXJOYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuY2x1c3Rlci5jbHVzdGVyTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRUtTIENsdXN0ZXIgTmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tQ2x1c3Rlck5hbWVgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NsdXN0ZXJFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmNsdXN0ZXIuY2x1c3RlckVuZHBvaW50LFxuICAgICAgZGVzY3JpcHRpb246ICdFS1MgQ2x1c3RlciBFbmRwb2ludCcsXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXQgRUNSIFJlcG9zaXRvcnkgVVJJcyBmb3IgYWxsIG1pY3Jvc2VydmljZXNcbiAgICBPYmplY3QuZW50cmllcyh0aGlzLmVjclJlcG9zaXRvcmllcykuZm9yRWFjaCgoW3NlcnZpY2VOYW1lLCByZXBvXSkgPT4ge1xuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgYEVDUiR7c2VydmljZU5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzZXJ2aWNlTmFtZS5zbGljZSgxKS5yZXBsYWNlKCctJywgJycpfVJlcG9zaXRvcnlVUklgLCB7XG4gICAgICAgIHZhbHVlOiByZXBvLnJlcG9zaXRvcnlVcmksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgRUNSIFJlcG9zaXRvcnkgVVJJIGZvciAke3NlcnZpY2VOYW1lfWAsXG4gICAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1FQ1Ike3NlcnZpY2VOYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc2VydmljZU5hbWUuc2xpY2UoMSkucmVwbGFjZSgnLScsICcnKX1SZXBvc2l0b3J5VVJJYCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0t1YmVjdGxDb21tYW5kJywge1xuICAgICAgdmFsdWU6IGBhd3MgZWtzIHVwZGF0ZS1rdWJlY29uZmlnIC0tcmVnaW9uICR7dGhpcy5yZWdpb259IC0tbmFtZSAke3RoaXMuY2x1c3Rlci5jbHVzdGVyTmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDb21tYW5kIHRvIGNvbmZpZ3VyZSBrdWJlY3RsJyxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCBmb3IgY29ubmVjdGluZyB0byB0aGUgY2x1c3RlclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbHVzdGVyQ29uZmlnQ29tbWFuZCcsIHtcbiAgICAgIHZhbHVlOiBgYXdzIGVrcyB1cGRhdGUta3ViZWNvbmZpZyAtLXJlZ2lvbiAke3RoaXMucmVnaW9ufSAtLW5hbWUgJHt0aGlzLmNsdXN0ZXIuY2x1c3Rlck5hbWV9IC0tcm9sZS1hcm4gJHt0aGlzLmNsdXN0ZXIucm9sZS5yb2xlQXJufWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hbmQgdG8gY29uZmlndXJlIGt1YmVjdGwgd2l0aCBjbHVzdGVyIHJvbGUnLFxuICAgIH0pO1xuICB9XG59Il19