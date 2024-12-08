import { Database } from "./client.js";

export async function getShowInfo(podcastDomain) {
  return Database.collection("shows").findOne({ domains: podcastDomain });
}

export async function getShowBySlug(showSlug) {
  return Database.collection("shows").findOne({ slug: showSlug });
}
