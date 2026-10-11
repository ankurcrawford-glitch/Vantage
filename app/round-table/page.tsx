'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import { ROUND_TABLE_WORD_RATIO, ROUND_TABLE_MIN_VERSIONS } from '@/lib/roundTableGate';

const COMMON_APP_COLLEGE_ID = 'a0000000-0000-0000-0000-000000000000';

interface SchoolRow {
  id: string;
  name: string;
  total: number; // supplemental prompts for this school
  ready: number; // prompts that meet the Round Table bar
}

// Per-school readiness for the signed-in student, using the same bar the
// Round Table itself enforces (lib/roundTableGate). Read-only.
function useSchoolReadiness(): { rows: SchoolRow[] | null; signedIn: boolean | null } {
  const [rows, setRows] = useState<SchoolRow[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSignedIn(false); setRows([]); return; }
        setSignedIn(true);
        const { data: uc } = await supabase.from('user_colleges').select('college_id').eq('user_id', user.id);
        const ids = (uc ?? []).map((r: { college_id: string }) => r.college_id).filter((id) => id !== COMMON_APP_COLLEGE_ID);
        if (ids.length === 0) { setRows([]); return; }
        const [{ data: colleges }, { data: prompts }] = await Promise.all([
          supabase.from('colleges').select('id, name').in('id', ids),
          supabase.from('college_prompts').select('id, college_id, word_limit').in('college_id', ids),
        ]);
        const promptList = prompts ?? [];
        const promptIds = promptList.map((p: { id: string }) => p.id);
        const readyPromptIds = new Set<string>();
        if (promptIds.length > 0) {
          const { data: essays } = await supabase
            .from('essays')
            .select('college_prompt_id, essay_versions(word_count, content, is_current)')
            .eq('user_id', user.id)
            .in('college_prompt_id', promptIds);
          const limitById = new Map<string, number | null>(promptList.map((p: { id: string; word_limit: number | null }) => [p.id, p.word_limit ?? null]));
          for (const e of (essays ?? []) as { college_prompt_id: string; essay_versions?: { word_count: number | null; content: string | null; is_current: boolean }[] }[]) {
            const versions = e.essay_versions ?? [];
            const current = versions.find((v) => v.is_current);
            if (!current?.content?.trim()) continue;
            const limit = limitById.get(e.college_prompt_id) ?? null;
            const target = limit ? Math.ceil(limit * ROUND_TABLE_WORD_RATIO) : null;
            const meetsWords = target ? (current.word_count ?? 0) >= target : true;
            if (meetsWords && versions.length >= ROUND_TABLE_MIN_VERSIONS) readyPromptIds.add(e.college_prompt_id);
          }
        }
        const out: SchoolRow[] = (colleges ?? []).map((c: { id: string; name: string }) => {
          const mine = promptList.filter((p: { college_id: string }) => p.college_id === c.id);
          return { id: c.id, name: c.name, total: mine.length, ready: mine.filter((p: { id: string }) => readyPromptIds.has(p.id)).length };
        });
        out.sort((a, b) => a.name.localeCompare(b.name));
        setRows(out);
      } catch {
        setRows([]); // page still explains the Round Table; the list is a convenience
      }
    })();
  }, []);
  return { rows, signedIn };
}

// ─── Vantage — What is the Round Table? ──────────────────────────
// The definition page the journey strip points to. Explains what the
// Round Table is, what it does for the student, what it requires, and
// where to convene one. No new nav entry — the strip and school pages
// are its doors.

const gold = '#C9A977';
const ink = '#E8DDC9';
const dim = 'rgba(232,221,201,0.68)';
const faint = 'rgba(232,221,201,0.45)';

