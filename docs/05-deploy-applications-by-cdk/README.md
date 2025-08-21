[< back to 04 Modeling and Development >](../04-modeling-and-development/README.md)

# Deploy CoffeeShop Application on Amazon EKS with Kubernetes

**Congratulations on your persistent learning journey! It's time to deploy the applications to a real AWS environment using modern cloud-native technologies.**

![CoffeeShop EKS Deployment Architecture](../img/coffeeshop-eks-deployment.png)

*The above diagram illustrates the complete EKS deployment architecture, showing the development workflow from source code to production deployment, including the hybrid EKS + Lambda approach for optimal performance and cost efficiency.*

This section covers deploying the CoffeeShop microservices to Amazon EKS (Elastic Kubernetes Service) using containerized deployment with ARM64 Graviton3 instances for optimal performance and cost efficiency.

## 📋 Architecture Flow Overview

### **Development to Deployment Pipeline**
1. **Developer** writes Java 21 + Spring Boot 3.4.1 code
2. **Build Process** compiles and creates ARM64 Docker images
3. **Amazon ECR** stores multi-architecture container images
4. **EKS Deployment** pulls images and runs microservices

### **Runtime Architecture**
- **Public Subnet**: ALB for external traffic, NAT Gateway for outbound connectivity
- **Private Subnet**: EKS cluster with Graviton3 nodes running microservices
- **Hybrid Computing**: EKS for core services + Lambda for event processing
- **Data Layer**: DynamoDB tables with EventBridge for event-driven communication

## 🚀 Current Deployment Architecture

### **Modern Cloud-Native Stack**
- **Container Orchestration**: Amazon EKS (Kubernetes 1.28)
- **Compute**: ARM64 Graviton3 instances (c7g.medium/large)
- **Application Runtime**: Java 21 + Spring Boot 3.4.1
- **Database**: Amazon DynamoDB (NoSQL)
- **Event Messaging**: Amazon EventBridge
- **Container Registry**: Amazon ECR
- **Load Balancing**: Application Load Balancer (ALB)

### **Why EKS over ECS?**
- **Kubernetes-Native**: Industry standard container orchestration
- **Multi-Cloud Portability**: Kubernetes runs anywhere
- **Rich Ecosystem**: Extensive tooling and community support
- **Advanced Scaling**: Horizontal Pod Autoscaler (HPA) and Cluster Autoscaler
- **Service Mesh Ready**: Native support for Istio, Linkerd
- **GitOps Integration**: ArgoCD, Flux for continuous deployment

## 📋 Prerequisites

To deploy applications to AWS EKS, you need the following essential tools installed:

