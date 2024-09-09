import { randomBytes } from "crypto";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { ofetch } from "ofetch";
import { object, string } from "zod";
import { sha1 } from "../util/hash";

const CallbackSchema = object({ code: string() });
const DiscordTokenSchema = object({ access_token: string() });
const DiscordMeSchema = object({ id: string() });

export const discord = new Hono()
  .get(
    "/callback",
    validator("query", async (data, c) => {
      const parsed = CallbackSchema.safeParse(data);

      if (!parsed.success) {
        return c.json({ error: "Missing code" }, 400);
      }

      return parsed.data;
    }),
    async (c) => {
      const { code } = c.req.valid("query");
      const Env = c.get("Env");

      const params = new URLSearchParams();

      params.append("client_id", Env.DISCORD_CLIENT_ID);
      params.append("client_secret", Env.DISCORD_CLIENT_SECRET);
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", Env.DISCORD_REDIRECT_URI);
      params.append("scope", "identify");

      const token = await ofetch<Zod.infer<typeof DiscordTokenSchema>>(
        "https://discord.com/api/oauth2/token",
        {
          method: "post",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      const discordToken = DiscordTokenSchema.safeParse(token);

      if (!discordToken.success) {
        console.warn(
          "[Discord] Failed to request access token: %s",
          discordToken.error.toString()
        );

        return c.json({ error: "Failed to request access token" }, 500);
      }

      const discordMe = await ofetch<Zod.infer<typeof DiscordMeSchema>>(
        "https://discord.com/api/users/@me",
        {
          headers: {
            Authorization: `Bearer ${discordToken.data.access_token}`,
          },
        }
      );

      const me = DiscordMeSchema.safeParse(discordMe);

      if (!me.success) {
        console.warn(
          "[Discord] Failed to request user: %s",
          me.error.toString()
        );

        return c.json({ error: "Failed to request user" }, 500);
      }

      const userId = me.data.id;

      if (Env.ALLOWED_USERS.length > 0 && !Env.ALLOWED_USERS.includes(userId)) {
        return c.json({ error: "User is not whitelisted" }, 403);
      }

      const Redis = c.get("Redis");

      let secret = await Redis.get(
        `secrets:${sha1(Env.PEPPER_SECRETS + userId)}`
      );

      if (!secret) {
        const bytes = randomBytes(48);
        secret = bytes.toString("hex");

        await Redis.set(`secrets:${sha1(Env.PEPPER_SECRETS + userId)}`, secret);
      }

      return c.json({ secret });
    }
  )
  .get("/settings", async (c) => {
    const Env = c.get("Env");

    return c.json({
      clientId: Env.DISCORD_CLIENT_ID,
      redirectUri: Env.DISCORD_REDIRECT_URI,
    });
  });
