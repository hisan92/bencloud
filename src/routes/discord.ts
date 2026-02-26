import { randomBytes } from "crypto";
import { validator } from "hono/validator";
import { ofetch } from "ofetch";
import z from "zod";
import { hono } from "../hono";
import { sha1 } from "../util/hash";
import { match } from "../util/match";

const callbackSchema = z.object({ code: z.string() });
const tokenSchema = z.object({ access_token: z.string() });
const discordMeSchema = z.object({ id: z.string() });

export const discord = hono()
  .get(
    "/callback",
    validator("query", async (data, c) => {
      const parsed = callbackSchema.safeParse(data);

      if (!parsed.success) {
        return c.json({ error: "Missing code" }, 400);
      }

      return parsed.data;
    }),
    async (c) => {
      const { code } = c.req.valid("query");
      const env = c.get("env");

      const params = new URLSearchParams();

      params.append("client_id", env.DISCORD_CLIENT_ID);
      params.append("client_secret", env.DISCORD_CLIENT_SECRET);
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", env.DISCORD_REDIRECT_URI);
      params.append("scope", "identify");

      const token = await ofetch<z.infer<typeof tokenSchema>>(
        "https://discord.com/api/oauth2/token",
        {
          method: "post",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
      );

      const discordToken = tokenSchema.safeParse(token);

      if (!discordToken.success) {
        console.warn(
          "[Discord] Failed to request access token: %s",
          discordToken.error.toString(),
        );

        return c.json({ error: "Failed to request access token" }, 500);
      }

      const discordMe = await ofetch<z.infer<typeof discordMeSchema>>(
        "https://discord.com/api/users/@me",
        {
          headers: {
            Authorization: `Bearer ${discordToken.data.access_token}`,
          },
        },
      );

      const me = discordMeSchema.safeParse(discordMe);

      if (!me.success) {
        console.warn(
          "[Discord] Failed to request user: %s",
          me.error.toString(),
        );

        return c.json({ error: "Failed to request user" }, 500);
      }

      const userId = me.data.id;

      if (env.ALLOWED_USERS.length > 0 && !env.ALLOWED_USERS.includes(userId)) {
        return c.json({ error: "User is not whitelisted" }, 403);
      }

      const redis = c.get("redis");

      const secretsKey = `secrets:${sha1(env.PEPPER_SECRETS + userId)}`;

      let secret = await match(env.STORE, {
        cloudflare: () => c.env.KV.get(secretsKey),
        redis: () => redis.get(secretsKey),
      });

      if (!secret) {
        const bytes = randomBytes(48);
        secret = bytes.toString("hex");

        await match(env.STORE, {
          cloudflare: async () => {
            await c.env.KV.put(secretsKey, secret!);
          },
          redis: async () => {
            await redis.set(secretsKey, secret!);
          },
        });
      }

      return c.json({ secret });
    },
  )
  .get("/settings", async (c) => {
    const env = c.get("env");

    return c.json({
      clientId: env.DISCORD_CLIENT_ID,
      redirectUri: env.DISCORD_REDIRECT_URI,
    });
  });
