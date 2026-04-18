import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Monthly spend circuit breakers + manual kill-switch for AI features.
 *
 * Three independent controls, in priority order:
 *
 *   1. MANUAL: `AI_FEATURES_DISABLED=1` env var. Flip in Vercel to instantly
 *      kill all AI features with no deploy. Useful for emergencies.
 *
 *   2. PER-USER CAP (primary): each user gets their own monthly cost
 *      counter. When a single user's estimated spend exceeds
 *      `GEMINI_USER_MONTHLY_BUDGET_USD`, further calls FOR THAT USER are
 *      rejected with 503. Others are unaffected. Stops one bad actor from
 *      monopolizing the budget. This is the main defense.
 *
 *   3. GLOBAL CAP (backstop): tracks total estimated spend across all
 *      users per calendar month. When it exceeds
 *      `GEMINI_MONTHLY_BUDGET_USD`, ALL calls are rejected. Protects
 *      against system-wide runaway (many users abusing, or a shared bug).
 *      Optional — leave unset if you don't want a hard global ceiling.
 *
 * Both counters reset naturally on the 1st of each calendar month because
 * the Redis key includes YYYY-MM.
 *
 * Usage:
 *
 *   const budget = await checkBudget(userId);
 *   if (!budget.ok) return budget.response;
 *   // ...make the Gemini call...
 *   await recordSpend(userId, 'thinking-partner');
 *
 * Required env vars (set in Vercel):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *   GEMINI_USER_MONTHLY_BUDGET_USD (primary — e.g. "2" for $2/user/month)
 *   GEMINI_MONTHLY_BUDGET_USD       (optional backstop — e.g. "100")
 *   AI_FEATURES_DISABLED            (optional; set to "1" to force-disable)
 */

// Per-call cost estimates in USD. Conservative rounding of the actual
// Gemini pricing (input + output for typical request sizes). Tune if the
// real spend diverges materially from projections.
const COST_PER_CALL: Record<string, number> = {
  'thinking-partner': 0.0006,
  'round-table': 0.020,
};

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function currentMonth(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function globalMonthKey(): string {
  return `vantage:budget:usd:${currentMonth()}`;
}

function userMonthKey(userId: string): string {
  return `vantage:user-budget:usd:${userId}:${currentMonth()}`;
}

function parseBudget(envVar: string): number | null {
  const raw = process.env[envVar];
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export type BudgetResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * Call this BEFORE making a Gemini request. Returns { ok: false } with a
 * 503 if (a) the manual kill-switch is on, (b) this user has hit their
 * per-user monthly cap, or (c) the global monthly cap is exceeded.
 *
 * Checks are done in priority order: manual → per-user → global.
 */
export async function checkBudget(userId: string): Promise<BudgetResult> {
  // 1. Manual kill-switch — cheapest check, no network call.
  if (process.env.AI_FEATURES_DISABLED === '1') {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            'AI features are temporarily unavailable. Please try again later or contact support if this persists.',
        },
        { status: 503 }
      ),
    };
  }

  const userBudget = parseBudget('GEMINI_USER_MONTHLY_BUDGET_USD');
  const globalBudget = parseBudget('GEMINI_MONTHLY_BUDGET_USD');

  // If no budgets configured at all, allow through.
  if (userBudget === null && globalBudget === null) {
    return { ok: true };
  }

  const redis = getRedis();
  if (!redis) {
    // No Redis — can't track spend. Log in production and allow through.
    if (process.env.NODE_ENV === 'production') {
      console.warn('[budget] Upstash not configured — cannot enforce monthly budget caps');
    }
    return { ok: true };
  }

  // 2. Per-user cap — the primary defense.
  if (userBudget !== null) {
    const userKey = userMonthKey(userId);
    const raw = await redis.get<string | number>(userKey);
    const spent = typeof raw === 'number' ? raw : Number(raw ?? 0);
    if (Number.isFinite(spent) && spent >= userBudget) {
      console.warn(`[budget] Per-user cap reached for ${userId}: $${spent.toFixed(4)} / $${userBudget.toFixed(2)}`);
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              'You\'ve reached this month\'s limit on AI feedback. The limit resets on the 1st of next month. Please contact support if you need more.',
          },
          {
            status: 503,
            headers: { 'X-Budget-Exceeded': 'user' },
          }
        ),
      };
    }
  }

  // 3. Global cap — the system-wide backstop.
  if (globalBudget !== null) {
    const key = globalMonthKey();
    const raw = await redis.get<string | number>(key);
    const spent = typeof raw === 'number' ? raw : Number(raw ?? 0);
    if (Number.isFinite(spent) && spent >= globalBudget) {
      console.warn(`[budget] Global cap reached: $${spent.toFixed(2)} / $${globalBudget.toFixed(2)}`);
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              'AI features are paused for this month while we review usage. Please contact support if you need immediate access.',
          },
          {
            status: 503,
            headers: { 'X-Budget-Exceeded': 'global' },
          }
        ),
      };
    }
  }

  return { ok: true };
}

/**
 * Call this AFTER a successful Gemini response to record the estimated
 * cost against both the per-user and global monthly counters. Fire-and-
 * forget — failures here must not block the user's response. Worst case
 * under Redis outage: we under-count, which is safer than failing.
 */
export async function recordSpend(
  userId: string,
  route: keyof typeof COST_PER_CALL | string
): Promise<void> {
  const cost = COST_PER_CALL[route];
  if (!cost) return;

  const redis = getRedis();
  if (!redis) return;

  try {
    // Both counters expire 40 days after last write so a month-crossing
    // request doesn't resurrect a stale counter past its window.
    const userKey = userMonthKey(userId);
    const globalKey = globalMonthKey();
    await Promise.all([
      redis.incrbyfloat(userKey, cost).then(() => redis.expire(userKey, 60 * 60 * 24 * 40)),
      redis.incrbyfloat(globalKey, cost).then(() => redis.expire(globalKey, 60 * 60 * 24 * 40)),
    ]);
  } catch (e) {
    console.warn('[budget] Failed to record spend:', e);
  }
}

/**
 * For admin observability — returns current month's global spend, the
 * configured caps, and the kill-switch state. Safe to expose via a
 * protected endpoint.
 */
export async function getBudgetStatus(): Promise<{
  month: string;
  globalSpent: number;
  globalBudget: number | null;
  userBudget: number | null;
  disabled: boolean;
}> {
  const redis = getRedis();
  let globalSpent = 0;
  if (redis) {
    const raw = await redis.get<string | number>(globalMonthKey());
    globalSpent = typeof raw === 'number' ? raw : Number(raw ?? 0);
  }
  return {
    month: currentMonth(),
    globalSpent: Number.isFinite(globalSpent) ? globalSpent : 0,
    globalBudget: parseBudget('GEMINI_MONTHLY_BUDGET_USD'),
    userBudget: parseBudget('GEMINI_USER_MONTHLY_BUDGET_USD'),
    disabled: process.env.AI_FEATURES_DISABLED === '1',
  };
}
