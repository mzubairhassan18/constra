import { neon } from "@neondatabase/serverless";

/**
 * Per-invocation Neon client (no global caching).
 *
 * OpenNext/Workers troubleshooting mandates this: clients instantiated
 * once and reused across requests crash with "Cannot perform I/O on
 * behalf of a different request". The HTTP driver is stateless, so a
 * fresh client per call is cheap and safe. DATABASE_URL is still read
 * lazily so builds (no env) don't crash at import time.
 */
function fresh() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

type Tag = ReturnType<typeof neon>;

const sql = Object.assign(
  function (strings: TemplateStringsArray, ...values: unknown[]) {
    return (fresh() as unknown as (
      s: TemplateStringsArray,
      ...v: unknown[]
    ) => Promise<Record<string, unknown>[]>)(
      strings as TemplateStringsArray,
      ...values
    );
  },
  {
    query(text: string, params: unknown[]) {
      return fresh().query(text, params as never[]);
    },
  },
) as unknown as Tag;

export default sql;
