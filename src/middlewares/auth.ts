import { createFactory } from "hono/factory";
import { validator } from "hono/validator";
import { object, string } from "zod";
import { sha1 } from "../util/hash";

const factory = createFactory();

const AuthorizationSchema = object({ authorization: string() });

const handlers = factory.createHandlers(
  validator("header", async (data, c) => {
    const parsed = AuthorizationSchema.safeParse(data);

    if (!parsed.success) {
      return c.json({ error: "Missing authorization" }, 401);
    }

    return parsed.data;
  }),
  async (c, next) => {
    const authToken = c.req.valid("header").authorization;
    const token = Buffer.from(authToken, "base64");

    const parsed = string()
      .regex(/^[a-z0-9]+:[0-9]+$/)
      .safeParse(token.toString());

    if (!parsed.success) {
      return c.json({ error: "Invalid authorization" }, 401);
    }

    const [secret, userId] = parsed.data.split(":");

    const Env = c.get("Env");
    const Redis = c.get("Redis");

    const stored = await Redis.get(
      `secrets:${sha1(Env.PEPPER_SECRETS + userId)}`
    );

    if (!stored || stored !== secret) {
      return c.json({ error: "Invalid authorization" }, 401);
    }

    c.set("userId", userId);

    await next();
  }
);

export function requireAuth() {
  return handlers;
}
