import { updatePodcastNameBySlug } from "../../core/episodeRepo.js";
import { adminPodcastGetInfoController } from "./detail/getDetails.js";
import { editPodcastMetaInfo } from "./detail/edit_meta.js";
import { getPostBySlug } from "../../core/episodeRepo.js";
import { buildPublicChapters } from "../../core/generator.js";
import { downloadFile } from "../../minio/utils.js";

async function updatePodcastName(request, h) {
  const slug = request.params.slug;
  const newName = request.payload.episode_name;

  await updatePodcastNameBySlug(slug, newName);

  return h.response().code(200).header('HX-Trigger', 'update-preview');
}

async function buildPublicAudio(podcast) {
  const chapters = podcast.charters;

  console.log('chapters', chapters);

  //[0]atrim=start=330:end=4250[a1]; [0]atrim=start=4250:end=4800[a2]; [0]atrim=start=7800:end=11400[a3]; [a1][a2][a3]concat=n=3:v=0:a=1[out]
  //[0]atrim=start=60:end=120[a1]; [0]atrim=start=180:end=300[a2]; [0]atrim=start=300:end=310[a3]; [a1][a2][a3]concat=n=3:v=0:a=1[out]
  let filterString = '';
  let publicIndex = 1;

  chapters.forEach((chapter, index) => {
    if (chapter.isPublic !== false) {
      const chapterStartSecond = chapter.timeInSeconds;
      const chapterEndSecond = chapters[index + 1]?.timeInSeconds;

      console.log('chapter name', chapter.description);

      console.log('chapterStartSecond', chapterStartSecond);
      console.log('chapterEndSecond', chapterEndSecond);

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

  console.log('filterString', filterString);

  console.log("start downoald patreon file");

  const folder = 'tmp/some-test';

  // download patreon file

  console.log("end downoald patreon file");
}

async function updateFiles(request, h) {
  const slug = request.params.slug;

  const podcast = await getPostBySlug(slug);

  const publicChapters = buildPublicChapters(podcast.charters);

  console.log('publicChapters', publicChapters);

  buildPublicAudio(podcast);

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
