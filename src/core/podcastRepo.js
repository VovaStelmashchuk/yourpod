import { Database } from "./client.js";

export async function getShowInfo(podcastDomain) {
  return Database.collection('shows').findOne({ domains: podcastDomain });
}

