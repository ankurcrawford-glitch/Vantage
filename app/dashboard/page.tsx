'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import Eyebrow from '@/components/Eyebrow';

interface UserStats {
  gpa_weighted: number | null;
  gpa_unweighted: number | null;
  sat_score: number | null;
  act_score: number | null;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-gold-leaf font-body">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [collegeCount, setCollegeCount] = useState(0);
  const [essayCount, setEssayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  // Handle post-checkout success
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setShowPaymentSuccess(true);
      // Clean the URL
      router.replace('/dashboard', { scroll: false });
      // Re-check subscription after short delay (webhook may take a moment)
      const timer = setTimeout(() => {
        checkSubscription();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUser(user);
      // Check subscription
      try {
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        setHasSubscription(!!sub);
      } catch {
        setHasSubscription(false);
      }
    }
  };

  const checkSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      setHasSubscription(!!sub);
    } catch {
      // ignore
    }
  };

  const handleCheckout = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to start checkout. Please try again.');
      }
    } catch {
      alert('Unable to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!user || !accessCode.trim()) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode, userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setHasSubscription(true);
        setAccessCode('');
      } else {
        setCodeError(data.error || 'Invalid code');
      }
    } catch {
      setCodeError('Unable to verify code. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsData) {
        setStats(statsData);
      }

      // Load college count
      const { count: collegeCountData } = await supabase
        .from('user_colleges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setCollegeCount(collegeCountData || 0);

      // Load essay count
      const { count: essayCountData } = await supabase
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setEssayCount(essayCountData || 0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-gold-leaf font-body">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      {/* Navigation */}
      <nav className="border-b border-hairline/10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-heading text-2xl font-semibold text-cream">VANTAGE</span>
            <span className="text-gold-leaf text-2xl">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-body text-sm transition-colors" style={{ color: pathname === '/dashboard' ? '#E8DDC9' : 'rgba(232,221,201,0.7)', fontWeight: pathname === '/dashboard' ? 600 : 400, textDecoration: 'none' }}>Dashboard</Link>
            <Link href="/personal-statement" className="font-body text-sm transition-colors" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? '#E8DDC9' : 'rgba(232,221,201,0.7)', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? 600 : 400, textDecoration: 'none' }}>Essays</Link>
            <Link href="/common-app" className="font-body text-sm transition-colors" style={{ color: pathname.startsWith('/common-app') ? '#E8DDC9' : 'rgba(232,221,201,0.7)', fontWeight: pathname.startsWith('/common-app') ? 600 : 400, textDecoration: 'none' }}>Common App</Link>
            <Link href="/colleges" className="font-body text-sm transition-colors" style={{ color: pathname.startsWith('/colleges') ? '#E8DDC9' : 'rgba(232,221,201,0.7)', fontWeight: pathname.startsWith('/colleges') ? 600 : 400, textDecoration: 'none' }}>Portfolio</Link>
            <Link href="/profile" className="font-body text-sm transition-colors" style={{ color: pathname === '/profile' ? '#E8DDC9' : 'rgba(232,221,201,0.7)', fontWeight: pathname === '/profile' ? 600 : 400, textDecoration: 'none' }}>Profile</Link>
            <Link href="/discovery" className="font-body text-sm transition-colors" style={{ color: pathname === '/discovery' ? '#E8DDC9' : 'rgba(232,221,201,0.7)', fontWeight: pathname === '/discovery' ? 600 : 400, textDecoration: 'none' }}>Insight Questions</Link>
            <button onClick={handleLogout} className="font-body text-sm transition-colors" style={{ color: 'rgba(232,221,201,0.7)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#E8DDC9'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,221,201,0.7)'; }}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Payment Success Banner */}
        {showPaymentSuccess && (
          <div className="mb-8 p-4 rounded" style={{ background: 'rgba(201,169,119,0.15)', border: '1px solid rgba(201,169,119,0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading text-lg text-gold-leaf">Payment Successful</p>
                <p className="font-body text-sm text-cream/70">Thank you! You now have full access to Insight Questions and Strategic Intelligence.</p>
              </div>
              <button
                onClick={() => setShowPaymentSuccess(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(232,221,201,0.5)', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <PageHeader
          title={`Welcome back${user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}`}
          subtitle="Your admissions command center."
        />

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <Eyebrow>Colleges</Eyebrow>
            <p className="font-heading text-4xl text-cream mt-3 mb-2">{collegeCount}</p>
            <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.62)' }}>In your portfolio</p>
          </Card>

          <Card>
            <Eyebrow>Essays</Eyebrow>
            <p className="font-heading text-4xl text-cream mt-3 mb-2">{essayCount}</p>
            <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.62)' }}>In progress</p>
          </Card>

          <Card>
            <Eyebrow>Progress</Eyebrow>
            <p className="font-heading text-4xl text-cream mt-3 mb-2">
              {collegeCount > 0 ? Math.round((essayCount / (collegeCount * 2)) * 100) : 0}%
            </p>
            <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.62)' }}>Complete</p>
          </Card>
        </div>

        {/* Academic Stats */}
        {stats && (
          <div className="mb-12">
            <h2 className="font-heading text-3xl text-cream mb-6">Academic Profile</h2>
            <Card>
              <div className="grid md:grid-cols-4 gap-6">
                {stats.gpa_weighted && (
                  <div>
                    <Eyebrow muted>Weighted GPA</Eyebrow>
                    <p className="font-heading text-2xl text-cream mt-2">{stats.gpa_weighted}</p>
                  </div>
                )}
                {stats.gpa_unweighted && (
                  <div>
                    <Eyebrow muted>Unweighted GPA</Eyebrow>
                    <p className="font-heading text-2xl text-cream mt-2">{stats.gpa_unweighted}</p>
                  </div>
                )}
                {stats.sat_score && (
                  <div>
                    <Eyebrow muted>SAT Score</Eyebrow>
                    <p className="font-heading text-2xl text-cream mt-2">{stats.sat_score}</p>
                  </div>
                )}
                {stats.act_score && (
                  <div>
                    <Eyebrow muted>ACT Score</Eyebrow>
                    <p className="font-heading text-2xl text-cream mt-2">{stats.act_score}</p>
                  </div>
                )}
              </div>
              <Link href="/profile" className="inline-block mt-6">
                <Button variant="secondary">Edit Profile</Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="font-heading text-3xl text-cream mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/colleges">
              <Card className="cursor-pointer transition-colors">
                <h3 className="font-heading text-xl text-cream mb-3">Add Colleges</h3>
                <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.62)' }}>
                  Build your portfolio of target schools
                </p>
              </Card>
            </Link>

            <Link href="/common-app">
              <Card className="cursor-pointer transition-colors">
                <h3 className="font-heading text-xl text-cream mb-3">Start Common App Essay</h3>
                <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.62)' }}>
                  Choose a prompt and begin writing
                </p>
              </Card>
            </Link>

            <Link href="/profile">
              <Card className="cursor-pointer transition-colors">
                <h3 className="font-heading text-xl text-cream mb-3">Update Profile</h3>
                <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.62)' }}>
                  Edit your stats and activities
                </p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Upgrade CTA - shown only if not subscribed */}
        {!hasSubscription && (
          <div className="mt-12">
            <Card>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h2 className="font-heading text-2xl text-gold-leaf mb-2">Unlock Full Access</h2>
                  <p className="font-body text-cream/70 text-sm" style={{ maxWidth: '600px' }}>
                    Get access to 12 Insight Questions and Strategic Intelligence, our AI-powered essay coaching that learns your unique story and provides personalized guidance.
                  </p>
                  <p className="font-heading text-3xl text-cream mt-3">$100 <span className="font-body text-sm text-cream/50">one-time</span></p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="font-body font-bold text-xs uppercase tracking-wider"
                  style={{
                    background: '#C9A977',
                    color: '#0B1320',
                    padding: '14px 32px',
                    border: 'none',
                    cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                    opacity: checkoutLoading ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {checkoutLoading ? 'Redirecting...' : 'Upgrade Now'}
                </button>
              </div>
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(232,221,201,0.1)' }}>
                <p className="font-body text-sm mb-3" style={{ color: 'rgba(232,221,201,0.7)' }}>Have an access code?</p>
                <div style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => { setAccessCode(e.target.value); setCodeError(''); }}
                    placeholder="Enter code"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(232,221,201,0.2)',
                      color: '#E8DDC9',
                      padding: '10px 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      borderRadius: '2px',
                      outline: 'none',
                      flex: 1,
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRedeemCode(); }}
                  />
                  <button
                    onClick={handleRedeemCode}
                    disabled={codeLoading || !accessCode.trim()}
                    style={{
                      background: 'transparent',
                      color: '#C9A977',
                      border: '1px solid rgba(201,169,119,0.5)',
                      padding: '10px 20px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '2px',
                      cursor: codeLoading || !accessCode.trim() ? 'not-allowed' : 'pointer',
                      opacity: codeLoading || !accessCode.trim() ? 0.5 : 1,
                    }}
                  >
                    {codeLoading ? 'Verifying...' : 'Redeem'}
                  </button>
                </div>
                {codeError && (
                  <p className="font-body text-sm mt-2" style={{ color: '#A35A6A' }}>{codeError}</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Upcoming Deadlines (placeholder) */}
        <div className="mt-12">
          <h2 className="font-heading text-3xl text-cream mb-6">Upcoming Deadlines</h2>
          <Card>
            <p className="font-body text-cream/70 text-center py-8">
              No upcoming deadlines. Add colleges to see deadlines.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}