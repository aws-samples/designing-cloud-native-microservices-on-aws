#!/bin/bash

#UserId="$(aws sts get-caller-identity | jq .UserId)"
#echo "$UserId"

# create event bus
EVENT_BUS_NAME=coffeeshop-event-bus
EventBusArn=$(aws events create-event-bus --name $EVENT_BUS_NAME | jq .EventBusArn)
echo "$EventBusArn"

# create order-created-event rule
OrderCreatedRule=$(aws events put-rule --name "order-created" --event-pattern "{\"detail-type\": [ \"customevent\" ],\"source\": [\"solid.humank.coffeeshop.order\"]}" --event-bus-name "$EVENT_BUS_NAME" | jq .RuleArn)
echo "$OrderCreatedRule"

# create