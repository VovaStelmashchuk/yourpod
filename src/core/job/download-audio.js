import pulse from "./init.js";
import { uploadFile } from "../../minio/utils.js";
import { Database } from "../client.js";

import dotenv from "dotenv";
dotenv.config();
const RAPID_API_KEY = process.env.RAPID_API_KEY;

export function initSyncAudioJobs() {
  initDownloadAudioJob();
  initSaveAudioToS3Job();
}

function initDownloadAudioJob() {
  pulse.define(
    "download-audio",
    async (job, done) => {
      const { videoId, showSlug, episodeSlug } = job.attrs.data;

      try {
        await Database.collection("shows").updateOne(
          { slug: showSlug, "items.slug": episodeSlug },
          {
            $set: {
              "items.$.episodeSync": "in-progress",
            },
          }
        );
        console.log("Processing job for videoId:", videoId);

        const audioResult = await getAudioUrl(videoId);

        if (audioResult.isReady) {
          console.log("Audio is ready:", audioResult.link);

          await Database.collection("shows").updateOne(
            { slug: showSlug, "items.slug": episodeSlug },
            {
              $set: {
                "items.$.duration": audioResult.duration,
              },
            }
          );
          // Queue the next job to save audio to S3
          pulse
            .create("save-audio-to-s3", {
              audioUrl: audioResult.link,
              key: `v2/${showSlug}/episodes/${episodeSlug}-${videoId}.mp3`,
              showSlug: showSlug,
              episodeSlug: episodeSlug,
            })
            .save();

          done(null, {
            link: audioResult.link,
            duration: audioResult.duration,
          });
        } else {
          console.log("Audio is not ready yet.");
          throw new Error("Audio not ready");
        }
      } catch (error) {
        console.error("Error processing job:", error.message);
        done(error);
      }
    },
    {
      concurrency: 1,
      lockLimit: 1,
      shouldSaveResult: true,
      attempts: 10,
      backoff: {
        type: "fixed",
        delay: 60000,
      },
    }
  );
}

function initSaveAudioToS3Job() {
  pulse.define(
    "save-audio-to-s3",
    async (job, done) => {
      const { audioUrl, key, showSlug, episodeSlug } = job.attrs.data;

      try {
        console.log("Processing job to save audio to S3:", { audioUrl, key });

        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to download audio: ${response.status} ${response.statusText}`
          );
        }

        const audioBuffer = await response.arrayBuffer();
        await uploadFile(key, Buffer.from(audioBuffer), "audio/mpeg");

        console.log(`Audio saved to S3 successfully: ${key}`);

        await Database.collection("shows").updateOne(
          { slug: showSlug, "items.slug": episodeSlug },
          {
            $set: {
              "items.$.episodeSync": "success",
              "items.$.audio": key,
            },
          }
        );

        done(null, { success: true, key });
      } catch (error) {
        await Database.collection("shows").updateOne(
          { slug: showSlug, "items.slug": episodeSlug },
          {
            $set: {
              "items.$.episodeSync": "fail",
            },
          }
        );
        console.error("Error processing job to save audio:", error.message);
        done(error);
      }
    },
    {
      concurrency: 1,
      lockLimit: 1,
      attempts: 5,
      backoff: {
        type: "fixed",
        delay: 30000, // Retry after 30 seconds
      },
    }
  );
}

async function getAudioUrl(videoId) {
  const response = await fetch(
    `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
    {
      headers: {
        "x-rapidapi-host": "youtube-mp36.p.rapidapi.com",
        "x-rapidapi-key": RAPID_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch response from youtube-mp36, with status: ${response.status}`
    );
  }

  const body = await response.json();
  if (body.status === "fail") {
    throw new Error(`Failed to get audio: ${body.msg}`);
  }
  if (body.progress === 100) {
    return {
      isReady: true,
      link: body.link,
      duration: body.duration,
    };
  } else {
    return {
      isReady: false,
    };
  }
}
