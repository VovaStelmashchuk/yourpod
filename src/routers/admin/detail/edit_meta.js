import { getPostBySlug, updateTimeCodeBySlug, updateLinkBySlug } from "../../../core/episodeRepo.js";

async function updateTimeCode(request, h) {
  const { hours, minutes, seconds, text, isPublic } = request.payload;
  const isPublicValue = isPublic === 'on' ? true : false;

  const slug = request.params.slug;
  const index = request.params.index;

  const time = `${hours}:${minutes}:${seconds}`;

  await updateTimeCodeBySlug(slug, index, time, text, isPublicValue);

  return h.response().code(200).header('HX-Trigger', 'update-preview');
}

async function updateLink(request, h) {
  const { link, text } = request.payload;

  const slug = request.params.slug;
  const index = request.params.index;

  await updateLinkBySlug(slug, index, link, text);
  return h.response().code(200).header('HX-Trigger', 'update-preview');
}

async function addTimeCode(request, h) {
  const slug = request.params.slug;
  const podcast = await getPostBySlug(slug);

  const index = podcast.charters.length;

  return h.view(
    'edit_podcast_time_code_wrapper',
    {
      slug: slug,
      index: index,
    },
    {
      layout: false
    }
  );
}

async function addLink(request, h) {
  const slug = request.params.slug;
  const podcast = await getPostBySlug(slug);

  const index = podcast.links.length;

  return h.view(
    'editable_link_wrapper',
    {
      slug: slug,
      index: index,
    },
    {
      layout: false
    }
  );
}

export function editPodcastMetaInfo(server) {
  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/timecodes/{index}',
    handler: updateTimeCode,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'POST',
    path: '/admin/podcast/{slug}/add-timecode',
    handler: addTimeCode,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/links/{index}',
    handler: updateLink,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'POST',
    path: '/admin/podcast/{slug}/add-link',
    handler: addLink,
    options: {
      auth: 'adminSession',
    }
  });
}

