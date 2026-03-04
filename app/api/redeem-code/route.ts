import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json({ error: 'Code and user ID required' }, { status: 400 });
    }

    // Check the code against the environment variable
    const validCode = process.env.ACCESS_CODE;
    if (!validCode) {
      return NextResponse.json({ error: 'Access codes are not configured' }, { status: 503 });
    }

    if (code.trim().toUpperCase() !== validCode.trim().toUpperCase()) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 403 });
    }

    // Code is valid — activate the user's subscription
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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