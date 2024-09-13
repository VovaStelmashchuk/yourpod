import { getPostBySlug } from "../core/episodeRepo.js";
import { buildObjectURL } from "../minio/utils.js";
import { buildPublicChapters } from "../core/generator.js";
import { getShowInfo } from "../core/podcastRepo.js";
import dotenv from 'dotenv';

dotenv.config();

const startUrl = process.env.S3_START_URL;

async function podcastDetailsHandler(request, h) {
  const host = request.headers.host;
  const showInfo = await getShowInfo(host)

  const slug = request.params.slug;

  const podcast = await getPostBySlug(showInfo.slug, slug);

  const publicChapters = buildPublicChapters(podcast.charters)

  return h.view('podcastDetails',
    {
      showName: showInfo.showName,
      header_links: showInfo.links,
      title: podcast.title,
      audioUrl: buildObjectURL(podcast.publicAudioFile),
      imageUrl: `${startUrl}${showInfo.showLogoUrl}`,
      chapters: publicChapters
        .map(chapter => {
          return {
            time: chapter.time,
            title: chapter.description,
            timeInSeconds: chapter.timeInSeconds
          }
        }),
      links: podcast.links
        .map(link => {
          return {
            link: link.link,
            title: link.title,
          }
        }),
    },
    {
      layout: 'layout',
    }
  );
}

export function podcastDetails(server) {
  server.route({
    method: 'GET',
    path: '/podcast/{slug}',
    handler: podcastDetailsHandler,
    options: {
      auth: false
    }
  });
}

