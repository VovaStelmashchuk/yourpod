import { downloadFile, uploadFileFromPath } from "./utils.js";

import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import Fs from 'fs'

/*
 * The method downoald file from minio and apply ffmpeg to it and upload to minio
 */
export async function applyFFmpegToFileInMinio(inputKey, outputKey, ffmpegCommand) {
  console.log('Applying ffmpeg to file in minio, start download');
  console.log('inputKey', inputKey);
  console.log('outputKey', outputKey);
  console.log('ffmpegCommand', ffmpegCommand);

  const folder = `.tmp/test-key/`;
  Fs.rmSync(folder, { recursive: true, force: true });

  await downloadFile(inputKey, `${folder}/${inputKey}`);

  const output = `${folder}/${outputKey}`;
  const outputFolder = output.split('/').slice(0, -1).join('/');
  Fs.mkdirSync(outputFolder, { recursive: true });

  console.log('Downloaded file from minio');

  // Wrap the child process in a promise
  await new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, [
      '-i', `${folder}/${inputKey}`,
      '-filter_complex', ffmpegCommand,
      output,
    ]);

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on('error', (error) => {
      console.error(`error: ${error.message}`);
      reject(error);
    });

    child.on('close', async (code) => {
      console.log(`child process exited with code ${code}`);
      if (code === 0) {
        // Upload file only if the process exits successfully
        await uploadFileFromPath(outputKey, output, 'audio/mpeg');
        console.log('Uploaded file to minio');
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
}

