import { getPublicPosts } from "../core/episodeRepo.js";
import { getShowInfo } from "../core/podcastRepo.js";
import dotenv from 'dotenv';

dotenv.config();

const startUrl = process.env.S3_START_URL;

async function homeHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host)

  return h.view('home', {
    showName: showInfo.showName,
    header_links: showInfo.links,
  }, {
    layout: 'layout'
  });
}

async function podcastListHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host);
  const podcasts = await getPublicPosts(showInfo.slug);
  const postsWithChartersDescription = podcasts.map(post => ({
    ...post,
    chartersDescription: post.charters ? post.charters.map(charter => charter.description).join(' ') : '',
    url: post.type === 'public' ? `/podcast/${post.slug}` : 'https://www.patreon.com/androidstory',
    imageUrl: `${startUrl}${showInfo.showLogoUrl}`,
  }));

  return h.view('podcastList', {
    posts: postsWithChartersDescription,
  }, {
    layout: false
  }
  );
}

async function aboutHandler(request, h) {
  const host = request.headers.host;
  const show = await getShowInfo(host)

  return h.view('about', {
    about: show.about,
  }, {
    layout: false
  });
}

export function home(server) {
  server.route({
    method: 'GET',
    path: '/',
    handler: homeHandler,
    options: {
      auth: false
    }
  });
  server.route({
    method: 'GET',
    path: '/tab-podcast-list',
    handler: podcastListHandler,
    options: {
      auth: false
    }
  });
  server.route({
    method: 'GET',
    path: '/tab-about',
    handler: aboutHandler,
    options: {
      auth: false
    }
  });
}
