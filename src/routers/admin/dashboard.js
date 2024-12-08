import { getAllShows } from "../../core/showRepo.js";

import dotenv from "dotenv";
dotenv.config();

const startS3Url = process.env.S3_START_URL;

async function dashboardView(request, h) {
  const shows = await getAllShows();
  const showsUiModel = shows.map((show) => ({
    url: `/admin/show/${show.slug}`,
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

export function adminDashboard(server) {
  server.route({
    method: "GET",
    path: "/admin/dashboard",
    handler: dashboardView,
    options: {
      auth: "adminSession",
    },
  });
}
