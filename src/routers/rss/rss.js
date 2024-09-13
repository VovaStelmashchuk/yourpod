import { getShowInfo } from "../../core/podcastRepo.js";
import { getFileContent } from "../../minio/utils.js";
import dotenv from 'dotenv';

dotenv.config();

const rssFileName = process.env.PODCAST_RSS_FILE_NAME;

async function rssHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host);

  const rss = await getFileContent(`${showInfo.slug}/${rssFileName}`);

  return h.response(rss).type('application/rss+xml');
}

export function rss(server) {
  server.route({
    method: 'GET',
    path: '/rss.xml',
    handler: rssHandler,
    options: {
      auth: false
    }
  })
}
