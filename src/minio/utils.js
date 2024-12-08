import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

import dotenv from "dotenv";
import Fs from "fs";
import url from "url";
import ytdl from "ytdl-core";
import { Upload } from "@aws-sdk/lib-storage";

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

export async function streamYoutubeVideoAudioToS3(videoId, key) {
  try {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const output = Fs.createWriteStream("/tmp/audio.mp4");

    ytdl(youtubeUrl)
      .on("error", (err) => {
        console.error("Error during download:", err);
      })
      .on("info", (info) => {
        console.log(`Downloading audio from: ${info.videoDetails.title}`);
      })
      .pipe(output)
      .on("finish", () => {
        console.log(`Audio downloaded successfully to: ${outputPath}`);
      });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function uploadFileStream(key, body, contentType) {
  try {
    const upload = new Upload({
      client,
      params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });

    upload.on("httpUploadProgress", (progress) => {
      console.log(
        `Upload progress: ${progress.loaded}/${
          progress.total || "unknown total"
        } bytes`
      );
    });

    await upload.done();
    console.log(`File uploaded successfully, key = ${key}`);
  } catch (error) {
    console.error("Error uploading file:", error);
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
