'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { canAccessCollegePrep } from '@/lib/college-prep-access';
import { effectiveGrade, schoolYearEnd } from '@/lib/grade';
import Button from './Button';
// Shared with FoundationsNav so both headers are visually identical.
import { C, display } from '@/lib/foundations-theme';

// College-prep-only routes. Foundations students (9/10, and juniors
// before January) are routed back to their own home if they land here.
const COLLEGE_PREP_PATHS = [
  '/dashboard',
  '/colleges',
  '/common-app',
  '/essays',
  '/story-builder',
  '/applications',
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<number | null>(null);
  // Essays dropdown: Common App + the student's own schools.
  const [essaysOpen, setEssaysOpen] = useState(false);
  const [myColleges, setMyColleges] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_stats')
            .select('grade, class_of, grade_confirmed_for')
            .eq('user_id', user.id)
            .single();
          const g = !error ? effectiveGrade(data) : null;
          if (g !== null) {
            setGrade(g);
            // Annual grade confirmation — catches students who deep-link
            // past the gateway. The confirm page stamps grade_confirmed_for.
            if ((data as { grade_confirmed_for?: number } | null)?.grade_confirmed_for !== schoolYearEnd()) {
              router.replace('/confirm-grade');
              return;
            }
          }
        } catch {
          /* grade column not present yet - leave hidden */
        }
        // Portfolio schools for the Essays dropdown — best-effort.
        try {
          const { data: rows } = await supabase
            .from('user_colleges')
            .select('colleges:college_id(id, name)')
            .eq('user_id', user.id);
          const COMMON_APP_ID = 'a0000000-0000-0000-0000-000000000000';
          const list = ((rows ?? []) as any[])
            .map((r) => r.colleges)
            .filter((c) => c?.id && c.id !== COMMON_APP_ID)
            .map((c) => ({ id: c.id as string, name: c.name as string }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, 12);
          setMyColleges(list);
        } catch { /* dropdown just shows the two mains */ }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  // Determine which page is active
  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    if (path === '/foundations') return pathname.startsWith('/foundations');
    if (path === '/applications') {
      return (
        pathname.startsWith('/applications') ||
        pathname.startsWith('/essays') ||
        pathname.startsWith('/common-app')
      );
    }
    if (path === '/profile') return pathname === '/profile';
    if (path === '/story-builder') return pathname === '/story-builder';
    if (path === '/colleges') return pathname.startsWith('/colleges');
    return false;
  };

  // Identical to the Foundations header tabs (same values, same theme).
  const getLinkStyle = (path: string): React.CSSProperties => {
    const active = isActive(path);
    return {
      fontSize: 12,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      textDecoration: 'none',
      color: active ? C.gold : C.inkDim,
      borderBottom: active ? `1px solid ${C.gold}` : '1px solid transparent',
      paddingBottom: 4,
    };
  };

  // Foundations students (9-11) get a fully separate interface:
  // only the Foundations link, and the logo points to their home.
  const isFoundations = grade !== null && grade >= 9 && grade <= 11;

  // Grade 9/10 (and juniors before January) don't get the college-prep
  // tools yet. Fails open when the grade is unknown so legacy accounts
  // are never locked out.
  const collegeSideAllowed =
    grade === null || grade === 12 || !isFoundations || canAccessCollegePrep(grade);

  // Route guard: if a Foundations-only student lands on a college-prep
  // page via direct URL, send them back to their own home.
  useEffect(() => {
    if (loading || !user || collegeSideAllowed) return;
    if (COLLEGE_PREP_PATHS.some((p) => pathname.startsWith(p))) {
      router.replace('/foundations/compass');
    }
  }, [loading, user, collegeSideAllowed, pathname, router]);

  return (
    // Mirrors FoundationsNav's <header> exactly — same border, padding,
    // wordmark treatment, and tab styling — so crossing between the two
    // sides of the product feels like one house.
    <header
      style={{
        borderBottom: `1px solid ${C.line}`,
        padding: '18px clamp(16px, 4vw, 48px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <Link
        href={user ? (isFoundations ? "/foundations/compass" : "/dashboard") : "/"}
        style={{ display: 'flex', alignItems: 'baseline', gap: 12, textDecoration: 'none' }}
      >
        <span style={{ ...display, fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: 0.5 }}>
          Vantage
        </span>
        <span style={{ color: C.gold, fontSize: 11, letterSpacing: 3, fontWeight: 500, textTransform: 'uppercase' }}>
          Applications
        </span>
      </Link>
      <nav style={{ display: 'flex', gap: 'clamp(14px, 2.5vw, 30px)', flexWrap: 'wrap', alignItems: 'center' }}>
          {loading ? (
            <span style={{ color: 'rgba(232,221,201,0.45)', fontSize: '14px' }}>Loading...</span>
          ) : user ? (
            <>
              {/* College-app links, Dashboard first. Seniors always; juniors
                  from January (canAccessCollegePrep). Grade 9/10 stay in
                  Foundations. */}
              {collegeSideAllowed && (
                <>
                  <Link href="/dashboard" style={getLinkStyle('/dashboard')}>Dashboard</Link>
                  <Link href="/story-builder" style={getLinkStyle('/story-builder')}>Story Builder</Link>
                  {/* Essays with a dropdown: Common App + the student's schools. */}
                  <div
                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'baseline' }}
                    onMouseEnter={() => setEssaysOpen(true)}
                    onMouseLeave={() => setEssaysOpen(false)}
                  >
                    <Link href="/applications" style={getLinkStyle('/applications')}>
                      Essays <span aria-hidden style={{ fontSize: 9 }}>▾</span>
                    </Link>
                    {essaysOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          paddingTop: 10, // hover bridge between tab and menu
                          zIndex: 60,
                        }}
                      >
                        <div
                          style={{
                            background: '#101a2b',
                            border: `1px solid ${C.line}`,
                            borderRadius: 8,
                            minWidth: 220,
                            padding: '8px 0',
                            boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)',
                          }}
                        >
                          {[
                            { href: '/applications', label: 'All Essays' },
                            { href: '/common-app', label: 'Common App' },
                          ].map((it) => (
                            <Link
                              key={it.href}
                              href={it.href}
                              onClick={() => setEssaysOpen(false)}
                              style={{
                                display: 'block',
                                padding: '9px 18px',
                                fontSize: 12,
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                                textDecoration: 'none',
                                color: C.gold,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,169,119,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              {it.label}
                            </Link>
                          ))}
                          {myColleges.length > 0 && (
                            <>
                              <div style={{ borderTop: `1px solid ${C.line}`, margin: '6px 0' }} />
                              <p
                                style={{
                                  padding: '4px 18px 6px',
                                  margin: 0,
                                  fontSize: 9,
                                  letterSpacing: 2,
                                  textTransform: 'uppercase',
                                  color: C.inkDim,
                                }}
                              >
                                Your schools
                              </p>
                              {myColleges.map((c) => (
                                <Link
                                  key={c.id}
                                  href={`/colleges/${c.id}`}
                                  onClick={() => setEssaysOpen(false)}
                                  style={{
                                    display: 'block',
                                    padding: '7px 18px',
                                    fontSize: 13,
                                    textDecoration: 'none',
                                    color: C.inkDim,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 260,
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = C.gold; e.currentTarget.style.background = 'rgba(201,169,119,0.08)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = C.inkDim; e.currentTarget.style.background = 'transparent'; }}
                                >
                                  {c.name}
                                </Link>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Link href="/colleges" style={getLinkStyle('/colleges')}>Strategy</Link>
                  <Link href="/profile" style={getLinkStyle('/profile')}>My Profile</Link>
                </>
              )}
              {/* Foundations is the other world — set apart by a divider,
                  mirroring the gold "Vantage →" crossover in FoundationsNav.
                  The env flag is a deploy switch (NEXT_PUBLIC_FOUNDATIONS_ENABLED),
                  not a user gate. */}
              {process.env.NEXT_PUBLIC_FOUNDATIONS_ENABLED === 'true' && (
                <Link
                  href="/foundations/compass"
                  style={{
                    fontSize: 12,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: C.gold,
                    borderLeft: collegeSideAllowed ? `1px solid ${C.line}` : 'none',
                    paddingLeft: collegeSideAllowed ? 'clamp(14px, 2.5vw, 24px)' : 0,
                    paddingBottom: 4,
                  }}
                >
                  Foundations →
                </Link>
              )}
              {/* Same treatment as the Foundations header's "Log out". */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  letterSpacing: 1,
                  color: C.inkDim,
                  fontFamily: 'inherit',
                  paddingBottom: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.ink;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.inkDim;
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
          )}
      </nav>
    </header>
  );
}
