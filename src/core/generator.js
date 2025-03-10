import { Podcast } from "podcast";

import { buildObjectURL, getFileSizeInByte } from "../minio/utils.js";
import { getShowBySlug } from "../core/podcastRepo.js";

import { Database } from "./client.js";

import dotenv from "dotenv";

dotenv.config();

const startUrl = process.env.S3_START_URL;

const currentYear = new Date().getFullYear();

export async function updateRss(showSlug) {
  const showInfo = await getShowBySlug(showSlug);

  const host = `https://${showInfo.mainDomain}`;

  const logoUrl = `${startUrl}${showInfo.showLogoUrl}`;
  const description = showInfo.about;

  const author = showInfo.author;

  const pubDate = new Date().toUTCString();

  const feed = new Podcast({
    title: showInfo.showName,
    description: description,
    feedUrl: `${startUrl}/v2/${showSlug}/rss.xml`,
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

  const podcasts = showInfo.items
    .filter((post) => post.audio !== undefined)
    .sort((a, b) => {
      if (a.youtube.position < b.youtube.position) return -1;
      if (a.youtube.position > b.youtube.position) return 1;

      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);

      return dateB - dateA;
    });

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

  await Database.collection("shows").updateOne(
    { slug: showSlug },
    { $set: { rss: xml } }
  );
}