function Point({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
      <span
        className="font-heading"
        style={{
          color: gold,
          fontSize: '15px',
          fontWeight: 600,
          border: '1px solid rgba(201,169,119,0.4)',
          borderRadius: '50%',
          width: '34px',
          height: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      <div>
        <h3 className="font-heading text-xl font-semibold mb-1" style={{ color: ink }}>{title}</h3>
        <p className="font-body text-sm" style={{ color: dim, lineHeight: 1.65, margin: 0 }}>{children}</p>
      </div>
    </div>
  );
}

export default function RoundTablePage() {
  const { rows, signedIn } = useSchoolReadiness();
  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 96px' }}>
        <p className="font-body mb-3" style={{ color: gold, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          The final read
        </p>
        <h1 className="font-heading text-5xl mb-5" style={{ color: ink, lineHeight: 1.1 }}>
          The Round Table
        </h1>
        <p className="font-body text-lg mb-12" style={{ color: dim, lineHeight: 1.7 }}>
          Before you hit submit, an admissions committee will read your application the way
          you never do: all of it at once, side by side, asking one question — <em style={{ color: ink }}>who
          is this person?</em> The Round Table is that reading, done for you, before it counts.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '48px' }}>
          <Point n="1" title="It reads everything, per school">
            Your Common App essay, every supplement for that college, your activities, your
            stats — reviewed together as one application to one school, not as separate pieces.
          </Point>
          <Point n="2" title="It knows what that school values">
            The read is tuned to the college in front of it. What lands at a place defined by
            research intensity is different from what lands at a place built on discussion and
            debate — the Round Table judges your application in that school&apos;s terms.
          </Point>
          <Point n="3" title="It catches what single-essay feedback can't">
            Two essays telling the same story. A thread you set up in one piece and abandoned.
            A supplement that could have been written by anyone. These only show up when
            everything is read together — which is exactly how it will be read.
          </Point>
          <Point n="4" title="It tells you the truth, while you can still act on it">
            You get the committee&apos;s honest verdict — what carries the application, what
            weakens it, what to fix — days before the deadline instead of months after.
          </Point>
        </div>

        <div style={{
          borderLeft: `3px solid ${gold}`,
          background: 'rgba(201,169,119,0.07)',
          borderRadius: '0 10px 10px 0',
          padding: '18px 24px',
          marginBottom: '48px',
        }}>
          <p className="font-body text-sm" style={{ color: ink, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: gold }}>When it unlocks:</strong> the Round Table convenes
            once a school&apos;s essays are genuinely drafted — each one near its word limit and
            saved. That&apos;s deliberate: a committee read of
            half-finished work would only tell you it&apos;s half-finished.
          </p>
        </div>

        {signedIn && rows && rows.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 className="font-heading text-2xl mb-3" style={{ color: ink }}>Your schools</h2>
            <p className="font-body text-sm mb-4" style={{ color: dim, lineHeight: 1.7 }}>
              Each school convenes its own Round Table. Click a school to go straight to it.
              The count shows how many of that school&apos;s supplements meet the bar
              (at least {Math.round(ROUND_TABLE_WORD_RATIO * 100)}% of the word limit, saved).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rows.map((r) => {
                const open = r.total > 0 && r.ready >= r.total;
                const noSupp = r.total === 0;
                return (
                  <Link key={r.id} href={`/colleges/${r.id}#round-table`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderRadius: '4px',
                        background: '#101a2b', border: '1px solid rgba(232,221,201,0.12)',
                      }}
                    >
                      <span className="font-body text-sm" style={{ color: ink }}>{r.name}</span>
                      <span
                        className="font-body text-xs uppercase tracking-wider"
                        style={{ color: open ? '#0B1320' : noSupp ? faint : gold, background: open ? gold : 'transparent', padding: '4px 10px', borderRadius: '3px', border: open ? 'none' : '1px solid rgba(201,169,119,0.35)', whiteSpace: 'nowrap' }}
                      >
                        {noSupp ? 'No supplements' : open ? 'Ready — convene' : `${r.ready} of ${r.total} essays ready`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="font-heading text-2xl mb-3" style={{ color: ink }}>How to convene one</h2>
        <p className="font-body text-sm mb-8" style={{ color: dim, lineHeight: 1.7 }}>
          Open <Link href="/colleges" style={{ color: gold, textDecoration: 'underline' }}>My Schools</Link>,
          click into any college on your list, and look for the Round Table. Run it school by
          school as each application comes together — the read is different every time, because
          every school is.
        </p>

        <Link href="/colleges">
          <button
            className="font-body font-bold text-xs uppercase tracking-wider"
            style={{
              background: gold,
              color: '#0B1320',
              padding: '14px 32px',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            Go to My Schools
          </button>
        </Link>
        <p className="font-body text-xs mt-4" style={{ color: faint }}>
          Part of the journey: Profile → Strategy → Story Builder → Essays → <span style={{ color: gold }}>Round Table</span>.
        </p>
      </div>
    </div>
  );
}
