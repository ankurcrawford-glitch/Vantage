import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

/**
 * Keeps the Supabase auth session cookie fresh on every request.
 *
 * Without this middleware, the access token eventually expires and the user
 * silently gets 401s from API routes even though they're "logged in." The
 * middleware calls supabase.auth.getUser() on each matching request, which
 * refreshes the cookie if the refresh token is still valid.
 *
 * Pattern adapted from the @supabase/ssr Next.js integration docs.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        // Mirror the cookies onto the outgoing response so the browser picks
        // up any refreshed session.
        cookiesToSet.forEach(({ name, value }: CookieToSet) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: do not remove. Forces a refresh if the access token is stale.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on every route except static assets and images.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
