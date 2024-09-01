import { getPostBySlug, updateTimeCodeBySlug, updateLinkBySlug } from "../../../core/episodeRepo.js";

async function updateTimeCode(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;
  
  const { hours, minutes, seconds, text, isPublic } = request.payload;
  const isPublicValue = isPublic === 'on' ? true : false;

  const index = request.params.index;

  const time = `${hours}:${minutes}:${seconds}`;

  await updateTimeCodeBySlug(showSlug, episodeSlug, index, time, text, isPublicValue);

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
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;

  const podcast = await getPostBySlug(showSlug, episodeSlug);

  const index = podcast.charters.length;

  return h.view(
    'editable_time_code',
    {
      showSlug: showSlug,
      episodeSlug: episodeSlug,
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
    'editable_link',
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
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/timecodes/{index}',
    handler: updateTimeCode,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'POST',
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/add-timecode',
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

