"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseStack = void 0;
const cdk = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
class DatabaseStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Check if we should import existing tables from context
        const importExisting = this.node.tryGetContext('importExistingTables') === 'true';
        // Order Table - create or import
        if (importExisting) {
            this.orderTable = dynamodb.Table.fromTableName(this, 'OrderTable', 'Order');
        }
        else {
            this.orderTable = new dynamodb.Table(this, 'OrderTable', {
                tableName: 'Order',
                partitionKey: {
                    name: 'seqNo',
                    type: dynamodb.AttributeType.NUMBER,
                },
                billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                pointInTimeRecoverySpecification: {
                    pointInTimeRecoveryEnabled: true,
                },
                encryption: dynamodb.TableEncryption.AWS_MANAGED,
            });
        }
        // Coffee Table - create or import
        if (importExisting) {
            this.coffeeTable = dynamodb.Table.fromTableName(this, 'CoffeeTable', 'Coffee');
        }
        else {
            this.coffeeTable = new dynamodb.Table(this, 'CoffeeTable', {
                tableName: 'Coffee',
                partitionKey: {
                    name: 'seqNo',
                    type: dynamodb.AttributeType.NUMBER,
                },
                billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                pointInTimeRecoverySpecification: {
                    pointInTimeRecoveryEnabled: true,
                },
                encryption: dynamodb.TableEncryption.AWS_MANAGED,
            });
        }
        // Inventory Table - create or import
        if (importExisting) {
            this.inventoryTable = dynamodb.Table.fromTableName(this, 'InventoryTable', 'Inventory');
        }
        else {
            const inventoryTable = new dynamodb.Table(this, 'InventoryTable', {
                tableName: 'Inventory',
                partitionKey: {
                    name: 'itemId',
                    type: dynamodb.AttributeType.STRING,
                },
                billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                pointInTimeRecoverySpecification: {
                    pointInTimeRecoveryEnabled: true,
                },
                encryption: dynamodb.TableEncryption.AWS_MANAGED,
            });
            // Add GSI for inventory by category (only for new tables)
            inventoryTable.addGlobalSecondaryIndex({
                indexName: 'CategoryIndex',
                partitionKey: {
                    name: 'category',
                    type: dynamodb.AttributeType.STRING,
                },
                sortKey: {
                    name: 'itemId',
                    type: dynamodb.AttributeType.STRING,
                },
            });
            this.inventoryTable = inventoryTable;
        }
        // Outputs
        new cdk.CfnOutput(this, 'OrderTableName', {
            value: this.orderTable.tableName,
            description: 'Order DynamoDB Table Name',
            exportName: `${this.stackName}-OrderTableName`,
        });
        new cdk.CfnOutput(this, 'CoffeeTableName', {
            value: this.coffeeTable.tableName,
            description: 'Coffee DynamoDB Table Name',
            exportName: `${this.stackName}-CoffeeTableName`,
        });
        new cdk.CfnOutput(this, 'InventoryTableName', {
            value: this.inventoryTable.tableName,
            description: 'Inventory DynamoDB Table Name',
            exportName: `${this.stackName}-InventoryTableName`,
        });
    }
}
exports.DatabaseStack = DatabaseStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYXRhYmFzZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMscURBQXFEO0FBR3JELE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSzFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIseURBQXlEO1FBQ3pELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHNCQUFzQixDQUFDLEtBQUssTUFBTSxDQUFDO1FBRWxGLGlDQUFpQztRQUNqQyxJQUFJLGNBQWMsRUFBRTtZQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDN0U7YUFBTTtZQUNMLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7Z0JBQ3ZELFNBQVMsRUFBRSxPQUFPO2dCQUNsQixZQUFZLEVBQUU7b0JBQ1osSUFBSSxFQUFFLE9BQU87b0JBQ2IsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTtpQkFDcEM7Z0JBQ0QsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtnQkFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztnQkFDeEMsZ0NBQWdDLEVBQUU7b0JBQ2hDLDBCQUEwQixFQUFFLElBQUk7aUJBQ2pDO2dCQUNELFVBQVUsRUFBRSxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVc7YUFDakQsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxrQ0FBa0M7UUFDbEMsSUFBSSxjQUFjLEVBQUU7WUFD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QUNMLENBQUM7Q0FDRjtBQXRHRCxzQ0FzR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgY2xhc3MgRGF0YWJhc2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBvcmRlclRhYmxlOiBkeW5hbW9kYi5JVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBjb2ZmZWVUYWJsZTogZHluYW1vZGIuSVRhYmxlO1xuICBwdWJsaWMgcmVhZG9ubHkgaW52ZW50b3J5VGFibGU6IGR5bmFtb2RiLklUYWJsZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSBzaG91bGQgaW1wb3J0IGV4aXN0aW5nIHRhYmxlcyBmcm9tIGNvbnRleHRcbiAgICBjb25zdCBpbXBvcnRFeGlzdGluZyA9IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdpbXBvcnRFeGlzdGluZ1RhYmxlcycpID09PSAndHJ1ZSc7XG5cbiAgICAvLyBPcmRlciBUYWJsZSAtIGNyZWF0ZSBvciBpbXBvcnRcbiAgICBpZiAoaW1wb3J0RXhpc3RpbmcpIHtcbiAgICAgIHRoaXMub3JkZXJUYWJsZSA9IGR5bmFtb2RiLlRhYmxlLmZyb21UYWJsZU5hbWUodGhpcywgJ09yZGVyVGFibGUnLCAnT3JkZXInKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcmRlclRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdPcmRlclRhYmxlJywge1xuICAgICAgICB0YWJsZU5hbWU6ICdPcmRlcicsXG4gICAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICAgIG5hbWU6ICdzZXFObycsXG4gICAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIsXG4gICAgICAgIH0sXG4gICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIFVzZSBSRVRBSU4gZm9yIHByb2R1Y3Rpb25cbiAgICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeVNwZWNpZmljYXRpb246IHtcbiAgICAgICAgICBwb2ludEluVGltZVJlY292ZXJ5RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkFXU19NQU5BR0VELFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ29mZmVlIFRhYmxlIC0gY3JlYXRlIG9yIGltcG9ydFxuICAgIGlmIChpbXBvcnRFeGlzdGluZykge1xuICAgICAgdGhpcy5jb2ZmZWVUYWJsZSA9IGR5bmFtb2RiLlRhYmxlLmZyb21UYWJsZU5hbWUodGhpcywgJ0NvZmZlZVRhYmxlJywgJ0NvZmZlZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvZmZlZVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdDb2ZmZWVUYWJsZScsIHtcbiAgICAgICAgdGFibGVOYW1lOiAnQ29mZmVlJyxcbiAgICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgICAgbmFtZTogJ3NlcU5vJyxcbiAgICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUixcbiAgICAgICAgfSxcbiAgICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gVXNlIFJFVEFJTiBmb3IgcHJvZHVjdGlvblxuICAgICAgICBwb2ludEluVGltZVJlY292ZXJ5U3BlY2lmaWNhdGlvbjoge1xuICAgICAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlFbmFibGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQVdTX01BTkFHRUQsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBJbnZlbnRvcnkgVGFibGUgLSBjcmVhdGUgb3IgaW1wb3J0XG4gICAgaWYgKGltcG9ydEV4aXN0aW5nKSB7XG4gICAgICB0aGlzLmludmVudG9yeVRhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZSh0aGlzLCAnSW52ZW50b3J5VGFibGUnLCAnSW52ZW50b3J5Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGludmVudG9yeVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdJbnZlbnRvcnlUYWJsZScsIHtcbiAgICAgICAgdGFibGVOYW1lOiAnSW52ZW50b3J5JyxcbiAgICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgICAgbmFtZTogJ2l0ZW1JZCcsXG4gICAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICAgIH0sXG4gICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIFVzZSBSRVRBSU4gZm9yIHByb2R1Y3Rpb25cbiAgICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeVNwZWNpZmljYXRpb246IHtcbiAgICAgICAgICBwb2ludEluVGltZVJlY292ZXJ5RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkFXU19NQU5BR0VELFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEFkZCBHU0kgZm9yIGludmVudG9yeSBieSBjYXRlZ29yeSAob25seSBmb3IgbmV3IHRhYmxlcylcbiAgICAgIGludmVudG9yeVRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgICAgaW5kZXhOYW1lOiAnQ2F0ZWdvcnlJbmRleCcsXG4gICAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICAgIG5hbWU6ICdjYXRlZ29yeScsXG4gICAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICAgIH0sXG4gICAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgICBuYW1lOiAnaXRlbUlkJyxcbiAgICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLmludmVudG9yeVRhYmxlID0gaW52ZW50b3J5VGFibGU7XG4gICAgfVxuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdPcmRlclRhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLm9yZGVyVGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdPcmRlciBEeW5hbW9EQiBUYWJsZSBOYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1PcmRlclRhYmxlTmFtZWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ29mZmVlVGFibGVOYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuY29mZmVlVGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2ZmZWUgRHluYW1vREIgVGFibGUgTmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgJHt0aGlzLnN0YWNrTmFtZX0tQ29mZmVlVGFibGVOYW1lYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdJbnZlbnRvcnlUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5pbnZlbnRvcnlUYWJsZS50YWJsZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0ludmVudG9yeSBEeW5hbW9EQiBUYWJsZSBOYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke3RoaXMuc3RhY2tOYW1lfS1JbnZlbnRvcnlUYWJsZU5hbWVgLFxuICAgIH0pO1xuICB9XG59Il19