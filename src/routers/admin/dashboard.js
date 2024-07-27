const { getAllPosts } = require("../../core/episodeRepo");

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
}

module.exports = {
  adminDashboard
}
