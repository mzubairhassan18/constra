// Pure HR domain — no framework imports.
export interface PayrollPolicy {
  monthlyDivisorDays: number;
  dailyHours: number;
  overtimeMultiplier: number;
}

export interface Employee {
  kind: "permanent" | "daily_wager";
  monthlySalary?: number;
  hourlyRate?: number;
  dayRate?: number;
}

export interface Assignment {
  employeeId: string;
  projectId: string;
  stageId?: string | null;
  fromDate: string;
  toDate: string | null;
  allocationPct: number;
}

export function effectiveHourlyRate(e: Employee, p: PayrollPolicy): number {
  if (e.kind === "permanent") {
    if (e.monthlySalary == null) throw new Error("permanent needs monthlySalary");
    return e.monthlySalary / p.monthlyDivisorDays / p.dailyHours;
  }
  if (e.hourlyRate != null) return e.hourlyRate;
  if (e.dayRate != null) return e.dayRate / p.dailyHours;
  throw new Error("daily wager needs hourlyRate or dayRate");
}

export function validateAssignment(
  a: Assignment,
): { ok: true } | { ok: false; error: string } {
  if (a.toDate !== null && a.toDate < a.fromDate)
    return { ok: false, error: "toDate before fromDate" };
  if (a.allocationPct < 1 || a.allocationPct > 100)
    return { ok: false, error: "allocation must be 1..100" };
  return { ok: true };
}
