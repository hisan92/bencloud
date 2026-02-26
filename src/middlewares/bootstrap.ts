import { createMiddleware } from "hono/factory";
import { env } from "../config/env";
import { redis } from "../db/redis";

export function bootstrap() {
  return createMiddleware(async (c, next) => {
    const Env = env(c);
    const enableRedis = Env.STORE === "redis";

    const Redis = await redis(c);

    c.set("env", Env);
    c.set("redis", Redis);

    if (enableRedis && !Redis.isOpen) {
      await Redis.connect();
    }

    await next();
  });
}
