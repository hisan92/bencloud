import { createFactory } from "hono/factory";
import { validator } from "hono/validator";
import z from "zod";
import type { Env } from "../hono";
import { sha1 } from "../util/hash";
import { match } from "../util/match";

const factory = createFactory<Env>();

const authorizationSchema = z.object({ authorization: z.string() });

const handlers = factory.createHandlers(
  validator("header", async (data, c) => {
    const parsed = authorizationSchema.safeParse(data);

    if (!parsed.success) {
      return c.json({ error: "Missing authorization" }, 401);
    }

    return parsed.data;
  }),
  async (c, next) => {
    const authToken = c.req.valid("header").authorization;
    const token = Buffer.from(authToken, "base64");

    const parsed = z
      .string()
      .regex(/^[a-z0-9]+:[0-9]+$/)
      .safeParse(token.toString());

    if (!parsed.success) {
      return c.json({ error: "Invalid authorization" }, 401);
    }

    const [secret, userId] = parsed.data.split(":");

    const env = c.get("env");
    const redis = c.get("redis");

    const secretsKey = `secrets:${sha1(env.PEPPER_SECRETS + userId)}`;

    const stored = await match(env.STORE, {
      cloudflare: () => c.env.KV.get(secretsKey),
      redis: () => redis.get(secretsKey),
    });

    if (!stored || stored !== secret) {
      return c.json({ error: "Invalid authorization" }, 401);
    }

    c.set("userId", userId);

    await next();
  },
);

export function requireAuth() {
  return handlers;
}
