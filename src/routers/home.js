import { getShowInfo } from "../core/podcastRepo.js";
import dotenv from "dotenv";

dotenv.config();

const startUrl = process.env.S3_START_URL;

async function homeHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host);

  return h.view(
    "home",
    {
      showName: showInfo.showName,
      header_links: showInfo.links,
    },
    {
      layout: "layout",
    }
  );
}

function buildShortDescription(description) {
  let shortDescription = description;
  const firstTwoZeroIndex = description.indexOf("00:00");
  if (firstTwoZeroIndex !== -1) {
    shortDescription = description.slice(firstTwoZeroIndex);
  }
  // remove all time stamps in format hh:mm:ss and '-' character
  shortDescription = shortDescription.replace(/(\d{2}:\d{2}:\d{2})/g, "");
  shortDescription = shortDescription.replace(/-/g, "");
  return shortDescription;
}

async function podcastListHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host);

  const posts = showInfo.youtubeVideoItems.map((video) => ({
    url: `/podcast/${video.slug}`,
    imageUrl: `${startUrl}${showInfo.showLogoUrl}`,
    title: video.title,
    chartersDescription: buildShortDescription(video.description),
  }));

  return h.view(
    "podcastList",
    {
      posts: posts,
    },
    {
      layout: false,
    }
  );
}

async function aboutHandler(request, h) {
  const host = request.headers.host;
  const show = await getShowInfo(host);

  return h.view(
    "about",
    {
      about: show.about,
    },
    {
      layout: false,
    }
  );
}

export function home(server) {
  server.route({
    method: "GET",
    path: "/",
    handler: homeHandler,
    options: {
      auth: false,
    },
  });
  server.route({
    method: "GET",
    path: "/tab-podcast-list",
    handler: podcastListHandler,
    options: {
      auth: false,
    },
  });
  server.route({
    method: "GET",
    path: "/tab-about",
    handler: aboutHandler,
    options: {
      auth: false,
    },
  });
}
