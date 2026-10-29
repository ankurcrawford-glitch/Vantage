// lib/gemini-models.ts
//
// One place for Gemini model names, overridable from Vercel env vars so a
// model retirement is a settings change, not a code change + deploy.
//
// History: the app shipped on gemini-2.5-pro / gemini-2.5-flash /
// gemini-2.5-flash-lite. Google withdrew the 2.5 family in October 2026 and
// every AI feature went down at once ("Unable to generate the review right
// now"). Current names per https://ai.google.dev/gemini-api/docs/deprecations
//
// Env vars (Vercel → Settings → Environment Variables):
//   GEMINI_MODEL_PRO   — the heavy, highest-quality call (Round Table)
//   GEMINI_MODEL_FAST  — cheap per-essay feedback and extraction

// Round Table gets the flagship reasoning model (Gemini 4 Argon, stable as of
// Oct 2026). It is the one expensive call in the app and the one students
// act on; per-user rate limits + monthly budget keep the cost bounded.
export const GEMINI_MODEL_PRO = process.env.GEMINI_MODEL_PRO || 'gemini-4-argon';
export const GEMINI_MODEL_FAST = process.env.GEMINI_MODEL_FAST || 'gemini-3.5-flash-lite';

/** Human-readable hint for the student when Gemini rejects the request. */
export function geminiFailureMessage(status: number, fallback: string): string {
  if (status === 404) return `${fallback} (AI model unavailable — code 404)`;
  if (status === 400) return `${fallback} (AI request rejected — code 400)`;
  if (status === 401 || status === 403) return `${fallback} (AI key problem — code ${status})`;
  return `${fallback} (code ${status})`;
}
