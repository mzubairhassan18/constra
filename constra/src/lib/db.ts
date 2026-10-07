import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

function fresh(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

/**
 * Per-invocation Neon client (no global caching).
 *
 * OpenNext/Workers troubleshooting mandates this: clients instantiated
 * once and reused across requests crash with "Cannot perform I/O on
 * behalf of a different request". The HTTP driver is stateless, so a
 * fresh client per call is cheap and safe. The URL is read lazily so
 * builds (no env) don't crash at import time.
 */
const sql = new Proxy(function () {}, {
  apply(_t, _thisArg, args: unknown[]) {
    const client = fresh() as unknown as (
      ...a: unknown[]
    ) => Promise<Record<string, unknown>[]>;
    return client(...args);
  },
  get(_t, prop: string | symbol) {
    return (fresh() as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as unknown as Sql;

export default sql;
