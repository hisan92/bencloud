import z from "zod";

export const Env = {
  REDIS_URI: z.string().url().max(256).default("redis://localhost:6379"),
};
