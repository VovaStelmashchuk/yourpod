import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";
import url from "url";

dotenv.config();

const startUrl = process.env.S3_START_URL;
const s3Endpoint = process.env.S3_ENDPOINT;
const bucketName = process.env.S3_BUCKET_NAME;

const client = new S3Client({
  endpoint: s3Endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.S3_REGION,
  s3ForcePathStyle: true,
});

export async function downloadAndUploadImage(imageUrl, key) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download image: ${response.status} ${response.statusText}`
    );
  }

  const upload = new Upload({
    client,
    params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: response.body,
      ContentType: "image/jpeg",
    },
  });

  try {
    await upload.done();
    console.log(
      `Image streamed from ${imageUrl} and uploaded to S3 with key: ${key}`
    );
  } catch (error) {
    console.error(`Error uploading image stream: ${error.message}`);
    throw error;
  }
}

export function buildObjectURL(path) {
  if (!path) {
    return undefined;
  }
  return url.resolve(startUrl, path);
}

export async function getFileSizeInByte(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await client.send(command);

    return response.ContentLength;
  } catch (error) {
    console.error("Error retrieving file size: ", error);
    throw error;
  }
}

export async function uploadFile(key, body, contentType) {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    };

    await client.send(new PutObjectCommand(params));

    console.log(`File uploaded successfully, key = ${key}`);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

export async function getFileContent(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const data = await client.send(command);

    return data.Body;
  } catch (error) {
    console.error("Error getting file content:", error);
    throw error;
  }
}
