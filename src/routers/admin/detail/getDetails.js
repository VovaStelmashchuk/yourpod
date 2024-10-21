import { getPostBySlug } from "../../../core/episodeRepo.js";
import { buildObjectURL } from "../../../minio/utils.js";
import { buildYoutubePublicDescription, buildYoutubePatreonDescription } from "../../../core/generator.js";

async function getPodcastDetails(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;

  const podcast = await getPostBySlug(showSlug, episodeSlug);

  let media = {
    showAudio: false,
    showVideo: false,
    showUploadVideoButton: true,
    audioUrl: buildObjectURL(podcast.originFilePath),
    uploadUrl: `/admin/show/${showSlug}/episode/${episodeSlug}/upload`,
  }
  if (podcast.videoPath && podcast.originFilePath) {
    media = {
      showAudio: true,
      showVideo: true,
      showUploadVideoButton: false,
      videoUrl: buildObjectURL(podcast.videoPath),
      audioUrl: buildObjectURL(podcast.originFilePath),
    }
  }
  if (podcast.videoPath) {
    media = {
      showAudio: false,
      showVideo: true,
      showUploadVideoButton: false,
      videoUrl: buildObjectURL(podcast.videoPath),
    }
  }
  if (podcast.originFilePath) {
    media = {
      showAudio: true,
      showVideo: false,
      showUploadVideoButton: false,
      audioUrl: buildObjectURL(podcast.originFilePath),
    }
  }

  return h.view(
    'admin/admin_podcast_detail',
    {
      title: podcast.title,
      slug: podcast.slug,
      showSlug: showSlug,
      episodeSlug: podcast.slug,
      media: media,
      timecodes: podcast.charters.map((chapter, index) => {
        const splitTime = chapter.time.split(':');
        const hour = splitTime[0];
        const minute = splitTime[1];
        const second = splitTime[2];
        return {
          showSlug: podcast.showSlug,
          episodeSlug: podcast.slug,
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
          showSlug: podcast.showSlug,
          episodeSlug: podcast.slug,
          index: index,
          link: link.link,
          text: link.text,
        }
      }),
      isAudioBuildInProgress: podcast.montage_status === 'in_progress',
      publish_button_text: podcast.visibility === 'private' ? 'Publish' : 'Unpublish',
      url: podcast.visibility === 'private' ? `/admin/show/${podcast.showSlug}/episode/${podcast.slug}/publish` : `/admin/show/${podcast.showSlug}/episode/${podcast.slug}/unpublish`,
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

