import { connection } from "next/server";
import sql from "@/lib/db";

/** Leak-free diagnostics: booleans + error messages only, never values. */
export async function GET() {
  await connection();
  const out: Record<string, unknown> = {
    hasDbUrl: !!process.env.DATABASE_URL,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    runtime: (globalThis as Record<string, unknown>).navigator
      ? "worker"
      : "node",
  };
  try {
    const rows = await sql`SELECT 1 AS ok`;
    out.db = rows;
  } catch (e) {
    out.dbError =
      e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 500) : String(e).slice(0, 200);
  }
  return Response.json(out);
}
