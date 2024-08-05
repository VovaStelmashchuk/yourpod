import { updateMontageStatusBySlug } from '../core/episodeRepo.js';
import { applyFFmpegToFileInMinio } from '../minio/ffmpegApply.js';

async function createPublicAudioJob(podcast) {
  const chapters = podcast.charters;

  let complexFilterString = '';
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

      complexFilterString += `${filterMainPart},asetpts=PTS-STARTPTS[a${publicIndex}]; `;
      publicIndex++;
    }
  });

  // add part with [a0]...[a<publicIndex>]
  for (let i = 1; i < publicIndex; i++) {
    complexFilterString += `[a${i}]`;
  }

  complexFilterString += `concat=n=${publicIndex - 1}:v=0:a=1`;

  await applyFFmpegToFileInMinio(podcast.origin_file, `episodes/${podcast.slug}.mp3`, complexFilterString)
}

export async function createPublicAudio(podcast) {
  await modifyPodcastStatus(podcast.slug, 'in_progress');

  createPublicAudioJob(podcast)
    .then(async () => {
      await modifyPodcastStatus(podcast.slug, 'success');
      console.log('Public audio creation successful.');
    })
    .catch(async (error) => {
      await modifyPodcastStatus(podcast.slug, 'failure');
      console.error('Public audio creation failed:', error);
    });

  return { status: 'in-progress' };
}

async function modifyPodcastStatus(slug, status) {
  updateMontageStatusBySlug(slug, status);
  console.log(`Updating podcast status to ${status} for ${slug}`);
}

