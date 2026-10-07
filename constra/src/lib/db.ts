import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

let client: Sql | null = null;

function get(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = neon(url);
  }
  return client;
}

/**
 * Lazy Neon client: constructing at import time would crash builds
 * (CI has no DATABASE_URL) and prerenders. First query wins.
 */
const sql = new Proxy(function () {}, {
  apply(_t, _thisArg, args) {
    return (get() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_t, prop) {
    return (get() as unknown as Record<PropertyKey, unknown>)[prop];
  },
}) as unknown as Sql;

export default sql;
