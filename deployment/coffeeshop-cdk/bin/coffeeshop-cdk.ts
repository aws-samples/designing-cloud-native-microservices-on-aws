#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import {CoffeeShopCodePipeline} from "../lib/coffee-shop-code-pipeline";


const app = new cdk.App();

const env = {
    region: app.node.tryGetContext('region') || process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION,
    account: app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    bucketName: 'coffeeshop-' + Math.random().toString(36).substring(7)
};

new CoffeeShopCodePipeline(app,'CoffeeShopCodePipeline',{env});

