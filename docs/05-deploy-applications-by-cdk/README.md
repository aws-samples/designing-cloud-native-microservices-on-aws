# Deploy CoffeeShop Application on Amazon EKS with CDK v2

[< back to 04 Modeling and Development >](../04-modeling-and-development/README.md)

**Congratulations on your persistent learning journey! It's time to deploy the applications to a real AWS environment using modern cloud-native technologies.**

This section covers deploying the CoffeeShop microservices to Amazon EKS (Elastic Kubernetes Service) using the CDK v2 infrastructure-as-code approach with Quarkus-based microservices.

## 📋 Architecture Overview

### **Modern Cloud-Native Stack**

- **Container Orchestration**: Amazon EKS (Kubernetes 1.28)
- **Compute**: EC2 instances (t3.medium) with managed node groups
- **Application Runtime**: Java 17 + Quarkus Framework
- **Database**: Amazon DynamoDB (NoSQL)
- **Event Messaging**: Amazon EventBridge
- **Container Registry**: Amazon ECR
- **Load Balancing**: Application Load Balancer (ALB)
- **CI/CD**: AWS CodePipeline + CodeBuild

### **Microservices Architecture**

The CoffeeShop application consists of three main microservices:

1. **Orders Web Service** (`orders-web`): Handles order management and processing
2. **Coffee Web Service** (`coffee-web`): Manages coffee inventory and recipes
3. **Inventory Web Service** (`inventory-web`): Tracks ingredient inventory

Each service is built with:
- **Quarkus Framework**: Cloud-native Java framework optimized for containers
- **RESTful APIs**: JAX-RS for HTTP endpoints
- **DynamoDB Integration**: AWS SDK for data persistence
- **Health Checks**: Built-in health endpoints for Kubernetes probes

## 🛠️ Prerequisites

Before deploying the applications, ensure you have the following tools installed:

### **Required Tools**

```bash
# AWS CLI v2
aws --version
# aws-cli/2.x.x Python/3.x.x

# Node.js and npm (for CDK)
node --version  # v18.x or later
npm --version   # v8.x or later

# AWS CDK v2
npm install -g aws-cdk
cdk --version   # 2.x.x

# Docker (for building container images)
docker --version  # 20.x or later

# kubectl (for Kubernetes management)
kubectl version --client  # v1.28.x

# Maven (for building Java applications)
mvn --version  # 3.8.x or later

# Java 17 (required for Quarkus)
java -version  # openjdk 17.x.x
```

### **AWS Account Setup**

```bash
# Configure AWS credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-west-2
# Default output format: json

# Verify AWS account access
aws sts get-caller-identity

# Set environment variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-west-2
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
```

## 🚀 Deployment Instructions

### **Step 1: Clone and Prepare the Repository**

```bash
# Clone the repository
git clone https://github.com/aws-samples/designing-cloud-native-microservices-on-aws.git
cd designing-cloud-native-microservices-on-aws

# Navigate to source code
cd sources/coffeeshop

# Verify Java version (must be Java 17)
java -version

# Build all applications
mvn clean package -DskipTests
```

### **Step 2: Deploy Infrastructure with CDK v2**

The CDK v2 deployment creates a complete infrastructure stack including:
- VPC with public/private subnets
- EKS cluster with managed node groups
- DynamoDB tables for data storage
- ECR repositories for container images
- Lambda functions for event processing
- CI/CD pipeline for automated deployments

```bash
# Navigate to CDK deployment directory
cd ../../deployment/coffeeshop-cdk-v2

# Install CDK dependencies
npm install

# Bootstrap CDK (if not done before)
cdk bootstrap aws://${AWS_ACCOUNT_ID}/us-west-2

# Deploy infrastructure stacks in order
echo "Deploying Network Stack..."
cdk deploy CoffeeShop-dev-Network --require-approval never

echo "Deploying Database Stack..."
cdk deploy CoffeeShop-dev-Database --require-approval never

echo "Deploying Lambda Stack..."
cdk deploy CoffeeShop-dev-Lambda --require-approval never

echo "Deploying EKS Stack..."
cdk deploy CoffeeShop-dev-EKS --require-approval never

echo "Deploying Pipeline Stack..."
cdk deploy CoffeeShop-dev-Pipeline --require-approval never

echo "Deploying Monitoring Stack..."
cdk deploy CoffeeShop-dev-Monitoring --require-approval never
```

### **Step 3: Configure kubectl for EKS**

```bash
# Update kubeconfig for the EKS cluster
aws eks update-kubeconfig --region us-west-2 --name coffeeshop-eks

# Verify cluster access
kubectl get nodes
kubectl get namespaces

# Check cluster info
kubectl cluster-info
```

