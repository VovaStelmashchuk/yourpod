// server.js
const Hapi = require('@hapi/hapi');
const Path = require('path');
const Inert = require('@hapi/inert');
const home = require("./routers/home");
const staticFiles = require("./routers/staticFiles");

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
  });

  // Register inert plugin
  await server.register(Inert);

  await staticFiles(server);

  // Serve static files
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'public'),
        listing: false
      }
    }
  });

  // Handle the main route
  server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      return h.file('src/public/index.html');
    }
  });

  home(server);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init().then(() => console.log('Server started'));

