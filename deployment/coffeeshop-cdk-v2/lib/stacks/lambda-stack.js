"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
const iam = require("aws-cdk-lib/aws-iam");
const logs = require("aws-cdk-lib/aws-logs");
class LambdaStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.functions = {};
        // Common Lambda execution role
        const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });
        // Add basic Lambda execution permissions
        lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: ['arn:aws:logs:*:*:*'],
        }));
        // Add VPC access permissions
        lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
                'ec2:AttachNetworkInterface',
                'ec2:DetachNetworkInterface',
            ],
            resources: ['*'],
        }));
        // Grant DynamoDB permissions
        props.orderTable.grantFullAccess(lambdaExecutionRole);
        props.coffeeTable.grantFullAccess(lambdaExecutionRole);
        // Grant EventBridge permissions
        lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'events:PutEvents',
            ],
            resources: ['*'],
        }));
        // Coffee Order Handler Lambda (using your Java implementation)
        this.functions.coffeeOrderHandler = new lambda.Function(this, 'CoffeeOrderHandler', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'solid.humank.coffeeshop.cofee.sls.orders.OrderCreatedHandler::handleRequest',
            code: lambda.Code.fromAsset('../../sources/coffeeshop/coffee-sls/build/libs/coffee-sls.jar'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            role: lambdaExecutionRole,
            environment: {
                ORDER_TABLE_NAME: props.orderTable.tableName,
                COFFEE_TABLE_NAME: props.coffeeTable.tableName,
            },
            logGroup: new logs.LogGroup(this, 'CoffeeOrderHandlerLogGroup', {
                retention: logs.RetentionDays.ONE_WEEK,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
        });
        // Inventory Management Lambda (using your Java implementation)
        this.functions.inventoryHandler = new lambda.Function(this, 'InventoryHandler', {
            runtime: lambda.Runtime.JAVA_21,
            handler: 'helloworld.App::handleRequest',
            code: lambda.Code.fromAsset('../../sources/coffeeshop/inventory-sls/build/libs/inventory-sls.jar'),
            timeout: cdk.Duration.seconds(20),
            memorySize: 512,
            role: lambdaExecutionRole,
            environment: {
                COFFEE_TABLE_NAME: props.coffeeTable.tableName,
            },
            logGroup: new logs.LogGroup(this, 'InventoryHandlerLogGroup', {
                retention: logs.RetentionDays.ONE_WEEK,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
        });
        // Note: Order processing is handled by orders-web service, not Lambda
        // API Gateway
        this.api = new apigateway.RestApi(this, 'CoffeeShopApi', {
            restApiName: 'CoffeeShop API',
            description: 'API for CoffeeShop microservices',
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },
            deployOptions: {
                stageName: 'prod',
                tracingEnabled: true,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                metricsEnabled: true,
            },
        });
        // API Gateway integrations
        const coffeeIntegration = new apigateway.LambdaIntegration(this.functions.coffeeOrderHandler);
        const inventoryIntegration = new apigateway.LambdaIntegration(this.functions.inventoryHandler);
        // API Routes
        const coffeeResource = this.api.root.addResource('coffee');
        coffeeResource.addResource('order').addMethod('POST', coffeeIntegration);
        const inventoryResource = this.api.root.addResource('inventory');
        inventoryResource.addMethod('GET', inventoryIntegration);
        inventoryResource.addMethod('POST', inventoryIntegration);
        // Note: Orders API is handled by orders-web service running on EKS
        // Check if we should create or import EventBridge rule
        const importExistingRule = this.node.tryGetContext('importExistingRule') === 'true';
        let orderCreatedRule;
        if (importExistingRule) {
            // Import existing EventBridge Rule
            orderCreatedRule = events.Rule.fromEventRuleArn(this, 'OrderCreatedRule', 'arn:aws:events:us-west-2:584518143473:rule/OrderCreatedRule');
            // For imported rules, we cannot add targets via CDK
            // The target should be managed separately or already exist
            console.log('Using existing EventBridge rule - targets must be managed separately');
        }
        else {
            // Create new EventBridge Rule
            const newRule = new events.Rule(this, 'OrderCreatedRule', {
                eventPattern: {
                    source: ['solid.humank.coffeeshop.order'],
                    detailType: ['customevent'],
                },
                ruleName: 'OrderCreatedRule',
            });
            // Add Lambda target to EventBridge rule
            newRule.addTarget(new targets.LambdaFunction(this.functions.coffeeOrderHandler));
            orderCreatedRule = newRule;
        }
        // Outputs
        new cdk.CfnOutput(this, 'ApiGatewayUrl', {
            value: this.api.url,
            description: 'API Gateway URL',
            exportName: `${this.stackName}-ApiUrl`,
        });
        new cdk.CfnOutput(this, 'CoffeeOrderUrl', {
            value: `${this.api.url}coffee/order`,
            description: 'Coffee Order API URL',
        });
        new cdk.CfnOutput(this, 'InventoryUrl', {
            value: `${this.api.url}inventory`,
            description: 'Inventory API URL',
        });
        // Note: Orders API URL will be provided by EKS ingress
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyxpREFBaUQ7QUFDakQseURBQXlEO0FBR3pELGlEQUFpRDtBQUNqRCwwREFBMEQ7QUFDMUQsMkNBQTJDO0FBQzNDLDZDQUE2QztBQVM3QyxNQUFhLFdBQVksU0FBUSxHQUFHLENBQUMsS0FBSztJQUl0QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQzdELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBSlosY0FBUyxHQUF1QyxFQUFFLENBQUM7UUFNL0QsK0JBQStCO1FBQy9CLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUNsRSxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUM7U0FDOUQsQ0FBQyxDQUFDO1FBRUgseUNBQXlDO1FBQ3pDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDcEQsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztZQUN4QixPQUFPLEVBQUU7Z0JBQ0wscUJBQXFCO2dCQUNyQixzQkFBc0I7Z0JBQ3RCLG1CQUFtQjthQUN0QjtZQUNELFNBQVMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1NBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBRUosNkJBQTZCO1FBQzdCLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDcEQsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztZQUN4QixPQUFPLEVBQUU7Z0JBQ0wsNEJBQTRCO2dCQUM1QiwrQkFBK0I7Z0JBQy9CLDRCQUE0QjtnQkFDNUIsNEJB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QUFDLENBQUM7UUFFSCx1REFBdUQ7SUFDM0QsQ0FBQztDQUNKO0FBdktELGtDQXVLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIExhbWJkYVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gICAgdnBjOiBlYzIuVnBjO1xuICAgIG9yZGVyVGFibGU6IGR5bmFtb2RiLklUYWJsZTtcbiAgICBjb2ZmZWVUYWJsZTogZHluYW1vZGIuSVRhYmxlO1xufVxuXG5leHBvcnQgY2xhc3MgTGFtYmRhU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAgIHB1YmxpYyByZWFkb25seSBmdW5jdGlvbnM6IHsgW2tleTogc3RyaW5nXTogbGFtYmRhLkZ1bmN0aW9uIH0gPSB7fTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTGFtYmRhU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICAvLyBDb21tb24gTGFtYmRhIGV4ZWN1dGlvbiByb2xlXG4gICAgICAgIGNvbnN0IGxhbWJkYUV4ZWN1dGlvblJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0xhbWJkYUV4ZWN1dGlvblJvbGUnLCB7XG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWRkIGJhc2ljIExhbWJkYSBleGVjdXRpb24gcGVybWlzc2lvbnNcbiAgICAgICAgbGFtYmRhRXhlY3V0aW9uUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nR3JvdXAnLFxuICAgICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFsnYXJuOmF3czpsb2dzOio6KjoqJ10sXG4gICAgICAgIH0pKTtcblxuICAgICAgICAvLyBBZGQgVlBDIGFjY2VzcyBwZXJtaXNzaW9uc1xuICAgICAgICBsYW1iZGFFeGVjdXRpb25Sb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICAnZWMyOkNyZWF0ZU5ldHdvcmtJbnRlcmZhY2UnLFxuICAgICAgICAgICAgICAgICdlYzI6RGVzY3JpYmVOZXR3b3JrSW50ZXJmYWNlcycsXG4gICAgICAgICAgICAgICAgJ2VjMjpEZWxldGVOZXR3b3JrSW50ZXJmYWNlJyxcbiAgICAgICAgICAgICAgICAnZWMyOkF0dGFjaE5ldHdvcmtJbnRlcmZhY2UnLFxuICAgICAgICAgICAgICAgICdlYzI6RGV0YWNoTmV0d29ya0ludGVyZmFjZScsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vIEdyYW50IER5bmFtb0RCIHBlcm1pc3Npb25zXG4gICAgICAgIHByb3BzLm9yZGVyVGFibGUuZ3JhbnRGdWxsQWNjZXNzKGxhbWJkYUV4ZWN1dGlvblJvbGUpO1xuICAgICAgICBwcm9wcy5jb2ZmZWVUYWJsZS5ncmFudEZ1bGxBY2Nlc3MobGFtYmRhRXhlY3V0aW9uUm9sZSk7XG5cbiAgICAgICAgLy8gR3JhbnQgRXZlbnRCcmlkZ2UgcGVybWlzc2lvbnNcbiAgICAgICAgbGFtYmRhRXhlY3V0aW9uUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgJ2V2ZW50czpQdXRFdmVudHMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgIH0pKTtcblxuICAgICAgICAvLyBDb2ZmZWUgT3JkZXIgSGFuZGxlciBMYW1iZGEgKHVzaW5nIHlvdXIgSmF2YSBpbXBsZW1lbnRhdGlvbilcbiAgICAgICAgdGhpcy5mdW5jdGlvbnMuY29mZmVlT3JkZXJIYW5kbGVyID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQ29mZmVlT3JkZXJIYW5kbGVyJywge1xuICAgICAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuSkFWQV8yMSxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdzb2xpZC5odW1hbmsuY29mZmVlc2hvcC5jb2ZlZS5zbHMub3JkZXJzLk9yZGVyQ3JlYXRlZEhhbmRsZXI6OmhhbmRsZVJlcXVlc3QnLFxuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi8uLi9zb3VyY2VzL2NvZmZlZXNob3AvY29mZmVlLXNscy9idWlsZC9saWJzL2NvZmZlZS1zbHMuamFyJyksXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICAgICAgICBtZW1vcnlTaXplOiAxMDI0LFxuICAgICAgICAgICAgcm9sZTogbGFtYmRhRXhlY3V0aW9uUm9sZSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgT1JERVJfVEFCTEVfTkFNRTogcHJvcHMub3JkZXJUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgICAgICAgQ09GRkVFX1RBQkxFX05BTUU6IHByb3BzLmNvZmZlZVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2dHcm91cDogbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgJ0NvZmZlZU9yZGVySGFuZGxlckxvZ0dyb3VwJywge1xuICAgICAgICAgICAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gSW52ZW50b3J5IE1hbmFnZW1lbnQgTGFtYmRhICh1c2luZyB5b3VyIEphdmEgaW1wbGVtZW50YXRpb24pXG4gICAgICAgIHRoaXMuZnVuY3Rpb25zLmludmVudG9yeUhhbmRsZXIgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdJbnZlbnRvcnlIYW5kbGVyJywge1xuICAgICAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuSkFWQV8yMSxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdoZWxsb3dvcmxkLkFwcDo6aGFuZGxlUmVxdWVzdCcsXG4gICAgICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uLy4uL3NvdXJjZXMvY29mZmVlc2hvcC9pbnZlbnRvcnktc2xzL2J1aWxkL2xpYnMvaW52ZW50b3J5LXNscy5qYXInKSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICAgICAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgICAgICAgIHJvbGU6IGxhbWJkYUV4ZWN1dGlvblJvbGUsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIENPRkZFRV9UQUJMRV9OQU1FOiBwcm9wcy5jb2ZmZWVUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG9nR3JvdXA6IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdJbnZlbnRvcnlIYW5kbGVyTG9nR3JvdXAnLCB7XG4gICAgICAgICAgICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBOb3RlOiBPcmRlciBwcm9jZXNzaW5nIGlzIGhhbmRsZWQgYnkgb3JkZXJzLXdlYiBzZXJ2aWNlLCBub3QgTGFtYmRhXG5cbiAgICAgICAgLy8gQVBJIEdhdGV3YXlcbiAgICAgICAgdGhpcy5hcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdDb2ZmZWVTaG9wQXBpJywge1xuICAgICAgICAgICAgcmVzdEFwaU5hbWU6ICdDb2ZmZWVTaG9wIEFQSScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FQSSBmb3IgQ29mZmVlU2hvcCBtaWNyb3NlcnZpY2VzJyxcbiAgICAgICAgICAgIGVuZHBvaW50Q29uZmlndXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIHR5cGVzOiBbYXBpZ2F0ZXdheS5FbmRwb2ludFR5cGUuUkVHSU9OQUxdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcbiAgICAgICAgICAgICAgICB0cmFjaW5nRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXG4gICAgICAgICAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFQSSBHYXRld2F5IGludGVncmF0aW9uc1xuICAgICAgICBjb25zdCBjb2ZmZWVJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMuZnVuY3Rpb25zLmNvZmZlZU9yZGVySGFuZGxlcik7XG4gICAgICAgIGNvbnN0IGludmVudG9yeUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGhpcy5mdW5jdGlvbnMuaW52ZW50b3J5SGFuZGxlcik7XG5cbiAgICAgICAgLy8gQVBJIFJvdXRlc1xuICAgICAgICBjb25zdCBjb2ZmZWVSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2NvZmZlZScpO1xuICAgICAgICBjb2ZmZWVSZXNvdXJjZS5hZGRSZXNvdXJjZSgnb3JkZXInKS5hZGRNZXRob2QoJ1BPU1QnLCBjb2ZmZWVJbnRlZ3JhdGlvbik7XG5cbiAgICAgICAgY29uc3QgaW52ZW50b3J5UmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdpbnZlbnRvcnknKTtcbiAgICAgICAgaW52ZW50b3J5UmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBpbnZlbnRvcnlJbnRlZ3JhdGlvbik7XG4gICAgICAgIGludmVudG9yeVJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIGludmVudG9yeUludGVncmF0aW9uKTtcblxuICAgICAgICAvLyBOb3RlOiBPcmRlcnMgQVBJIGlzIGhhbmRsZWQgYnkgb3JkZXJzLXdlYiBzZXJ2aWNlIHJ1bm5pbmcgb24gRUtTXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgd2Ugc2hvdWxkIGNyZWF0ZSBvciBpbXBvcnQgRXZlbnRCcmlkZ2UgcnVsZVxuICAgICAgICBjb25zdCBpbXBvcnRFeGlzdGluZ1J1bGUgPSB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnaW1wb3J0RXhpc3RpbmdSdWxlJykgPT09ICd0cnVlJztcbiAgICAgICAgXG4gICAgICAgIGxldCBvcmRlckNyZWF0ZWRSdWxlOiBldmVudHMuSVJ1bGU7XG4gICAgICAgIFxuICAgICAgICBpZiAoaW1wb3J0RXhpc3RpbmdSdWxlKSB7XG4gICAgICAgICAgICAvLyBJbXBvcnQgZXhpc3RpbmcgRXZlbnRCcmlkZ2UgUnVsZVxuICAgICAgICAgICAgb3JkZXJDcmVhdGVkUnVsZSA9IGV2ZW50cy5SdWxlLmZyb21FdmVudFJ1bGVBcm4oXG4gICAgICAgICAgICAgICAgdGhpcywgXG4gICAgICAgICAgICAgICAgJ09yZGVyQ3JlYXRlZFJ1bGUnLCBcbiAgICAgICAgICAgICAgICAnYXJuOmF3czpldmVudHM6dXMtd2VzdC0yOjU4NDUxODE0MzQ3MzpydWxlL09yZGVyQ3JlYXRlZFJ1bGUnXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBGb3IgaW1wb3J0ZWQgcnVsZXMsIHdlIGNhbm5vdCBhZGQgdGFyZ2V0cyB2aWEgQ0RLXG4gICAgICAgICAgICAvLyBUaGUgdGFyZ2V0IHNob3VsZCBiZSBtYW5hZ2VkIHNlcGFyYXRlbHkgb3IgYWxyZWFkeSBleGlzdFxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1VzaW5nIGV4aXN0aW5nIEV2ZW50QnJpZGdlIHJ1bGUgLSB0YXJnZXRzIG11c3QgYmUgbWFuYWdlZCBzZXBhcmF0ZWx5Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgbmV3IEV2ZW50QnJpZGdlIFJ1bGVcbiAgICAgICAgICAgIGNvbnN0IG5ld1J1bGUgPSBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ09yZGVyQ3JlYXRlZFJ1bGUnLCB7XG4gICAgICAgICAgICAgICAgZXZlbnRQYXR0ZXJuOiB7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogWydzb2xpZC5odW1hbmsuY29mZmVlc2hvcC5vcmRlciddLFxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxUeXBlOiBbJ2N1c3RvbWV2ZW50J10sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBydWxlTmFtZTogJ09yZGVyQ3JlYXRlZFJ1bGUnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFkZCBMYW1iZGEgdGFyZ2V0IHRvIEV2ZW50QnJpZGdlIHJ1bGVcbiAgICAgICAgICAgIG5ld1J1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKHRoaXMuZnVuY3Rpb25zLmNvZmZlZU9yZGVySGFuZGxlcikpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBvcmRlckNyZWF0ZWRSdWxlID0gbmV3UnVsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE91dHB1dHNcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUdhdGV3YXlVcmwnLCB7XG4gICAgICAgICAgICB2YWx1ZTogdGhpcy5hcGkudXJsLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSBVUkwnLFxuICAgICAgICAgICAgZXhwb3J0TmFtZTogYCR7dGhpcy5zdGFja05hbWV9LUFwaVVybGAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDb2ZmZWVPcmRlclVybCcsIHtcbiAgICAgICAgICAgIHZhbHVlOiBgJHt0aGlzLmFwaS51cmx9Y29mZmVlL29yZGVyYCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29mZmVlIE9yZGVyIEFQSSBVUkwnLFxuICAgICAgICB9KTtcblxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSW52ZW50b3J5VXJsJywge1xuICAgICAgICAgICAgdmFsdWU6IGAke3RoaXMuYXBpLnVybH1pbnZlbnRvcnlgLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbnZlbnRvcnkgQVBJIFVSTCcsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIE5vdGU6IE9yZGVycyBBUEkgVVJMIHdpbGwgYmUgcHJvdmlkZWQgYnkgRUtTIGluZ3Jlc3NcbiAgICB9XG59Il19