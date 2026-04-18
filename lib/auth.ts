import { createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side helper that returns the authenticated user's Supabase session
 * user id. Checks, in order:
 *
 *   1. Authorization: Bearer <access_token> header — works for any client
 *      that explicitly sends the session token (recommended).
 *   2. Supabase session cookies — works if the frontend uses @supabase/ssr's
 *      createBrowserClient (which writes session to cookies).
 *
 * This app's frontend uses the plain @supabase/supabase-js client, which
 * stores the session in localStorage, so cookies are empty. The frontend
 * must send the access token via Authorization header — see
 * `lib/authFetch.ts` on the client side.
 *
 * NEVER trust `userId` from the request body. That is a trivial cross-tenant
 * data-leak vector.
 *
 * Usage in an API route:
 *
 *   const auth = await getAuthedUser(request);
 *   if (!auth.ok) return auth.response;
 *   const userId = auth.userId;
 */
export type AuthedResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; response: NextResponse };

export async function getAuthedUser(request?: NextRequest): Promise<AuthedResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Supabase environment is not configured' },
        { status: 500 }
      ),
    };
  }

  // Try Authorization header first (primary path for this app).
  const authHeader = request?.headers.get('authorization') || request?.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        return { ok: true, userId: data.user.id, email: data.user.email ?? null };
      }
    }
  }

  // Fallback: cookie-based session (works only if frontend uses @supabase/ssr).
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // no-op
        },
      },
    });
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      return { ok: true, userId: data.user.id, email: data.user.email ?? null };
    }
  } catch {
    // cookies() can fail outside a request context — fall through to 401.
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
  };
}

/**
 * Returns the service-role Supabase client. This BYPASSES Row Level Security
 * and has full read/write access to every table. Use only when you genuinely
 * need to bypass RLS — e.g., Stripe webhooks, admin tasks, cross-user
 * aggregations. For per-user operations, prefer the session client so RLS
 * acts as a backstop.
 *
 * Throws if service role key is not configured; catch at call site and
 * return a 500 to the client.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Minimal HTML escape for user-supplied values that are interpolated into
 * email or other HTML templates. Replaces the five characters that can
 * break out of attribute or element context.
 *
 * Use this on EVERY user-supplied value before template interpolation.
 * Template literals do not escape by default — that is a common injection
 * vector in email workflows.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (input == null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
