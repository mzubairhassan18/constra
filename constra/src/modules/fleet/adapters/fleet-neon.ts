import sql from "@/lib/db";
import { fmtDate } from "@/lib/format";

export interface VehicleRow {
  id: string;
  plateNo: string;
  type: string;
  mulkiaExpiry: string | null;
  insuranceExpiry: string | null;
  maintenanceTotal: number;
  fineTotal: number;
}

export async function listVehicles(): Promise<VehicleRow[]> {
  const rows = await sql`
    SELECT v.id, v.plate_no, v.type, v.mulkia_expiry, v.insurance_expiry,
           COALESCE(m.total, 0) AS maintenance_total,
           COALESCE(f.total, 0) AS fine_total
    FROM vehicles v
    LEFT JOIN (SELECT vehicle_id, SUM(cost) AS total FROM vehicle_maintenance GROUP BY vehicle_id) m
      ON m.vehicle_id = v.id
    LEFT JOIN (SELECT vehicle_id, SUM(amount) AS total FROM vehicle_fines GROUP BY vehicle_id) f
      ON f.vehicle_id = v.id
    ORDER BY v.plate_no`;
  return rows.map((r) => ({
    id: r.id as string,
    plateNo: r.plate_no as string,
    type: r.type as string,
    mulkiaExpiry: r.mulkia_expiry ? fmtDate(r.mulkia_expiry) : null,
    insuranceExpiry: r.insurance_expiry ? fmtDate(r.insurance_expiry) : null,
    maintenanceTotal: Number(r.maintenance_total),
    fineTotal: Number(r.fine_total),
  }));
}

export async function addVehicle(input: {
  plateNo: string; type: string; mulkiaExpiry?: string; insuranceExpiry?: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO vehicles (plate_no, type, mulkia_expiry, insurance_expiry)
    VALUES (${input.plateNo}, ${input.type},
      ${input.mulkiaExpiry || null}::date, ${input.insuranceExpiry || null}::date)
    RETURNING id`;
  return rows[0].id as string;
}

export async function addMaintenance(input: {
  vehicleId: string; date: string; cost: number; description?: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO vehicle_maintenance (vehicle_id, date, cost, description)
    VALUES (${input.vehicleId}, ${input.date}::date, ${input.cost}, ${input.description || null})
    RETURNING id`;
  return rows[0].id as string;
}

export async function addFine(input: {
  vehicleId: string; date: string; amount: number; reason?: string; driver?: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO vehicle_fines (vehicle_id, date, amount, reason, driver)
    VALUES (${input.vehicleId}, ${input.date}::date, ${input.amount},
      ${input.reason || null}, ${input.driver || null})
    RETURNING id`;
  return rows[0].id as string;
}

export interface DocumentRow {
  id: string; projectId: string; name: string; r2Key: string;
  version: number; uploadedBy: string | null;
}

export async function listDocuments(projectId: string): Promise<DocumentRow[]> {
  const rows = await sql`
    SELECT id, project_id, name, r2_key, version, uploaded_by
    FROM site_documents WHERE project_id = ${projectId} ORDER BY created_at DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    projectId: r.project_id as string,
    name: r.name as string,
    r2Key: r.r2_key as string,
    version: Number(r.version),
    uploadedBy: (r.uploaded_by as string | null) ?? null,
  }));
}

export async function addDocument(input: {
  projectId: string; name: string; r2Key: string; uploadedBy?: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO site_documents (project_id, name, r2_key, uploaded_by)
    VALUES (${input.projectId}, ${input.name}, ${input.r2Key}, ${input.uploadedBy ?? null})
    RETURNING id`;
  return rows[0].id as string;
}

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected";

export interface QuotationRow {
  id: string; clientName: string; projectName: string | null;
  date: string; amount: number; status: QuotationStatus; notes: string | null;
}

export async function listQuotations(): Promise<QuotationRow[]> {
  const rows = await sql`
    SELECT id, client_name, project_name, date, amount, status, notes
    FROM quotations ORDER BY created_at DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    clientName: r.client_name as string,
    projectName: (r.project_name as string | null) ?? null,
    date: fmtDate(r.date),
    amount: Number(r.amount),
    status: r.status as QuotationStatus,
    notes: (r.notes as string | null) ?? null,
  }));
}

export async function addQuotation(input: {
  clientName: string; projectName?: string; date: string; amount: number; notes?: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO quotations (client_name, project_name, date, amount, notes)
    VALUES (${input.clientName}, ${input.projectName || null},
      ${input.date}::date, ${input.amount}, ${input.notes || null})
    RETURNING id`;
  return rows[0].id as string;
}

export async function setQuotationStatus(id: string, status: QuotationStatus): Promise<void> {
  await sql`UPDATE quotations SET status = ${status} WHERE id = ${id}`;
}
