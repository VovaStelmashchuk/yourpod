import { getPostBySlug, updateAudioPathBySlug } from "../../../core/episodeRepo.js";
import { applyFFmpegToFileInMinio } from "../../../minio/ffmpegApply.js";
import { buildObjectURL } from "../../../minio/utils.js";

async function buildAudio(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;
  const episode = await getPostBySlug(showSlug, episodeSlug);
  const audioPath = `${showSlug}/episodes/${episodeSlug}/full-audio.wav`;
  await applyFFmpegToFileInMinio(episode.videoPath, audioPath);
  await updateAudioPathBySlug(showSlug, episodeSlug, audioPath);
  console.log('Building audio for episode', showSlug, episodeSlug);

  return h.view(
    'media_component',
    {
      showSlug: showSlug,
      episodeSlug: episodeSlug,
      showAudio: true,
      showVideo: true,
      audioUrl: buildObjectURL(audioPath),
      videoUrl: buildObjectURL(episode.videoPath),
      showUploadVideoButton: false,
    },
    {
      layout: false
    }
  )
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
