// Pure chat domain — no framework imports.
export const MAX_BODY_LENGTH = 2000;

/** Order-independent key for a 1:1 pair. */
export function directKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export function validateBody(
  body: string,
): { ok: true; body: string } | { ok: false; error: "empty" | "too_long" } {
  const trimmed = body.trim();
  if (trimmed.length === 0) return { ok: false, error: "empty" };
  if (body.length > MAX_BODY_LENGTH) return { ok: false, error: "too_long" };
  return { ok: true, body };
}

/** Counts messages strictly after lastReadAt (all when never read). */
export function countUnread(
  messageAts: (string | Date)[],
  lastReadAt: string | Date | null,
): number {
  if (lastReadAt === null) return messageAts.length;
  const cut = new Date(lastReadAt).getTime();
  return messageAts.filter((m) => new Date(m).getTime() > cut).length;
}
