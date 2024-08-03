
/*
 * The method downoald file from minio and apply ffmpeg to it and upload to minio
 */
export async function applyFFmpegToFileInMinio(inputKey, outputKey, ffmpegCommand) {
  await downloadFile('patreon/' + podcast.audio_file_key, `${folder}/patreon-${podcast.audio_file_key}`);
}
