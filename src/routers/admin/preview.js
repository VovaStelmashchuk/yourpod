import { getPostBySlug } from "../../core/episodeRepo.js";
import { buildObjectURL } from "../../minio/utils.js";
import { buildPublicChapters } from "../../core/generator.js";
import { getShowBySlug } from "../../core/podcastRepo.js";
import dotenv from 'dotenv';

dotenv.config();

const startUrl = process.env.S3_START_URL;

async function podcastDetailsHandler(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;

  const showInfo = await getShowBySlug(showSlug);

  const podcast = await getPostBySlug(showSlug, episodeSlug);
  const publicChapters = buildPublicChapters(podcast.charters)

  return h.view('podcastDetails',
    {
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
            text: link.text,
          }
        }),
    },
    {
      layout: false,
    }
  );
}

export function podcastPreview(server) {
  server.route({
    method: 'GET',
    path: '/admin/preview/show/{showSlug}/episode/{episodeSlug}',
    handler: podcastDetailsHandler,
    options: {
      auth: false
    }
  });
}
