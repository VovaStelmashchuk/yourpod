import { publishPodcast, unpublishPodcast } from "../../../core/episodeRepo.js";
import { updateRss } from "../../../core/generator.js";

async function publishHandler(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;
  await publishPodcast(showSlug, episodeSlug);

  await updateRss(showSlug);

  return h.view(
    'buttons/publish_button',
    {
      publish_button_text: 'Unpublish',
      url: `/admin/show/${showSlug}/episode/${episodeSlug}/unpublish`,
    },
    {
      layout: false
    }
  )
}

async function unpublishHandler(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;

  console.log('unpublishing', showSlug, episodeSlug);

  await unpublishPodcast(showSlug, episodeSlug);

  await updateRss(showSlug);

  return h.view(
    'buttons/publish_button',
    {
      publish_button_text: 'Publish',
      url: `/admin/show/${showSlug}/episode/${episodeSlug}/publish`,
    },
    {
      layout: false
    }
  )
}

export function publishController(server) {
  server.route({
    method: 'PUT',
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/publish',
    handler: publishHandler,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'PUT',
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/unpublish',
    handler: unpublishHandler,
    options: {
      auth: 'adminSession',
    }
  });
}
