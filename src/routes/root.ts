import { hono } from "../hono";
import { requireAuth } from "../middlewares/auth";
import { sha1 } from "../util/hash";
import { match } from "../util/match";

export const root = hono()
  .delete(...requireAuth(), async (c) => {
    const userId = c.get("userId");
    const env = c.get("env");
    const redis = c.get("redis");

    const settingsKey = `settings:${sha1(env.PEPPER_SETTINGS + userId)}`;
    const secretsKey = `secrets:${sha1(env.PEPPER_SECRETS + userId)}`;

    await match(env.STORE, {
      cloudflare: async () => {
        await Promise.allSettled([
          c.env.KV.delete(settingsKey),
          c.env.KV.delete(secretsKey),
        ]);
      },
      redis: async () => {
        await Promise.allSettled([
          redis.del(settingsKey),
          redis.del(secretsKey),
        ]);
      },
    });

    return new Response(null, { status: 204 });
  })
  .get(async (c) => {
    return c.json({ ping: "pong" });
  });
