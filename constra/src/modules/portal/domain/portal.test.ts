import { describe, expect, it } from "vitest";
import {
  toPortalProject,
  type FullProject,
  type PortalFlags,
} from "./portal";

const FULL: FullProject = {
  id: "p-42",
  name: "Villa Project",
  clientName: "Villa Client",
  location: "Dubai",
  status: "active",
  progressPct: 62,
  agreementAmount: 250000,
  stages: [
    {
      id: "s-1",
      name: "Foundation",
      status: "completed",
      plannedStart: "2026-08-01",
      plannedEnd: "2026-08-20",
    },
    {
      id: "s-2",
      name: "Structure",
      status: "in_progress",
      plannedStart: "2026-08-21",
      plannedEnd: "2026-09-30",
    },
  ],
  invoices: [{ id: "inv-1", amount: 105000, status: "partial" }],
  receipts: [{ id: "rc-1", invoiceId: "inv-1", amount: 50000 }],
  nextPaymentDue: { amount: 55000, dueDate: "2026-10-15" },
  costs: { actual: 180000, boq: 170000, variance: 10000 },
  photos: [{ url: "https://cdn/x.jpg", caption: "Slab", takenAt: "2026-09-01" }],
  delays: [{ stageId: "s-2", reason: "Cement shortage", days: 5 }],
  supplierRates: [{ supplier: "SECRET_SUPPLIER", material: "Cement", rate: 999.99 }],
  payroll: [{ employee: "SECRET_EMP", monthlySalary: 8888 }],
  billLines: [{ billId: "SECRET_BILL", material: "Steel", qty: 10, rate: 777 }],
};

const flags = (
  showCosts: boolean,
  showPhotos: boolean,
  showDelays: boolean,
): PortalFlags => ({ showCosts, showPhotos, showDelays });

const ALL_COMBOS: PortalFlags[] = [false, true].flatMap((c) =>
  [false, true].flatMap((p) =>
    [false, true].map((d) => flags(c, p, d)),
  ),
);

describe("toPortalProject — internal fields never leak", () => {
  it("strips supplier rates, payroll and bill lines under every flag combination", () => {
    for (const f of ALL_COMBOS) {
      const dto = toPortalProject(FULL, f) as unknown as Record<string, unknown>;
      expect(dto).not.toHaveProperty("supplierRates");
      expect(dto).not.toHaveProperty("payroll");
      expect(dto).not.toHaveProperty("billLines");
      const raw = JSON.stringify(dto);
      expect(raw).not.toContain("SECRET_SUPPLIER");
      expect(raw).not.toContain("SECRET_EMP");
      expect(raw).not.toContain("SECRET_BILL");
      expect(raw).not.toContain("8888");
    }
  });

  it("does not mutate the input", () => {
    const before = JSON.stringify(FULL);
    toPortalProject(FULL, flags(false, false, false));
    expect(JSON.stringify(FULL)).toBe(before);
  });
});

describe("toPortalProject — flag gating", () => {
  it("includes costs only when showCosts is true", () => {
    const on = toPortalProject(FULL, flags(true, false, false)) as unknown as Record<
      string,
      unknown
    >;
    expect(on["costs"]).toEqual(FULL.costs);
    const off = toPortalProject(FULL, flags(false, false, false)) as unknown as Record<
      string,
      unknown
    >;
    expect(off).not.toHaveProperty("costs");
  });

  it("includes photos only when showPhotos is true", () => {
    const on = toPortalProject(FULL, flags(false, true, false)) as unknown as Record<
      string,
      unknown
    >;
    expect(on["photos"]).toEqual(FULL.photos);
    const off = toPortalProject(FULL, flags(false, false, false)) as unknown as Record<
      string,
      unknown
    >;
    expect(off).not.toHaveProperty("photos");
  });

  it("includes delays only when showDelays is true", () => {
    const on = toPortalProject(FULL, flags(false, false, true)) as unknown as Record<
      string,
      unknown
    >;
    expect(on["delays"]).toEqual(FULL.delays);
    const off = toPortalProject(FULL, flags(false, false, false)) as unknown as Record<
      string,
      unknown
    >;
    expect(off).not.toHaveProperty("delays");
  });
});

describe("toPortalProject — client-safe fields always survive", () => {
  it("keeps agreement amount, progress, stages, invoices and next payment under all flags", () => {
    for (const f of ALL_COMBOS) {
      const dto = toPortalProject(FULL, f);
      expect(dto.id).toBe("p-42");
      expect(dto.name).toBe("Villa Project");
      expect(dto.progressPct).toBe(62);
      expect(dto.agreementAmount).toBe(250000);
      expect(dto.stages).toHaveLength(2);
      expect(dto.invoices).toHaveLength(1);
      expect(dto.nextPaymentDue).toEqual({
        amount: 55000,
        dueDate: "2026-10-15",
      });
    }
  });
});
