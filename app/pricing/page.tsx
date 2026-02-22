'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
      setLoading(false);
    })();
  }, []);

  const handleSubscribe = async () => {
    setError('');
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError('No checkout URL returned');
    } catch {
      setError('Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0B1623' }}>
        <Navigation />
        <div className="flex items-center justify-center py-24">
          <span className="font-body" style={{ color: '#F3E5AB' }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <Navigation />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 className="font-heading text-4xl md:text-5xl font-semibold mb-4 text-center" style={{ color: 'white' }}>
            VANTAGE Access
          </h1>
          <p
            className="font-body text-lg text-center"
            style={{ color: '#F3E5AB', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}
          >
            One payment. Full access to Strategic Intelligence, essay writing, and your 12 Insight Questions.
          </p>
        </div>

        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <Card>
            <div style={{ padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="font-heading text-5xl font-semibold" style={{ color: '#D4AF37' }}>$100</span>
                <span className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>one-time</span>
              </div>
              <p className="font-body text-sm text-center mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Full access to the platform. No recurring fees.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
                {[
                  'Strategic Intelligence for every essay (AI-powered guidance)',
                  'Write, save, and version all your essays (Common App + college-specific)',
                  '12 Insight Questions to shape your story and power your strategy',
                  'Invite parents, counselors, or mentors to comment on your essays',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ color: '#D4AF37', flexShrink: 0 }}>✓</span>
                    <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.9)', flex: 1, minWidth: 0 }}>{item}</span>
                  </li>
                ))}
              </ul>

              {error && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(248,113,113,0.2)', color: '#F87171', borderRadius: '4px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Button
                    onClick={handleSubscribe}
                    disabled={checkoutLoading}
                    style={{ width: '100%', maxWidth: '280px', height: '48px' }}
                  >
                    {checkoutLoading ? 'Redirecting to checkout...' : 'Pay $100 — Get access'}
                  </Button>
                  <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Secure payment by Stripe. You’ll complete payment on Stripe’s page.
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p className="font-body text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Sign in to purchase.
                  </p>
                  <Link href="/login">
                    <Button variant="secondary">Sign in</Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
