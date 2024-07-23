#!/usr/bin/env node
import 'dotenv/config'
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { CdkLambdaTsStack } from '../lib/cdk-lambda-ts-stack'

const app = new cdk.App()
new CdkLambdaTsStack(app, 'CdkLambdaTsStack', {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
})
