// Applies a SQL migration file to Neon. Usage: node scripts/apply-migration.mjs ../db/migrations/0010_x.sql
// Reads DATABASE_URL from .env.local (never prints it).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/apply-migration.mjs <migration.sql>");
  process.exit(1);
}
const sqlText = readFileSync(resolve(file), "utf8");

const { config } = await import("dotenv");
config({ path: new URL("../.env.local", import.meta.url) });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (.env.local missing?)");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);
// Neon HTTP driver: one statement per call.
const statements = sqlText
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);
for (const stmt of statements) {
  await sql.query(stmt);
}
console.log(`applied ${file} (${statements.length} statements)`);
