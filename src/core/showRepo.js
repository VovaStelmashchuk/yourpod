import { Database } from "./client.js";

export async function getAllShows() {
  return Database.collection("shows").find().toArray();
}

export async function getShowBySlug(slug) {
  return Database.collection("shows").findOne({ slug: slug });
}

export async function getShowInfo(podcastDomain) {
  return Database.collection("shows").findOne({ domains: podcastDomain });
}
