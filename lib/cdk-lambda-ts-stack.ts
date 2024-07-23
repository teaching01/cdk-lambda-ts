import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as path from 'path'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { SnsDestination } from 'aws-cdk-lib/aws-s3-notifications'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sns from 'aws-cdk-lib/aws-sns'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'

const REPOSITORY_TOP = path.join(__dirname, '../')
const PREFIX = 'cdk-lambda-ts'

export class CdkLambdaTsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, `${PREFIX}-bucket`, {
      bucketName: PREFIX,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    // sqs
    const dlqResize = new sqs.Queue(this, `${PREFIX}-dlq-resize`, {
      queueName: `${PREFIX}-dlq-resize`,
    })
    const queueResize = new sqs.Queue(this, `${PREFIX}-queue-resize`, {
      queueName: `${PREFIX}-queue-resize`,
      deadLetterQueue: {
        queue: dlqResize,
        maxReceiveCount: 1,
      },
    })

    const dlqGrayscale = new sqs.Queue(this, `${PREFIX}-dlq-grayscale`, {
      queueName: `${PREFIX}-dlq-grayscale`,
    })
    const queueGrayscale = new sqs.Queue(this, `${PREFIX}-queue-grayscale`, {
      queueName: `${PREFIX}-queue-grayscale`,
      deadLetterQueue: {
        queue: dlqGrayscale,
        maxReceiveCount: 1,
      },
    })

    // sqs2
    const dlqBlur = new sqs.Queue(this, `${PREFIX}-dlq-blur`, {
      queueName: `${PREFIX}-dlq-blur`,
    })
    const queueBlur = new sqs.Queue(this, `${PREFIX}-queue-blur`, {
      queueName: `${PREFIX}-queue-blur`,
      deadLetterQueue: {
        queue: dlqBlur,
        maxReceiveCount: 1,
      },
    })

    const dlqRotate = new sqs.Queue(this, `${PREFIX}-dlq-rotate`, {
      queueName: `${PREFIX}-dlq-rotate`,
    })
    const queueRotate = new sqs.Queue(this, `${PREFIX}-queue-rotate`, {
      queueName: `${PREFIX}-queue-rotate`,
      deadLetterQueue: {
        queue: dlqRotate,
        maxReceiveCount: 1,
      },
    })

    // sns
    const topic = new sns.Topic(this, `${PREFIX}-topic`, {
      topicName: `${PREFIX}`,
      displayName: `${PREFIX}`,
    })
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new SnsDestination(topic),
      { prefix: 'original/' }
    )
    topic.addSubscription(
      new SqsSubscription(queueResize, { rawMessageDelivery: true })
    )
    topic.addSubscription(
      new SqsSubscription(queueBlur, { rawMessageDelivery: true })
    )

    // lambda: resize
    const resizeLambda = new NodejsFunction(this, `${PREFIX}-lambda-resize`, {
      functionName: `${PREFIX}-resize`,
      entry: path.join(REPOSITORY_TOP, 'lambdas/resize/src/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      environment: {
        QUEUE_URL: queueGrayscale.queueUrl,
      },
    })
    bucket.grantPut(resizeLambda)
    bucket.grantReadWrite(resizeLambda)
    resizeLambda.addEventSource(new SqsEventSource(queueResize))
    queueGrayscale.grantSendMessages(resizeLambda)

    // lambda: grayscale
    const grayscaleLambda = new NodejsFunction(
      this,
      `${PREFIX}-lambda-grayscale`,
      {
        functionName: `${PREFIX}-grayscale`,
        entry: path.join(REPOSITORY_TOP, 'lambdas/grayscale/src/index.ts'),
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        timeout: cdk.Duration.seconds(30),
      }
    )
    bucket.grantPut(grayscaleLambda)
    bucket.grantReadWrite(grayscaleLambda)
    grayscaleLambda.addEventSource(new SqsEventSource(queueGrayscale))

    // lambda: blur
    const blurLambda = new NodejsFunction(this, `${PREFIX}-lambda-blur`, {
      functionName: `${PREFIX}-blur`,
      entry: path.join(REPOSITORY_TOP, 'lambdas/blur/src/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      environment: {
        QUEUE_URL: queueRotate.queueUrl,
      },
    })
    bucket.grantPut(blurLambda)
    bucket.grantReadWrite(blurLambda)
    blurLambda.addEventSource(new SqsEventSource(queueBlur))
    queueRotate.grantSendMessages(blurLambda)

    // lambda: rotate
    const rotateLambda = new NodejsFunction(this, `${PREFIX}-lambda-rotate`, {
      functionName: `${PREFIX}-rotate`,
      entry: path.join(REPOSITORY_TOP, 'lambdas/rotate/src/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
    })
    bucket.grantPut(rotateLambda)
    bucket.grantReadWrite(rotateLambda)
    rotateLambda.addEventSource(new SqsEventSource(queueRotate))
  }
}
