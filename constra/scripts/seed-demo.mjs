// Seeds a realistic demo company dataset. Re-runnable (wipes previous demo rows first).
// Usage: node scripts/seed-demo.mjs
// Prints the login table at the end — paste new passwords into TEST-ACCOUNTS.md.
// Demo markers: usernames/prefixes listed in DEMO_* constants (never "__test").
const { config } = await import("dotenv");
config({ path: new URL("../.env.local", import.meta.url) });
const { randomBytes } = await import("node:crypto");
const { hashSync } = await import("bcryptjs");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const DAY = 86400000;
const today = new Date();
const dAgo = (n) => new Date(today.getTime() - n * DAY).toISOString().slice(0, 10);
const r2 = (n) => Math.round(n * 100) / 100;

const DEMO_USERS = ["superadmin", "owner", "client.ahmed", "client.sara", "client.omar", "client.layla", "client.yusuf"];
const DEMO_PROJECTS = ["Marina Gate Villa", "JVC Townhouses Block B", "Al Barsha Office Fit-out"];
const DEMO_EMPLOYEES = ["Khalid Mansour", "Mariam Al Zaabi", "Rajesh Kumar", "Imran Sheikh", "Fernando D'Souza", "Ali Hassan", "Deepak Yadav", "Salman Farooq", "Bijay Tamang", "Asif Ali"];
const DEMO_SUPPLIERS = ["Al Noor Building Materials", "Gulf Cement Trading", "Emirates Electricals"];
const DEMO_MATERIALS = ["Cement 50kg", "Steel rebar", "Washed sand", "Concrete block", "Emulsion paint"];
const DEMO_BILLS = ["DEMO-B1", "DEMO-B2", "DEMO-B3"];
const DEMO_INVOICES = ["INV-2026-001", "INV-2026-002"];
const DEMO_CREWS = ["Demo crew A", "Demo crew B"];
const DEMO_QUOTES = ["Sara Khan|JVC Block C", "Ahmed Al Farsi|Marina Gate annex"];
const DEMO_PLATES = ["DXB PK-4521", "DXB TR-8890"];

