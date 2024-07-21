const {addSessionToUser} = require("../../core/user");
const {adminDashboard} = require("./dashboard");

async function login(request, h) {
  return h.view('admin/login', {}, {layout: 'admin'});
}

async function postLogin(request, h) {
  const {username, password} = request.payload;

  const {sessionId, expiresAt, error} = await addSessionToUser(username, password);

  if (error) {
    return h.response('<div class="text-red-500">Invalid username or password. Please try again.</div>').type('text/html');
  }

  if (sessionId && expiresAt) {
    const ttl = new Date(expiresAt).getTime() - Date.now();
    return h.response()
      .state('sessionId', sessionId, {
        ttl: ttl,
        isSecure: true,
        isHttpOnly: true,
        path: '/'
      })
      .header('HX-Redirect', 'admin/dashboard')
      .code(200);
  }
}

function admin(server) {
  server.route({
    method: 'GET',
    path: '/login',
    handler: login,
    options: {
      auth: false,
    }
  })
  server.route({
    method: 'POST',
    path: '/login',
    handler: postLogin,
    options: {
      auth: false,
    }
  })

  adminDashboard(server);
}

module.exports = {
  admin
}