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

    // Supported env vars (checked in order):
    //   ACCESS_CODES   — comma-separated list of valid codes (preferred)
    //   ACCESS_CODE    — single code (legacy, kept for backward compat)
    //
    // TODO (from SECURITY-AUDIT.md): move to a single-use codes table in
    // Supabase, hash the codes, and track which account redeemed which
    // code. Rate-limit per IP. For now codes are cohort-level shared
    // secrets — anyone with a valid code can activate their own account.
    const rawPlural = process.env.ACCESS_CODES || '';
    const legacy = process.env.ACCESS_CODE || '';
    const validCodes = [
      ...rawPlural.split(',').map((c) => c.trim()).filter(Boolean),
      ...(legacy.trim() ? [legacy.trim()] : []),
    ].map((c) => c.toUpperCase());

    if (validCodes.length === 0) {
      return NextResponse.json(
        { error: 'Access codes are not configured' },
        { status: 503 }
      );
    }

    const submitted = code.trim().toUpperCase();
    if (!validCodes.includes(submitted)) {
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