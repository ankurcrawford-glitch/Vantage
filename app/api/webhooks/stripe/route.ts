import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Supabase admin client (bypasses RLS)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE env vars for webhook');
  }
  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  // Read raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // The user ID was passed as client_reference_id when creating the checkout session
    const userId = session.client_reference_id;
    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || null;

    if (!userId) {
      console.error('No client_reference_id (user ID) on checkout session:', session.id);
      return NextResponse.json({ received: true }); // Acknowledge but skip
    }

    // Only process paid sessions
    if (session.payment_status !== 'paid') {
      console.log('Payment not yet complete for session:', session.id);
      return NextResponse.json({ received: true });
    }

    try {
      const supabase = getSupabaseAdmin();

      // Upsert the user_subscriptions row so the user is now "active"
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(
          {
            user_id: userId,
            status: 'active',
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: session.id, // using session ID since this is one-time payment
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error upserting subscription:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log(`✅ Activated subscription for user ${userId} via session ${session.id}`);
    } catch (err) {
      console.error('Webhook processing error:', err);
      return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}