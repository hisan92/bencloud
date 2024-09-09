import { parseEnv } from "znv";
import { string } from "zod";

export const Env = parseEnv(process.env, {
  REDIS_URI: string().url().default("redis://localhost:6379"),
});
