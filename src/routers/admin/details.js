import { updatePodcastNameBySlug } from "../../core/episodeRepo.js";
import { adminPodcastGetInfoController } from "./detail/getDetails.js";
import { editPodcastMetaInfo } from "./detail/edit_meta.js";
import { getPostBySlug } from "../../core/episodeRepo.js";
import { createPublicAudio } from "../../montage/publicAudioGenerator.js";
import { publishController } from "./detail/publish.js";
import { podcastPreview } from "./preview.js";

async function updatePodcastName(request, h) {
  const episodeSlug = request.params.episodeSlug;
  const showSlug = request.params.showSlug;
  const newName = request.payload.episode_name;

  await updatePodcastNameBySlug(showSlug, episodeSlug, newName);

  return h.response().code(200).header('HX-Trigger', 'update-preview');
}

async function updateFiles(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

  await createPublicAudio(podcast);

  return h.view(
    'buttons/build_audio',
    {
      isAudioBuildInProgress: true,
    },
    {
      layout: false
    }
  ).header('HX-Trigger', 'update-progress');
}

async function getProgress(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;

  const podcast = await getPostBySlug(showSlug, episodeSlug);

  if (podcast.montage_status === 'in_progress') {
    return h.view(
      'progress',
      {},
      {
        layout: false
      }
    )
  } else {
    return h.response().code(200)
  }
}

export function editPodcastDetails(server) {
  adminPodcastGetInfoController(server)
  editPodcastMetaInfo(server)
  publishController(server)
  podcastPreview(server)

  server.route({
    method: 'PUT',
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/update-name',
    handler: updatePodcastName,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'POST',
    path: '/admin/podcast/{slug}/update-files',
    handler: updateFiles,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'GET',
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/progress',
    handler: getProgress,
    options: {
      auth: 'adminSession',
    }
  });
}
