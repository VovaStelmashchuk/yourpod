import { updatePodcastNameBySlug } from "../../core/episodeRepo.js";
import { adminPodcastGetInfoController } from "./detail/getDetails.js";
import { editPodcastMetaInfo } from "./detail/edit_meta.js";
import { getPostBySlug } from "../../core/episodeRepo.js";
import { buildPublicChapters } from "../../core/generator.js";
import { applyFFmpegToFileInMinio } from "../../minio/ffmpegApply.js";

async function updatePodcastName(request, h) {
  const slug = request.params.slug;
  const newName = request.payload.episode_name;

  await updatePodcastNameBySlug(slug, newName);

  return h.response().code(200).header('HX-Trigger', 'update-preview');
}

async function buildPublicAudio(podcast) {
  const chapters = podcast.charters;

  let filterString = '';
  let publicIndex = 1;

  chapters.forEach((chapter, index) => {
    if (chapter.isPublic !== false) {
      const chapterStartSecond = chapter.timeInSeconds;
      const chapterEndSecond = chapters[index + 1]?.timeInSeconds;

      const filterStart = `[0]atrim=start=${chapterStartSecond}`;

      let filterMainPart = ''

      if (chapterEndSecond !== undefined) {
        filterMainPart = `${filterStart}:end=${chapterEndSecond}`;
      } else {
        filterMainPart = `${filterStart}`;
      }

      filterString += `${filterMainPart},asetpts=PTS-STARTPTS[a${publicIndex}]; `;
      publicIndex++;
    }
  });

  // add part with [a0]...[a<publicIndex>]
  for (let i = 1; i < publicIndex; i++) {
    filterString += `[a${i}]`;
  }

  filterString += `concat=n=${publicIndex - 1}:v=0:a=1`;

  await applyFFmpegToFileInMinio(podcast.origin_file, `episodes/${podcast.slug}.mp3`, filterString)
}

async function updateFiles(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

  const publicChapters = buildPublicChapters(podcast.charters);

  console.log('publicChapters', publicChapters);

  await buildPublicAudio(podcast);

  return h.response().code(200)
}

export function editPodcastDetails(server) {
  adminPodcastGetInfoController(server)
  editPodcastMetaInfo(server)
  server.route({
    method: 'PUT',
    path: '/admin/podcast/{slug}/update-name',
    handler: updatePodcastName,
    options: {
      auth: 'adminSession',
    }
  });

  server.route({
    method: 'POST',
    path: '/admin/podcast/{slug}/update-files',
    handler: updateFiles,
    options: {
      auth: 'adminSession',
    }
  });
}
