import { Hono } from "hono";
import { getContext } from "hono/context-storage";

export interface Env {
  Bindings: Bindings;
}

export function hono() {
  return new Hono<Env>();
}

export function context() {
  return getContext<Env>();
}
