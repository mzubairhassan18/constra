import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getPhoto } from "@/lib/r2";

export async function GET(request: Request) {
  if (!(await getSessionUser())) redirect("/login");
  const key = new URL(request.url).searchParams.get("key") ?? "";
  const photo = await getPhoto(key);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(photo.body, {
    headers: { "Content-Type": photo.contentType },
  });
}
