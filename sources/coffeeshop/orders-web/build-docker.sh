#!/usr/bin/env bash
cd orders-web && mvn clean package && cd ..

USER_ID=$(aws sts get-caller-identity | jq -r '.Account')
REGION=$(aws configure get region)

# Build regular Java Jar file and Native binary
# mvn clean package -DskipTests=true -Dnative=true -Dnative-image.docker-build=true

# Docker Build
docker build -f src/main/docker/Dockerfile.jvm -t solid-humank-coffeeshop/orders-web .

# Tag image for ecr
docker tag solid-humank-coffeeshop/orders-web:latest "$USER_ID".dkr.ecr."$REGION".amazonaws.com/solid-humank-coffeeshop/orders-web:latest

# Get ECR credential
$(aws ecr get-login --no-include-email)

# Push to ECR
docker push "$USER_ID".dkr.ecr."$REGION".amazonaws.com/solid-humank-coffeeshop/orders-web:latest