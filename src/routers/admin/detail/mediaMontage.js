import { getPostBySlug } from "../../../core/episodeRepo.js";
import { applyFFmpegToFileInMinio } from "../../../minio/ffmpegApply.js";

async function buildAudio(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;
  const episode = await getPostBySlug(showSlug, episodeSlug);
  const audioPath = `${showSlug}/episodes/${episodeSlug}/full-audio.wav`;
  await applyFFmpegToFileInMinio(episode.videoPath, audioPath);
  console.log('Building audio for episode', showSlug, episodeSlug);

}

export function media(server) {
  server.route({
    method: 'POST',
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/buildAudio',
    handler: buildAudio,
    options: {
      auth: 'adminSession',
    }
  });
}
