const { getAllPosts, getPostBySlug } = require("../../core/episodeRepo");
const { buildObjectURL } = require("../../minio/utils");

async function dashboardView(request, h) {
  return h.view('admin/dashboard', {}, { layout: 'admin', })
}

async function adminPodcastList(request, h) {
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

async function podcastDetailsHandler(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

  return h.view(
    'admin/admin_podcast_detail',
    {
      title: podcast.title,
      slug: slug,
      audioUrl: buildObjectURL('episodes/' + podcast.audio_file_key),
      timecodes: podcast.charters.map(chapter => {
        return {
          time: chapter.time,
          title: chapter.description,
          timeInSeconds: chapter.time.split(':').reduce((acc, time) => (60 * acc) + +time)
        }
      })
    },
    { layout: 'admin' }
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
}

module.exports = {
  adminDashboard
}
