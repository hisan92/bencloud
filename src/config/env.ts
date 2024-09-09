import { parseEnv } from "znv";
import { coerce, string } from "zod";

export const Env = parseEnv(process.env, {
  APP_PORT: coerce.number().int().positive().default(4000),
  ROOT_REDIRECT: string().url(),
  DISCORD_CLIENT_ID: string(),
  DISCORD_CLIENT_SECRET: string(),
  DISCORD_REDIRECT_URI: string().url(),
  PEPPER_SECRETS: string(),
  PEPPER_SETTINGS: string(),
  SIZE_LIMIT: coerce.number().int().positive().default(33554432),
  ALLOWED_USERS: string()
    .transform((value) => value.split(","))
    .refine((value) => value.every((v) => /^[0-9]+$/.test(v)), {
      message: "All Discord user IDs must be numeric",
    })
    .default(""),
});
