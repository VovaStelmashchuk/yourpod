import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

import dotenv from 'dotenv';
import Fs from 'fs'
import url from 'url';

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

export async function uploadFile(key, body) {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: body,
    };

    await client.send(new PutObjectCommand(params));

    console.log(`File uploaded successfully, key = ${key}`);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

export async function uploadFileFromPath(key, filePath, contentType) {
  try {
    const fileContent = Fs.readFileSync(filePath);

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    };

    await client.send(new PutObjectCommand(params));

    console.log(`File uploaded successfully, key = ${key}`);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function downloadFile(key, localPath) {
  console.log(`Downloading file ${key} to ${localPath}`);

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const data = await client.send(command);

    Fs.mkdirSync(localPath.split('/').slice(0, -1).join('/'), { recursive: true });
    const writableStream = Fs.createWriteStream(localPath);

    // Pipe the data from the response to the file
    data.Body.pipe(writableStream);

    // Return a promise to ensure it completes before the function resolves
    return new Promise((resolve, reject) => {
      writableStream.on('finish', () => {
        console.log(`Successfully downloaded file ${key} to ${localPath}`);
        resolve();
      });
      writableStream.on('error', (err) => {
        console.error('Error writing file to disk:', err);
        reject(err);
      });
    });
  } catch (err) {
    console.error('Error downloading file:', err);
    throw err; // Optionally rethrow the error for further handling
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
    console.error('Error getting file content:', error);
    throw error;
  }
}

