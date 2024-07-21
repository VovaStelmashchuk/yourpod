// server.js
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const {home} = require("./routers/home");
const Handlebars = require('handlebars');
const {podcastDetails} = require("./routers/details");
const staticFiles = require("./routers/staticFiles");

function registerViewFunctions() {
  Handlebars.registerHelper('eq', (a, b) => a === b);
}

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
  });

  // Register inert plugin
  await server.register(Inert);
  await server.register(require('@hapi/vision'));

  server.views({
    engines: {html: Handlebars},
    relativeTo: __dirname,
    partialsPath: 'templates/partials',
    path: 'templates/pages',
    layout: true,
    layoutPath: 'templates/layouts'
  });

  registerViewFunctions()

  await staticFiles(server);
  home(server);
  podcastDetails(server);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init().then(() => console.log('Server started'));

