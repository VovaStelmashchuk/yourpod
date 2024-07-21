async function dashboardView(request, h) {
  return h.view('admin/dashboard', {}, {layout: 'admin',})
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
}

module.exports = {
  adminDashboard
}