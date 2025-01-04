import { getShowInfo } from "../../core/podcastRepo.js";

async function rssHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host);

  const rss = showInfo.rss;

  return h.response(rss).type("application/rss+xml");
}

export function rss(server) {
  server.route({
    method: "GET",
    path: "/rss.xml",
    handler: rssHandler,
    options: {
      auth: false,
    },
  });
}
