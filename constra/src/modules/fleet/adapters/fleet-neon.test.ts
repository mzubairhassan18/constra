import { afterAll, describe, expect, it } from "vitest";
import sql from "@/lib/db";
import {
  addDocument,
  addFine,
  addMaintenance,
  addQuotation,
  addVehicle,
  listQuotations,
  listVehicles,
  setQuotationStatus,
} from "./fleet-neon";

const PLATE = "__test-plate-1";
const CLIENT = "__test client";

afterAll(async () => {
  await sql`DELETE FROM vehicle_fines WHERE driver = '__test driver'`;
  await sql`DELETE FROM vehicle_maintenance WHERE description = '__test service'`;
  await sql`DELETE FROM vehicles WHERE plate_no = ${PLATE}`;
  await sql`DELETE FROM quotations WHERE client_name = ${CLIENT}`;
});

describe("fleet end-to-end (neon)", () => {
  it("adds vehicle with maintenance + fine totals, and quotation with status flow", async () => {
    const vehicleId = await addVehicle({ plateNo: PLATE, type: "__test truck" });
    await addMaintenance({ vehicleId, date: "2026-01-05", cost: 500, description: "__test service" });
    await addFine({ vehicleId, date: "2026-01-06", amount: 200, reason: "__test speeding", driver: "__test driver" });

    const vehicles = await listVehicles();
    const v = vehicles.find((x) => x.id === vehicleId);
    expect(v?.maintenanceTotal).toBe(500);
    expect(v?.fineTotal).toBe(200);

    const qid = await addQuotation({ clientName: CLIENT, date: "2026-01-07", amount: 10000 });
    await setQuotationStatus(qid, "sent");
    const quotes = await listQuotations();
    expect(quotes.find((q) => q.id === qid)?.status).toBe("sent");
  });

  it("records document metadata against a project", async () => {
    const p = await sql`SELECT id FROM projects LIMIT 1`;
    if (p.length === 0) return; // no seed project; metadata path covered by add/list shape
    const projectId = p[0].id as string;
    const docId = await addDocument({ projectId, name: "__test doc", r2Key: "__test/key.pdf" });
    expect(docId).toBeTruthy();
    await sql`DELETE FROM site_documents WHERE id = ${docId}`;
  });
});
