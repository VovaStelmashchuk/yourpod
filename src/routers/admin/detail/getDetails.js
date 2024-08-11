import { getPostBySlug } from "../../../core/episodeRepo.js";
import { buildObjectURL } from "../../../minio/utils.js";
import { buildYoutubePublicDescription, buildYoutubePatreonDescription } from "../../../core/generator.js";

async function podcastDetailsHandler(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

  return h.view(
    'admin/admin_podcast_detail',
    {
      title: podcast.title,
      slug: podcast.slug,
      audioUrl: buildObjectURL(podcast.origin_file),
      timecodes: podcast.charters.map((chapter, index) => {
        const splitTime = chapter.time.split(':');
        const hour = splitTime[0];
        const minute = splitTime[1];
        const second = splitTime[2];
        return {
          slug: podcast.slug,
          index: index,
          description: chapter.description,
          hour: hour,
          minute: minute,
          second: second,
          isPublic: chapter.isPublic !== false,
        }
      }),
      links: podcast.links.map((link, index) => {
        return {
          slug: podcast.slug,
          index: index,
          link: link.link,
          text: link.title,
        }
      }),
      isAudioBuildInProgress: podcast.montage_status === 'in_progress',
      publish_button_text: podcast.visibility === 'private' ? 'Publish' : 'Unpublish',
      url: podcast.visibility === 'private' ? `/admin/podcast/${slug}/publish` : `/admin/podcast/${slug}/unpublish`,
    },
    { layout: 'admin' }
  )
}

async function youtbeTextComponent(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);
  const publicDescription = buildYoutubePublicDescription(podcast);
  const patreonDescription = buildYoutubePatreonDescription(podcast);

  return h.view(
    'admin/youtube_text',
    {
      slug: slug,
      public_text: publicDescription,
      patreon_text: patreonDescription,
    },
    {
      layout: false
    }
  );
}

export function adminPodcastGetInfoController(server) {
  server.route({
    method: 'GET',
    path: '/admin/podcast/{slug}',
    handler: podcastDetailsHandler,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'GET',
    path: '/admin/podcast/{slug}/youtube-description',
    handler: youtbeTextComponent,
    options: {
      auth: 'adminSession',
    }
  });
}

