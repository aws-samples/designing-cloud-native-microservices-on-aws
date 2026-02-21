"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringStack = void 0;
const cdk = require("aws-cdk-lib");
const cloudwatch = require("aws-cdk-lib/aws-cloudwatch");
const sns = require("aws-cdk-lib/aws-sns");
const actions = require("aws-cdk-lib/aws-cloudwatch-actions");
class MonitoringStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // SNS Topic for alarms
        this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
            topicName: 'coffeeshop-alarms',
            displayName: 'CoffeeShop Alarms',
        });
        // Add email subscription (you can customize this)
        // this.alarmTopic.addSubscription(
        //   new subscriptions.EmailSubscription('your-email@example.com')
        // );
        // CloudWatch Dashboard
        this.dashboard = new cloudwatch.Dashboard(this, 'CoffeeShopDashboard', {
            dashboardName: 'CoffeeShop-Monitoring',
        });
        // Lambda Function Metrics
        const lambdaWidgets = [];
        Object.entries(props.lambdaFunctions).forEach(([name, func]) => {
            // Duration metric
            const durationWidget = new cloudwatch.GraphWidget({
                title: `${name} - Duration`,
                left: [func.metricDuration()],
                width: 12,
                height: 6,
            });
            // Error rate metric
            const errorWidget = new cloudwatch.GraphWidget({
                title: `${name} - Errors`,
                left: [func.metricErrors()],
                width: 12,
                height: 6,
            });
            // Invocation count
            const invocationWidget = new cloudwatch.GraphWidget({
                title: `${name} - Invocations`,
                left: [func.metricInvocations()],
                width: 12,
                height: 6,
            });
            lambdaWidgets.push(durationWidget, errorWidget, invocationWidget);
            // Create alarms for Lambda functions
            const errorAlarm = new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
                alarmName: `${name}-HighErrorRate`,
                metric: func.metricErrors({
                    period: cdk.Duration.minutes(5),
                }),
                threshold: 5,
                evaluationPeriods: 2,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });
            errorAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));
            const durationAlarm = new cloudwatch.Alarm(this, `${name}DurationAlarm`, {
                alarmName: `${name}-HighDuration`,
                metric: func.metricDuration({
                    period: cdk.Duration.minutes(5),
                }),
                threshold: 10000,
                evaluationPeriods: 3,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });
            durationAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));
        });
        // EKS Cluster Metrics
        const eksClusterWidget = new cloudwatch.GraphWidget({
            title: 'EKS Cluster Metrics',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/EKS',
                    metricName: 'cluster_failed_request_count',
                    dimensionsMap: {
                        ClusterName: props.eksCluster.clusterName,
                    },
                }),
            ],
            right: [
                new cloudwatch.Metric({
                    namespace: 'ContainerInsights',
                    metricName: 'cluster_node_count',
                    dimensionsMap: {
                        ClusterName: props.eksCluster.clusterName,
                    },
                }),
            ],
            width: 24,
            height: 6,
        });
        // Pod Metrics
        const podMetricsWidget = new cloudwatch.GraphWidget({
            title: 'Pod Metrics',
            left: [
                new cloudwatch.Metric({
                    namespace: 'ContainerInsights',
                    metricName: 'pod_cpu_utilization',
                    dimensionsMap: {
                        ClusterName: props.eksCluster.clusterName,
                        Namespace: 'coffeeshop',
                    },
                }),
            ],
            right: [
                new cloudwatch.Metric({
                    namespace: 'ContainerInsights',
                    metricName: 'pod_memory_utilization',
                    dimensionsMap: {
                        ClusterName: props.eksCluster.clusterName,
                        Namespace: 'coffeeshop',
                    },
                }),
            ],
            width: 24,
            height: 6,
        });
        // Add widgets to dashboard
        this.dashboard.addWidgets(new cloudwatch.TextWidget({
            markdown: '# CoffeeShop Application Monitoring\n\nThis dashboard shows key metrics for the CoffeeShop microservices application.',
            width: 24,
            height: 2,
        }));
        this.dashboard.addWidgets(new cloudwatch.TextWidget({
            markdown: '## Lambda Functions',
            width: 24,
            height: 1,
        }));
        // Add Lambda widgets in rows of 2
        for (let i = 0; i < lambdaWidgets.length; i += 2) {
            const row = lambdaWidgets.slice(i, i + 2);
            this.dashboard.addWidgets(...row);
        }
        this.dashboard.addWidgets(new cloudwatch.TextWidget({
            markdown: '## EKS Cluster',
            width: 24,
            height: 1,
        }));
        this.dashboard.addWidgets(eksClusterWidget);
        this.dashboard.addWidgets(new cloudwatch.TextWidget({
            markdown: '## Pod Metrics',
            width: 24,
            height: 1,
        }));
        this.dashboard.addWidgets(podMetricsWidget);
        // EKS Cluster Alarms
        const eksClusterFailedRequestAlarm = new cloudwatch.Alarm(this, 'EKSClusterFailedRequestAlarm', {
            alarmName: 'EKS-ClusterFailedRequests',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/EKS',
                metricName: 'cluster_failed_request_count',
                dimensionsMap: {
                    ClusterName: props.eksCluster.clusterName,
                },
                period: cdk.Duration.minutes(5),
            }),
            threshold: 10,
            evaluationPeriods: 2,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        eksClusterFailedRequestAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));
        // Pod CPU Utilization Alarm
        const podHighCpuAlarm = new cloudwatch.Alarm(this, 'PodHighCpuAlarm', {
            alarmName: 'Pod-HighCpuUtilization',
            metric: new cloudwatch.Metric({
                namespace: 'ContainerInsights',
                metricName: 'pod_cpu_utilization',
                dimensionsMap: {
                    ClusterName: props.eksCluster.clusterName,
                    Namespace: 'coffeeshop',
                },
                period: cdk.Duration.minutes(5),
            }),
            threshold: 80,
            evaluationPeriods: 3,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        podHighCpuAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));
        // Pod Memory Utilization Alarm
        const podHighMemoryAlarm = new cloudwatch.Alarm(this, 'PodHighMemoryAlarm', {
            alarmName: 'Pod-HighMemoryUtilization',
            metric: new cloudwatch.Metric({
                namespace: 'ContainerInsights',
                metricName: 'pod_memory_utilization',
                dimensionsMap: {
                    ClusterName: props.eksCluster.clusterName,
                    Namespace: 'coffeeshop',
                },
                period: cdk.Duration.minutes(5),
            }),
            threshold: 85,
            evaluationPeriods: 3,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        podHighMemoryAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));
        // Outputs
        new cdk.CfnOutput(this, 'DashboardURL', {
            value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
            description: 'CloudWatch Dashboard URL',
        });
        new cdk.CfnOutput(this, 'AlarmTopicArn', {
            value: this.alarmTopic.topicArn,
            description: 'SNS Topic ARN for alarms',
            exportName: `${this.stackName}-AlarmTopicArn`,
        });
    }
}
exports.MonitoringStack = MonitoringStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3Jpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUd6RCwyQ0FBMkM7QUFFM0MsOERBQThEO0FBUTlELE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUk1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2xELFNBQVMsRUFBRSxtQkFBbUI7WUFDOUIsV0FBVyxFQUFFLG1CQUFtQjtTQUNqQyxDQUFDLENBQUM7UUFFSCxrREFBa0Q7UUFDbEQsbUNBQW1DO1FBQ25DLGtFQUFrRTtRQUNsRSxLQUFLO1FBRUwsdUJBQXVCO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUNyRSxhQUFhLEVBQUUsdUJBQXVCO1NBQ3ZDLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixNQUFNLGFBQWEsR0FBeUIsRUFBRSxDQUFDO1FBRS9DLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDN0Qsa0JBQWtCO1lBQ2xCLE1BQU0sY0FBYyxHQUFHLElBQUksVUFBVSxDQUFDLFdBQVcsQ0FBQztnQkFDaEQsS0FBSyxFQUFFLEdBQUcsSUFBSSxhQUFhO2dCQUMzQixJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JB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QUUsbUJBQW1CO2dCQUM5QixVQUFVLEVBQUUsd0JBQXdCO2dCQUNwQyxhQUFhLEVBQUU7b0JBQ2IsV0FBVyxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVztvQkFDekMsU0FBUyxFQUFFLFlBQVk7aUJBQ3hCO2dCQUNELE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDaEMsQ0FBQztZQUNGLFNBQVMsRUFBRSxFQUFFO1lBQ2IsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixnQkFBZ0IsRUFBRSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsYUFBYTtTQUM1RCxDQUFDLENBQUM7UUFFSCxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRTFFLFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsV0FBVyxJQUFJLENBQUMsTUFBTSxrREFBa0QsSUFBSSxDQUFDLE1BQU0sb0JBQW9CLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFO1lBQzVJLFdBQVcsRUFBRSwwQkFBMEI7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUTtZQUMvQixXQUFXLEVBQUUsMEJBQTBCO1lBQ3ZDLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLGdCQUFnQjtTQUM5QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFsUEQsMENBa1BDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgZWtzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0ICogYXMgc3Vic2NyaXB0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnO1xuaW1wb3J0ICogYXMgYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1vbml0b3JpbmdTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBsYW1iZGFGdW5jdGlvbnM6IHsgW2tleTogc3RyaW5nXTogbGFtYmRhLkZ1bmN0aW9uIH07XG4gIGVrc0NsdXN0ZXI6IGVrcy5DbHVzdGVyO1xufVxuXG5leHBvcnQgY2xhc3MgTW9uaXRvcmluZ1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGRhc2hib2FyZDogY2xvdWR3YXRjaC5EYXNoYm9hcmQ7XG4gIHB1YmxpYyByZWFkb25seSBhbGFybVRvcGljOiBzbnMuVG9waWM7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IE1vbml0b3JpbmdTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBTTlMgVG9waWMgZm9yIGFsYXJtc1xuICAgIHRoaXMuYWxhcm1Ub3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ0FsYXJtVG9waWMnLCB7XG4gICAgICB0b3BpY05hbWU6ICdjb2ZmZWVzaG9wLWFsYXJtcycsXG4gICAgICBkaXNwbGF5TmFtZTogJ0NvZmZlZVNob3AgQWxhcm1zJyxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBlbWFpbCBzdWJzY3JpcHRpb24gKHlvdSBjYW4gY3VzdG9taXplIHRoaXMpXG4gICAgLy8gdGhpcy5hbGFybVRvcGljLmFkZFN1YnNjcmlwdGlvbihcbiAgICAvLyAgIG5ldyBzdWJzY3JpcHRpb25zLkVtYWlsU3Vic2NyaXB0aW9uKCd5b3VyLWVtYWlsQGV4YW1wbGUuY29tJylcbiAgICAvLyApO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBEYXNoYm9hcmRcbiAgICB0aGlzLmRhc2hib2FyZCA9IG5ldyBjbG91ZHdhdGNoLkRhc2hib2FyZCh0aGlzLCAnQ29mZmVlU2hvcERhc2hib2FyZCcsIHtcbiAgICAgIGRhc2hib2FyZE5hbWU6ICdDb2ZmZWVTaG9wLU1vbml0b3JpbmcnLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uIE1ldHJpY3NcbiAgICBjb25zdCBsYW1iZGFXaWRnZXRzOiBjbG91ZHdhdGNoLklXaWRnZXRbXSA9IFtdO1xuICAgIFxuICAgIE9iamVjdC5lbnRyaWVzKHByb3BzLmxhbWJkYUZ1bmN0aW9ucykuZm9yRWFjaCgoW25hbWUsIGZ1bmNdKSA9PiB7XG4gICAgICAvLyBEdXJhdGlvbiBtZXRyaWNcbiAgICAgIGNvbnN0IGR1cmF0aW9uV2lkZ2V0ID0gbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogYCR7bmFtZX0gLSBEdXJhdGlvbmAsXG4gICAgICAgIGxlZnQ6IFtmdW5jLm1ldHJpY0R1cmF0aW9uKCldLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNixcbiAgICAgIH0pO1xuXG4gICAgICAvLyBFcnJvciByYXRlIG1ldHJpY1xuICAgICAgY29uc3QgZXJyb3JXaWRnZXQgPSBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiBgJHtuYW1lfSAtIEVycm9yc2AsXG4gICAgICAgIGxlZnQ6IFtmdW5jLm1ldHJpY0Vycm9ycygpXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KTtcblxuICAgICAgLy8gSW52b2NhdGlvbiBjb3VudFxuICAgICAgY29uc3QgaW52b2NhdGlvbldpZGdldCA9IG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6IGAke25hbWV9IC0gSW52b2NhdGlvbnNgLFxuICAgICAgICBsZWZ0OiBbZnVuYy5tZXRyaWNJbnZvY2F0aW9ucygpXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KTtcblxuICAgICAgbGFtYmRhV2lkZ2V0cy5wdXNoKGR1cmF0aW9uV2lkZ2V0LCBlcnJvcldpZGdldCwgaW52b2NhdGlvbldpZGdldCk7XG5cbiAgICAgIC8vIENyZWF0ZSBhbGFybXMgZm9yIExhbWJkYSBmdW5jdGlvbnNcbiAgICAgIGNvbnN0IGVycm9yQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBgJHtuYW1lfUVycm9yQWxhcm1gLCB7XG4gICAgICAgIGFsYXJtTmFtZTogYCR7bmFtZX0tSGlnaEVycm9yUmF0ZWAsXG4gICAgICAgIG1ldHJpYzogZnVuYy5tZXRyaWNFcnJvcnMoe1xuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0pLFxuICAgICAgICB0aHJlc2hvbGQ6IDUsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICAgIH0pO1xuXG4gICAgICBlcnJvckFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBhY3Rpb25zLlNuc0FjdGlvbih0aGlzLmFsYXJtVG9waWMpKTtcblxuICAgICAgY29uc3QgZHVyYXRpb25BbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsIGAke25hbWV9RHVyYXRpb25BbGFybWAsIHtcbiAgICAgICAgYWxhcm1OYW1lOiBgJHtuYW1lfS1IaWdoRHVyYXRpb25gLFxuICAgICAgICBtZXRyaWM6IGZ1bmMubWV0cmljRHVyYXRpb24oe1xuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0pLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwMDAwLCAvLyAxMCBzZWNvbmRzXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAzLFxuICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICAgIH0pO1xuXG4gICAgICBkdXJhdGlvbkFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBhY3Rpb25zLlNuc0FjdGlvbih0aGlzLmFsYXJtVG9waWMpKTtcbiAgICB9KTtcblxuICAgIC8vIEVLUyBDbHVzdGVyIE1ldHJpY3NcbiAgICBjb25zdCBla3NDbHVzdGVyV2lkZ2V0ID0gbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgdGl0bGU6ICdFS1MgQ2x1c3RlciBNZXRyaWNzJyxcbiAgICAgIGxlZnQ6IFtcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvRUtTJyxcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnY2x1c3Rlcl9mYWlsZWRfcmVxdWVzdF9jb3VudCcsXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgQ2x1c3Rlck5hbWU6IHByb3BzLmVrc0NsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgICAgcmlnaHQ6IFtcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdDb250YWluZXJJbnNpZ2h0cycsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ2NsdXN0ZXJfbm9kZV9jb3VudCcsXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgQ2x1c3Rlck5hbWU6IHByb3BzLmVrc0NsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgICAgd2lkdGg6IDI0LFxuICAgICAgaGVpZ2h0OiA2LFxuICAgIH0pO1xuXG4gICAgLy8gUG9kIE1ldHJpY3NcbiAgICBjb25zdCBwb2RNZXRyaWNzV2lkZ2V0ID0gbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgdGl0bGU6ICdQb2QgTWV0cmljcycsXG4gICAgICBsZWZ0OiBbXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgbmFtZXNwYWNlOiAnQ29udGFpbmVySW5zaWdodHMnLFxuICAgICAgICAgIG1ldHJpY05hbWU6ICdwb2RfY3B1X3V0aWxpemF0aW9uJyxcbiAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICBDbHVzdGVyTmFtZTogcHJvcHMuZWtzQ2x1c3Rlci5jbHVzdGVyTmFtZSxcbiAgICAgICAgICAgIE5hbWVzcGFjZTogJ2NvZmZlZXNob3AnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICAgIHJpZ2h0OiBbXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgbmFtZXNwYWNlOiAnQ29udGFpbmVySW5zaWdodHMnLFxuICAgICAgICAgIG1ldHJpY05hbWU6ICdwb2RfbWVtb3J5X3V0aWxpemF0aW9uJyxcbiAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICBDbHVzdGVyTmFtZTogcHJvcHMuZWtzQ2x1c3Rlci5jbHVzdGVyTmFtZSxcbiAgICAgICAgICAgIE5hbWVzcGFjZTogJ2NvZmZlZXNob3AnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICAgIHdpZHRoOiAyNCxcbiAgICAgIGhlaWdodDogNixcbiAgICB9KTtcblxuICAgIC8vIEFkZCB3aWRnZXRzIHRvIGRhc2hib2FyZFxuICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICBuZXcgY2xvdWR3YXRjaC5UZXh0V2lkZ2V0KHtcbiAgICAgICAgbWFya2Rvd246ICcjIENvZmZlZVNob3AgQXBwbGljYXRpb24gTW9uaXRvcmluZ1xcblxcblRoaXMgZGFzaGJvYXJkIHNob3dzIGtleSBtZXRyaWNzIGZvciB0aGUgQ29mZmVlU2hvcCBtaWNyb3NlcnZpY2VzIGFwcGxpY2F0aW9uLicsXG4gICAgICAgIHdpZHRoOiAyNCxcbiAgICAgICAgaGVpZ2h0OiAyLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgIG5ldyBjbG91ZHdhdGNoLlRleHRXaWRnZXQoe1xuICAgICAgICBtYXJrZG93bjogJyMjIExhbWJkYSBGdW5jdGlvbnMnLFxuICAgICAgICB3aWR0aDogMjQsXG4gICAgICAgIGhlaWdodDogMSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEFkZCBMYW1iZGEgd2lkZ2V0cyBpbiByb3dzIG9mIDJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxhbWJkYVdpZGdldHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGxhbWJkYVdpZGdldHMuc2xpY2UoaSwgaSArIDIpO1xuICAgICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyguLi5yb3cpO1xuICAgIH1cblxuICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICBuZXcgY2xvdWR3YXRjaC5UZXh0V2lkZ2V0KHtcbiAgICAgICAgbWFya2Rvd246ICcjIyBFS1MgQ2x1c3RlcicsXG4gICAgICAgIHdpZHRoOiAyNCxcbiAgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhla3NDbHVzdGVyV2lkZ2V0KTtcblxuICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICBuZXcgY2xvdWR3YXRjaC5UZXh0V2lkZ2V0KHtcbiAgICAgICAgbWFya2Rvd246ICcjIyBQb2QgTWV0cmljcycsXG4gICAgICAgIHdpZHRoOiAyNCxcbiAgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhwb2RNZXRyaWNzV2lkZ2V0KTtcblxuICAgIC8vIEVLUyBDbHVzdGVyIEFsYXJtc1xuICAgIGNvbnN0IGVrc0NsdXN0ZXJGYWlsZWRSZXF1ZXN0QWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnRUtTQ2x1c3RlckZhaWxlZFJlcXVlc3RBbGFybScsIHtcbiAgICAgIGFsYXJtTmFtZTogJ0VLUy1DbHVzdGVyRmFpbGVkUmVxdWVzdHMnLFxuICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICBuYW1lc3BhY2U6ICdBV1MvRUtTJyxcbiAgICAgICAgbWV0cmljTmFtZTogJ2NsdXN0ZXJfZmFpbGVkX3JlcXVlc3RfY291bnQnLFxuICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgQ2x1c3Rlck5hbWU6IHByb3BzLmVrc0NsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICB9KSxcbiAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5OT1RfQlJFQUNISU5HLFxuICAgIH0pO1xuXG4gICAgZWtzQ2x1c3RlckZhaWxlZFJlcXVlc3RBbGFybS5hZGRBbGFybUFjdGlvbihuZXcgYWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKSk7XG5cbiAgICAvLyBQb2QgQ1BVIFV0aWxpemF0aW9uIEFsYXJtXG4gICAgY29uc3QgcG9kSGlnaENwdUFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ1BvZEhpZ2hDcHVBbGFybScsIHtcbiAgICAgIGFsYXJtTmFtZTogJ1BvZC1IaWdoQ3B1VXRpbGl6YXRpb24nLFxuICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICBuYW1lc3BhY2U6ICdDb250YWluZXJJbnNpZ2h0cycsXG4gICAgICAgIG1ldHJpY05hbWU6ICdwb2RfY3B1X3V0aWxpemF0aW9uJyxcbiAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgIENsdXN0ZXJOYW1lOiBwcm9wcy5la3NDbHVzdGVyLmNsdXN0ZXJOYW1lLFxuICAgICAgICAgIE5hbWVzcGFjZTogJ2NvZmZlZXNob3AnLFxuICAgICAgICB9LFxuICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgfSksXG4gICAgICB0aHJlc2hvbGQ6IDgwLFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDMsXG4gICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICB9KTtcblxuICAgIHBvZEhpZ2hDcHVBbGFybS5hZGRBbGFybUFjdGlvbihuZXcgYWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKSk7XG5cbiAgICAvLyBQb2QgTWVtb3J5IFV0aWxpemF0aW9uIEFsYXJtXG4gICAgY29uc3QgcG9kSGlnaE1lbW9yeUFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ1BvZEhpZ2hNZW1vcnlBbGFybScsIHtcbiAgICAgIGFsYXJtTmFtZTogJ1BvZC1IaWdoTWVtb3J5VXRpbGl6YXRpb24nLFxuICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICBuYW1lc3BhY2U6ICdDb250YWluZXJJbnNpZ2h0cycsXG4gICAgICAgIG1ldHJpY05hbWU6ICdwb2RfbWVtb3J5X3V0aWxpemF0aW9uJyxcbiAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgIENsdXN0ZXJOYW1lOiBwcm9wcy5la3NDbHVzdGVyLmNsdXN0ZXJOYW1lLFxuICAgICAgICAgIE5hbWVzcGFjZTogJ2NvZmZlZXNob3AnLFxuICAgICAgICB9LFxuICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgfSksXG4gICAgICB0aHJlc2hvbGQ6IDg1LFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDMsXG4gICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICB9KTtcblxuICAgIHBvZEhpZ2hNZW1vcnlBbGFybS5hZGRBbGFybUFjdGlvbihuZXcgYWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rhc2hib2FyZFVSTCcsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke3RoaXMucmVnaW9ufS5jb25zb2xlLmF3cy5hbWF6b24uY29tL2Nsb3Vkd2F0Y2gvaG9tZT9yZWdpb249JHt0aGlzLnJlZ2lvbn0jZGFzaGJvYXJkczpuYW1lPSR7dGhpcy5kYXNoYm9hcmQuZGFzaGJvYXJkTmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZFdhdGNoIERhc2hib2FyZCBVUkwnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FsYXJtVG9waWNBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hbGFybVRvcGljLnRvcGljQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdTTlMgVG9waWMgQVJOIGZvciBhbGFybXMnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUFsYXJtVG9waWNBcm5gLFxuICAgIH0pO1xuICB9XG59Il19