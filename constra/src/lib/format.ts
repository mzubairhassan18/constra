/** Neon returns DATE as a Date object (or string) — normalize to YYYY-MM-DD (TZ-safe). */
export function fmtDate(v: unknown): string {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (v == null) return "";
  return String(v).slice(0, 10);
}

/** Display money consistently (server-safe, no Intl surprises on Workers). */
export function fmtMoney(n: number, digits = 2): string {
  return `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}
