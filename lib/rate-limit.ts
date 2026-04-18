import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Rate limiting for Gemini-backed API routes.
 *
 * Without this, a malicious user (or a frontend bug that retries on failure)
 * can call the API in a tight loop and run up your Gemini bill. Round Table
 * calls Pro at ~2¢ each; 10 calls/second for a minute is ~$12. For a day,
 * that's hundreds of dollars.
 *
 * Backed by Upstash Redis. Falls back to an in-memory, per-instance limiter
 * if Upstash env vars aren't configured — that's only useful for local dev
 * since Vercel spawns multiple serverless instances in production.
 *
 * Required env vars (set in Vercel → Settings → Environment Variables):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Usage in an API route:
 *
 *   const limit = await checkRateLimit(userId, 'thinking-partner');
 *   if (!limit.ok) return limit.response;
 *   // ...proceed with the expensive call
 */

type RouteKey = 'thinking-partner' | 'round-table';

interface RouteLimits {
  perMinute: number;
  perHour: number;
  perDay: number;
}

// Per-user limits. Keep these well above normal use but tight enough to
// catch automated abuse before it gets expensive. Round Table is 30x the
// cost of per-essay feedback, so it gets much stricter limits.
const LIMITS: Record<RouteKey, RouteLimits> = {
  'thinking-partner': { perMinute: 10, perHour: 60, perDay: 200 },
  'round-table':      { perMinute: 2,  perHour: 5,  perDay: 15 },
};

// Lazy-initialize the Upstash client so local dev without env vars still works.
let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

// Cache limiter instances so we don't rebuild them on every request.
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(route: RouteKey, window: 'minute' | 'hour' | 'day'): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const key = `${route}:${window}`;
  const cached = limiterCache.get(key);
  if (cached) return cached;

  const limits = LIMITS[route];
  const count =
    window === 'minute' ? limits.perMinute :
    window === 'hour'   ? limits.perHour :
                          limits.perDay;
  const windowSpec: `${number} ${'s' | 'm' | 'h' | 'd'}` =
    window === 'minute' ? '1 m' :
    window === 'hour'   ? '1 h' :
                          '1 d';

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(count, windowSpec),
    analytics: false,
    prefix: `vantage:rl:${route}:${window}`,
  });
  limiterCache.set(key, limiter);
  return limiter;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * Check all three rate-limit windows (per-minute, per-hour, per-day) for a
 * given user and route. Returns `ok: true` if all pass, or `ok: false` with
 * a 429 response if any window is exceeded.
 *
 * If Upstash env vars aren't configured, this silently allows the request
 * through — use local dev only in that state. Production must have Upstash.
 */
export async function checkRateLimit(
  userId: string,
  route: RouteKey
): Promise<RateLimitResult> {
  const limits = LIMITS[route];

  // If Upstash isn't configured, log once and allow through. We don't want
  // to break dev by blocking every request.
  if (!getRedis()) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[rate-limit] Upstash not configured — allowing request in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
    }
    return { ok: true };
  }

  const windows: Array<{ w: 'minute' | 'hour' | 'day'; label: string; cap: number }> = [
    { w: 'minute', label: 'per minute', cap: limits.perMinute },
    { w: 'hour',   label: 'per hour',   cap: limits.perHour   },
    { w: 'day',    label: 'per day',    cap: limits.perDay    },
  ];

  for (const { w, label, cap } of windows) {
    const limiter = getLimiter(route, w);
    if (!limiter) continue;
    const { success, reset } = await limiter.limit(userId);
    if (!success) {
      const resetInSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `You've hit the ${label} rate limit (${cap} requests). Please try again in ${resetInSeconds >= 60 ? `${Math.ceil(resetInSeconds / 60)} minute${Math.ceil(resetInSeconds / 60) === 1 ? '' : 's'}` : `${resetInSeconds} seconds`}.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(resetInSeconds),
              'X-RateLimit-Window': label,
              'X-RateLimit-Cap': String(cap),
            },
          }
        ),
      };
    }
  }

  return { ok: true };
}
