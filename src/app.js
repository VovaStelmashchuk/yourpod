import { server as _server } from "@hapi/hapi";
import Inert from "@hapi/inert";
import Vision from "@hapi/vision";
import Handlebars from "handlebars";

import { home } from "./routers/home.js";
import { staticFiles } from "./routers/staticFiles.js";
import { admin } from "./routers/admin/login.js";
import { adminAuth } from "./routers/admin/auth.js";
import { rss } from "./routers/rss/rss.js";
import { syncApis } from "./routers/admin/sync.js";
import { podcastDetails } from "./routers/details.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

function registerViewFunctions() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
}

const init = async () => {
  const server = _server({
    port: 3000,
    host: "0.0.0.0",
    debug: { request: ["error"] },
  });

  await server.register(Inert);
  await server.register(Vision);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  server.views({
    engines: { html: Handlebars },
    relativeTo: __dirname,
    partialsPath: ["templates/partials", "templates/widgets"],
    path: ["templates/pages", "templates/partials", "templates/widgets"],
    layout: true,
    layoutPath: "templates/layouts",
  });

  registerViewFunctions();

  staticFiles(server);

  await adminAuth(server);

  podcastDetails(server);
  home(server);
  admin(server);
  rss(server);
  syncApis(server);

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.info(err);
  process.exit(1);
});

init().then(() => console.log("Server started"));
