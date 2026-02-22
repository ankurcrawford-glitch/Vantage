import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_ID } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  if (!stripe || !STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: 'Payments are not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in .env.local' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const successUrl = `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing`;

    const userId = typeof body.userId === 'string' ? body.userId : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Checkout error:', err);
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
