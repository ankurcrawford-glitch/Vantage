import { createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Server-side helper that returns the authenticated user's Supabase session
 * user id, derived from the signed session cookies. NEVER trust `userId` from
 * the request body — that's a trivial cross-tenant data-leak vector.
 *
 * Usage in an API route:
 *
 *   const auth = await getAuthedUser();
 *   if (!auth.ok) return auth.response;
 *   const userId = auth.userId;
 *
 * The discriminated return type makes the auth check visible at the call site
 * and forces the caller to handle the unauthenticated case.
 */
export type AuthedResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; response: NextResponse };

export async function getAuthedUser(): Promise<AuthedResult> {
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

  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Missing request context' }, { status: 401 }),
    };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // We don't need setAll for read-only auth checks in API routes.
      setAll() {
        // no-op
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    };
  }

  return { ok: true, userId: data.user.id, email: data.user.email ?? null };
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
