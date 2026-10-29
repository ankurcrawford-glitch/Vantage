// lib/ai.ts
//
// One place for the Anthropic (Claude) calls behind Round Table, Strategic
// Intelligence and activity extraction. Model names are overridable from
// Vercel env vars so a model retirement is a settings change, not a deploy.
//
// History: these routes shipped on Gemini. Google withdrew the 2.5 family in
// October 2026 and, once the model names were fixed, the project's Google
// billing returned 402 (Payment Required) — so every AI feature was down
// during ED season. The counselor chat was already on Anthropic and never
// went down, so the three routes moved here too (Oct 29, 2026).
//
// Env vars (Vercel → Settings → Environment Variables):
//   ANTHROPIC_API_KEY  — required (already set for the counselor)
//   CLAUDE_MODEL_PRO   — the heavy, highest-quality call (Round Table)
//   CLAUDE_MODEL_FAST  — cheap per-essay feedback and extraction

// Round Table: Sonnet 5.5 ($2 / $10 per M tokens as of Oct 2026). One call is
// roughly 8k tokens in + 1k out ≈ 2–3¢. Per-user rate limits + the monthly
// budget in lib/budget.ts keep that bounded.
export const CLAUDE_MODEL_PRO = process.env.CLAUDE_MODEL_PRO || 'claude-sonnet-5-5';
// Per-essay feedback + extraction: Haiku 5.5 ($0.10 / $0.50 per M tokens).
export const CLAUDE_MODEL_FAST = process.env.CLAUDE_MODEL_FAST || 'claude-haiku-5-5';

// If a default model name ever 404s (renamed / retired), fall back to the
// previous generation automatically instead of taking the feature down.
const FALLBACK_MODEL: Record<string, string> = {
  'claude-sonnet-5-5': 'claude-sonnet-4-6',
  'claude-haiku-5-5': 'claude-haiku-4-5-20251001',
};

export interface ClaudeCallOptions {
  model: string;
  system?: string;
  prompt: string;
  maxTokens: number;
  temperature?: number;
  /** Tag for server logs, e.g. 'round-table'. */
  label: string;
}

export type ClaudeResult =
  | { ok: true; text: string; model: string; stopReason: string | null; usage: unknown }
  | { ok: false; status: number; message: string; transient: boolean };

/** Human-readable hint for the student when the AI call fails. */
export function aiFailureMessage(status: number, fallback: string): string {
  if (status === 404) return `${fallback} (AI model unavailable — code 404)`;
  if (status === 400) return `${fallback} (AI request rejected — code 400)`;
  if (status === 401 || status === 403) return `${fallback} (AI key problem — code ${status})`;
  if (status === 402) return `${fallback} (AI billing problem — code 402)`;
  return `${fallback} (code ${status})`;
}

/**
 * Single non-streaming Messages API call. One automatic retry on transient
 * capacity errors (429 / 529 / 503) and one automatic model fallback on 404.
 * Never throws on an API error — returns { ok: false } so routes can decide
 * what to show the student.
 */
export async function callClaude(opts: ClaudeCallOptions): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, message: 'ANTHROPIC_API_KEY env var is not set.', transient: false };
  }

  const attemptOnce = async (model: string): Promise<Response> =>
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens,
        // `temperature` is rejected (400) by Claude 5.5+ models; only send it
        // when a route explicitly opts in via CLAUDE_SEND_TEMPERATURE=1.
        ...(opts.temperature !== undefined && process.env.CLAUDE_SEND_TEMPERATURE === '1' && { temperature: opts.temperature }),
        ...(opts.system && { system: opts.system }),
        messages: [{ role: 'user', content: opts.prompt }],
      }),
    });

  let model = opts.model;
  let res = await attemptOnce(model);

  if (res.status === 404 && FALLBACK_MODEL[model]) {
    console.warn(`[${opts.label}] model ${model} returned 404; falling back to ${FALLBACK_MODEL[model]}`);
    model = FALLBACK_MODEL[model];
    res = await attemptOnce(model);
  }

  if (res.status === 429 || res.status === 529 || res.status === 503) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await attemptOnce(model);
  }

  if (!res.ok) {
    const errorText = await res.text();
    let details: unknown;
    try { details = JSON.parse(errorText); } catch { details = { message: errorText }; }
    console.error(`[${opts.label}] Anthropic API error`, res.status, details);
    return {
      ok: false,
      status: res.status,
      message: errorText.slice(0, 500),
      transient: res.status === 429 || res.status === 529 || res.status === 503,
    };
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('\n')
    .trim();

  console.log(`[${opts.label}] claude response`, JSON.stringify({
    model,
    stopReason: data.stop_reason ?? null,
    usage: data.usage,
    rawLength: text.length,
  }));

  return { ok: true, text, model, stopReason: data.stop_reason ?? null, usage: data.usage };
}
