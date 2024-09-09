import { createMiddleware } from "hono/factory";
import { Env } from "../config/env";
import { Redis } from "../db/redis";

export function bootstrap() {
  return createMiddleware(async (c, next) => {
    c.set("Env", Env);
    c.set("Redis", Redis);

    if (!Redis.isReady) {
      await Redis.connect();
    }

    await next();
  });
}
