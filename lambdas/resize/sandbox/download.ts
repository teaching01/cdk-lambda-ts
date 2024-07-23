import 'dotenv/config'
import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
} from '@aws-sdk/client-s3'

const BUCKET_NAME = process.env.BUCKET_NAME

async function main() {
  const s3Client = new S3Client()
  const key = 'original/cdk.png'

  const input: GetObjectCommandInput = {
    Bucket: BUCKET_NAME,
    Key: key,
  }
  const command = new GetObjectCommand(input)
  const result = await s3Client.send(command)
  if (!result.Body) {
    throw Error('result.Body is undefined!')
  }
  const body = await result.Body.transformToByteArray()
  console.log(body)
}

main()
