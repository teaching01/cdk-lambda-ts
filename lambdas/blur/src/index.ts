import { S3Handler, S3Event, SQSHandler, SQSEvent } from 'aws-lambda'
import { S3Client } from '@aws-sdk/client-s3'
import path from 'path'
import { getImageFromS3, putImageToS3 } from '../../common/src/index'
import { S3Message } from '../../common/src/types'
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs'

const QUEUE_URL = process.env.QUEUE_URL
const PROCESS = 'blur'

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log(`SQS Event: ${JSON.stringify(event, null, 2)}`)

  const s3Client = new S3Client()
  for (const record of event.Records) {
    const message = record.body
    const s3Event: S3Event = JSON.parse(message)
    console.log(`S3 Event: ${JSON.stringify(s3Event, null, 2)}`)

    for (const s3Record of s3Event.Records) {
      // 1. download
      const bucketName = s3Record.s3.bucket.name
      const key = s3Record.s3.object.key
      const parsedKey = path.parse(key)

      const image = await getImageFromS3(s3Client, bucketName, key)

      console.log(`${PROCESS}`)
      image.blur(5)

      // 3. upload
      const mime = image.getMIME()

      const imageBuffer = await image.getBufferAsync(mime)

      const uploadKey = `${PROCESS}/${parsedKey.name}-${PROCESS}${parsedKey.ext}`

      await putImageToS3(s3Client, bucketName, uploadKey, imageBuffer)

      // 4. send message to sqs
      const s3Message: S3Message = { bucketName, key: uploadKey }
      // sqs client
      const sqsClient = new SQSClient()
      // sqs command
      const input: SendMessageCommandInput = {
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(s3Message),
      }
      const command: SendMessageCommand = new SendMessageCommand(input)
      // send
      await sqsClient.send(command)
      console.log(
        `sent the message to SQS, message: ${JSON.stringify(s3Message)}`
      )
    }
  }
}
