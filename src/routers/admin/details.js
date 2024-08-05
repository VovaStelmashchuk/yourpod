import { updatePodcastNameBySlug } from "../../core/episodeRepo.js";
import { adminPodcastGetInfoController } from "./detail/getDetails.js";
import { editPodcastMetaInfo } from "./detail/edit_meta.js";
import { getPostBySlug } from "../../core/episodeRepo.js";
import { createPublicAudio } from "../../montage/publicAudioGenerator.js";

async function updatePodcastName(request, h) {
  const slug = request.params.slug;
  const newName = request.payload.episode_name;

  await updatePodcastNameBySlug(slug, newName);

  return h.response().code(200).header('HX-Trigger', 'update-preview');
}

async function updateFiles(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

  await createPublicAudio(podcast);

  return h.response().code(200).header('HX-Trigger', 'update-progress');
}

async function getProgress(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

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

  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/update-name',
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
    path: '/admin/podcast/{slug}/progress',
    handler: getProgress,
    options: {
      auth: 'adminSession',
    }
  });
}
