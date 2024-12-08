import { google } from "googleapis";
import { getShowBySlug } from "../../core/showRepo.js";
import { Database } from "../../core/client.js";
import { downloadAndUploadImage } from "../../minio/utils.js";
import slugify from "slugify";
import dotenv from "dotenv";

dotenv.config();

const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const startS3Url = process.env.S3_START_URL;

async function getPlaylistItems(playlistId, nextPageToken) {
  const youtube = google.youtube({
    version: "v3",
    auth: youtubeApiKey,
  });

  const response = await youtube.playlistItems.list({
    part: ["snippet"],
    playlistId: playlistId,
    maxResults: 50,
    pageToken: nextPageToken,
  });

  return response.data;
}

function buildDescription(description, videoId) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  let processedText = description
    .replace(urlRegex, function (url) {
      return `<a class="text-green-500" href="${url}" target="_blank">${url}</a>`;
    })
    .replace(/\n/g, "<br>");

  processedText =
    `<a class="text-green-500" href="https://www.youtube.com/watch?v=${videoId}" > Подивитись відео на YouTube </a><br>` +
    processedText;

  return processedText;
}

function buildShortDescription(description) {
  let shortDescription = description;
  const firstTwoZeroIndex = description.indexOf("00:00");
  if (firstTwoZeroIndex !== -1) {
    shortDescription = description.slice(firstTwoZeroIndex);
  }
  // remove all time stamps in format hh:mm:ss and '-' character
  shortDescription = shortDescription.replace(/(\d{2}:\d{2}:\d{2})/g, "");
  shortDescription = shortDescription.replace(/-/g, "");
  return shortDescription;
}

async function performShowSyncHandler(request, h) {
  const showSlug = request.params.showSlug;
  const show = await getShowBySlug(showSlug);
  const playlistId = show.youtubePlaylistId;

  let nextPageToken = null;
  let items = [];

  do {
    const response = await getPlaylistItems(playlistId, nextPageToken);
    items = items.concat(response.items);
    nextPageToken = response.nextPageToken;
  } while (nextPageToken);

  const youtubeVideoItems = items.map((item) => {
    let thumbnail = item.snippet.thumbnails.maxres;
    if (!thumbnail) {
      thumbnail = item.snippet.thumbnails.standard;
    }
    const youtubeDescription = item.snippet.description;
    const videoId = item.snippet.resourceId.videoId;
    return {
      youtube: {
        videoId: videoId,
        title: item.snippet.title,
        description: youtubeDescription,
        publishedAt: item.snippet.publishedAt,
        thumbnail: thumbnail.url,
      },
      slug: slugify(item.snippet.title, { lower: true, strict: true }),
      shortDescription: buildShortDescription(youtubeDescription),
      description: buildDescription(youtubeDescription, videoId),
    };
  });

  await Database.collection("shows").updateOne(
    { slug: showSlug },
    {
      $set: {
        lastSyncTime: new Date(),
        items: youtubeVideoItems,
      },
    }
  );

  return h.response().code(200).header("HX-Refresh", "true");
}

async function syncPageHandler(request, h) {
  const showSlug = request.params.showSlug;
  const show = await getShowBySlug(showSlug);

  const items = show.items.map((item) => ({
    ...item,
    title: item.youtube.title,
    description: item.youtube.description,
    imageUrl: item.youtube.thumbnail,
    refreshMediaUrl: `/admin/show/${showSlug}/${item.slug}/refresh-media`,
  }));

  return h.view(
    "admin/episode_list",
    {
      pageTitle: show.showName,
      posts: items,
      performSyncUrl: `/admin/show/${showSlug}/perform-sync`,
      lastSyncTime: show.lastSyncTime,
    },
    {
      layout: "admin",
    }
  );
}

async function syncEpisodeHandler(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;
  const show = await getShowBySlug(showSlug);

  const episode = show.items.find((item) => item.slug === episodeSlug);

  console.log("Syncing episode: ", episode);
  // Sync episode audio - video
  /*await streamYoutubeVideoAudioToS3(
    videoId,
    `v2/${showSlug}/episodes/${videoId}.mp3`
  );*/

  const key = `v2/${showSlug}/episodes/${episodeSlug}.jpg`;
  downloadAndUploadImage(episode.youtube.thumbnail, key);

  await Database.collection("shows").updateOne(
    { slug: showSlug, "items.slug": episodeSlug },
    {
      $set: {
        "items.$.image": key,
      },
    }
  );

  return h.response().code(200);
}

export function syncApis(server) {
  server.route({
    method: "GET",
    path: "/admin/show/{showSlug}",
    handler: syncPageHandler,
    options: {
      auth: "adminSession",
    },
  });

  server.route({
    method: "POST",
    path: "/admin/show/{showSlug}/{episodeSlug}/refresh-media",
    handler: syncEpisodeHandler,
    options: {
      auth: "adminSession",
    },
  });

  server.route({
    method: "POST",
    path: "/admin/show/{showSlug}/perform-sync",
    handler: performShowSyncHandler,
    options: {
      auth: "adminSession",
    },
  });
}
