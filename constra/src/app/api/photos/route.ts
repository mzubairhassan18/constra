import { getSessionUser } from "@/lib/session";
import { getPhoto } from "@/lib/r2";
import sql from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const portalToken = url.searchParams.get("portal");

  if (portalToken) {
    // Public client link: key must belong to the token's project.
    const t = await sql`SELECT project_id FROM portal_tokens WHERE token = ${portalToken}`;
    if (t.length === 0) return new Response("Not found", { status: 404 });
    const m = /^reports\/([^/]+)\//.exec(key);
    if (!m || m[1] !== (t[0].project_id as string)) {
      return new Response("Not found", { status: 404 });
    }
  } else {
    const { redirect } = await import("next/navigation");
    if (!(await getSessionUser())) redirect("/login");
  }

  const photo = await getPhoto(key);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(photo.body, {
    headers: { "Content-Type": photo.contentType },
  });
}
