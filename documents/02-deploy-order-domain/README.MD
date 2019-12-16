# Deploy Order Domain Service

This EventStormingWorkshop sample code is written in Java8 and leverage maven package management system to do all the java source code compile and package stuff. If you are familiared with Maven, then just go through the command:

> mvn clean test package

If you are new to java and maven, please check for these instructions to setup

[Install Java 8 SDK](https://www.ntu.edu.sg/home/ehchua/programming/howto/JDK_HowTo.html)

[Install Maven](https://maven.apache.org/install.html)

After the Java8 SDK and Maven installation finished, then run command:

```bash

cd EventStormingWorkShop/sources/java-implements

cd callcarbar-coffee-order

mvn clean test package
```

![image](/documents/images/order-mvn-process.png)

## SAM CLI Local Test

The Order Domain take the Order Lambda function as the entry point, which is proxy integrated with API Gateway.

The way to start the api gateway at local, just start with the command:

> sam local start-api

![image](/documents/images/order-domain-sam-local-startapi.png)

## Create DynamoDB Table to persist Domain Entity - Order

Order table Partition Key definition:

```json
{
    "TableName": "Order",
    "KeySchema": [
      { "AttributeName": "establishtime", "KeyType": "HASH" }
    ],
    "AttributeDefinitions": [
      { "AttributeName": "establishtime", "AttributeType": "S" }
    ],
    "ProvisionedThroughput": {
      "ReadCapacityUnits": 5,
      "WriteCapacityUnits": 5
    }
}
```

```bash
cd ~/<<YourWorkPath>>/EventStormingWorkShop/sources

aws dynamodb create-table --cli-input-json file://create-dynamodb-table-order.json --region ap-northeast-1

```

Output:

```json
{
    "TableDescription": {
        "TableArn": "arn:aws:dynamodb:ap-northeast-1:584518143473:table/Order",
        "AttributeDefinitions": [
            {
                "AttributeName": "establishtime",
                "AttributeType": "S"
            }
        ],
        "ProvisionedThroughput": {
            "NumberOfDecreasesToday": 0,
            "WriteCapacityUnits": 5,
            "ReadCapacityUnits": 5
        },
        "TableSizeBytes": 0,
        "TableName": "Order",
        "TableStatus": "CREATING",
        "TableId": "111bc38b-bc03-4a60-b285-9a2d063851bf",
        "KeySchema": [
            {
                "KeyType": "HASH",
                "AttributeName": "establishtime"
            }
        ],
        "ItemCount": 0,
        "CreationDateTime": 1539189162.492
    }
}
```

## SAM CLI Package & Deploy

### Packing application

At first, make sure that you have a s3 bucket which is used to store the application, if need, just run the command to create a new bucket.


```bash
aws s3 mb s3://bucket-name-to-store-lambda-function --region <<AsYouNeed>>
```

Next, then try to pack this lambda function and upload it to s3 bucket which you refer to store.

```bash
sam package \
    --template-file template.yaml \
    --output-template-file serverless-output.yaml \
    --s3-bucket <<your-lambda-bucket-store>>
```

Output:

```text
Uploading to 64f89b4bdacf2baf8a828e87e4a4cd01  8339909 / 8339909.0  (100.00%)
Successfully packaged artifacts and wrote output template to file serverless-output.yaml.
Execute the following command to deploy the packaged template
aws cloudformation deploy --template-file /Users/yikai/git/EventStormingWorkShop/sources/java-implements/callcarbar-coffee-order/serverless-output.yaml --stack-name <YOUR STACK NAME>
```

The package command returns an AWS SAM template named serverless-output.yaml that contains the CodeUri that points to the deployment zip in the Amazon S3 bucket that you specified. This template represents your serverless application. You are now ready to deploy it.

Take a look on the Serverless-output.yml

```yml
AWSTemplateFormatVersion: '2010-09-09'
Outputs:
  TestOrderUrl:
    Description: Test Order URL
    Value:
      Fn::Sub: https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/order
Resources:
  OrderFunction:
    Properties:
      CodeUri: s3://kim-lambda-store/64f89b4bdacf2baf8a828e87e4a4cd01
      Events:
        PurchaseOrder:
          Properties:
            Method: post
            Path: /order
          Type: Api
      Handler: solid.humank.adapters.OrderAPIGProxyWrapper::handleRequest
      MemorySize: 256
      Policies:
      - AmazonDynamoDBFullAccess
      - AWSLambdaFullAccess
      - CloudWatchEventsFullAccess
      Runtime: java8
      Timeout: 60
    Type: AWS::Serverless::Function
Transform: AWS::Serverless-2016-10-31
```

### Deploying application

```bash
sam deploy \
    --template-file serverless-output.yaml \
    --stack-name OrderDomain \
    --capabilities CAPABILITY_IAM
```

Output:

```log
Waiting for changeset to be created..
Waiting for stack create/update to complete
Successfully created/updated stack - OrderDomain
```

Remember, the Serverless Application Model is a streamline version from CloudFormation. All the sam deployment will trigger the cloudformation to create stack from the specified serverless-output.yaml. So the whole cloudformation stack creation process will be invoked( Check for change, if exist then create change-set, and then confirm to create/update the change to complete).

Final check for the cloudformation to see these changes.

* Cloudformation Stack created

![image](/documents/images/order-domain-stack-created.png)

* Created resources

![image](/documents/images/order-domain-resources.png)

If you are interested in knowing the whole process, and want to know what stuff CFN did, just look at the event records.

* Creation detail

![image](/documents/images/order-domain-creation-process.png)