async function wipeDemo() {
  // Collect demo/test posting refs first (refs embed row ids).
  const bb = await sql.query(
    `SELECT id FROM bills WHERE invoice_no = ANY($1) OR invoice_no LIKE '__test%'`,
    [DEMO_BILLS],
  );
  const ii = await sql.query(
    `SELECT id FROM client_invoices WHERE invoice_no = ANY($1) OR invoice_no LIKE '__test%'`,
    [DEMO_INVOICES],
  );
  const mm = await sql.query(
    `SELECT id FROM manpower_entries WHERE name = ANY($1) OR name LIKE '__test%'`,
    [DEMO_CREWS],
  );
  const rr = await sql.query(
    `SELECT r.id FROM client_receipts r JOIN client_invoices i ON i.id = r.invoice_id
     WHERE i.invoice_no = ANY($1) OR i.invoice_no LIKE '__test%'`,
    [DEMO_INVOICES],
  );
  const refs = [
    ...bb.map((r) => `bill:${r.id}`),
    ...ii.map((r) => `invoice:${r.id}`),
    ...mm.flatMap((r) => [`manpower:${r.id}`, `manpower-clear:${r.id}`]),
    ...rr.map((r) => `receipt:${r.id}`),
  ];
  if (refs.length > 0) {
    await sql.query(
      `DELETE FROM transaction_lines WHERE transaction_id IN (SELECT id FROM transactions WHERE ref = ANY($1))`,
      [refs],
    );
  }
  await sql.query(`DELETE FROM client_receipts WHERE invoice_id IN (SELECT id FROM client_invoices WHERE invoice_no = ANY($1) OR invoice_no LIKE '__test%')`, [DEMO_INVOICES]);
  await sql.query(`DELETE FROM bills WHERE invoice_no = ANY($1) OR invoice_no LIKE '__test%'`, [DEMO_BILLS]);
  await sql.query(`DELETE FROM client_invoices WHERE invoice_no = ANY($1) OR invoice_no LIKE '__test%'`, [DEMO_INVOICES]);
  await sql.query(`DELETE FROM manpower_entries WHERE name = ANY($1) OR name LIKE '__test%'`, [DEMO_CREWS]);
  if (refs.length > 0) {
    await sql.query(`DELETE FROM transactions WHERE ref = ANY($1)`, [refs]);
  }
  await sql.query(`DELETE FROM material_requests WHERE project_id IN (SELECT id FROM projects WHERE name = ANY($1) OR name LIKE '__test%')`, [DEMO_PROJECTS]);
  await sql.query(`DELETE FROM daily_reports WHERE project_id IN (SELECT id FROM projects WHERE name = ANY($1) OR name LIKE '__test%')`, [DEMO_PROJECTS]);
  await sql.query(`DELETE FROM client_messages WHERE project_id IN (SELECT id FROM projects WHERE name = ANY($1))`, [DEMO_PROJECTS]);
  await sql.query(`DELETE FROM attendances WHERE assignment_id IN (SELECT a.id FROM assignments a JOIN projects p ON p.id = a.project_id WHERE p.name = ANY($1))`, [DEMO_PROJECTS]);
  await sql.query(`DELETE FROM assignments WHERE project_id IN (SELECT id FROM projects WHERE name = ANY($1))`, [DEMO_PROJECTS]);
  await sql.query(`DELETE FROM stages WHERE project_id IN (SELECT id FROM projects WHERE name = ANY($1) OR name LIKE '__test%')`, [DEMO_PROJECTS]);
  await sql.query(`DELETE FROM accounts WHERE code LIKE 'EXP-%'`);
  await sql.query(`DELETE FROM projects WHERE name = ANY($1) OR name LIKE '__test%'`, [DEMO_PROJECTS]);
  await sql.query(`DELETE FROM employees WHERE name = ANY($1)`, [DEMO_EMPLOYEES]);
  await sql.query(`DELETE FROM suppliers WHERE name = ANY($1)`, [DEMO_SUPPLIERS]);
  await sql.query(`DELETE FROM materials WHERE name = ANY($1)`, [DEMO_MATERIALS]);
  await sql.query(`DELETE FROM vehicles WHERE plate_no = ANY($1)`, [DEMO_PLATES]);
  const qc = DEMO_QUOTES.map((q) => q.split("|")[0]);
  await sql.query(`DELETE FROM quotations WHERE client_name = ANY($1)`, [qc]);
  await sql.query(`DELETE FROM users WHERE username = ANY($1)`, [DEMO_USERS]);
  console.log("wiped previous demo + __test leftovers");
}

async function accountId(code) {
  const r = await sql.query(`SELECT id FROM accounts WHERE code = $1`, [code]);
  if (r.length === 0) throw new Error(`missing control account ${code}`);
  return r[0].id;
}

