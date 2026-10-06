import sql from "@/lib/db";

/** Money owed: unpaid wager balances + unpaid client invoices (receivable) + supplier payable. */
export async function getDues(): Promise<{
  manpowerDue: number;
  receivableDue: number;
  supplierPayable: number;
}> {
  const [m, r, s] = await Promise.all([
    sql`SELECT COALESCE(SUM(balance), 0) AS n FROM manpower_entries`,
    sql`SELECT COALESCE(SUM(i.gross) - COALESCE((SELECT SUM(amount) FROM client_receipts), 0), 0) AS n FROM client_invoices i`,
    sql`SELECT COALESCE(SUM(l.credit) - COALESCE((SELECT SUM(l2.debit) FROM transaction_lines l2 JOIN accounts a2 ON a2.id = l2.account_id WHERE a2.code = '2000'), 0), 0) AS n
        FROM transaction_lines l JOIN accounts a ON a.id = l.account_id WHERE a.code = '2000'`,
  ]);
  return {
    manpowerDue: Number(m[0].n),
    receivableDue: Number(r[0].n),
    supplierPayable: Number(s[0].n),
  };
}

/** Per-stage spend: bills + wager cost + permanent labour. */
export async function getStageCosts(projectId?: string): Promise<
  { projectName: string; stageName: string; bills: number; manpower: number; labour: number; total: number }[]
> {
  const base = `
    SELECT p.name AS project_name, s.id AS stage_id, s.name AS stage_name,
      COALESCE((SELECT SUM(b.gross) FROM bills b WHERE b.stage_id = s.id), 0) AS bills,
      COALESCE((SELECT SUM(m.rate * m.hours) FROM manpower_entries m WHERE m.stage_id = s.id), 0) AS manpower,
      COALESCE((
        SELECT SUM(a.hours * CASE
          WHEN e.kind = 'permanent' THEN e.monthly_salary / pp.monthly_divisor_days / pp.daily_hours
          WHEN e.hourly_rate IS NOT NULL THEN e.hourly_rate
          ELSE e.day_rate / pp.daily_hours END)
        FROM attendances a
        JOIN assignments asg ON asg.id = a.assignment_id
        JOIN employees e ON e.id = asg.employee_id
        CROSS JOIN payroll_policy pp
        WHERE pp.id = 1 AND asg.stage_id = s.id
      ), 0) AS labour
    FROM stages s JOIN projects p ON p.id = s.project_id`;
  const rows = projectId
    ? await sql.query(`${base} WHERE s.project_id = $1 ORDER BY p.name, s.position`, [projectId])
    : await sql.query(`${base} ORDER BY p.name, s.position`, []);
  return rows.map((r) => ({
    projectName: r.project_name as string,
    stageName: r.stage_name as string,
    bills: Number(r.bills),
    manpower: Number(r.manpower),
    labour: Number(r.labour),
    total: Number(r.bills) + Number(r.manpower) + Number(r.labour),
  }));
}

/** Survival forecast: monthly burn vs active pipeline. */
export async function getSurvival(): Promise<{
  monthlyBurn: number;
  activePipeline: number;
  receivableDue: number;
  monthsCovered: number;
}> {
  const [burn, pipe, recv] = await Promise.all([
    sql`SELECT COALESCE(SUM(l.debit), 0) AS n FROM transaction_lines l
        JOIN accounts a ON a.id = l.account_id JOIN transactions t ON t.id = l.transaction_id
        WHERE a.type = 'expense' AND t.date >= CURRENT_DATE - INTERVAL '90 days'`,
    sql`SELECT COALESCE(SUM(agreement_amount), 0) AS n FROM projects WHERE status = 'active'`,
    sql`SELECT COALESCE(SUM(i.gross) - COALESCE((SELECT SUM(amount) FROM client_receipts), 0), 0) AS n FROM client_invoices i`,
  ]);
  const monthlyBurn = Number(burn[0].n) / 3;
  const activePipeline = Number(pipe[0].n);
  const receivableDue = Number(recv[0].n);
  return {
    monthlyBurn: Math.round(monthlyBurn * 100) / 100,
    activePipeline,
    receivableDue,
    monthsCovered: monthlyBurn > 0 ? Math.round(((activePipeline + receivableDue) / monthlyBurn) * 10) / 10 : 0,
  };
}
