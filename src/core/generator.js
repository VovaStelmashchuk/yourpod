import { Podcast } from "podcast";

import {
  buildObjectURL,
  getFileSizeInByte,
  uploadFile,
} from "../minio/utils.js";
import { getShowBySlug } from "../core/podcastRepo.js";

import dotenv from "dotenv";

dotenv.config();

const startUrl = process.env.S3_START_URL;
const host = process.env.BASE_URL;
const rssFileName = process.env.PODCAST_RSS_FILE_NAME;

const currentYear = new Date().getFullYear();

export async function updateRss(showSlug) {
  const showInfo = await getShowBySlug(showSlug);

  const logoUrl = `${startUrl}${showInfo.showLogoUrl}`;
  const description = showInfo.about;

  const author = showInfo.authors;

  const pubDate = new Date().toUTCString();

  const feed = new Podcast({
    title: showInfo.showName,
    description: description,
    feedUrl: `${startUrl}/v2/${showSlug}/${rssFileName}`,
    siteUrl: host,
    webMaster: host,
    generator: "YourPod",
    imageUrl: logoUrl,
    author: author,
    copyright: `© 2020-${currentYear} ${showInfo.showName}`,
    language: "ua",
    categories: ["Technology"],
    pubDate: pubDate,
    ttl: 60,
    itunesAuthor: author,
    itunesType: "episodic",
    itunesSummary: description,
    itunesOwner: { name: author, email: "vovochkastelmashchuk@gmail.com" },
    itunesExplicit: false,
    itunesCategory: [
      {
        text: "Technology",
      },
      {
        text: "News",
        subcats: [
          {
            text: "Tech News",
          },
        ],
      },
    ],
    itunesImage: logoUrl,
  });

  const podcasts = showInfo.items.filter((post) => post.audio !== undefined);

  const fileSizes = await Promise.all(
    podcasts.map((post) => getFileSizeInByte(post.audio))
  );

  const podcastsUrl = await Promise.all(
    podcasts.map((post) => buildObjectURL(post.audio))
  );

  const podcastCount = podcasts.length;

  podcasts.forEach((post, index) => {
    let episodeDescription = post.description;

    let linkToEpisode = `${host}/podcast/${post.slug}`;

    let guid = post.youtube.videoId;

    let date = post.pubDate.toUTCString();

    const duration = post.duration;

    feed.addItem({
      title: post.youtube.title,
      description: episodeDescription,
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
      itunesEpisodeType: "full",
      itunesSeason: 2,
      itunesEpisode: podcastCount - index,
      itunesImage: logoUrl,
      itunesAuthor: author,
      itunesSummary: episodeDescription,
    });
  });

  const xml = feed.buildXml();

  await uploadFile(`v2/${showSlug}/${rssFileName}`, xml, "application/rss+xml");
}
