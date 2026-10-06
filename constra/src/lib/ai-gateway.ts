// LLM gateway adapter. Optional: without AI_GATEWAY_URL the app answers
// from deterministic templates (tools results). With a keyless or keyed
// OpenAI-compatible gateway set, answers get phrased by the model.
// Env: AI_GATEWAY_URL, AI_GATEWAY_KEY (optional), AI_MODEL (optional).
export async function phraseAnswer(
  question: string,
  facts: string,
): Promise<string | null> {
  const base = process.env.AI_GATEWAY_URL;
  if (!base) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AI_GATEWAY_KEY
          ? { Authorization: `Bearer ${process.env.AI_GATEWAY_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "default",
        messages: [
          {
            role: "system",
            content:
              "You are a construction ERP assistant. Answer briefly from the facts. Never invent numbers.",
          },
          { role: "user", content: `Question: ${question}\nFacts:\n${facts}` },
        ],
        max_tokens: 300,
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return j.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
