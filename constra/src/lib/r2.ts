import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET ?? "constra-photos";

export function r2Enabled(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

function client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/** Uploads a site photo. Key space is restricted to reports/ and bills/ prefixes. */
export async function putPhoto(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  if (!key.startsWith("reports/") && !key.startsWith("bills/")) {
    throw new Error("bad key prefix");
  }
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getPhoto(
  key: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  if (!key.startsWith("reports/") && !key.startsWith("bills/")) return null;
  try {
    const out = await client().send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    if (!out.Body) return null;
    return {
      body: out.Body.transformToWebStream(),
      contentType: out.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export function reportPhotoKey(
  projectId: string,
  date: string,
  filename: string,
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const rand = Math.random().toString(36).slice(2, 10);
  return `reports/${projectId}/${date}/${rand}-${safe}`;
}
