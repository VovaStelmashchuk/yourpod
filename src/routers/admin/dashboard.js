import { getAllPosts, createPodcast } from "../../core/episodeRepo.js";
import { getAllShows, getShowBySlug } from "../../core/showRepo.js";
import slugify from "slugify";

import dotenv from "dotenv";
dotenv.config();

const startS3Url = process.env.S3_START_URL;

async function dashboardView(request, h) {
  const shows = await getAllShows();
  const showsUiModel = shows.map((show) => ({
    url: `/admin/show/${show.slug}/sync`,
    showName: show.showName,
    showLogoUrl: `${startS3Url}${show.showLogoUrl}`,
  }));

  return h.view(
    "admin/dashboard",
    {
      pageTitle: "Dashboard",
      shows: showsUiModel,
    },
    {
      layout: "admin",
    }
  );
}

async function adminPodcastListBySlug(showSlug, h, layout) {
  const show = await getShowBySlug(showSlug);
  const posts = await getAllPosts(showSlug);

  const uiPosts = posts.map((post) => ({
    ...post,
    detailUrl: `/admin/show/${show.slug}/episode/${post.slug}`,
  }));

  const pageTitle = "Dashboard " + show.showName;

  return h.view(
    "admin/admin_podcast_list",
    {
      pageTitle: pageTitle,
      posts: uiPosts,
      createPodcastButton: {
        title: "Create Podcast",
        showSlug: showSlug,
      },
    },
    {
      layout: layout,
    }
  );
}

async function createPodcastHandler(request, h) {
  const { episodeName } = request.payload;
  const showSlug = request.params.showSlug;
  const show = await getShowBySlug(showSlug);

  const slug = slugify(episodeName);

  await createPodcast(show.slug, episodeName, slug, show.links);

  return adminPodcastListBySlug(showSlug, h, false);
}

async function adminPodcastList(request, h) {
  const showSlug = request.params.showSlug;
  return adminPodcastListBySlug(showSlug, h, "admin");
}

export function adminDashboard(server) {
  server.route({
    method: "GET",
    path: "/admin/dashboard",
    handler: dashboardView,
    options: {
      auth: "adminSession",
    },
  });

  server.route({
    method: "GET",
    path: "/admin/show/{showSlug}",
    handler: adminPodcastList,
    options: {
      auth: "adminSession",
    },
  });
  server.route({
    method: "POST",
    path: "/admin/show/{showSlug}/episode",
    handler: createPodcastHandler,
    options: {
      auth: "adminSession",
    },
  });
}
