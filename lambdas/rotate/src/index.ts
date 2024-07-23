import { SQSHandler, SQSEvent } from 'aws-lambda'
import { S3Client } from '@aws-sdk/client-s3'
import path from 'path'
import { getImageFromS3, putImageToS3 } from '../../common/src/index'
import { S3Message } from '../../common/src/types'

const PROCESS = 'rotate'

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`)

  const s3Client = new S3Client()
  for (const record of event.Records) {
    // 1. download
    const message = record.body
    const s3Message: S3Message = JSON.parse(message)

    const bucketName = s3Message.bucketName
    const key = s3Message.key
    const parsedKey = path.parse(key)

    const image = await getImageFromS3(s3Client, bucketName, key)

    // 2. process
    const degree = 5
    console.log(`${PROCESS} the image for ${key}, degree: ${degree}`)
    image.rotate(degree)

    // 3. upload
    const mime = image.getMIME()

    const imageBuffer = await image.getBufferAsync(mime)

    const uploadKey = `${PROCESS}/${parsedKey.name}-${PROCESS}${parsedKey.ext}`

    await putImageToS3(s3Client, bucketName, uploadKey, imageBuffer)
  }
}
