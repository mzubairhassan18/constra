import { connection } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  await connection(); // request-time only: CI builds have no DATABASE_URL
  const rows =
    await sql`SELECT count(*)::int AS tables FROM pg_tables WHERE schemaname = 'public'`;
  const roles =
    await sql`SELECT count(*)::int AS roles FROM roles`;
  return Response.json({
    ok: true,
    db: "neon constra (ap-southeast-1)",
    tables: rows[0].tables,
    roles: roles[0].roles,
  });
}
