'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { effectiveGrade } from '@/lib/grade';
import Button from '@/components/Button';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import Navigation from '@/components/Navigation';
import { canAccessCollegePrep } from '@/lib/college-prep-access';
import { eaLabel, PLAN_EXPLAINERS } from '@/lib/earlyPlans';

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
  // Completion metric moved from "essay rows exist" (which counted any
  // touched prompt regardless of whether the student had actually done
  // the work) to essays that hit the refinement bar: current version
  // ≥ 80% of the word limit AND at least 2 saved versions. Same rule
  // Round Table uses so numbers agree across the product.
  const [essayCount, setEssayCount] = useState(0);        // finished essays
  const [essayInProgressCount, setEssayInProgressCount] = useState(0);
  const [totalPrompts, setTotalPrompts] = useState(0);    // supplementals + Common App the student needs
  const [deadlineGroups, setDeadlineGroups] = useState<{ date: string; items: { name: string; kind: string }[] }[]>([]);
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
      // Foundations students stay in their interface until college prep opens
      // (juniors from January; seniors via gateway crossover).
      try {
        const { data: gs } = await supabase
          .from('user_stats')
          .select('grade, class_of')
          .eq('user_id', user.id)
          .maybeSingle();
        const g = effectiveGrade(gs);
        if (
          typeof g === 'number' &&
          g >= 9 &&
          g <= 11 &&
          !canAccessCollegePrep(g)
        ) {
          router.push('/foundations/compass');
          return;
        }
      } catch { /* grade column missing — never block existing users */ }
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ code: accessCode }),
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

      // Load user's colleges with deadlines -> group by date so shared
      // dates (e.g. Nov 1) appear once with schools stacked beneath.
      try {
        const { data: dlRows } = await supabase
          .from('user_colleges')
          .select('colleges:college_id(name, deadline_ed, deadline_ea, deadline_rd)')
          .eq('user_id', user.id);
        const byDate = new Map<string, { name: string; kind: string }[]>();
        const today = new Date().toISOString().slice(0, 10);
        for (const row of (dlRows ?? []) as any[]) {
          const c = row.colleges;
          if (!c) continue;
          // Label restrictive early action honestly: Harvard/Princeton/
          // Stanford/Yale/Georgetown/Notre Dame "EA" is really REA/SCEA.
          for (const [kind, d] of [['ED', c.deadline_ed], [eaLabel(c.name), c.deadline_ea], ['RD', c.deadline_rd]] as const) {
            if (!d || d < today) continue;
            if (!byDate.has(d)) byDate.set(d, []);
            byDate.get(d)!.push({ name: c.name, kind });
          }
        }
        // Every upcoming deadline, no cap — students plan off this list.
        const groups = [...byDate.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, items]) => ({ date, items }));
        setDeadlineGroups(groups);
      } catch { /* deadlines are decorative - never block the dashboard */ }

      // Compute REAL progress. Denominator: total prompts across the
      // user's colleges plus the Common App essay. Numerator: essays
      // that meet the same refinement bar as Round Table (≥80% of word
      // limit and ≥2 saved versions). This makes the Progress card
      // reflect application readiness, not "did I start typing yet."
      const COMMON_APP_COLLEGE_ID = 'a0000000-0000-0000-0000-000000000000';
      const collegeIds = new Set<string>(
        ((await supabase.from('user_colleges').select('college_id').eq('user_id', user.id)).data ?? [])
          .map((row: any) => row.college_id)
      );
      collegeIds.add(COMMON_APP_COLLEGE_ID);

      const { data: promptRows } = await supabase
        .from('college_prompts')
        .select('id, word_limit')
        .in('college_id', Array.from(collegeIds));
      const prompts = promptRows ?? [];
      setTotalPrompts(prompts.length);

      let finished = 0;
      let inProgress = 0;
      if (prompts.length > 0) {
        const promptWordLimit = new Map<string, number | null>(
          prompts.map((p: any) => [p.id, p.word_limit ?? null])
        );
        const promptIds = prompts.map((p: any) => p.id);
        const { data: essayRows } = await supabase
          .from('essays')
          .select('college_prompt_id, essay_versions(word_count, content, is_current)')
          .eq('user_id', user.id)
          .in('college_prompt_id', promptIds);

        for (const essay of (essayRows ?? []) as any[]) {
          const versions = essay.essay_versions ?? [];
          const current = versions.find((v: any) => v.is_current);
          const hasContent = !!(current?.content && current.content.trim().length > 0);
          if (!hasContent) continue;
          const wordCount = current.word_count ?? 0;
          const versionCount = versions.length;
          const limit = promptWordLimit.get(essay.college_prompt_id) ?? null;
          const wordTarget = limit ? Math.ceil(limit * 0.8) : null;
          const meetsWords = wordTarget ? wordCount >= wordTarget : wordCount > 0;
          const meetsVersions = versionCount >= 2;
          if (meetsWords && meetsVersions) finished += 1;
          else inProgress += 1;
        }
      }
      setEssayCount(finished);
      setEssayInProgressCount(inProgress);
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

  // Stay on the loading screen until a session is confirmed. Otherwise
  // loadDashboardData can finish with no user, flip loading off, and
  // paint "Welcome back" / empty stats before the login redirect.
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-gold-leaf font-body">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Payment Success Banner */}
        {showPaymentSuccess && (
          <div className="mb-8 p-4 rounded" style={{ background: 'rgba(201,169,119,0.15)', border: '1px solid rgba(201,169,119,0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading text-lg text-gold-leaf">Payment Successful</p>
                <p className="font-body text-sm text-cream/70">Thank you! You now have full access to Story Builder and Strategic Intelligence.</p>
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
        <div className="mb-12">
          <h1 className="font-heading text-5xl text-cream mb-4">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
          </h1>
          <p className="font-body text-gold-light text-lg">
            Your work, in one place.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <StatCard
            title="Colleges"
            value={collegeCount}
            caption="In your portfolio"
            icon="◆"
          />
          <StatCard
            title="Essays"
            value={essayCount}
            caption={totalPrompts > 0
              ? `Ready · ${essayInProgressCount} in progress`
              : essayInProgressCount > 0 ? `${essayInProgressCount} in progress` : 'Ready'}
            icon="▲"
          />
          <StatCard
            title="Progress"
            value={totalPrompts > 0 ? Math.round((essayCount / totalPrompts) * 100) : 0}
            suffix="%"
            caption={totalPrompts > 0 ? `${essayCount} of ${totalPrompts} essays refined` : 'Add schools to track progress'}
            icon="■"
          />
        </div>

        {/* Academic Stats */}
        {stats && (
          <div className="mb-12">
            <h2 className="font-heading text-3xl text-cream mb-6">Academic Profile</h2>
            <Card>
              <div className="grid md:grid-cols-4 gap-6">
                {stats.gpa_weighted && (
                  <div>
                    <p className="font-body text-sm text-cream/70 mb-1">Weighted GPA</p>
                    <p className="font-heading text-2xl text-gold-leaf">{stats.gpa_weighted}</p>
                  </div>
                )}
                {stats.gpa_unweighted && (
                  <div>
                    <p className="font-body text-sm text-cream/70 mb-1">Unweighted GPA</p>
                    <p className="font-heading text-2xl text-gold-leaf">{stats.gpa_unweighted}</p>
                  </div>
                )}
                {stats.sat_score && (
                  <div>
                    <p className="font-body text-sm text-cream/70 mb-1">SAT Score</p>
                    <p className="font-heading text-2xl text-gold-leaf">{stats.sat_score}</p>
                  </div>
                )}
                {stats.act_score && (
                  <div>
                    <p className="font-body text-sm text-cream/70 mb-1">ACT Score</p>
                    <p className="font-heading text-2xl text-gold-leaf">{stats.act_score}</p>
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
              <Card className="cursor-pointer hover:bg-royal-blue/80 transition-colors">
                <h3 className="font-heading text-xl text-gold-leaf mb-3">Add Colleges</h3>
                <p className="font-body text-cream/70 text-sm">
                  Build your portfolio of target schools
                </p>
              </Card>
            </Link>

            <Link href="/common-app">
              <Card className="cursor-pointer hover:bg-royal-blue/80 transition-colors">
                <h3 className="font-heading text-xl text-gold-leaf mb-3">Start Common App Essay</h3>
                <p className="font-body text-cream/70 text-sm">
                  Choose a prompt and begin writing 
                </p>
              </Card>
            </Link>

            <Link href="/profile">
              <Card className="cursor-pointer hover:bg-royal-blue/80 transition-colors">
                <h3 className="font-heading text-xl text-gold-leaf mb-3">Update Profile</h3>
                <p className="font-body text-cream/70 text-sm">
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
                    Get access to the 12-question Story Builder and Strategic Intelligence, our AI-powered essay coaching that learns your unique story and provides personalized guidance.
                  </p>
                  <p className="font-heading text-xl text-cream mt-3">Obtain a one-time code for access</p>
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

        <div className="mt-12">
          <h2 className="font-heading text-3xl text-cream mb-6">Upcoming Deadlines</h2>
          <Card>
            {deadlineGroups.length === 0 ? (
              <p className="font-body text-cream/70 text-center py-8">
                No upcoming deadlines yet. Deadlines appear here as you add schools.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(() => {
                  // These are every round each school OFFERS, not a plan —
                  // and the early rounds have rules worth stating plainly.
                  const edSchools = new Set<string>();
                  const reaSchools = new Set<string>();
                  for (const g of deadlineGroups) {
                    for (const it of g.items) {
                      if (it.kind === 'ED') edSchools.add(it.name);
                      if (it.kind === 'REA') reaSchools.add(it.name);
                    }
                  }
                  const showEarlyNote = edSchools.size > 1 || reaSchools.size > 1 || (edSchools.size >= 1 && reaSchools.size >= 1);
                  return (
                    <>
                      <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.45)', margin: '0 0 4px', lineHeight: 1.6 }}>
                        All dates each of your schools offers.{' '}
                        <span title={PLAN_EXPLAINERS.ED} style={{ color: '#C9A977', cursor: 'help' }}>ED</span> binding ·{' '}
                        <span title={PLAN_EXPLAINERS.REA} style={{ color: '#D4A24E', cursor: 'help' }}>REA</span> restrictive ·{' '}
                        <span title={PLAN_EXPLAINERS.EA} style={{ color: '#C9A977', cursor: 'help' }}>EA</span> open ·{' '}
                        <span title={PLAN_EXPLAINERS.RD} style={{ color: '#C9A977', cursor: 'help' }}>RD</span> regular
                      </p>
                      {showEarlyNote && (
                        <div style={{
                          background: 'rgba(212,162,78,0.08)',
                          border: '1px solid rgba(212,162,78,0.3)',
                          borderRadius: '4px',
                          padding: '12px 16px',
                          margin: '8px 0 12px',
                        }}>
                          <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.85)', margin: 0, lineHeight: 1.6 }}>
                            <span style={{ color: '#D4A24E', fontWeight: 600 }}>Plan your early round deliberately.</span>{' '}
                            {edSchools.size > 1 && `${edSchools.size} of your schools offer Early Decision, but ED is binding — you can apply ED to only one. `}
                            {reaSchools.size >= 1 && `Restrictive Early Action (${[...reaSchools].slice(0, 4).join(', ')}${reaSchools.size > 4 ? '…' : ''}) generally rules out applying ED or private-college EA anywhere else. `}
                            Pick one early strategy; everything else moves to Regular Decision.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
                {deadlineGroups.map((g, i) => (
                  <div
                    key={g.date}
                    style={{
                      display: 'flex',
                      gap: '24px',
                      padding: '16px 8px',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(201,169,119,0.15)',
                    }}
                  >
                    <div style={{ minWidth: '96px' }}>
                      <p className="font-heading text-xl" style={{ color: '#C9A977', margin: 0 }}>
                        {new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.5)', margin: 0 }}>
                        {new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center' }}>
                      {g.items.map((it) => (
                        <span key={it.name + it.kind} className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.85)' }}>
                          {it.name}
                          <span
                            title={PLAN_EXPLAINERS[it.kind] || ''}
                            style={{
                              color: it.kind === 'REA' ? '#D4A24E' : '#C9A977',
                              marginLeft: '6px',
                              fontSize: '11px',
                              letterSpacing: '1px',
                              cursor: 'help',
                            }}
                          >
                            {it.kind}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}