### **Step 4: Build and Push Container Images**

The CDK stack creates ECR repositories for each microservice. Now we need to build and push the container images.

#### **Build Orders Web Service**

```bash
# Navigate to orders-web directory
cd ../../sources/coffeeshop/orders-web

# Build the application
mvn clean package -DskipTests

# Get ECR login credentials
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com

# Build Docker image using Quarkus JVM Dockerfile
docker build -f src/main/docker/Dockerfile.jvm \
  -t ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/orders-web:latest .

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/orders-web:latest

cd ..
```

#### **Build Coffee Web Service**

```bash
# Navigate to coffee-web directory
cd coffee-web

# Build the application
mvn clean package -DskipTests

# Build Docker image (create Dockerfile if not exists)
cat > Dockerfile << 'EOF'
FROM fabric8/java-alpine-openjdk17-jre
ENV JAVA_OPTIONS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV AB_ENABLED=jmx_exporter
COPY target/lib/* /deployments/lib/
COPY target/*-runner.jar /deployments/app.jar
EXPOSE 8080

RUN adduser -G root --no-create-home --disabled-password 1001 \
  && chown -R 1001 /deployments \
  && chmod -R "g+rwX" /deployments \
  && chown -R 1001:root /deployments
USER 1001

ENTRYPOINT [ "/deployments/run-java.sh" ]
EOF

# Build and push Docker image
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/coffee-web:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/coffee-web:latest

cd ..
```

#### **Build Inventory Web Service**

```bash
# Navigate to inventory-web directory
cd inventory-web

# Build the application
mvn clean package -DskipTests

# Build Docker image (create Dockerfile if not exists)
cat > Dockerfile << 'EOF'
FROM fabric8/java-alpine-openjdk17-jre
ENV JAVA_OPTIONS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV AB_ENABLED=jmx_exporter
COPY target/lib/* /deployments/lib/
COPY target/*-runner.jar /deployments/app.jar
EXPOSE 8080

RUN adduser -G root --no-create-home --disabled-password 1001 \
  && chown -R 1001 /deployments \
  && chmod -R "g+rwX" /deployments \
  && chown -R 1001:root /deployments
USER 1001

ENTRYPOINT [ "/deployments/run-java.sh" ]
EOF

# Build and push Docker image
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/inventory-web:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/inventory-web:latest

cd ..
```

### **Step 5: Deploy Applications to Kubernetes**

Create Kubernetes manifests for the microservices:

#### **Create Namespace**

```bash
# Create coffeeshop namespace
kubectl create namespace coffeeshop
kubectl config set-context --current --namespace=coffeeshop
```

#### **Deploy Orders Web Service**

```yaml
# Create orders-web-deployment.yaml
cat > orders-web-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-web
  namespace: coffeeshop
  labels:
    app: orders-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: orders-web
  template:
    metadata:
      labels:
        app: orders-web
    spec:
      containers:
      - name: orders-web
        image: ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/orders-web:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: QUARKUS_HTTP_HOST
          value: "0.0.0.0"
        - name: QUARKUS_HTTP_PORT
          value: "8080"
        - name: AWS_REGION
          value: "us-west-2"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: orders-web-service
  namespace: coffeeshop
spec:
  selector:
    app: orders-web
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP
EOF

# Replace AWS_ACCOUNT_ID in the manifest
sed -i "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" orders-web-deployment.yaml

# Deploy orders service
kubectl apply -f orders-web-deployment.yaml
```

#### **Deploy Coffee Web Service**

```yaml
# Create coffee-web-deployment.yaml
cat > coffee-web-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coffee-web
  namespace: coffeeshop
  labels:
    app: coffee-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: coffee-web
  template:
    metadata:
      labels:
        app: coffee-web
    spec:
      containers:
      - name: coffee-web
        image: ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/coffee-web:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: QUARKUS_HTTP_HOST
          value: "0.0.0.0"
        - name: QUARKUS_HTTP_PORT
          value: "8080"
        - name: AWS_REGION
          value: "us-west-2"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: coffee-web-service
  namespace: coffeeshop
spec:
  selector:
    app: coffee-web
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP
EOF

# Replace AWS_ACCOUNT_ID in the manifest
sed -i "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" coffee-web-deployment.yaml

# Deploy coffee service
kubectl apply -f coffee-web-deployment.yaml
```

#### **Deploy Inventory Web Service**

