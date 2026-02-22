'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';

export default function PricingSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <Navigation />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-4" style={{ color: 'white' }}>
          Thank you
        </h1>
        <p className="font-body text-lg mb-8 max-w-md mx-auto" style={{ color: '#F3E5AB' }}>
          Your payment was successful. Your account will be upgraded shortly. If you don’t see access right away, refresh the page or sign out and back in.
        </p>
        <p className="font-body text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          You now have full access to Strategic Intelligence, essay writing, and the 12 Insight Questions.
        </p>
        {sessionId && (
          <p className="font-body text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Session: {sessionId.slice(0, 24)}…
          </p>
        )}
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </main>
    </div>
  );
}
