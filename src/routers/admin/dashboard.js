const {getAllPosts, getPostBySlug, updatePodcastNameBySlug} = require("../../core/episodeRepo");
const {buildObjectURL} = require("../../minio/utils");

async function dashboardView(_, h) {
  return h.view('admin/dashboard', {}, {layout: 'admin',})
}

async function adminPodcastList(_, h) {
  const posts = await getAllPosts()

  const uiPosts = posts.map(post => ({
    ...post,
    detailUrl: `/admin/podcast/${post.slug}`,
  }));

  return h.view(
    'admin/admin_podcast_list',
    {
      posts: uiPosts,
    }, {
      layout: false,
    }
  )
}

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
      slug: slug,
      audioUrl: buildObjectURL('episodes/' + podcast.audio_file_key),
    },
    {layout: 'admin'}
  )
}

function adminDashboard(server) {
  server.route({
    method: 'GET',
    path: '/admin/dashboard',
    handler: dashboardView,
    options: {
      auth: 'adminSession',
    }
  })

  server.route({
    method: 'GET',
    path: '/admin/podcast',
    handler: adminPodcastList,
    options: {
      auth: 'adminSession',
    }
  })
  server.route({
    method: 'GET',
    path: '/admin/podcast/{slug}',
    handler: podcastDetailsHandler,
    options: {
      auth: 'adminSession',
    }
  })
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
  adminDashboard
}