async function stageExpense(stageId) {
  const code = `EXP-${stageId.slice(0, 8)}`;
  const r = await sql.query(
    `INSERT INTO accounts (code, name, type, category, stage_id)
     VALUES ($1, $2, 'expense', 'Direct costs', $3)
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [code, `Stage expense ${code}`, stageId],
  );
  return r[0].id;
}

async function ensureControl(code, name, type, category) {
  await sql.query(
    `INSERT INTO accounts (code, name, type, category) VALUES ($1, $2, $3, $4)
     ON CONFLICT (code) DO NOTHING`,
    [code, name, type, category],
  );
}

/** Balanced posting mirroring postJournalEntry. lines: [{code, debit, credit}]. */
async function post(ref, memo, lines, date) {
  const dr = r2(lines.reduce((n, l) => n + l.debit, 0));
  const cr = r2(lines.reduce((n, l) => n + l.credit, 0));
  if (Math.abs(dr - cr) > 0.005) throw new Error(`unbalanced ${ref}: Dr ${dr} Cr ${cr}`);
  const h = await sql.query(
    `INSERT INTO transactions (date, ref, memo) VALUES (COALESCE($1::date, CURRENT_DATE), $2, $3) RETURNING id`,
    [date ?? null, ref, memo ?? null],
  );
  const txnId = h[0].id;
  for (const l of lines) {
    const aid = await accountId(l.code);
    await sql.query(
      `INSERT INTO transaction_lines (transaction_id, account_id, debit, credit) VALUES ($1, $2, $3, $4)`,
      [txnId, aid, l.debit, l.credit],
    );
  }
  return txnId;
}

const ids = {};
const passwords = {};

async function main() {
  await wipeDemo();
  await ensureControl("2001", "Manpower Payable", "liability", "Payables");

  // --- users ---
  const mkUser = async (username, display, role) => {
    const pw = randomBytes(6).toString("base64url");
    const r = await sql.query(
      `INSERT INTO users (username, display_name, role_id, password_hash)
       VALUES ($1, $2, (SELECT id FROM roles WHERE name = $3), $4) RETURNING id`,
      [username, display, role, hashSync(pw, 10)],
    );
    ids[username] = r[0].id;
    passwords[username] = pw;
  };
  await mkUser("superadmin", "IT Super Admin", "super_admin");
  await mkUser("owner", "Company Owner", "owner");
  await mkUser("client.ahmed", "Ahmed Al Farsi", "client");
  await mkUser("client.sara", "Sara Khan", "client");
  await mkUser("client.omar", "Omar Haddad", "client");
  await mkUser("client.layla", "Layla Ibrahim", "client");
  await mkUser("client.yusuf", "Yusuf Rahman", "client");

  // --- employees (10) ---
  const emp = async (name, kind, pay, designation, linkUser) => {
    const r = await sql.query(
      `INSERT INTO employees (name, kind, monthly_salary, hourly_rate, day_rate, designation, phone, joining_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9::uuid) RETURNING id`,
      [name, kind, pay.monthly ?? null, pay.hourly ?? null, pay.day ?? null,
       designation, "+971501234567", dAgo(200),
       linkUser ? await userId(linkUser) : null],
    );
    ids[`emp:${name}`] = r[0].id;
  };
  const userId = async (u) => (await sql.query(`SELECT id FROM users WHERE username = $1`, [u]))[0].id;
  await emp("Khalid Mansour", "permanent", { monthly: 6500 }, "Site Foreman", "foreman");
  await emp("Mariam Al Zaabi", "permanent", { monthly: 8000 }, "HR Officer", "hr");
  await emp("Rajesh Kumar", "permanent", { monthly: 4500 }, "Mason", null);
  await emp("Imran Sheikh", "permanent", { monthly: 4200 }, "Steel Fixer", null);
  await emp("Fernando D'Souza", "permanent", { monthly: 5000 }, "Electrician", null);
  await emp("Ali Hassan", "permanent", { monthly: 3800 }, "Driver", null);
  await emp("Deepak Yadav", "daily_wager", { day: 90 }, "Helper", null);
  await emp("Salman Farooq", "daily_wager", { day: 110 }, "Carpenter", null);
  await emp("Bijay Tamang", "daily_wager", { hourly: 25 }, "Plumber", null);
  await emp("Asif Ali", "daily_wager", { day: 100 }, "Painter", null);

  // --- projects + stages + tasks ---
  const proj = async (name, client, loc, amount, start, end, clientUser) => {
    const r = await sql.query(
      `INSERT INTO projects (name, client_name, location, agreement_amount, start_date, end_date, status, client_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7) RETURNING id`,
      [name, client, loc, amount, start, end, clientUser ? ids[clientUser] : null],
    );
    ids[`proj:${name}`] = r[0].id;
  };
  await proj("Marina Gate Villa", "Ahmed Al Farsi", "Palm Jumeirah, Dubai", 2400000, dAgo(130), dAgo(-160), "client.ahmed");
  await proj("JVC Townhouses Block B", "Sara Khan", "JVC, Dubai", 3800000, dAgo(200), dAgo(-100), "client.sara");
  await proj("Al Barsha Office Fit-out", "Omar Haddad", "Al Barsha, Dubai", 950000, dAgo(60), dAgo(-60), "client.omar");

  const stage = async (pname, name, pos, status, boq, budget, start, end) => {
    const actualStart = status === "pending" ? null : start;
    const actualEnd = status === "completed" ? end : null;
    const r = await sql.query(
      `INSERT INTO stages (project_id, name, position, status, boq, budget, planned_start, planned_end,
        actual_start, actual_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8::date, $9::date, $10::date) RETURNING id`,
      [ids[`proj:${pname}`], name, pos, status, boq, budget, start, end, actualStart, actualEnd],
    );
    ids[`stage:${pname}/${name}`] = r[0].id;
  };
  await stage("Marina Gate Villa", "Foundation", 0, "completed", 380000, 350000, dAgo(130), dAgo(90));
  await stage("Marina Gate Villa", "Structure", 1, "in_progress", 720000, 700000, dAgo(89), dAgo(-10));
  await stage("Marina Gate Villa", "MEP", 2, "pending", 450000, 430000, dAgo(-9), dAgo(-70));
  await stage("Marina Gate Villa", "Finishing", 3, "pending", 550000, 520000, dAgo(-69), dAgo(-160));
  await stage("JVC Townhouses Block B", "Foundation", 0, "completed", 500000, 480000, dAgo(200), dAgo(150));
  await stage("JVC Townhouses Block B", "Structure", 1, "completed", 1100000, 1050000, dAgo(149), dAgo(60));
  await stage("JVC Townhouses Block B", "MEP", 2, "in_progress", 700000, 680000, dAgo(59), dAgo(-30));
  await stage("JVC Townhouses Block B", "Finishing", 3, "pending", 900000, 870000, dAgo(-29), dAgo(-100));
  await stage("Al Barsha Office Fit-out", "Demolition", 0, "completed", 120000, 110000, dAgo(60), dAgo(40));
  await stage("Al Barsha Office Fit-out", "Partition & MEP", 1, "in_progress", 400000, 390000, dAgo(39), dAgo(-20));
  await stage("Al Barsha Office Fit-out", "Finishing", 2, "pending", 300000, 290000, dAgo(-19), dAgo(-60));

  const task = async (pname, sname, title, status, extra = {}) => {
    await sql.query(
      `INSERT INTO tasks (stage_id, title, status, priority, assigned_to, due_date, delay_reason, position)
       VALUES ($1, $2, $3, $4, $5::uuid, $6::date, $7::text, 0)`,
      [ids[`stage:${pname}/${sname}`], title, status, extra.priority ?? "medium",
       extra.assignee ? ids[`emp:${extra.assignee}`] : null, extra.due ?? null, extra.delay ?? null],
    );
  };
  await task("Marina Gate Villa", "Foundation", "Excavation & PCC", "done", { assignee: "Rajesh Kumar", due: dAgo(100) });
  await task("Marina Gate Villa", "Foundation", "Waterproofing", "done", { due: dAgo(92) });
  await task("Marina Gate Villa", "Structure", "Column casting Block A", "in_progress", { assignee: "Khalid Mansour", due: dAgo(-5), priority: "high" });
  await task("Marina Gate Villa", "Structure", "Slab B1 pour", "todo", { due: dAgo(-12) });
  await task("Marina Gate Villa", "MEP", "AC duct delivery", "blocked", { delay: "Supplier strike — 2 weeks late", due: dAgo(-15), priority: "high" });
  await task("JVC Townhouses Block B", "MEP", "Electrical first fix", "in_progress", { assignee: "Fernando D'Souza", due: dAgo(-10) });
  await task("JVC Townhouses Block B", "MEP", "Plumbing rough-in", "todo", { assignee: "Bijay Tamang", due: dAgo(-20) });
  await task("Al Barsha Office Fit-out", "Partition & MEP", "Gypsum partitions", "in_progress", { assignee: "Salman Farooq", due: dAgo(-7) });

  // --- assignments + attendance ---
  const asg = async (ename, pname, sname, from, pct = 100) => {
    const r = await sql.query(
      `INSERT INTO assignments (employee_id, project_id, stage_id, from_date, allocation_pct)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [ids[`emp:${ename}`], ids[`proj:${pname}`],
       sname ? ids[`stage:${pname}/${sname}`] : null, from, pct],
    );
    return r[0].id;
  };
  const a1 = await asg("Khalid Mansour", "Marina Gate Villa", "Structure", dAgo(89));
  const a2 = await asg("Rajesh Kumar", "Marina Gate Villa", "Structure", dAgo(80));
  const a3 = await asg("Imran Sheikh", "JVC Townhouses Block B", "MEP", dAgo(59));
  const a4 = await asg("Fernando D'Souza", "JVC Townhouses Block B", "MEP", dAgo(55));
  const a5 = await asg("Deepak Yadav", "Marina Gate Villa", "Structure", dAgo(40));
  const a6 = await asg("Salman Farooq", "Al Barsha Office Fit-out", "Partition & MEP", dAgo(39));
  const a7 = await asg("Bijay Tamang", "JVC Townhouses Block B", "MEP", dAgo(30));
  const a8 = await asg("Asif Ali", "Al Barsha Office Fit-out", "Partition & MEP", dAgo(25));
  const a9 = await asg("Ali Hassan", "Marina Gate Villa", "Structure", dAgo(20));
  for (const [aid, days, hrs, ot] of [[a1, 1, 8, 0], [a1, 2, 8, 2], [a1, 3, 8, 0], [a2, 1, 8, 0], [a2, 2, 8, 0], [a3, 1, 8, 0], [a4, 1, 8, 1], [a5, 1, 8, 0], [a6, 1, 8, 0], [a7, 2, 8, 0], [a8, 1, 8, 0], [a9, 2, 8, 0]]) {
    await sql.query(
      `INSERT INTO attendances (assignment_id, date, hours, overtime_hours) VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [aid, dAgo(days), hrs, ot],
    );
  }

  // --- suppliers + materials ---
  const sup = async (name, trn, phone) => {
    const r = await sql.query(`INSERT INTO suppliers (name, trn_no, phone) VALUES ($1, $2, $3) RETURNING id`, [name, trn, phone]);
    ids[`sup:${name}`] = r[0].id;
  };
  await sup("Al Noor Building Materials", "100200300400003", "+97142223344");
  await sup("Gulf Cement Trading", "100200300400004", "+97143334455");
  await sup("Emirates Electricals", "100200300400005", "+97144445566");
  const mat = async (name, unit) => {
    const r = await sql.query(`INSERT INTO materials (name, unit) VALUES ($1, $2) RETURNING id`, [name, unit]);
    ids[`mat:${name}`] = r[0].id;
  };
  await mat("Cement 50kg", "bag");
  await mat("Steel rebar", "kg");
  await mat("Washed sand", "m3");
  await mat("Concrete block", "pcs");
  await mat("Emulsion paint", "gallon");

  // --- supplier bills (standard 5% VAT) ---
  const bill = async (invNo, supName, pname, sname, date, lines) => {
    let net = 0, vat = 0;
    const computed = lines.map((l) => {
      const n = r2(l.qty * l.rate);
      const v = l.tax === "standard" ? r2(n * 0.05) : 0;
      net = r2(net + n); vat = r2(vat + v);
      return { ...l, net: n, vat: v };
    });
    const gross = r2(net + vat);
    const stageId = sname ? ids[`stage:${pname}/${sname}`] : null;
    const b = await sql.query(
      `INSERT INTO bills (invoice_no, supplier_id, project_id, stage_id, date, net, vat_in, gross)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [invNo, ids[`sup:${supName}`], ids[`proj:${pname}`], stageId, date, net, vat, gross],
    );
    const billId = b[0].id;
    for (const l of computed) {
      await sql.query(
        `INSERT INTO bill_lines (bill_id, material_id, description, qty, unit_price, discount, tax_code, net, vat)
         VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)`,
        [billId, l.mat ? ids[`mat:${l.mat}`] : null, l.desc, l.qty, l.rate, l.tax, l.net, l.vat],
      );
    }
    const expId = stageId ? await stageExpense(stageId) : await accountId("5000");
    const exp = (await sql.query(`SELECT code FROM accounts WHERE id = $1`, [expId]))[0].code;
    const txn = await post(`bill:${billId}`, invNo, [
      { code: exp, debit: net, credit: 0 },
      ...(vat > 0 ? [{ code: "1400", debit: vat, credit: 0 }] : []),
      { code: "2000", debit: 0, credit: gross },
    ], date);
    await sql.query(`UPDATE bills SET transaction_id = $1 WHERE id = $2`, [txn, billId]);
  };
  await bill("DEMO-B1", "Al Noor Building Materials", "Marina Gate Villa", "Structure", dAgo(6), [
    { mat: "Cement 50kg", desc: "Cement 50kg", qty: 200, rate: 28, tax: "standard" },
    { mat: "Concrete block", desc: "Concrete blocks", qty: 1500, rate: 4.5, tax: "standard" },
    { mat: "Washed sand", desc: "Washed sand", qty: 12, rate: 180, tax: "standard" },
  ]);
  await bill("DEMO-B2", "Gulf Cement Trading", "JVC Townhouses Block B", "MEP", dAgo(12), [
    { mat: "Cement 50kg", desc: "Cement 50kg", qty: 100, rate: 28.5, tax: "standard" },
  ]);
  await bill("DEMO-B3", "Emirates Electricals", "JVC Townhouses Block B", "MEP", dAgo(20), [
    { desc: "Copper cables", qty: 500, rate: 12, tax: "standard" },
    { desc: "Site labour", qty: 1, rate: 2000, tax: "exempt" },
  ]);

  // --- client invoices + receipts ---
  const invoice = async (invNo, pname, sname, date, lines) => {
    let net = 0, vat = 0;
    for (const l of lines) {
      const n = r2(l.qty * l.rate);
      net = r2(net + n);
      if (l.tax === "standard") vat = r2(vat + n * 0.05);
    }
    const gross = r2(net + vat);
    const r = await sql.query(
      `INSERT INTO client_invoices (project_id, stage_id, invoice_no, date, net, vat_out, gross)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [ids[`proj:${pname}`], sname ? ids[`stage:${pname}/${sname}`] : null, invNo, date, net, vat, gross],
    );
    const invId = r[0].id;
    const txn = await post(`invoice:${invId}`, invNo, [
      { code: "1100", debit: gross, credit: 0 },
      { code: "4000", debit: 0, credit: net },
      ...(vat > 0 ? [{ code: "2100", debit: 0, credit: vat }] : []),
    ], date);
    await sql.query(`UPDATE client_invoices SET transaction_id = $1 WHERE id = $2`, [txn, invId]);
    return invId;
  };
  const receipt = async (invId, amount, date, method) => {
    const r = await sql.query(
      `INSERT INTO client_receipts (invoice_id, date, amount, method) VALUES ($1, $2, $3, $4) RETURNING id`,
      [invId, date, amount, method],
    );
    await post(`receipt:${r[0].id}`, `${method} ${amount}`, [
      { code: "1000", debit: amount, credit: 0 },
      { code: "1100", debit: 0, credit: amount },
    ], date);
  };
  const i1 = await invoice("INV-2026-001", "Marina Gate Villa", "Foundation", dAgo(15), [
    { qty: 1, rate: 400000, tax: "standard" },
  ]);
  await receipt(i1, 250000, dAgo(5), "Bank transfer");
  const i2 = await invoice("INV-2026-002", "JVC Townhouses Block B", "Structure", dAgo(30), [
    { qty: 1, rate: 600000, tax: "standard" },
  ]);
  await receipt(i2, 630000, dAgo(10), "Cheque");

  // --- manpower ---
  const crew = async (name, skill, pname, sname, date, rate, hours, paid) => {
    const total = r2(rate * hours);
    const bal = r2(total - paid);
    const r = await sql.query(
      `INSERT INTO manpower_entries (date, name, skill, project_id, stage_id, rate, hours, paid, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [date, name, skill, ids[`proj:${pname}`], sname ? ids[`stage:${pname}/${sname}`] : null, rate, hours, paid, bal],
    );
    const eid = r[0].id;
    const expId = sname ? await stageExpense(ids[`stage:${pname}/${sname}`]) : await accountId("5000");
    const exp = (await sql.query(`SELECT code FROM accounts WHERE id = $1`, [expId]))[0].code;
    const txn = await post(`manpower:${eid}`, name, [
      { code: exp, debit: total, credit: 0 },
      { code: "1000", debit: 0, credit: paid },
      ...(bal > 0 ? [{ code: "2001", debit: 0, credit: bal }] : []),
    ], date);
    await sql.query(`UPDATE manpower_entries SET transaction_id = $1 WHERE id = $2`, [txn, eid]);
  };
  await crew("Demo crew A", "Masonry", "Marina Gate Villa", "Structure", dAgo(2), 25, 160, 3000);
  await crew("Demo crew B", "Gypsum", "Al Barsha Office Fit-out", "Partition & MEP", dAgo(3), 22, 80, 1760);

  // --- material requests ---
  const req = async (pname, sname, date, status, notes, lines) => {
    const r = await sql.query(
      `INSERT INTO material_requests (project_id, stage_id, date, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [ids[`proj:${pname}`], sname ? ids[`stage:${pname}/${sname}`] : null, date, status, notes],
    );
    for (const l of lines) {
      await sql.query(`INSERT INTO material_request_lines (request_id, material_name, qty) VALUES ($1, $2, $3)`, [r[0].id, l[0], l[1]]);
    }
  };
  await req("Marina Gate Villa", "Structure", dAgo(1), "pending", "Urgent — slab pour next week", [["Cement 50kg", 50], ["Steel rebar", 2]]);
  await req("JVC Townhouses Block B", "MEP", dAgo(4), "approved", "First fix materials", [["Copper cables", 10]]);

  // --- daily reports ---
  const rep = async (pname, sname, date, work, delays, plan, by) => {
    await sql.query(
      `INSERT INTO daily_reports (project_id, stage_id, date, work_done, delays, next_day_plan, reported_by)
       VALUES ($1, $2::uuid, $3::date, $4, $5::text, $6::text, $7::uuid)`,
      [ids[`proj:${pname}`], sname ? ids[`stage:${pname}/${sname}`] : null, date, work, delays, plan,
       by ? ids[`emp:${by}`] : null],
    );
  };
  await rep("Marina Gate Villa", "Structure", dAgo(1), "Column casting grid B–D completed, curing started.", null, "Slab B1 steel fixing.", "Khalid Mansour");
  await rep("Marina Gate Villa", "Structure", dAgo(2), "Column casting grid A completed.", "Rain stopped work for half a day.", "Resume grid B–D.", "Khalid Mansour");
  await rep("JVC Townhouses Block B", "MEP", dAgo(1), "Electrical first fix level 2 done, 40 points.", null, "Plumbing rough-in level 2.", "Fernando D'Souza");
  await rep("Al Barsha Office Fit-out", "Partition & MEP", dAgo(2), "Gypsum partitions 60% done.", null, "Complete partitions, start painting prep.", "Salman Farooq");

  // --- quotations + vehicles ---
  await sql.query(`INSERT INTO quotations (client_name, project_name, date, amount, status, notes) VALUES
    ('Sara Khan', 'JVC Block C', $1, 4100000, 'sent', 'Follow up next week'),
    ('Ahmed Al Farsi', 'Marina Gate annex', $2, 320000, 'draft', 'Awaiting drawings')`, [dAgo(7), dAgo(3)]);
  const v1 = await sql.query(`INSERT INTO vehicles (plate_no, type, mulkia_expiry, insurance_expiry) VALUES ('DXB PK-4521', 'Pickup', $1, $2) RETURNING id`, [dAgo(-300), dAgo(-200)]);
  const v2 = await sql.query(`INSERT INTO vehicles (plate_no, type, mulkia_expiry, insurance_expiry) VALUES ('DXB TR-8890', 'Tower crane', $1, $2) RETURNING id`, [dAgo(-250), dAgo(-100)]);
  await sql.query(`INSERT INTO vehicle_maintenance (vehicle_id, date, cost, description) VALUES ($1, $2, 1200, 'Engine service')`, [v1[0].id, dAgo(20)]);
  await sql.query(`INSERT INTO vehicle_maintenance (vehicle_id, date, cost, description) VALUES ($1, $2, 8500, 'Annual crane inspection')`, [v2[0].id, dAgo(40)]);
  await sql.query(`INSERT INTO vehicle_fines (vehicle_id, date, amount, reason, driver) VALUES ($1, $2, 400, 'Speeding — Sheikh Zayed Rd', 'Ali Hassan')`, [v1[0].id, dAgo(9)]);

  // --- client messages ---
  const msg = async (pname, author, body, daysAgo) => {
    await sql.query(
      `INSERT INTO client_messages (project_id, author_id, body, created_at)
       VALUES ($1, (SELECT id FROM users WHERE username = $2), $3, now() - ($4 || ' days')::interval)`,
      [ids[`proj:${pname}`], author, body, String(daysAgo)],
    );
  };
  await msg("Marina Gate Villa", "client.ahmed", "How is the structure going? When is slab B1 due?", 2);
  await msg("Marina Gate Villa", "admin", "Columns done, curing in progress. Slab B1 pour is scheduled for next week.", 1);
  await msg("JVC Townhouses Block B", "client.sara", "Invoice paid in full today — please confirm receipt.", 9);

  // --- portal token for Marina villa ---
  await sql.query(
    `INSERT INTO portal_tokens (token, project_id, show_costs, show_photos, show_delays)
     VALUES ('demo-portal-marina-001', $1, FALSE, TRUE, TRUE)`,
    [ids["proj:Marina Gate Villa"]],
  );

  // --- integrity check ---
  const t = await sql.query(`SELECT COALESCE(SUM(debit),0) AS d, COALESCE(SUM(credit),0) AS c FROM transaction_lines`);
  console.log(`ledger: Dr ${t[0].d} = Cr ${t[0].c}`);
  if (Number(t[0].d) !== Number(t[0].c)) throw new Error("LEDGER OUT OF BALANCE");
  const counts = await sql.query(`SELECT
    (SELECT count(*) FROM projects) AS projects,
    (SELECT count(*) FROM stages) AS stages,
    (SELECT count(*) FROM tasks) AS tasks,
    (SELECT count(*) FROM employees) AS employees,
    (SELECT count(*) FROM users) AS users,
    (SELECT count(*) FROM bills) AS bills,
    (SELECT count(*) FROM client_invoices) AS invoices,
    (SELECT count(*) FROM manpower_entries) AS manpower,
    (SELECT count(*) FROM daily_reports) AS reports`);
  console.log("counts:", JSON.stringify(counts[0]));
  console.log("LOGINS:" + JSON.stringify(passwords));
}

main().catch((e) => {
  console.error("SEED FAILED:", e.message);
  process.exit(1);
});
