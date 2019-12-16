## Design each Microservices in Port-adapter concept

![image](/documents/images/implementation.png)

>The famous Port-Adapter pattern is best suite for developing microservices. Focus on core domain problem, and switch any infrastructure or communication tools as you need.

![image](/documents/images/orderdomain.png)

>For this workshop demo, design a order domain object, and leverage AWS services to do persistent, http request accept and handler, and event propagation.

## Using Lambda function as the entry point

You can easily export a lambda function to accept the incomg command, and do some stuff.

## Using CloudWatch Event as the integration Event

If cross boundary event did occured in current domain, never call other domain service directly, just publish a cross-domain-event. On AWS, the most appropriate one is using CloudWatch Event, it's a near-real-time event, high performance and scalable.

## Using DynamoDB as the Write Model/ Read Model persistent Repository

Once capture Model with Domain Experts, you can design Write Model first, and create Query usage Read Model.