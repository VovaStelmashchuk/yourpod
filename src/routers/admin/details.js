const { getPostBySlug, updatePodcastNameBySlug } = require("../../core/episodeRepo");
const { buildObjectURL } = require("../../minio/utils");

async function updatePodcastName(request, h) {
  const slug = request.params.slug;
  const newName = request.payload.episode_name;

  await updatePodcastNameBySlug(slug, newName);

  return h.response().code(200);
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
      timecodes: podcast.charters.map(chapter => {
        const splitTime = chapter.time.split(':');
        const hour = splitTime[0];
        const minute = splitTime[1];
        const second = splitTime[2];
        return {
          description: chapter.description,
          hour: hour,
          minute: minute,
          second: second,
        }
      })
    },
    { layout: 'admin' }
  )
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
}

module.exports = {
  editPodcastDetails
}; 
