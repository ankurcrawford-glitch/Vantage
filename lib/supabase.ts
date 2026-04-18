import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Browser-side Supabase client.
//
// Uses @supabase/ssr's createBrowserClient so the auth session is persisted
// in cookies (not localStorage). This is REQUIRED for server-side auth
// checks in API routes — lib/auth.ts reads the session from cookies.
//
// A singleton is used so repeated imports don't spawn multiple auth listeners.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (local) or Vercel → Settings → Environment Variables (production), then redeploy.'
  );
}

let browserClient: SupabaseClient | null = null;

function getBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
  );
  return browserClient;
}

// Exported as `supabase` for backward compatibility with existing imports.
// In SSR/server-component contexts this module should not be imported; use
// the server-side helpers in lib/auth.ts instead.
export const supabase: SupabaseClient =
  typeof window === 'undefined'
    ? // During SSR we return a no-op-ish client. Server-side code should not
      // use this import — it should use lib/auth.ts or getAdminClient().
      // But we still need a value so existing imports don't explode at build.
      createBrowserClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder'
      )
    : getBrowserClient();
