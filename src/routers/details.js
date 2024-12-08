import { getShowInfo } from "../core/podcastRepo.js";

async function podcastDetailsHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host);
  const slug = request.params.slug;

  const episode = showInfo.items.find((episode) => episode.slug === slug);

  console.log("episode", episode);

  return h.view(
    "podcastDetails",
    {
      videoId: episode.youtube.videoId,
      showName: showInfo.showName,
      header_links: showInfo.links,
      description: episode.description,
      title: episode.title,
    },
    {
      layout: "layout",
    }
  );
}

export function podcastDetails(server) {
  server.route({
    method: "GET",
    path: "/podcast/{slug}",
    handler: podcastDetailsHandler,
    options: {
      auth: false,
    },
  });
}
