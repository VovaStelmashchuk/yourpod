import { getPostBySlug } from "../../core/episodeRepo.js";
import { buildObjectURL } from "../../minio/utils.js";
import { buildPublicChapters } from "../../core/generator.js";

async function podcastDetailsHandler(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;

  const podcast = await getPostBySlug(showSlug, episodeSlug);
  const publicChapters = buildPublicChapters(podcast.charters)

  return h.view('podcastDetails',
    {
      title: podcast.title,
      audioUrl: buildObjectURL(podcast.publicAudioFile),
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
