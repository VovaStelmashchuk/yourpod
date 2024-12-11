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

async function podcastListHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host);

  const posts = showInfo.items
    .sort((a, b) => a.youtube.position - b.youtube.position)
    .map((item) => {
      let imageUrl;
      if (item.image) {
        imageUrl = `${startUrl}/${item.image}`;
      } else {
        imageUrl = `${startUrl}${showInfo.showLogoUrl}`;
      }
      return {
        url: `/podcast/${item.slug}`,
        imageUrl: `${imageUrl}`,
        title: item.youtube.title,
        chartersDescription: item.shortDescription,
      };
    });

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
