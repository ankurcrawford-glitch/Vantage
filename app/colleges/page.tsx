'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import Button from '@/components/Button';
import SchoolCard from '@/components/SchoolCard';
import EdStrategyPanel from '@/components/EdStrategyPanel';
import SchoolDetailModal from '@/components/SchoolDetailModal';
import StrategyHeader from '@/components/StrategyHeader';
import BalanceDiagnostic, { buildBalanceDiagnostic } from '@/components/BalanceDiagnostic';
import {
  classify,
  profileFromUserStats,
  type College,
  type SchoolClassification,
  type StudentProfile,
  type Tier,
  TIERS,
} from '@/lib/classifier';
import { computeEdStrategy } from '@/lib/edStrategy';

type Tab = 'strategy' | 'add';

const TIER_COLOR: Record<Tier, string> = {
  Safety: '#4ADE80',
  Likely: '#86EFAC',
  Target: '#D4AF37',
  Reach: '#FBBF24',
  'Hard Reach': '#F87171',
};

export default function CollegesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [colleges, setColleges] = useState<College[]>([]);
  const [userColleges, setUserColleges] = useState<string[]>([]);
  const [collegesWithPrompts, setCollegesWithPrompts] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('strategy');
  const [searchTerm, setSearchTerm] = useState('');
  const [openSchoolId, setOpenSchoolId] = useState<string | null>(null);

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const [collegesRes, userCollegesRes, promptsRes, statsRes] = await Promise.all([
        supabase.from('colleges').select('*').order('name'),
        supabase.from('user_colleges').select('college_id').eq('user_id', user.id),
        supabase.from('college_prompts').select('college_id'),
        supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      ]);

      if (collegesRes.data) {
        setColleges(
          collegesRes.data.filter((c: College) => c.id !== 'a0000000-0000-0000-0000-000000000000')
        );
      }
      if (userCollegesRes.data) {
        setUserColleges(userCollegesRes.data.map((u) => u.college_id));
      }
      if (promptsRes.data) {
        setCollegesWithPrompts(new Set(promptsRes.data.map((p) => p.college_id)));
      }
      if (statsRes.data) {
        setProfile(profileFromUserStats(statsRes.data));
      } else {
        // No stats row yet — use neutral defaults so page still renders.
        setProfile(profileFromUserStats({
          gpa_unweighted: null, gpa_weighted: null, sat_score: null, act_score: null,
          state: null, intended_major: null, ap_count: null, test_optional: null,
          hook_recruited_athlete: null, hook_first_gen: null, hook_urm: null,
          hook_low_income: null, hook_legacy_active: null, hook_legacy_college_ids: null,
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------ classify ------------------------------ */

  const classifications: SchoolClassification[] = useMemo(() => {
    if (!profile) return [];
    const myColleges = colleges.filter((c) => userColleges.includes(c.id));
    return myColleges.map((c) => classify(c, profile, 'RD'));
  }, [colleges, userColleges, profile]);

  const tierCounts: Record<Tier, number> = useMemo(() => {
    const out: Record<Tier, number> = {
      Safety: 0, Likely: 0, Target: 0, Reach: 0, 'Hard Reach': 0,
    };
    for (const c of classifications) out[c.bucket]++;
    return out;
  }, [classifications]);

  const diagnostic = useMemo(() => buildBalanceDiagnostic(tierCounts), [tierCounts]);

  const edStrategy = useMemo(
    () => (profile ? computeEdStrategy(classifications, profile) : null),
    [classifications, profile]
  );

  const byTier: Record<Tier, SchoolClassification[]> = useMemo(() => {
    const out: Record<Tier, SchoolClassification[]> = {
      Safety: [], Likely: [], Target: [], Reach: [], 'Hard Reach': [],
    };
    for (const c of classifications) out[c.bucket].push(c);
    for (const t of TIERS) {
      out[t].sort((a, b) => (a.college.acceptance_rate ?? 1) - (b.college.acceptance_rate ?? 1));
    }
    return out;
  }, [classifications]);

  const openClassification = openSchoolId
    ? classifications.find((c) => c.college.id === openSchoolId) ?? null
    : null;

  /* ------------------------------ actions ------------------------------ */

  async function handleAddCollege(collegeId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('user_colleges').insert({ user_id: user.id, college_id: collegeId });
    if (!error) setUserColleges((prev) => [...prev, collegeId]);
  }

  async function handleRemoveCollege(collegeId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('user_colleges')
      .delete()
      .eq('user_id', user.id)
      .eq('college_id', collegeId);
    if (!error) setUserColleges((prev) => prev.filter((id) => id !== collegeId));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  /* ------------------------------ render ------------------------------ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37', fontFamily: 'var(--font-body)' }}>Loading...</div>
      </div>
    );
  }

  const availableColleges = colleges
    .filter((c) => !userColleges.includes(c.id))
    .filter((c) =>
      searchTerm
        ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.location ?? '').toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

  const profileIncomplete = !profile || (profile.unweightedGpa === 3.5 && !profile.sat && !profile.act);

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      {/* NAV — preserved verbatim from prior page */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname === '/dashboard' ? 600 : 400 }}>Dashboard</Link>
            <Link href="/personal-statement" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? 600 : 400 }}>Essays</Link>
            <Link href="/common-app" style={{ color: pathname.startsWith('/common-app') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname.startsWith('/common-app') ? 600 : 400 }}>Common App</Link>
            <Link href="/colleges" style={{ color: pathname.startsWith('/colleges') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname.startsWith('/colleges') ? 600 : 400 }}>Portfolio</Link>
            <Link href="/profile" style={{ color: pathname === '/profile' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname === '/profile' ? 600 : 400 }}>Profile</Link>
            <Link href="/discovery" style={{ color: pathname === '/discovery' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: pathname === '/discovery' ? 600 : 400 }}>Insight Questions</Link>
            <button onClick={handleLogout} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', padding: 0 }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 32px' }}>
        {/* Header — title + balance pill */}
        <StrategyHeader
          totalSchools={classifications.length}
          pillLabel={diagnostic.pillLabel}
          pillVariant={diagnostic.pillVariant}
        />

        {/* Profile-incomplete nudge */}
        {profileIncomplete && (
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderLeft: '4px solid #D4AF37',
              padding: '16px 24px',
              marginBottom: '24px',
            }}
          >
            <p className="font-body text-sm" style={{ color: '#F3E5AB', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: '#D4AF37' }}>Add your stats to unlock real classifications.</strong>{' '}
              We need GPA, SAT/ACT, intended major, and a few other inputs.{' '}
              <Link href="/profile" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
                Complete your profile →
              </Link>
            </p>
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {(
            [
              { k: 'strategy' as Tab, label: 'Strategy' },
              { k: 'add' as Tab, label: 'Add Schools' },
            ]
          ).map(({ k, label }) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="font-body"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: active ? '#D4AF37' : 'rgba(255,255,255,0.55)',
                  borderBottom: active ? '2px solid #D4AF37' : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* STRATEGY TAB */}
        {tab === 'strategy' && (
          <>
            {classifications.length === 0 ? (
              <Card>
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <h3 className="font-heading" style={{ color: 'white', fontSize: '22px', marginBottom: '8px' }}>
                    Your portfolio is empty.
                  </h3>
                  <p className="font-body" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginBottom: '20px' }}>
                    Add schools you're considering and we'll show you exactly where each one falls.
                  </p>
                  <Button variant="primary" onClick={() => setTab('add')}>
                    Add Your First Schools
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {/* Balance diagnostic card */}
                <BalanceDiagnostic data={diagnostic} />

                {/* ED Strategy panel */}
                {edStrategy && profile && (
                  <div style={{ marginBottom: '32px' }}>
                    <EdStrategyPanel strategy={edStrategy} profile={profile} />
                  </div>
                )}

                {/* Tier columns */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                    marginTop: '32px',
                  }}
                >
                  {TIERS.map((t) => (
                    <TierColumn
                      key={t}
                      tier={t}
                      schools={byTier[t]}
                      onOpen={(id) => setOpenSchoolId(id)}
                      onRemove={handleRemoveCollege}
                      collegesWithPrompts={collegesWithPrompts}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ADD TAB */}
        {tab === 'add' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or location..."
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '14px 18px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
            </div>

            {availableColleges.length === 0 ? (
              <Card>
                <p className="font-body text-center" style={{ color: 'rgba(255,255,255,0.65)', padding: '24px' }}>
                  {searchTerm ? 'No colleges found matching your search.' : 'No additional colleges available.'}
                </p>
              </Card>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '20px',
                }}
              >
                {availableColleges.map((college) => (
                  <Card key={college.id}>
                    <h3 className="font-heading" style={{ color: '#D4AF37', fontSize: '22px', marginBottom: '6px' }}>
                      {college.name}
                    </h3>
                    <p className="font-body" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', marginBottom: '14px' }}>
                      {college.location}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                      {college.acceptance_rate != null && (
                        <span className="font-body" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                          Acceptance: {(college.acceptance_rate * 100).toFixed(1)}%
                        </span>
                      )}
                      {college.sat_range_low != null && college.sat_range_high != null && (
                        <span className="font-body" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                          SAT: {college.sat_range_low} – {college.sat_range_high}
                        </span>
                      )}
                    </div>
                    <Button variant="secondary" onClick={() => handleAddCollege(college.id)} style={{ width: '100%' }}>
                      Add to Portfolio
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {openClassification && (
        <SchoolDetailModal
          classification={openClassification}
          onClose={() => setOpenSchoolId(null)}
          onRemove={() => handleRemoveCollege(openClassification.college.id)}
        />
      )}
    </div>
  );
}

/* ------------------------------ subviews ------------------------------ */

function TierColumn({
  tier,
  schools,
  onOpen,
  onRemove,
  collegesWithPrompts,
}: {
  tier: Tier;
  schools: SchoolClassification[];
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  collegesWithPrompts: Set<string>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '8px',
          borderBottom: `2px solid ${TIER_COLOR[tier]}`,
        }}
      >
        <span className="font-heading" style={{ color: 'white', fontSize: '17px', fontWeight: 600 }}>
          {tier}
        </span>
        <span
          className="font-body"
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {schools.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {schools.length === 0 ? (
          <div
            className="font-body"
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
              fontStyle: 'italic',
              padding: '20px 8px',
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.08)',
            }}
          >
            None yet
          </div>
        ) : (
          schools.map((c) => (
            <SchoolCard
              key={c.college.id}
              classification={c}
              hasPrompts={collegesWithPrompts.has(c.college.id)}
              onOpen={() => onOpen(c.college.id)}
              onRemove={() => onRemove(c.college.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
