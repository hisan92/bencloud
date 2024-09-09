import { Hono } from "hono";
import { sha1 } from "../util/hash";

export const settings = new Hono()
  .options(async (c) => {
    const userId = c.get("userId");
    const Env = c.get("Env");
    const Redis = c.get("Redis");

    const written = await Redis.hGet(
      `settings:${sha1(Env.PEPPER_SETTINGS + userId)}`,
      "written"
    );

    if (!written) {
      return c.notFound();
    }

    return new Response(null, { headers: { ETag: written }, status: 204 });
  })
  .get(async (c) => {
    const userId = c.get("userId");
    const Env = c.get("Env");
    const Redis = c.get("Redis");

    const settings = await Redis.hmGet(
      `settings:${sha1(Env.PEPPER_SETTINGS + userId)}`,
      ["value", "written"]
    );

    if (!settings[0]) {
      return c.notFound();
    }

    const [value, written] = [
      new TextEncoder().encode(settings[0]),
      settings[1],
    ];

    const ifm = c.req.header("if-none-match");

    if (ifm && ifm === written) {
      return new Response(null, { status: 304 });
    }

    return new Response(value, {
      headers: { "Content-Type": "application/octet-stream", ETag: written },
    });
  })
  .put(async (c) => {
    if (c.req.header("Content-Type") !== "application/octet-stream") {
      return c.json(
        { error: "Content type must be application/octet-stream" },
        415
      );
    }

    const Env = c.get("Env");

    const body = await c.req.arrayBuffer();

    if (body.byteLength > Env.SIZE_LIMIT) {
      return c.json({ error: "Settings are too large" }, 413);
    }

    const userId = c.get("userId");
    const Redis = c.get("Redis");

    const written = Date.now();

    await Redis.hSet(`settings:${sha1(Env.PEPPER_SETTINGS + userId)}`, {
      value: Buffer.from(body),
      written,
    });

    return c.json({ written });
  })
  .delete(async (c) => {
    const userId = c.get("userId");
    const Env = c.get("Env");
    const Redis = c.get("Redis");

    await Redis.del(`settings:${sha1(Env.PEPPER_SETTINGS + userId)}`);

    return new Response(null, { status: 204 });
  });
