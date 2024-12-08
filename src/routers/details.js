import { getShowInfo } from "../core/podcastRepo.js";

function buildDescription(description, videoId) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  let processedText = description
    .replace(urlRegex, function (url) {
      return `<a class="text-green-500" href="${url}" target="_blank">${url}</a>`;
    })
    .replace(/\n/g, "<br>");

  processedText =
    `<a class="text-green-500" href="https://www.youtube.com/watch?v=${videoId}" > Подивитись відео на YouTube </a><br>` +
    processedText;

  return processedText;
}

async function podcastDetailsHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host);
  const slug = request.params.slug;

  const episode = showInfo.youtubeVideoItems.find(
    (episode) => episode.slug === slug
  );

  console.log("episode", episode);

  return h.view(
    "podcastDetails",
    {
      videoId: episode.videoId,
      showName: showInfo.showName,
      header_links: showInfo.links,
      description: buildDescription(
        episode.description || "",
        episode.videoId
      ).trim(),
      title: episode.title,
      links: [],
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
