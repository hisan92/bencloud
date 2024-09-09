import { createHash } from "crypto";

export function sha1(value: string) {
  return createHash("sha1").update(value).digest("hex");
}
