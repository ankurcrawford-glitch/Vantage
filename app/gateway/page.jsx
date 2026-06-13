'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Vantage — Gateway ───────────────────────────────────────────
// Post-login fork. If we already know the student's grade, route them
// straight to their interface (no buttons):
//   grade 9-11 → Foundations
//   grade 12   → Vantage (college app)
// If grade is unknown (first login, or existing users from before the
// grade column), show the two-door chooser. The choice is saved to
// user_stats.grade so they are never asked again.

export default function Gateway() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }
        // Remembered grade → skip the chooser entirely.
        const { data } = await supabase
          .from('user_stats')
          .select('grade')
          .eq('user_id', user.id)
          .maybeSingle();
        const g = data?.grade;
        if (typeof g === 'number' && g >= 9 && g <= 11) {
          router.replace('/foundations/conversation');
          return;
        }
        if (g === 12) {
          router.replace('/dashboard');
          return;
        }
        setReady(true); // unknown grade → show the two doors
      } catch {
        setReady(true); // fail open: let them choose
      }
    })();
  }, [router]);

  const enterFoundations = () => {
    // Grade picker (9/10/11) saves the grade, then Foundations welcome.
    router.push('/foundations/start');
  };

  const goToVantage = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Did they already have a profile row? (decides dashboard vs profile)
      const { data: existing } = await supabase
        .from('user_stats')
        .select('user_id')
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      const res = await fetch('/api/foundations/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ grade: 12 }),
      });
      if (!res.ok) throw new Error('save failed');

      // New seniors set up their profile first; returning users go home.
      router.push(existing ? '/dashboard' : '/profile');
    } catch {
      setError("Couldn't save that. Please try again.");
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.5)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-24" style={{ background: '#0B1320' }}>
      <div style={{ width: '100%', maxWidth: '720px' }}>
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-heading text-3xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
            <span className="text-3xl" style={{ color: '#C9A977' }}>.</span>
          </div>
          <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.7)' }}>
            Where are you on the journey?
          </p>
        </div>

        {error && (
          <p className="font-body text-sm text-center mb-6" style={{ color: '#A35A6A' }}>{error}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Foundations door */}
          <button
            onClick={enterFoundations}
            style={{
              background: 'rgba(201,169,119,0.06)',
              border: '1px solid rgba(201,169,119,0.3)',
              borderRadius: '8px',
              padding: '36px 28px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A977'; e.currentTarget.style.background = 'rgba(201,169,119,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(201,169,119,0.3)'; e.currentTarget.style.background = 'rgba(201,169,119,0.06)'; }}
          >
            <p className="font-body" style={{ color: '#C9A977', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
              Grades 9–11
            </p>
            <p className="font-heading" style={{ color: '#E8DDC9', fontSize: '26px', fontWeight: 600, marginBottom: '10px' }}>
              Enter Foundations
            </p>
            <p className="font-body" style={{ color: 'rgba(232,221,201,0.6)', fontSize: '14px', lineHeight: 1.6 }}>
              Discover who you are, build your story, and lay the groundwork — years before applications.
            </p>
          </button>

          {/* Vantage door */}
          <button
            onClick={goToVantage}
            disabled={saving}
            style={{
              background: 'rgba(201,169,119,0.06)',
              border: '1px solid rgba(201,169,119,0.3)',
              borderRadius: '8px',
              padding: '36px 28px',
              textAlign: 'left',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A977'; e.currentTarget.style.background = 'rgba(201,169,119,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(201,169,119,0.3)'; e.currentTarget.style.background = 'rgba(201,169,119,0.06)'; }}
          >
            <p className="font-body" style={{ color: '#C9A977', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
              Rising Seniors
            </p>
            <p className="font-heading" style={{ color: '#E8DDC9', fontSize: '26px', fontWeight: 600, marginBottom: '10px' }}>
              {saving ? 'One moment…' : 'Go to Vantage'}
            </p>
            <p className="font-body" style={{ color: 'rgba(232,221,201,0.6)', fontSize: '14px', lineHeight: 1.6 }}>
              Applying this year. Your colleges, essays, and strategy — all in one place.
            </p>
          </button>
        </div>

        <p className="font-body text-xs text-center" style={{ color: 'rgba(232,221,201,0.4)', marginTop: '28px' }}>
          We'll remember your choice — next time you'll go straight in.
        </p>
      </div>
    </div>
  );
}
