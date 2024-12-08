import * as Cookie from "@hapi/cookie";
import { getUserBySessionId } from "../../core/user.js";

import dotenv from "dotenv";

dotenv.config();

const isSecure = process.env.IS_SECURE === "true";
const cookiePass = process.env.COOKIE_PASS;

export async function adminAuth(server) {
  await server.register(Cookie);

  server.auth.strategy("adminSession", "cookie", {
    cookie: {
      name: "sessionId",
      password: cookiePass,
      isSecure: isSecure,
    },
    redirectTo: "/login",
    validate: async (request, session) => {
      const user = await getUserBySessionId(session);

      if (!user) {
        return { isValid: false };
      }

      return { isValid: true };
    },
  });

  server.auth.default("adminSession");
}
