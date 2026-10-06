import sql from "@/lib/db";
import { effectiveHourlyRate } from "../domain/types";

export interface StageLabourCost {
  stageId: string;
  totalHours: number;
  totalCost: number;
}

/** Sums hours × effective rate for a stage (permanent via payroll_policy, wager direct). */
export async function getStageLabourCost(stageId: string): Promise<StageLabourCost> {
  const rows = await sql`
    SELECT COALESCE(SUM(a.hours), 0) AS hours,
      COALESCE(SUM(a.hours * CASE
        WHEN e.kind = 'permanent'
          THEN e.monthly_salary / p.monthly_divisor_days / p.daily_hours
        WHEN e.hourly_rate IS NOT NULL THEN e.hourly_rate
        ELSE e.day_rate / p.daily_hours
      END), 0) AS cost
    FROM attendances a
    JOIN assignments asg ON asg.id = a.assignment_id
    JOIN employees e ON e.id = asg.employee_id
    CROSS JOIN payroll_policy p
    WHERE p.id = 1 AND asg.stage_id = ${stageId}`;
  return {
    stageId,
    totalHours: Number(rows[0].hours),
    totalCost: Number(rows[0].cost),
  };
}

export { effectiveHourlyRate };