```yaml
# Create inventory-web-deployment.yaml
cat > inventory-web-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-web
  namespace: coffeeshop
  labels:
    app: inventory-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: inventory-web
  template:
    metadata:
      labels:
        app: inventory-web
    spec:
      containers:
      - name: inventory-web
        image: ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/coffeeshop/inventory-web:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: QUARKUS_HTTP_HOST
          value: "0.0.0.0"
        - name: QUARKUS_HTTP_PORT
          value: "8080"
        - name: AWS_REGION
          value: "us-west-2"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: inventory-web-service
  namespace: coffeeshop
spec:
  selector:
    app: inventory-web
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP
EOF

# Replace AWS_ACCOUNT_ID in the manifest
sed -i "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" inventory-web-deployment.yaml

# Deploy inventory service
kubectl apply -f inventory-web-deployment.yaml
```

#### **Create Application Load Balancer Ingress**

```yaml
# Create ingress.yaml
cat > ingress.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: coffeeshop-ingress
  namespace: coffeeshop
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/healthcheck-path: /
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}]'
spec:
  rules:
  - http:
      paths:
      - path: /orders
        pathType: Prefix
        backend:
          service:
            name: orders-web-service
            port:
              number: 80
      - path: /coffee
        pathType: Prefix
        backend:
          service:
            name: coffee-web-service
            port:
              number: 80
      - path: /inventory
        pathType: Prefix
        backend:
          service:
            name: inventory-web-service
            port:
              number: 80
EOF

# Deploy ingress
kubectl apply -f ingress.yaml
```

#### **Wait for Deployments to Complete**

```bash
# Wait for all deployments to be ready
kubectl rollout status deployment/orders-web -n coffeeshop
kubectl rollout status deployment/coffee-web -n coffeeshop
kubectl rollout status deployment/inventory-web -n coffeeshop

# Check pod status
kubectl get pods -n coffeeshop

# Check services
kubectl get services -n coffeeshop

# Check ingress (may take a few minutes to provision ALB)
kubectl get ingress -n coffeeshop
```

## 🔍 Step 6: Verify Deployment

### **Check Application Status**

```bash
# Check all resources in coffeeshop namespace
kubectl get all -n coffeeshop

# Check pod logs
kubectl logs -f deployment/orders-web -n coffeeshop
kubectl logs -f deployment/coffee-web -n coffeeshop
kubectl logs -f deployment/inventory-web -n coffeeshop

# Get ALB URL (wait for ADDRESS to be populated)
kubectl get ingress coffeeshop-ingress -n coffeeshop -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### **Test API Endpoints**

```bash
# Get the ALB URL
ALB_URL=$(kubectl get ingress coffeeshop-ingress -n coffeeshop -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB URL: http://${ALB_URL}"

# Test orders service health check
curl -v http://${ALB_URL}/orders/

# Test coffee service health check
curl -v http://${ALB_URL}/coffee/

# Test inventory service health check
curl -v http://${ALB_URL}/inventory/

# Expected response: {"status":"healthy"}
```

### **Monitor Application Logs**

```bash
# View real-time logs for all services
kubectl logs -f deployment/orders-web -n coffeeshop &
kubectl logs -f deployment/coffee-web -n coffeeshop &
kubectl logs -f deployment/inventory-web -n coffeeshop &

# Stop log monitoring
# Press Ctrl+C to stop
```

## 📊 Monitoring and Observability

### **CloudWatch Integration**

The CDK stack automatically configures:
- **Container Insights**: EKS cluster and pod metrics
- **Application Logs**: Centralized logging to CloudWatch
- **Custom Metrics**: Application metrics from Quarkus
- **Alarms**: Automated alerting for critical issues

### **Access CloudWatch Dashboard**

```bash
# Get CloudWatch dashboard URL
echo "https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:"

# View EKS cluster metrics
echo "https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#container-insights:performance/EKS:Cluster?~(query~(~'coffeeshop-eks)~context~())"
```

### **Kubernetes Native Monitoring**

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n coffeeshop

# Check events
kubectl get events -n coffeeshop --sort-by='.lastTimestamp'

# Describe problematic pods
kubectl describe pod <pod-name> -n coffeeshop
```

## 🧹 Cleanup Resources

### **Delete Kubernetes Resources**

```bash
# Delete applications
kubectl delete namespace coffeeshop

# Verify deletion
kubectl get namespaces
```

### **Delete CDK Stacks**

```bash
# Navigate to CDK directory
cd deployment/coffeeshop-cdk-v2

# Destroy all stacks (in reverse order)
cdk destroy CoffeeShop-dev-Monitoring --force
cdk destroy CoffeeShop-dev-Pipeline --force
cdk destroy CoffeeShop-dev-EKS --force
cdk destroy CoffeeShop-dev-Lambda --force
cdk destroy CoffeeShop-dev-Database --force
cdk destroy CoffeeShop-dev-Network --force
```

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