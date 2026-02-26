import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./config/env";
import { hono } from "./hono";
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

const app = hono()
  .use(cors({ origin: discordOrigins, exposeHeaders: ["ETag"] }))
  .use(logger())
  .use(secureHeaders())
  .use(contextStorage())
  .use(bootstrap())
  .all("/v1/settings", ...requireAuth())
  .route("/v1/settings", settings)
  .route("/v1/oauth", discord)
  .route("/v1/", root)
  .get("/", (c) => {
    return c.redirect(env(c).ROOT_REDIRECT, 303);
  });

export default app;
