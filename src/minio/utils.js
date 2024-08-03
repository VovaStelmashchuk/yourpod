import * as Minio from 'minio'

import dotenv from 'dotenv';

dotenv.config();

const baseurl = process.env.BASE_URL;

const minioEndpoint = process.env.MINIO_END_POINT
const minioPort = process.env.MINIO_PORT
const minioAccessKey = process.env.MINIO_ACCESS_KEY
const minioSecretKey = process.env.MINIO_SECRET_KEY
const bucketName = 'story-podcast'

const minioClient = new Minio.Client({
  endPoint: minioEndpoint,
  port: Number(minioPort),
  useSSL: false,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
})

export function buildObjectURL(minioKey) {
  return `${baseurl}/files/${minioKey}`;
}

export async function getFileSizeInByte(key) {
  const stat = await minioClient.statObject(bucketName, key)
  return stat.size
}

export async function uploadFile(key, body) {
  await minioClient.putObject(bucketName, key, body, undefined, {
    'Content-Type': 'text/xml',
  })
}

export async function downloadFile(key, localPath) {
  await minioClient.fGetObject(bucketName, key, localPath, function(err) {
    if (err) {
      return console.log(err)
    }
    console.log(`success download file ${key} to ${localPath}`)
  })
}
