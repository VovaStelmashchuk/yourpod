const Cookie = require('@hapi/cookie');
const {getUserBySessionId} = require("../../core/user");

async function adminAuth(server) {
  await server.register(Cookie);

  server.auth.strategy('adminSession', 'cookie', {
    cookie: {
      name: 'sessionId',
      password: 'your-secret-password-that-is-at-least-32-characters-long',
      isSecure: true,
    },
    redirectTo: '/login',
    validate: async (request, session) => {
      const user = await getUserBySessionId(session);

      if (!user) {
        return {isValid: false};
      }

      return {isValid: true};
    }
  });

  server.auth.default('adminSession');
}

module.exports = {
  adminAuth
}