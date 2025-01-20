import { google } from "googleapis";
import { getShowBySlug } from "../../core/showRepo.js";
import { Database } from "../../core/client.js";
import { downloadAndUploadImage } from "../../minio/utils.js";
import standardSlugify from "standard-slugify";
import dotenv from "dotenv";
import pulse from "../../core/job/init.js";
import { updateRss } from "../../core/generator.js";
dotenv.config();

const youtubeApiKey = process.env.YOUTUBE_API_KEY;

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

  const existVideoIds = (show.items || []).map((item) => item.youtube.videoId);

  const youtubeVideoItems = items
    .filter((item) => !existVideoIds.includes(item.snippet.resourceId.videoId))
    .map((item) => {
      let thumbnail = item.snippet.thumbnails.maxres;
      if (!thumbnail) {
        thumbnail = item.snippet.thumbnails.standard;
      }
      if (!thumbnail) {
        console.log("Thumbnails not found", item.snippet);
      }
      const youtubeDescription = item.snippet.description;
      const videoId = item.snippet.resourceId.videoId;

      return {
        youtube: {
          videoId: videoId,
          title: item.snippet.title,
          description: youtubeDescription,
          thumbnail: thumbnail.url,
          position: item.snippet.position,
        },
        slug: standardSlugify(item.snippet.title, {
          keepCase: false,
        }),
        shortDescription: buildShortDescription(youtubeDescription),
        description: buildDescription(youtubeDescription, videoId),
      };
    });

  await Database.collection("shows").updateOne(
    { slug: showSlug },
    {
      $set: { lastSyncTime: new Date() },
      $addToSet: { items: { $each: youtubeVideoItems } },
    }
  );

  return h.response().code(200).header("HX-Refresh", "true");
}

async function syncPageHandler(request, h) {
  const showSlug = request.params.showSlug;
  const show = await getShowBySlug(showSlug);

  const items = (show.items || [])
    .sort((a, b) => {
      if (a.youtube.position < b.youtube.position) return -1;
      if (a.youtube.position > b.youtube.position) return 1;

      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);

      return dateB - dateA;
    })
    .map((item) => ({
      ...item,
      title: item.youtube.title,
      description: item.youtube.description,
      imageUrl: item.youtube.thumbnail,
      refreshMediaUrl: `/admin/show/${showSlug}/${item.slug}/refresh-media`,
      isShowButton: item.episodeSync === undefined,
      syncStatus: item.episodeSync,
    }));

  return h.view(
    "admin/episode_list",
    {
      pageTitle: show.showName,
      posts: items,
      performSyncUrl: `/admin/show/${showSlug}/perform-sync`,
      buildRssUrl: `/admin/show/${showSlug}/build-rss`,
      lastSyncTime: show.lastSyncTime,
    },
    {
      layout: "admin",
    }
  );
}

async function getYoutubeVideoPublishedAt(videoId) {
  const youtube = google.youtube({
    version: "v3",
    auth: youtubeApiKey,
  });

  const response = await youtube.videos.list({
    part: ["snippet"],
    id: videoId,
  });

  console.log(response.data.items[0].snippet.publishedAt);
  return new Date(response.data.items[0].snippet.publishedAt);
}

async function syncEpisodeHandler(request, h) {
  const showSlug = request.params.showSlug;
  const episodeSlug = request.params.episodeSlug;
  const show = await getShowBySlug(showSlug);

  const episode = show.items.find((item) => item.slug === episodeSlug);
  const publishedAt = await getYoutubeVideoPublishedAt(episode.youtube.videoId);

  pulse.now("download-audio", {
    videoId: episode.youtube.videoId,
    showSlug: showSlug,
    episodeSlug: episodeSlug,
  });

  const key = `v2/${showSlug}/episodes/${episodeSlug}.jpg`;
  downloadAndUploadImage(episode.youtube.thumbnail, key);

  await Database.collection("shows").updateOne(
    { slug: showSlug, "items.slug": episodeSlug },
    {
      $set: {
        "items.$.image": key,
        "items.$.pubDate": publishedAt,
        "items.$.episodeSync": "in-progress",
      },
    }
  );

  return h.response().code(200).header("HX-Refresh", "true");
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

  server.route({
    method: "POST",
    path: "/admin/show/{showSlug}/build-rss",
    handler: async (request, h) => {
      const showSlug = request.params.showSlug;
      console.log("Building RSS for show", showSlug);
      updateRss(showSlug);
      return h.response().code(200).header("HX-Refresh", "true");
    },
    options: {
      auth: "adminSession",
    },
  });
}
