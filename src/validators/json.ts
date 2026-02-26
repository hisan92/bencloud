import z from "zod";

type Literal = z.infer<ReturnType<typeof literal>>;
type Json = Literal | { [key: string]: Json } | Json[];

function literal() {
  return z.union([z.string(), z.number(), z.boolean(), z.null()]);
}

export function json(): z.ZodType<Json> {
  return z.lazy(() => z.union([literal(), z.array(json()), z.record(json())]));
}
