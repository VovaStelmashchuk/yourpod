import fs from 'fs'
import path from 'path'

async function uploadVideo(request, h) {
  try {
    const data = request.payload;

    if (data.video) {
      const file = data.video;
      console.log(file);
      const filename = 'test.mov';

      const uploadDir = `uploads/`;
      fs.mkdirSync(uploadDir, { recursive: true });

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      const filePath = path.join(uploadDir, filename);
      const fileStream = fs.createWriteStream(filePath);

      // Pipe the file to the file system
      await new Promise((resolve, reject) => {
        file.on('error', (err) => reject(err));
        file.pipe(fileStream);
        file.on('end', () => resolve());
      });

      return h
        .response({
          status: 'success',
          message: 'File uploaded successfully',
          data: {
            filename: filename,
            path: filePath,
          },
        })
        .code(200);
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
    path: '/upload-video',
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
