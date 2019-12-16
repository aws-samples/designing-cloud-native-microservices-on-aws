# Deploy Makeup Domain Service

This EventStormingWorkshop sample code is written in Java8 and leverage maven package management system to do all the java source code compile and package stuff. If you are familiared with Maven, then just go through the command:

> mvn clean test package

If you are new to java and maven, please check for these instructions to setup

[Install Java 8 SDK](https://www.ntu.edu.sg/home/ehchua/programming/howto/JDK_HowTo.html)

[Install Maven](https://maven.apache.org/install.html)

After the Java8 SDK and Maven installation finished, then run command:

```bash

cd EventStormingWorkShop/sources/java-implements

cd callcarbar-coffee-makeup

mvn clean test package
```

![image](/documents/images/makeup-mvn-process.png)


## SAM CLI Package & Deploy

### Packing application

At first, make sure that you have a s3 bucket which is used to store the application, if need, just run the command to create a new bucket.

If you had ever created the s3 bucket in "Deploy Order Domain" section, then you could skip this.

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
Uploading to bd4eb21d7157d5abd3f5463419440fa0  3800850 / 3800850.0  (100.00%)
Successfully packaged artifacts and wrote output template to file serverless-output.yaml.
Execute the following command to deploy the packaged template
aws cloudformation deploy --template-file /Users/yikaikao/git/EventStormingWorkShop/sources/java-implements/callcarbar-coffee-makeup/serverless-output.yaml --stack-name <YOUR STACK NAME>
```

The package command returns an AWS SAM template named serverless-output.yaml that contains the CodeUri that points to the deployment zip in the Amazon S3 bucket that you specified. This template represents your serverless application. You are now ready to deploy it.

Take a look on the Serverless-output.yml

```yml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MakeupFunction:
    Properties:
      CodeUri: s3://kim-lambda-store/bd4eb21d7157d5abd3f5463419440fa0
      Handler: solid.humank.adapters.OrderReceiverAdapter::handleRequest
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
    --stack-name MakeUpDomain \
    --capabilities CAPABILITY_IAM
```

Output:

```log
Waiting for changeset to be created..
Waiting for stack create/update to complete
Successfully created/updated stack - MakeUpDomain
```

Remember, the Serverless Application Model is a streamline version from CloudFormation. All the sam deployment will trigger the cloudformation to create stack from the specified serverless-output.yaml. So the whole cloudformation stack creation process will be invoked( Check for change, if exist then create change-set, and then confirm to create/update the change to complete).

Final check for the cloudformation to see these changes.

* Cloudformation Stack created

![image](/documents/images/makeup-domain-stack-created.png)

* Created resources

![image](/documents/images/makeup-domain-resources.png)

If you are interested in knowing the whole process, and want to know what stuff CFN did, just look at the event records.

* Creation detail

![image](/documents/images/makeup-domain-creation-process.png)