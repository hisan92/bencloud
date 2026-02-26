import type { KVNamespace } from "@cloudflare/workers-types";
import { env } from "./config/env";
import { redis } from "./db/redis";

declare module "hono" {
  interface ContextVariableMap {
    env: ReturnType<typeof env>;
    redis: Awaited<ReturnType<typeof redis>>;
    userId: string;
  }
}

declare global {
  interface Bindings {
    KV: KVNamespace;
  }
}
