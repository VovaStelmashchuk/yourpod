// server.js
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const {home} = require("./routers/home");
const Handlebars = require('handlebars');
const {podcastDetails} = require("./routers/details");
const staticFiles = require("./routers/staticFiles");
const {admin} = require("./routers/admin/login");
const {adminAuth} = require("./routers/admin/auth");
const { editPodcastDetails } = require('./routers/admin/details');

function registerViewFunctions() {
  Handlebars.registerHelper('eq', (a, b) => a === b);
}

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
  });

  await server.register(Inert);
  await server.register(Vision);

  server.views({
    engines: {html: Handlebars},
    relativeTo: __dirname,
    partialsPath: 'templates/partials',
    path: 'templates/pages',
    layout: true,
    layoutPath: 'templates/layouts'
  });

  registerViewFunctions()

  staticFiles(server);

  await adminAuth(server);

  home(server);
  podcastDetails(server);
  admin(server);
//  editPodcastDetails(server);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init().then(() => console.log('Server started'));

