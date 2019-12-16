# Run Demo

This Coffeeshop demo is a command line execution demo, all the process will invoke physical AWS resources usage.

## Make sure the Coffee Order API Gateway exposed Endpoint

If you haven't deploy the Order Domain Services, Makeup Domain Service and The Domain Events on CloudWatch Events onto AWS, just go back to

[Deploy Order Domain](/documents/02-deploy-order-domain/README.MD)

[Define CloudWatch Event for Coffee Order Created Event](/documents/01-define-cloudwatchevent/README.MD)

[Deploy MakeUp Domain](/documents/03-deploy-makeup-domain/README.MD)

## Send the coffee order

Now, we can findout the deployed endpoint via CloudFormation page.

Check for the Stack - OrderDomain, open the tab "Outputs", you could get the testOrderUrl value.

```bash
https://1yvd5pyuoe.execute-api.ap-northeast-1.amazonaws.com/Prod/order
```

![image](/documents/images/order-cfn-output-apig-url.png)

```bash
curl --header "Content-Type: application/json" \
--request POST \
--data '{"seatNo": "2a","drinkHere": "true","itemName": "Americano","quantity": "2","price": "80"}' \
https://1yvd5pyuoe.execute-api.ap-northeast-1.amazonaws.com/Prod/order -w "\n"
```

Once the order has been accepted, you will get the ticket for order response - orderString. I use the order created timestamp as the order identifier.

Output:

```json
{"orderString":"2018-10-10:06:41:38"}
```

## Check the order persisted status

All the orders will be persisted in DynamoDB, open the Dynamodb DB then check table - Order to see the newly inserted record.

![image](/documents/images/order-dynamodb.png)

## Check the Makeup domain Barista log

For the Barista, we can check cloudwatch log to see if he/she get the order.

![image](/documents/images/barista-log.png)

Exactly, the coffee order has been received as you ordered.

```json
{
    "quantity": 2,
    "seatNo": "2c",
    "drinkHere": true,
    "price": 80,
    "itemName": "Americano",
    "establishTime": "2018-10-10:14:07:46",
    "drinktemperature": 70
}
```

## Challenge to You

As you can see, the Makeup domain, Barista(s) had received the order, could you help them to makeup the coffee? You maybe like to drink coffee and maybe you could have your own way to do that.

So, I leave the challenge to you, add more business logic on Barista Object. Besides, follow the coffee-order domain development style, make sure the business logic is well defined and implemented.

* Specification By Example
* Unit test as usual
* Get used to learn and use Cucumber-Java

Anything else if you feel it's not enough, please don't be hesitate! PR to the repo, or pin me on FaceBook, Twitter or LinkedIn.

* FaceBook - https://www.facebook.com/kim.kao.33
* Twitter - https://twitter.com/YiKaiKao
* LinkedIn - https://www.linkedin.com/in/kim-kao-b93b2b68/
