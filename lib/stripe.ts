import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Payment features will be disabled.');
}

export const stripe = secretKey ? new Stripe(secretKey) : null;

/** Price ID for the $100 one-time VANTAGE access (create in Stripe Dashboard → Products). */
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
