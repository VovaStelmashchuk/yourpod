const { getPostBySlug, updatePodcastNameBySlug, updateTimeCodeBySlug, updateLinkBySlug } = require("../../core/episodeRepo");
const { buildObjectURL } = require("../../minio/utils");
const { buildYoutbeDescription } = require("../../core/generator");

async function updatePodcastName(request, h) {
  const slug = request.params.slug;
  const newName = request.payload.episode_name;

  await updatePodcastNameBySlug(slug, newName);

  return h.response().code(200).header('HX-Trigger', 'update-preview');
}

async function podcastDetailsHandler(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

  return h.view(
    'admin/admin_podcast_detail',
    {
      title: podcast.title,
      slug: podcast.slug,
      audioUrl: buildObjectURL('episodes/' + podcast.audio_file_key),
      timecodes: podcast.charters.map((chapter, index) => {
        const splitTime = chapter.time.split(':');
        const hour = splitTime[0];
        const minute = splitTime[1];
        const second = splitTime[2];
        return {
          slug: podcast.slug,
          index: index,
          description: chapter.description,
          hour: hour,
          minute: minute,
          second: second,
        }
      }),
      links: podcast.links.map((link, index) => {
        return {
          slug: podcast.slug,
          index: index,
          link: link.link,
          text: link.title,
        }
      })
    },
    { layout: 'admin' }
  )
}

async function updateTimeCode(request, h) {
  const { hours, minutes, seconds, text } = request.payload;

  const slug = request.params.slug;
  const index = request.params.index;

  const time = `${hours}:${minutes}:${seconds}`;

  await updateTimeCodeBySlug(slug, index, time, text);

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

async function youtbeTextComponent(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);
  const description = buildYoutbeDescription(podcast);

  return h.view(
    'admin/youtube_text',
    {
      slug: slug,
      text: description,
    },
    {
      layout: false
    }
  );
}

function editPodcastDetails(server) {
  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/update-name',
    handler: updatePodcastName,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'GET',
    path: '/admin/podcast/{slug}',
    handler: podcastDetailsHandler,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/timecodes/{index}',
    handler: updateTimeCode,
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
    path: '/admin/podcast/{slug}/add-timecode',
    handler: addTimeCode,
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

  server.route({
    method: 'GET',
    path: '/admin/podcast/{slug}/youtube-description',
    handler: youtbeTextComponent,
    options: {
      auth: 'adminSession',
    }
  });
}

module.exports = {
  editPodcastDetails
}; 
