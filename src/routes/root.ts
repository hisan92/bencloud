import { Hono } from "hono";
import { requireAuth } from "../middlewares/auth";
import { sha1 } from "../util/hash";

export const root = new Hono()
  .delete(...requireAuth(), async (c) => {
    const userId = c.get("userId");
    const Env = c.get("Env");
    const Redis = c.get("Redis");

    await Promise.allSettled([
      Redis.del(`settings:${sha1(Env.PEPPER_SETTINGS + userId)}`),
      Redis.del(`secrets:${sha1(Env.PEPPER_SECRETS + userId)}`),
    ]);

    return new Response(null, { status: 204 });
  })
  .get(async (c) => {
    return c.json({ ping: "pong" });
  });
