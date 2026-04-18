import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUser, getAdminClient } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: userId is the authenticated caller's id. Without this, any
    // logged-in user could activate someone else's subscription by passing
    // their UUID in the body.
    const auth = await getAuthedUser();
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    // Check the code against the environment variable.
    // TODO (from SECURITY-AUDIT.md): replace the shared env-var code with a
    // single-use codes table, rate-limit per IP, and store hashes, not
    // plaintext. For now this is a cohort-level shared secret.
    const validCode = process.env.ACCESS_CODE;
    if (!validCode) {
      return NextResponse.json({ error: 'Access codes are not configured' }, { status: 503 });
    }

    if (code.trim().toUpperCase() !== validCode.trim().toUpperCase()) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 403 });
    }

    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(
        {
          user_id: userId,
          status: 'active',
          stripe_customer_id: null,
          stripe_subscription_id: `code:${code.trim().toUpperCase()}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Error activating code:', error);
      return NextResponse.json({ error: 'Failed to activate access' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Redeem code error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}