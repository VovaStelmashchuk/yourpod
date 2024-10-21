import fs from 'fs'
import path from 'path'
import { uploadFileFromPath } from "../../../minio/utils.js";
import { updateVideoPathBySlug } from '../../../core/episodeRepo.js';
import dotenv from 'dotenv';

dotenv.config();
const startUrl = process.env.S3_START_URL;

function fileSuffix() {
  const count = 64;
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < count; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

async function uploadVideo(request, h) {
  try {
    const data = request.payload;

    if (data.video) {
      const fileFormat = "mp4";
      const showSlug = request.params.showSlug;
      const episodeSlug = request.params.episodeSlug;
      const saveFileName = `${episodeSlug}-${fileSuffix()}.${fileFormat}`;
      const file = data.video;
      console.log(file);

      const uploadDir = `uploads/`;
      fs.mkdirSync(uploadDir, { recursive: true });

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      const filePath = path.join(uploadDir, saveFileName);
      const fileStream = fs.createWriteStream(filePath);

      // Pipe the file to the file system
      await new Promise((resolve, reject) => {
        file.on('error', (err) => reject(err));
        file.pipe(fileStream);
        file.on('end', () => resolve());
      });

      const s3FileKey = `${showSlug}/videos/${saveFileName}`
      await uploadFileFromPath(s3FileKey, filePath, "video/mov");
      await updateVideoPathBySlug(showSlug, episodeSlug, s3FileKey);

      console.log(`File uploaded to S3: ${s3FileKey}`);

      return h.view(
        'media_component',
        {
          showAudio: false,
          showVideo: true,
          videoUrl: `${startUrl}/${s3FileKey}`,
          showUploadVideoButton: false,
        },
        {
          layout: false
        }
      )
    } else {
      return h
        .response({ status: 'fail', message: 'No file received' })
        .code(400);
    }
  } catch (error) {
    console.error('File upload failed:', error);
    return h
      .response({ status: 'error', message: 'Internal Server Error' })
      .code(500);
  }
}

export function uploadVideoController(server) {
  server.route({
    method: 'POST',
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/upload',
    handler: uploadVideo,
    options: {
      auth: 'adminSession',
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: 16 * 1024 * 1024 * 1024, // 16 GB
        multipart: true,
      },
    }
  });
}
