import { addSessionToUser } from "../../core/user.js";
import { adminDashboard } from "./dashboard.js";

import dotenv from "dotenv";
dotenv.config();
const isSecure = process.env.IS_SECURE === "true";

async function login(request, h) {
  return h.view("admin/login", {}, { layout: "admin" });
}

async function postLogin(request, h) {
  const { username, password } = request.payload;

  const { sessionId, expiresAt, error } = await addSessionToUser(
    username,
    password
  );

  if (error) {
    return h
      .response(
        '<div class="text-red-500 py-2">Invalid username or password. Please try again.</div>'
      )
      .type("text/html");
  }

  if (sessionId && expiresAt) {
    const ttl = new Date(expiresAt).getTime() - Date.now();
    return h
      .response()
      .state("sessionId", sessionId, {
        ttl: ttl,
        isSecure: isSecure,
        isHttpOnly: true,
        path: "/",
      })
      .header("HX-Redirect", "admin/dashboard")
      .code(200);
  }
}

export function admin(server) {
  server.route({
    method: "GET",
    path: "/login",
    handler: login,
    options: {
      auth: false,
    },
  });
  server.route({
    method: "POST",
    path: "/login",
    handler: postLogin,
    options: {
      auth: false,
    },
  });

  adminDashboard(server);
}
