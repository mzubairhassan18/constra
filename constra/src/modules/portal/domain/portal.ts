// Pure portal redaction — internal costs never leave the server unless flagged.
export interface PortalFlags {
  showCosts: boolean;
  showPhotos: boolean;
  showDelays: boolean;
}

export interface FullProject {
  id: string;
  name: string;
  clientName: string | null;
  location: string | null;
  status: string;
  progressPct: number;
  agreementAmount: number | null;
  stages: { id: string; name: string; status: string; plannedStart: string | null; plannedEnd: string | null }[];
  invoices: { id: string; amount: number; status: string }[];
  receipts: { id: string; invoiceId: string; amount: number }[];
  nextPaymentDue: { amount: number; dueDate: string } | null;
  costs?: { actual: number; boq: number; variance: number };
  photos?: { url: string; caption: string; takenAt: string }[];
  delays?: { stageId: string; reason: string; days: number }[];
  supplierRates?: unknown;
  payroll?: unknown;
  billLines?: unknown;
}

export interface PortalProject {
  id: string;
  name: string;
  clientName: string | null;
  location: string | null;
  status: string;
  progressPct: number;
  agreementAmount: number | null;
  stages: FullProject["stages"];
  invoices: FullProject["invoices"];
  receipts: FullProject["receipts"];
  nextPaymentDue: FullProject["nextPaymentDue"];
  costs?: FullProject["costs"];
  photos?: FullProject["photos"];
  delays?: FullProject["delays"];
}

/** Build the client-safe DTO. supplierRates/payroll/billLines are dropped unconditionally. */
export function toPortalProject(full: FullProject, flags: PortalFlags): PortalProject {
  const dto: PortalProject = {
    id: full.id,
    name: full.name,
    clientName: full.clientName,
    location: full.location,
    status: full.status,
    progressPct: full.progressPct,
    agreementAmount: full.agreementAmount,
    stages: full.stages.map((s) => ({ ...s })),
    invoices: full.invoices.map((i) => ({ ...i })),
    receipts: full.receipts.map((r) => ({ ...r })),
    nextPaymentDue: full.nextPaymentDue ? { ...full.nextPaymentDue } : null,
  };
  if (flags.showCosts && full.costs) dto.costs = { ...full.costs };
  if (flags.showPhotos && full.photos) dto.photos = full.photos.map((p) => ({ ...p }));
  if (flags.showDelays && full.delays) dto.delays = full.delays.map((d) => ({ ...d }));
  return dto;
}
