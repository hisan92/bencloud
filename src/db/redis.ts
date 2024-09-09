import { createClient } from "redis";
import { Env } from "../config/redis";

export const Redis = createClient({ url: Env.REDIS_URI });