### **Local Development Tools**
* [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - AWS command line interface
* [kubectl](https://kubernetes.io/docs/tasks/tools/) - Kubernetes command line tool
* [eksctl](https://eksctl.io/installation/) - EKS cluster management tool
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) - Container runtime
* [Java 21 JDK](https://docs.aws.amazon.com/corretto/latest/corretto-21-ug/downloads-list.html) - Amazon Corretto recommended
* [Gradle 8.13+](https://gradle.org/install/) - Build automation tool

### **AWS Account Requirements**
* AWS Account with administrative permissions
* AWS CLI configured with appropriate credentials
* Sufficient service limits for EKS, EC2, and DynamoDB



## 🛠️ Deployment Options

### **Option 1: Complete Infrastructure Deployment with CDK v2 (Recommended)**

This approach uses the modern `coffeeshop-cdk-v2` stack to deploy the complete infrastructure including EKS, Lambda, DynamoDB, and EventBridge.

#### **Step 1: Deploy Infrastructure Stacks**

```bash
# Navigate to CDK v2 deployment
cd deployment/coffeeshop-cdk-v2

# Install dependencies
npm install

# Set your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap CDK (if not done before)
cdk bootstrap aws://${AWS_ACCOUNT_ID}/us-west-2

# Deploy network layer
cdk deploy CoffeeShop-dev-Network

# Deploy database layer
cdk deploy CoffeeShop-dev-Database

# Deploy Lambda functions
cdk deploy CoffeeShop-dev-Lambda

# Deploy EKS cluster
cdk deploy CoffeeShop-dev-EKS

# Deploy CI/CD pipeline
cdk deploy CoffeeShop-dev-Pipeline

# Deploy monitoring components
cdk deploy CoffeeShop-dev-Monitoring
```

#### **Step 2: Configure kubectl and Deploy Applications**

```bash
# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name coffeeshop-eks

# Verify cluster access
kubectl get nodes

# Check if ECR repositories were created
aws ecr describe-repositories --region us-west-2 | grep coffeeshop

# The CDK stack creates:
# - coffeeshop/orders-web
# - coffeeshop/coffee-web  
# - coffeeshop/inventory-web
```

#### **Step 3: Build and Deploy Applications**

The CDK v2 stack includes an automated CI/CD pipeline. You can either:

##### **Option A: Use the Automated Pipeline**
```bash
# The pipeline automatically builds and deploys when you push to the repository
# Check pipeline status
aws codepipeline get-pipeline-state --name CoffeeShop-dev-Pipeline
```

##### **Option B: Manual Build and Deploy**
```bash
# Navigate to source code
cd ../../sources/coffeeshop

# Build applications
mvn clean package -DskipTests

# Get ECR login
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com

# Build and push orders-web
cd orders-web
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/orders-web:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/orders-web:latest
cd ..

# Build and push coffee-web  
cd coffee-web
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/coffee-web:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/coffee-web:latest
cd ..

# Build and push inventory-web
cd inventory-web
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/inventory-web:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/inventory-web:latest
cd ..
```

### **Option 2: Manual EKS Setup (Advanced Users)**

If you prefer to set up EKS manually without CDK:

#### **Step 1: Create EKS Cluster**
```bash
# Create EKS cluster with eksctl
eksctl create cluster \
  --name coffeeshop-eks \
  --region us-west-2 \
  --nodegroup-name coffeeshop-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name coffeeshop-eks
```

#### **Step 2: Install Required Add-ons**
```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

# Install Cluster Autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Install Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```



> Create build project

![](../img/setup-webhook.png)



> Specify source, select github, and then **Click Connect to Github**

![](../img/specify-source.png)



> Authorize AWS CodeBuild, click **Authorize aws-codesuite** and confirm **Password**

![](../img/authorize.png)



> Get connected with Github

![](../img/get-connected.png)



**Now, your github account is get connected with aws-codesuite, you don't need to save this code project, just cancel it. These steps just for webhook authorization.**

-----

### Deploy infrastructure and Application with Code* family CI/CD pipeline by CDK

**By running this CDK application, You will get a standard VPC with 3 Availablity Zones environment, and one NATGateway serving private subnets.**

**Besides, in order to have an ease of use container orcheration service, an ECS Cluster with Fargate mode is also created.**

### Deploy Application by Code* family

```shell script
cd deployment/coffeeshop-cdk

npm install

npm run build 

cdk synth

cdk bootstrap aws://${your-aws-id}/${your-region-todeploy}

cdk deploy CoffeeShopCodePipeline 
```

**This workshop sample code is developed in Java8 with Quarkus Framework, Libs dependency managed by Maven. By running this CDK CoffeeShopCodePipeline stack, You will have:**

* ECR - Will create a Docker Image repository to serve Orders-Web application.
* CodeCommit Repository - for auto deployment
* CodeBuild - Get Github WebHooked project, build source code, build docker image, Push image to ECR,  deploy **Orders-web** Fargate Service, deploy **coffee-sls Lambda Function**, create **Dynamodb Table -{ Order, Coffee}**, create Event Rule in default **Amazon EventBridge** ..etc.



**Deploy Result**

```shell
Outputs:
CoffeeShopCodePipeline.CodeBuildProjectName = CodeBuildProject
CoffeeShopCodePipeline.AlbSvcServiceURL46A1D997 = http://Coffe-AlbSv-5MLHALGIGWUB-82783022.us-west-2.elb.amazonaws.com
CoffeeShopCodePipeline.AlbSvcLoadBalancerDNS20AA0F0B = Coffe-AlbSv-5MLHALGIGWUB-82783022.us-west-2.elb.amazonaws.com
CoffeeShopCodePipeline.Hint =
Create a "imagedefinitions.json" file and git add/push into CodeCommit repository "designing-cloud-native-microservices-on-aws
" with the following value:

[
  {
    "name": "defaultContainer",
    "imageUri": "123456789012.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/orders-web:latest"
  }
]

CoffeeShopCodePipeline.Bucket = coffeeshop-nypea
CoffeeShopCodePipeline.CodeCommitRepoName = designing-cloud-native-microservices-on-aws
CoffeeShopCodePipeline.ServiceURL = http://Coffe-AlbSv-5MLHALGIGWUB-82783022.us-west-2.elb.amazonaws.com
CoffeeShopCodePipeline.StackName = CoffeeShopCodePipeline
CoffeeShopCodePipeline.StackId = arn:aws:cloudformation:us-west-2:584518143473:stack/CoffeeShopCodePipeline/f10c0520-0618-11ea-8122-023709c486f0

Stack ARN:
arn:aws:cloudformation:us-west-2:584518143473:stack/CoffeeShopCodePipeline/f10c0520-0618-11ea-8122-023709c486f0
```

Do remember to create a ["imagedefinitions.json"](https://docs.aws.amazon.com/codepipeline/latest/userguide/file-reference.html#pipelines-create-image-definitions) file and git add/push into CodeCommit repository "designing-cloud-native-microservices-on-aws
" (that has been created as part of the deployment above) with the following value:

```
[
  {
    "name": "defaultContainer",
    "imageUri": "your ecr repository arn for this coffeeshop/coffeeshop/orders-web:latest"
  }
]
```


### Way to Deploy applications 

You could deploy these applications via two approach: 

1. At first time, self manually deploy application in CodeBuild service, just to select the CodeBuild project and click the **start build** button, then the deployment process will be started.
2. Anytime, if you make any chang on the designing-cloud-native-microservices-on-aws repository on github, while you commit and push  to  master branch, then the CodeBuild service will automatically build it and trigger the codepipeline to deploy all these applications.

### Setup Lambda function trigger with EventBridge

```shell
targetArn=$(aws lambda get-function --function-name coffee-sls-OrderCreatedHandler | jq '.Configuration.FunctionArn')

aws events  put-targets --rule OrderCreatedRule --targets "Id"="OrderCreated","Arn"=$targetArn

ruleArn=$(aws events list-rules --name-prefix OrderCreatedRule | jq -r '.Rules[0].Arn')

aws lambda add-permission \
	--function-name coffee-sls-OrderCreatedHandler \
  --action lambda:InvokeFunction \
	--statement-id stat-coffee-sls \
  --principal events.amazonaws.com \
	--source-arn $ruleArn
```

### Run Test

**As all of the setting done, now you could hit the url which you created to make an coffee order:**

The **Orders-web** service endpoint is the Stack output - **CoffeeShopCodePipeline.AlbSvcServiceURLxxxx**

```shell
curl --header "Content-Type: application/json" \                                                                                            
        --request POST \
        --data '{"items":[{"productId":"5678","qty":2,"price":200}]}' \
        <<**CoffeeShopCodePipeline.AlbSvcServiceURLxxxx**>>/order

Result : 
{"items":[{"productId":"5678","qty":2,"price":200,"fee":400}],"status":0,"id":"ord-20191126-5906","createdDate":1574801783.400000000,"modifiedDate":null}
```

**Check the order table in DynamoDB**

![](../img/order-table-items.png)

**Check the lambda function(Order created event Handler) logs**

Visit Cloudwatch Service web page, search log groups : ***/aws/lambda/coffee-sls-OrderCreatedHandler***

```shell script
START RequestId: acfc1cf1-ba73-402e-921d-2fa2d95af5dc Version: $LATEST
## 🎯 Next Steps

### **Production Considerations**
- **Security**: Implement Pod Security Standards and Network Policies
- **Scaling**: Configure Horizontal Pod Autoscaler (HPA) and Vertical Pod Autoscaler (VPA)
- **GitOps**: Set up ArgoCD or Flux for continuous deployment
- **Service Mesh**: Consider Istio or AWS App Mesh for advanced traffic management
- **Backup**: Implement Velero for cluster backup and disaster recovery

### **Advanced Features**
- **Blue/Green Deployments**: Use Argo Rollouts for advanced deployment strategies
- **Canary Releases**: Implement gradual rollouts with traffic splitting
- **Multi-Region**: Deploy across multiple AWS regions for high availability
- **Cost Optimization**: Use Spot instances and cluster autoscaling

---

**Congratulations! 🎉** You have successfully deployed the CoffeeShop microservices on Amazon EKS with a modern cloud-native architecture. The application is now running with:

- ☸️ **Kubernetes orchestration** for container management
- 🚀 **Auto-scaling** for handling variable loads
- 📊 **Comprehensive monitoring** with CloudWatch
- 🔄 **Event-driven architecture** with EventBridge
- 💾 **Serverless database** with DynamoDB
- 🛡️ **Security best practices** with IAM roles and VPC isolation

Your cloud-native journey continues! 🌟

