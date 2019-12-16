# Domain Event definition

## Basic for CloudWatch Event

In this example, we leverage the AWS CloudWatch Event to publish the domain immutable fact, treat it as an domain event.

The CloudWatch Events support pretty much different event types, at first the events support AWS Service events:
[Supported AWS Service Event Tyes](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html).

## Problem Domain Immutable Fact Event

But if you want to define your own problem domain event, you could define the
> CloudWatch Rule with Event Pattern

The most easy way to define the domain event in AWS CloudWatch Event is to just add CloudWatch Rule to reflect the domain immutable fact. Of course, you still can just run the following command to achieve the goal.

```bash
aws events put-rule --name "OrderCreatedEvent" --event-pattern "{\"detail-type\": [ \"customevent\" ],\"source\": [\"solid.humank.eventstormingddd\"]}"
```

output would be:

```json
{
    "RuleArn": "arn:aws:events:ap-northeast-1:<<AWS Account ID>>:rule/OrderCreatedEvent"
}
```

Once the Domain event defined, then you could register the " Targets " on the event. The target means once the domain event occured, the registered Targets functions will be invoked to relfect the event or handle the event.

Yes, you could still associate/register the Targets on Event or just run the following command:

```bash
aws events put-targets --rule OrderCreatedEvent --targets "Id"="MakeUpDomain", "Arn"="<<Your AWS Lambda Function which is responsbile for the Barista makeup coffee for the incoming coffee order>>"
```

example:

```bash
aws events put-targets --rule "OrderCreatedEvent" --targets "Id"="MakeUpDomain","Arn"="arn:aws:lambda:ap-northeast-1:123456789012:function:BaristaHello"

```

Output would be:

```json
{
    "FailedEntries": [],
    "FailedEntryCount": 0
}
```

The well setup CloudWatch Event looks like this:
![image](/documents/images/OrderCreatedEvent-setup.png)

## Configure the Coffee Order Domain Events Properties File

The OrderCreatedEvent has been registered on AWS CloudWatch Event. 

And now, we need to configure the Order Domain to make it has the ability to publish the coffee order.

Open the Properties file, path is : 

```bash

<<Your work env>>/git/EventStormingWorkShop/sources/java-implements/callcarbar-coffee-order/src/main/resources/cloudwatchevents.properties
```

Modify the parameter: RESOURCE_ARN, change the arn to your OrderCreatedEvent Arn.

```bash
RESOURCE_ARN=arn:aws:events:ap-northeast-1:123456789012:rule/OrderCreatedEvent

RESOURCE_ARN=arn:aws:events:ap-northeast-1:<<Your AWS Account ID>>:rule/OrderCreatedEvent
```
