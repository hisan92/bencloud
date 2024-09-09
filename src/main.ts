import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { Env } from "./config/env";
import { Redis } from "./db/redis";
import { requireAuth } from "./middlewares/auth";
import { bootstrap } from "./middlewares/bootstrap";
import { discord } from "./routes/discord";
import { root } from "./routes/root";
import { settings } from "./routes/settings";

const discordOrigins = [
  "https://discord.com",
  "https://ptb.discord.com",
  "https://canary.discord.com",
  "https://discordapp.com",
  "https://ptb.discordapp.com",
  "https://canary.discordapp.com",
];

const App = new Hono()
  .use(cors({ origin: discordOrigins, exposeHeaders: ["ETag"] }))
  .use(logger())
  .use(secureHeaders())
  .use(bootstrap())
  .all("/v1/settings", ...requireAuth())
  .route("/v1/settings", settings)
  .route("/v1/oauth", discord)
  .route("/v1/", root)
  .get("/", (c) => {
    return c.redirect(Env.ROOT_REDIRECT, 303);
  });

async function shutdown() {
  if (Redis.isOpen) {
    await Redis.disconnect();
  }

  process.exit();
}

process.on("SIGTERM", shutdown);

process.on("SIGINT", shutdown);

export default {
  fetch: App.fetch,
  port: Env.APP_PORT,
};
