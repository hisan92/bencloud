import z from "zod";
import { hono } from "../hono";
import { sha1 } from "../util/hash";
import { match } from "../util/match";
import { json } from "../validators/json";

const settingsSchema = z.object({
  value: z.string(),
  written: z
    .string()
    .min(13)
    .regex(/^[0-9]$/),
});

export const settings = hono()
  .options(async (c) => {
    const userId = c.get("userId");
    const env = c.get("env");
    const redis = c.get("redis");

    const settingsKey = `settings:${sha1(env.PEPPER_SETTINGS + userId)}`;

    const written = await match(env.STORE, {
      cloudflare: () =>
        c.env.KV.get(settingsKey).then((value) => {
          if (value) {
            const _json = json().safeParse(value);

            if (_json.error) {
              return;
            }

            const _settings = settingsSchema.safeParse(_json.data);

            if (_settings.error) {
              return;
            }

            return _settings.data.written;
          }
        }),
      redis: () => redis.hGet(settingsKey, "written"),
    });

    if (!written) {
      return c.notFound();
    }

    return c.body(null, 204, { ETag: written });
  })
  .get(async (c) => {
    const userId = c.get("userId");
    const env = c.get("env");
    const redis = c.get("redis");

    const settingsKey = `settings:${sha1(env.PEPPER_SETTINGS + userId)}`;

    const settings = await match(env.STORE, {
      cloudflare: () =>
        c.env.KV.get(settingsKey).then((value) => {
          if (value) {
            const _json = json().safeParse(value);

            if (_json.error) {
              return [];
            }

            const _settings = settingsSchema.safeParse(_json.data);

            if (_settings.error) {
              return [];
            }

            return [_settings.data.value, _settings.data.written];
          }

          return [];
        }),
      redis: () => redis.hmGet(settingsKey, ["value", "written"]),
    });

    if (!settings[0]) {
      return c.notFound();
    }

    const [value, written] = [Buffer.from(settings[0], "base64"), settings[1]];

    const ifm = c.req.header("if-none-match");

    if (ifm && ifm === written) {
      return c.body(null, 304);
    }

    const stream = new ReadableStream<Buffer>({
      start: (controller) => {
        controller.enqueue(value);
        controller.close();
      },
    });

    return c.body(stream, {
      headers: { "Content-Type": "application/octet-stream", ETag: written },
    });
  })
  .put(async (c) => {
    if (c.req.header("Content-Type") !== "application/octet-stream") {
      return c.json(
        { error: "Content type must be application/octet-stream" },
        415,
      );
    }

    const env = c.get("env");

    const body = await c.req.arrayBuffer();

    if (body.byteLength > env.SIZE_LIMIT) {
      return c.json({ error: "Settings are too large" }, 413);
    }

    const userId = c.get("userId");
    const redis = c.get("redis");

    const written = Date.now();

    const settingsKey = `settings:${sha1(env.PEPPER_SETTINGS + userId)}`;

    const data = {
      value: Buffer.from(body).toString("base64"),
      written,
    };

    await match(env.STORE, {
      cloudflare: async () => {
        await c.env.KV.put(settingsKey, JSON.stringify(data));
      },
      redis: async () => {
        await redis.hSet(settingsKey, data);
      },
    });

    return c.json({ written });
  })
  .delete(async (c) => {
    const userId = c.get("userId");
    const env = c.get("env");
    const redis = c.get("redis");

    const settingsKey = `settings:${sha1(env.PEPPER_SETTINGS + userId)}`;

    await match(env.STORE, {
      cloudflare: async () => {
        await c.env.KV.delete(settingsKey);
      },
      redis: async () => {
        await redis.del(settingsKey);
      },
    });

    return c.body(null, 204);
  });
