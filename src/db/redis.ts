import { Context } from "hono";
import { env as runtimeEnv } from "hono/adapter";
import { parseEnv } from "znv";
import { Env } from "../config/redis";

export async function redis(ctx: Context) {
  const { createClient } = await import("redis");

  const e = parseEnv(runtimeEnv(ctx), Env);

  return createClient({ url: e.REDIS_URI });
}
