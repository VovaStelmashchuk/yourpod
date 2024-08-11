import { publishPodcast, unpublishPodcast } from "../../../core/episodeRepo.js";
import { updateRss } from "../../../core/generator.js";

async function publishHandler(request, h) {
  const slug = request.params.slug;
  await publishPodcast(slug)

  await updateRss();

  return h.view(
    'buttons/publish_button',
    {
      publish_button_text: 'Unpublish',
      url: `/admin/podcast/${slug}/unpublish`,
    },
    {
      layout: false
    }
  )
}

async function unpublishHandler(request, h) {
  const slug = request.params.slug;
  await unpublishPodcast(slug)

  await updateRss();

  return h.view(
    'buttons/publish_button',
    {
      publish_button_text: 'Publish',
      url: `/admin/podcast/${slug}/publish`,
    },
    {
      layout: false
    }
  )
}

export function publishController(server) {
  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/publish',
    handler: publishHandler,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/unpublish',
    handler: unpublishHandler,
    options: {
      auth: 'adminSession',
    }
  });
}
