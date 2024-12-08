import { Database } from "./client.js";

export function getPodcastForRss(showSlug) {
  return Database.collection("posts")
    .find(
      {
        showSlug: showSlug,
        visibility: "public",
        type: "public",
      },
      {
        sort: {
          publish_date: -1,
        },
      }
    )
    .toArray();
}

export function getAllPosts(showSlug) {
  return Database.collection("posts")
    .find(
      {
        showSlug: showSlug,
      },
      {
        sort: {
          publish_date: -1,
        },
      }
    )
    .toArray();
}

export function getPostBySlug(showSlug, episodeSlug) {
  return Database.collection("posts").findOne({
    slug: episodeSlug,
    showSlug: showSlug,
  });
}
