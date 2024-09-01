import { getPostBySlug } from "../../../core/episodeRepo.js";
import { buildObjectURL } from "../../../minio/utils.js";
import { buildYoutubePublicDescription, buildYoutubePatreonDescription } from "../../../core/generator.js";

async function getPodcastDetails(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;

  const podcast = await getPostBySlug(showSlug, episodeSlug);

  return h.view(
    'admin/admin_podcast_detail',
    {
      title: podcast.title,
      slug: podcast.slug,
      showSlug: showSlug,
      episodeSlug: podcast.slug,
      audioUrl: buildObjectURL(podcast.originFilePath),
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
      url: podcast.visibility === 'private' ? `/admin/podcast/${episodeSlug}/publish` : `/admin/podcast/${episodeSlug}/unpublish`,
    },
    { layout: 'admin' }
  )
}

async function youtbeTextComponent(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;

  const podcast = await getPostBySlug(showSlug, episodeSlug);
  const publicDescription = buildYoutubePublicDescription(podcast);
  const patreonDescription = buildYoutubePatreonDescription(podcast);

  return h.view(
    'admin/youtube_text',
    {
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
    path: '/admin/show/{showSlug}/episode/{episodeSlug}',
    handler: getPodcastDetails,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'GET',
    path: '/admin/show/{showSlug}/episode/{episodeSlug}/youtube-description',
    handler: youtbeTextComponent,
    options: {
      auth: 'adminSession',
    }
  });
}

