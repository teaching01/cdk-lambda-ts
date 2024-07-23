import jimp from 'jimp'
import path from 'path'

const REPOSITORY_TOP = path.resolve(__dirname, '../../../')

async function main() {
  const imagePath = path.join(REPOSITORY_TOP, 'images/cdk.png')
  console.log(`reading an image from: ${imagePath}`)

  const image = await jimp.read(imagePath)

  image.rotate(90)

  image.write('rotate.png')
}

main()
