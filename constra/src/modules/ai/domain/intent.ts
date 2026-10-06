// Pure intent router (keyword v1 — deterministic, offline).
// An LLM gateway may re-rank/clarify, but tools only run on these intents.
export type Intent =
  | { kind: "dues"; months?: number }
  | { kind: "stage_costs"; project?: string }
  | { kind: "survival" }
  | { kind: "navigate"; screen: string }
  | { kind: "unknown" };

const SCREENS: Record<string, string> = {
  bills: "/bills",
  bill: "/bills",
  finance: "/finance",
  payroll: "/hr",
  hr: "/hr",
  employee: "/hr",
  project: "/projects",
  operation: "/operations",
  operations: "/operations",
  manpower: "/operations",
  chat: "/chat",
  notification: "/notifications",
  master: "/masters",
  supplier: "/masters",
};

export function routeIntent(text: string): Intent {
  const t = text.toLowerCase();

  const openMatch = /(?:open|go to|show|navigate to)\s+([a-z ]+?)(?:\s+screen|\s+page)?$/.exec(t);
  if (openMatch) {
    for (const [key, screen] of Object.entries(SCREENS)) {
      if (openMatch[1].includes(key)) return { kind: "navigate", screen };
    }
  }

  if (/(due|dues|payable|owe|overdue|pending payment|receivable)/.test(t)) {
    const m = /(\d+)\s*month/.exec(t);
    return { kind: "dues", months: m ? Number(m[1]) : undefined };
  }
  if (/(stage cost|project cost|how much.*spent|cost.*stage|boq.*actual|overrun)/.test(t)) {
    const m = /(?:project|for)\s+([a-z0-9 ]+)/.exec(t);
    return { kind: "stage_costs", project: m?.[1]?.trim() };
  }
  if (/(surviv|how many projects|pipeline|forecast|next year|runway)/.test(t)) {
    return { kind: "survival" };
  }
  for (const [key, screen] of Object.entries(SCREENS)) {
    if (t.includes(`open ${key}`) || t.includes(`show ${key}`)) {
      return { kind: "navigate", screen };
    }
  }
  return { kind: "unknown" };
}
