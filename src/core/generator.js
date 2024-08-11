import { Podcast } from 'podcast';

import { getPodcastForRss } from './episodeRepo.js';
import { buildObjectURL, getFileSizeInByte, uploadFile } from '../minio/utils.js';

import dotenv from 'dotenv';

dotenv.config();

const host = process.env.BASE_URL;

export async function updateRss() {
  const podcasts = await getPodcastForRss();
  const logoUrl = buildObjectURL('logo.jpg')

  const description = 'Два андроїдщики, два Вови і деколи дві різні думки. Кожний подкаст ми обговорюємо нові релізи в світі android розробки, кращі і не дуже практики. Ділимося своїми думками, досвідом і деколи пробуємо не смішно жартувати. Також тут ви знайдете рекомендації початківцям, а хто давно в розробці мають тут просто гарно провести час. Якщо вам тут сподобалося то заходьте в наш telegram chat https://t.me/androidstory_chat Якщо прям сильно сподобалося закиньте там трішки грошей. https://www.patreon.com/androidstory'

  const author = 'Vova and Vova';

  const pubDate = new Date().toUTCString();

  const feed = new Podcast({
    title: 'Android story',
    description: description,
    feedUrl: buildObjectURL('rss.xml'),
    siteUrl: host,
    webMaster: host,
    generator: 'Android story',
    imageUrl: logoUrl,
    author: author,
    copyright: '© 2022 Android story',
    language: 'ua',
    categories: ['Technology'],
    pubDate: pubDate,
    ttl: 60,
    itunesAuthor: author,
    itunesType: 'episodic',
    itunesSummary: description,
    itunesOwner: { name: author, email: 'vovochkastelmashchuk@gmail.com' },
    itunesExplicit: false,
    itunesCategory: [{
      text: 'Technology',
    }, {
      text: 'News',
      subcats: [{
        text: 'Tech News',
      }],
    }],
    itunesImage: logoUrl,
  });

  const fileSizes = await Promise.all(podcasts.map(post =>
    getFileSizeInByte('episodes/' + post.audio_file_key)
  ));

  const podcastsUrl = await Promise.all(podcasts.map(post =>
    buildObjectURL('episodes/' + post.audio_file_key)
  ));

  const podcastCount = podcasts.length;

  podcasts.forEach((post, index) => {
    let description = buildRssDescription(post);

    let linkToEpisode = `${host}/podcast/${post.slug}`;

    let guid = post._id.toString();

    let date = post.publish_date.toISOString();

    const duration = post.duration;

    feed.addItem({
      title: post.title,
      description: description,
      url: linkToEpisode,
      guid: guid,
      date: date,
      enclosure: {
        url: podcastsUrl[index],
        size: fileSizes[index],
      },
      itunesTitle: post.title,
      itunesDuration: duration,
      itunesExplicit: false,
      itunesEpisodeType: 'full',
      itunesSeason: 2,
      itunesEpisode: podcastCount - index,
      itunesImage: logoUrl,
      itunesAuthor: author,
      itunesSummary: description,
    });
  });

  const xml = feed.buildXml();

  await uploadFile('rss.xml', xml);
}

export function buildPublicChapters(chapters) {
  const adjustedChapters = [];
  let totalPrivateChaptersTime = 0;
  let previousChapterStartTimeSeconds = 0;

  chapters.forEach((chapter, index) => {
    const chapterStartTimeInSeconds = chapter.time.split(':').reduce((acc, time) => (60 * acc) + +time, 0);

    if (chapter.isPublic !== false) {
      const adjustedTimeInSeconds = chapterStartTimeInSeconds - totalPrivateChaptersTime;
      adjustedChapters.push({
        time: new Date(adjustedTimeInSeconds * 1000).toISOString().substr(11, 8),
        description: chapter.description,
        timeInSeconds: chapter.timeInSeconds,
      });
    } else {
      const nextChapterTime = chapters[index + 1]?.time.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
      totalPrivateChaptersTime += nextChapterTime - chapterStartTimeInSeconds;
    }

    previousChapterStartTimeSeconds = chapterStartTimeInSeconds;
  });

  return adjustedChapters;
}

function buildRssDescription(post) {
  let description = 'В цьому випуску ';
  if (post.charters) {
    const publicChapters = buildPublicChapters(post.charters);
    description += '<ul>'
    publicChapters
      .filter(chapter => chapter.isPublic !== false)
      .forEach(chapter => {
        description += `<li>${chapter.time} - <em>${chapter.description}</em></li>`;
      });
    description += '</ul>'
  }

  if (post.links) {
    description += '<br>';
    description += '<h3>Згадано в випуску</h3>';
    description += '<ul>'
    post.links.forEach(link => {
      description += `<a href="${link.link}">${link.title}</a>`;
      description += '<br>';
    });
    description += '</ul>'
  }

  return description
}

export function buildYoutubePublicDescription(post) {
  let description = 'В цьому випуску \n';
  if (post.charters) {
    const publicChapters = buildPublicChapters(post.charters);
    publicChapters
      .forEach(chapter => {
        description += `${chapter.time} - ${chapter.description} \n`;
      });
  }

  return description + buildLinksBlock(post)
}


export function buildYoutubePatreonDescription(post) {
  let description = 'В цьому випуску \n';
  if (post.charters) {
    post.charters
      .forEach(chapter => {
        description += `${chapter.time} - ${chapter.description} \n`;
      });
  }

  return description + buildLinksBlock(post)
}

function buildLinksBlock(post) {
  let linksText = '';
  if (post.links) {
    linksText += '\n';
    linksText += 'Згадано в випуску \n';
    post.links.forEach(link => {
      linksText += `${link.link}`;
      linksText += '\n';
    });
  }

  return linksText;
}

