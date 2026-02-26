import { Context } from "hono";
import { env as runtimeEnv } from "hono/adapter";
import { parseEnv } from "znv";
import z from "zod";

export function env(ctx: Context) {
  return parseEnv(runtimeEnv(ctx), {
    // PORT: z.coerce.number().int().positive().default(3000),
    STORE: z.enum(["redis", "cloudflare"]).default("redis"),
    ROOT_REDIRECT: z.string().url(),
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    DISCORD_REDIRECT_URI: z.string().url(),
    PEPPER_SECRETS: z.string(),
    PEPPER_SETTINGS: z.string(),
    SIZE_LIMIT: z.coerce.number().int().positive().default(33554432),
    ALLOWED_USERS: z
      .string()
      .transform((value) => value.split(",").map((v) => v.trim()))
      .refine((value) => value.every((v) => /^[0-9]+$/.test(v)), {
        message: "All Discord user IDs must be numeric",
      })
      .default(""),
  });
}
