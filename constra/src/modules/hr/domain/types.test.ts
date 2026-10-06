import { describe, it, expect } from "vitest";
import {
  effectiveHourlyRate,
  validateAssignment,
  type Assignment,
  type Employee,
  type PayrollPolicy,
} from "./types";

const defaultPolicy: PayrollPolicy = {
  monthlyDivisorDays: 26,
  dailyHours: 8,
  overtimeMultiplier: 1.25,
};

const permanent = (monthlySalary: number): Employee => ({
  kind: "permanent",
  monthlySalary,
});

const wagerByHour = (hourlyRate: number): Employee => ({
  kind: "daily_wager",
  hourlyRate,
});

const wagerByDay = (dayRate: number): Employee => ({
  kind: "daily_wager",
  dayRate,
});

function assignment(over: Partial<Assignment> = {}): Assignment {
  return {
    employeeId: "emp-1",
    projectId: "proj-1",
    stageId: "stage-1",
    fromDate: "2026-01-01",
    toDate: null,
    allocationPct: 100,
    ...over,
  };
}

describe("effectiveHourlyRate", () => {
  it("derives permanent rate as monthly / 26 / 8", () => {
    expect(effectiveHourlyRate(permanent(26000), defaultPolicy)).toBeCloseTo(125, 5);
  });

  it("respects custom payroll_policy divisor/hours", () => {
    const policy: PayrollPolicy = {
      monthlyDivisorDays: 30,
      dailyHours: 9,
      overtimeMultiplier: 1.25,
    };
    expect(effectiveHourlyRate(permanent(27000), policy)).toBeCloseTo(100, 5);
  });

  it("uses hourlyRate directly for daily wager", () => {
    expect(effectiveHourlyRate(wagerByHour(20), defaultPolicy)).toBe(20);
  });

  it("derives daily wager rate as dayRate / 8", () => {
    expect(effectiveHourlyRate(wagerByDay(160), defaultPolicy)).toBe(20);
  });

  it("prefers hourlyRate when both hourlyRate and dayRate are set", () => {
    const e: Employee = { kind: "daily_wager", hourlyRate: 22, dayRate: 160 };
    expect(effectiveHourlyRate(e, defaultPolicy)).toBe(22);
  });

  it("throws for permanent without monthlySalary", () => {
    expect(() => effectiveHourlyRate({ kind: "permanent" }, defaultPolicy)).toThrow();
  });

  it("throws for daily wager without any rate", () => {
    expect(() => effectiveHourlyRate({ kind: "daily_wager" }, defaultPolicy)).toThrow();
  });
});

describe("validateAssignment", () => {
  it("accepts an open-ended assignment (toDate null)", () => {
    expect(validateAssignment(assignment())).toEqual({ ok: true });
  });

  it("accepts toDate equal to fromDate (single-day assignment)", () => {
    const r = validateAssignment(
      assignment({ fromDate: "2026-01-05", toDate: "2026-01-05" }),
    );
    expect(r).toEqual({ ok: true });
  });

  it("rejects toDate before fromDate", () => {
    const r = validateAssignment(
      assignment({ fromDate: "2026-02-01", toDate: "2026-01-31" }),
    );
    expect(r.ok).toBe(false);
  });

  it("rejects allocation below 1 and above 100", () => {
    expect(validateAssignment(assignment({ allocationPct: 0 })).ok).toBe(false);
    expect(validateAssignment(assignment({ allocationPct: 101 })).ok).toBe(false);
  });

  it("accepts boundary allocations 1 and 100", () => {
    expect(validateAssignment(assignment({ allocationPct: 1 }))).toEqual({ ok: true });
    expect(validateAssignment(assignment({ allocationPct: 100 }))).toEqual({ ok: true });
  });
});
