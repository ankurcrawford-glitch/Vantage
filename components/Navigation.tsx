'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { canAccessCollegePrep } from '@/lib/college-prep-access';
import { effectiveGrade, schoolYearEnd } from '@/lib/grade';
import Button from './Button';

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

  // Same treatment as the Foundations header tabs: small caps, tracked
  // out, gold underline on the active section.
  const getLinkStyle = (path: string): React.CSSProperties => {
    const active = isActive(path);
    return {
      color: active ? '#C9A977' : 'rgba(232,221,201,0.7)',
      textDecoration: 'none',
      fontSize: '12px',
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-body)',
      fontWeight: active ? 600 : 400,
      borderBottom: active ? '1px solid #C9A977' : '1px solid transparent',
      paddingBottom: '4px',
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
    <nav style={{ borderBottom: '1px solid rgba(232,221,201,0.1)', padding: '24px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={user ? (isFoundations ? "/foundations/compass" : "/dashboard") : "/"} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span className="font-heading text-2xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
          <span className="text-2xl" style={{ color: '#C9A977' }}>.</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {loading ? (
            <span style={{ color: 'rgba(232,221,201,0.5)', fontSize: '14px' }}>Loading...</span>
          ) : user ? (
            <>
              {/* College-app links, Dashboard first. Seniors always; juniors
                  from January (canAccessCollegePrep). Grade 9/10 stay in
                  Foundations. */}
              {collegeSideAllowed && (
                <>
                  <Link href="/dashboard" style={getLinkStyle('/dashboard')}>Dashboard</Link>
                  <Link href="/story-builder" style={getLinkStyle('/story-builder')}>Story Builder</Link>
                  <Link href="/applications" style={getLinkStyle('/applications')}>Essays</Link>
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
                    fontSize: '12px',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-body)',
                    color: '#C9A977',
                    borderLeft: collegeSideAllowed ? '1px solid rgba(201,169,119,0.35)' : 'none',
                    paddingLeft: collegeSideAllowed ? '24px' : 0,
                    paddingBottom: '4px',
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
                  fontSize: '12px',
                  letterSpacing: '1px',
                  color: 'rgba(232,221,201,0.6)',
                  fontFamily: 'var(--font-body)',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E8DDC9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(232,221,201,0.6)';
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
        </div>
      </div>
    </nav>
  );
}
