import { google } from "googleapis";
import { getShowBySlug } from "../../core/showRepo.js";
import { Database } from "../../core/client.js";
import { streamYoutubeVideoAudioToS3 } from "../../minio/utils.js";
import slugify from "slugify";
import dotenv from "dotenv";

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

async function performShowSyncHandler(request, h) {
  const showSlug = request.params.showSlug;
  const show = await getShowBySlug(showSlug);
  const playlistId = show.youtubePlaylistId;

  let nextPageToken = null;
  let items = [];

  console.log("Syncing show: ", showSlug, playlistId);

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
    return {
      slug: slugify(item.snippet.title, { lower: true, strict: true }),
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: thumbnail.url,
    };
  });

  Database.collection("shows").updateOne(
    { slug: showSlug },
    {
      $set: {
        youtubeVideoItems: youtubeVideoItems,
        lastSyncTime: new Date(),
      },
    }
  );

  return h.response().code(200).header("HX-Refresh", "true");
}

async function syncPageHandler(request, h) {
  const showSlug = request.params.showSlug;
  const show = await getShowBySlug(showSlug);

  return h.view(
    "admin/episode_list",
    {
      pageTitle: show.showName,
      posts: show.youtubeVideoItems,
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
  const videoId = request.params.videoId;
  const show = await getShowBySlug(showSlug);

  const episode = show.youtubeVideoItems.find(
    (item) => item.videoId === videoId
  );

  console.log("Syncing episode: ", episode);

  await streamYoutubeVideoAudioToS3(
    videoId,
    `v2/${showSlug}/episodes/${videoId}.mp3`
  );

  return { message: "Syncing episode" };
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
    path: "/admin/show/{showSlug}/{videoId}/perform-sync",
    handler: syncEpisodeHandler,
    options: {
      auth: false, //"adminSession",
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
