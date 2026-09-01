'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { effectiveGrade, schoolYearEnd } from '@/lib/grade';

// ─── Vantage — Annual grade confirmation ─────────────────────────
// Shown once per school year (first visit after Aug 1). We suggest the
// grade derived from class_of and ask the student to confirm or correct
// it. Saving stamps user_stats.grade_confirmed_for with the current
// school year so the screen never reappears until next August.
// Students with no grade at all never land here — the gateway chooser
// and Foundations grade picker own that path.

const GRADE_LABELS = {
  9: '9th grade (freshman)',
  10: '10th grade (sophomore)',
  11: '11th grade (junior)',
  12: '12th grade (senior)',
};

export default function ConfirmGrade() {
  const router = useRouter();
  const [suggested, setSuggested] = useState(null);
  const [selected, setSelected] = useState(null);
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
        const { data } = await supabase
          .from('user_stats')
          .select('grade, class_of, grade_confirmed_for')
          .eq('user_id', user.id)
          .maybeSingle();
        const g = effectiveGrade(data);
        if (g === null) {
          // No grade on file — the gateway chooser owns first-time setup.
          router.replace('/gateway');
          return;
        }
        if (data?.grade_confirmed_for === schoolYearEnd()) {
          // Already confirmed this year — nothing to do.
          router.replace('/gateway');
          return;
        }
        setSuggested(g);
        setSelected(g);
        setReady(true);
      } catch {
        router.replace('/gateway'); // fail open — never trap a student here
      }
    })();
  }, [router]);

  const save = async () => {
    if (saving || !selected) return;
    setSaving(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/foundations/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ grade: selected }),
      });
      if (!res.ok) throw new Error('save failed');
      router.replace('/gateway');
    } catch {
      setError("Couldn't save that. Please try again.");
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.45)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-24" style={{ background: '#0B1320' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-heading text-3xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
            <span className="text-3xl" style={{ color: '#C9A977' }}>.</span>
          </div>
          <p className="font-heading" style={{ color: '#E8DDC9', fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            Welcome back — new school year!
          </p>
          <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.68)', lineHeight: 1.6 }}>
            Quick check so your guidance fits: our records suggest you're entering{' '}
            <strong style={{ color: '#C9A977' }}>{GRADE_LABELS[suggested]}</strong> this year.
            Confirm or correct it below.
          </p>
        </div>

        {error && (
          <p className="font-body text-sm text-center mb-6" style={{ color: '#A35A6A' }}>{error}</p>
        )}

        <div style={{ display: 'grid', gap: '12px', marginBottom: '28px' }}>
          {[9, 10, 11, 12].map((g) => {
            const active = selected === g;
            return (
              <button
                key={g}
                onClick={() => setSelected(g)}
                style={{
                  background: active ? 'rgba(201,169,119,0.14)' : 'rgba(201,169,119,0.04)',
                  border: active ? '1px solid #C9A977' : '1px solid rgba(201,169,119,0.25)',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span className="font-body" style={{ color: '#E8DDC9', fontSize: '16px' }}>
                  {GRADE_LABELS[g]}
                </span>
                {g === suggested && (
                  <span className="font-body" style={{ color: '#C9A977', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Suggested
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="font-body font-bold text-xs uppercase tracking-wider"
          style={{
            width: '100%',
            height: '48px',
            background: '#C9A977',
            color: '#0B1320',
            border: '1px solid #C9A977',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : `Yes, I'm in ${selected ? GRADE_LABELS[selected].split(' ')[0] : ''} — continue`}
        </button>

        <p className="font-body text-xs text-center" style={{ color: 'rgba(232,221,201,0.45)', marginTop: '20px' }}>
          We'll ask again each August so your roadmap always matches your year.
        </p>
      </div>
    </div>
  );
}
