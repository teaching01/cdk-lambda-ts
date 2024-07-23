import 'dotenv/config'
import jimp from 'jimp'
import path from 'path'
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3'

const BUCKET_NAME = process.env.BUCKET_NAME
const REPOSITORY_TOP = path.resolve(__dirname, '../../../')

async function main() {
  const s3Client = new S3Client()
  const imagePath = path.join(REPOSITORY_TOP, 'images/cdk.png')
  console.log(`reading an image from: ${imagePath}`)

  const image = await jimp.read(imagePath)
  const mime = image.getMIME()

  const imageBuffer = await image.getBufferAsync(mime)

  const putInput: PutObjectCommandInput = {
    Bucket: BUCKET_NAME,
    Key: 'tmp/cdk.png',
    Body: imageBuffer,
  }
  const putCommand = new PutObjectCommand(putInput)
  const result = await s3Client.send(putCommand)
  console.log(result)
}

main()
