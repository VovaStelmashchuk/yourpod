const { updatePodcastNameBySlug } = require("../../core/episodeRepo");

async function updatePodcastName(request, h) {
  const slug = request.params.slug;
  const newName = request.payload.episode_name;

  await updatePodcastNameBySlug(slug, newName);

  return h.response().code(200);
}

function editPodcastDetails(server) {
  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/update-name',
    handler: updatePodcastName,
    options: {
      auth: 'adminSession',
    }
  })
}

module.exports = {
  editPodcastDetails
}; 
