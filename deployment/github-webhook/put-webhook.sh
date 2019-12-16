#!/usr/bin/env bash
aws codepipeline put-webhook --cli-input-json file://webhook.json --region "us-west-2"
aws codepipeline register-webhook-with-third-party --webhook-name EventStormingWorkshop-webhook
