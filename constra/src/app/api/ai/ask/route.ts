import { getSessionUser } from "@/lib/session";
import { phraseAnswer } from "@/lib/ai-gateway";
import { routeIntent } from "@/modules/ai/domain/intent";
import { getDues, getStageCosts, getSurvival } from "@/modules/ai/adapters/ai-neon";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { q } = (await request.json()) as { q?: string };
  const question = (q ?? "").slice(0, 500);
  if (!question.trim()) return Response.json({ error: "empty" }, { status: 400 });

  const intent = routeIntent(question);

  if (intent.kind === "navigate") {
    return Response.json({
      answer: `Opening ${intent.screen}…`,
      ui_action: { type: "REDIRECT", screen: intent.screen },
    });
  }

  if (intent.kind === "dues") {
    const d = await getDues();
    const facts = `manpower due AED ${d.manpowerDue}, client receivable AED ${d.receivableDue}, supplier payable AED ${d.supplierPayable}`;
    const answer =
      (await phraseAnswer(question, facts)) ??
      `You owe AED ${d.manpowerDue} in wager balances and AED ${d.supplierPayable} to suppliers. Clients owe you AED ${d.receivableDue}.`;
    return Response.json({
      answer,
      ui_action: { type: "REDIRECT", screen: "/finance" },
    });
  }

  if (intent.kind === "stage_costs") {
    const rows = await getStageCosts();
    const top = [...rows].sort((a, b) => b.total - a.total).slice(0, 5);
    const facts = top.map((r) => `${r.projectName}/${r.stageName}: ${r.total}`).join("; ");
    const answer =
      (await phraseAnswer(question, facts || "no costs recorded")) ??
      (top.length === 0
        ? "No stage costs recorded yet."
        : `Top stages by spend: ${facts}.`);
    return Response.json({
      answer,
      rows: top,
      ui_action: { type: "REDIRECT", screen: "/projects" },
    });
  }

  if (intent.kind === "survival") {
    const s = await getSurvival();
    const facts = `burn AED ${s.monthlyBurn}/mo, pipeline AED ${s.activePipeline}, receivable AED ${s.receivableDue}, covers ${s.monthsCovered} months`;
    const answer =
      (await phraseAnswer(question, facts)) ??
      `Burn AED ${s.monthlyBurn}/mo. Active pipeline AED ${s.activePipeline} + receivable AED ${s.receivableDue} covers ~${s.monthsCovered} months.`;
    return Response.json({
      answer,
      ui_action: { type: "REDIRECT", screen: "/finance" },
    });
  }

  return Response.json({
    answer: "Try: upcoming dues, stage costs, survival forecast, or 'open bills'.",
  });
}
