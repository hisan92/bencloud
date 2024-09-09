import { Env } from "./config/env";
import { Redis } from "./db/redis";

declare module "hono" {
  interface ContextVariableMap {
    Env: typeof Env;
    Redis: typeof Redis;
    userId: string;
  }
}
