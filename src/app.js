import { server as _server } from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import Handlebars from "handlebars";

import { home } from "./routers/home.js"
import { podcastDetails } from "./routers/details.js";
import { staticFiles } from './routers/staticFiles.js';
import { admin } from './routers/admin/login.js';
import { adminAuth } from './routers/admin/auth.js';
import { editPodcastDetails } from './routers/admin/details.js'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

function registerViewFunctions() {
  Handlebars.registerHelper('eq', (a, b) => a === b);
}

const init = async () => {
  const server = _server({
    port: 3000,
    host: '0.0.0.0',
    debug: { request: ['error'] }
  });

  await server.register(Inert);
  await server.register(Vision);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  server.views({
    engines: { html: Handlebars },
    relativeTo: __dirname,
    partialsPath: 'templates/partials',
    path: ['templates/pages', 'templates/partials'],
    layout: true,
    layoutPath: 'templates/layouts',
  });

  registerViewFunctions()

  staticFiles(server);

  await adminAuth(server);

  home(server);
  podcastDetails(server);
  admin(server);
  editPodcastDetails(server);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init().then(() => console.log('Server started'));

