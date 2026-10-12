'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';

// ─── Vantage — admin: students ───────────────────────────────────
// Who's signed up, who's active, what each student has done. Read-only
// roll-up from /api/admin/students (admin-gated server side).

interface Student {
  id: string; name: string | null; email: string; grade: number | null; class_of: number | null;
  gpa: number | null; sat: number | null; subscription: string | null;
  signed_up: string; last_sign_in: string | null; last_active: string | null;
  schools: number; early_plans: number; submitted: number; story_answers: number;
  essays: number; common_app_essays: number; essay_versions: number; last_essay_save: string | null;
  si_runs: number; round_tables: number; last_round_table: string | null;
  conversation_msgs: number; counselor_qs: number; spark_entries: number; activities: number;
}
interface Summary {
  total: number; new_7d: number; new_30d: number; active_7d: number; active_30d: number;
  by_grade: Record<string, number>; round_tables_7d: number; essay_saves_7d: number;
}

const gold = '#C9A977';
const ink = '#E8DDC9';
const dim = 'rgba(232,221,201,0.68)';
const faint = 'rgba(232,221,201,0.45)';

function ago(iso: string | null): string {
  if (!iso) return '—';
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return 'today';
  if (d < 2) return 'yesterday';
  if (d < 30) return `${Math.floor(d)}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
function warmth(iso: string | null): string {
  if (!iso) return faint;
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  return d <= 7 ? '#8FB89A' : d <= 30 ? gold : faint;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sort, setSort] = useState<keyof Student>('last_active');

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/login'); return; }
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/admin/students', {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (res.status === 403) { setDenied(true); return; }
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
        setSummary(data.summary);
        setStudents(data.students);
      } catch (e) {
        console.error(e);
        setLoadError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const rows = students
    .filter((s) => gradeFilter === 'all' ? true : gradeFilter === 'unset' ? s.grade === null : String(s.grade) === gradeFilter)
    .sort((a, b) => {
      const av = a[sort]; const bv = b[sort];
      if (typeof av === 'number' && typeof bv === 'number') return bv - av;
      return String(bv ?? '').localeCompare(String(av ?? ''));
    });

  const Tile = ({ label, value }: { label: string; value: string | number }) => (
    <div style={{ background: '#101a2b', border: '1px solid rgba(232,221,201,0.12)', borderRadius: '6px', padding: '14px 18px', minWidth: '130px' }}>
      <div className="font-heading" style={{ color: gold, fontSize: '28px', lineHeight: 1 }}>{value}</div>
      <div className="font-body text-xs uppercase tracking-wider" style={{ color: faint, marginTop: '6px' }}>{label}</div>
    </div>
  );

  const Th = ({ k, label, title }: { k: keyof Student; label: string; title?: string }) => (
    <th
      onClick={() => setSort(k)}
      title={title}
      style={{ textAlign: 'left', padding: '8px 10px', color: sort === k ? gold : dim, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500, borderBottom: '1px solid rgba(232,221,201,0.12)' }}
    >
      {label}{sort === k ? ' ▾' : ''}
    </th>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0B1320', color: ink }}>
      <Navigation />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px clamp(16px, 3vw, 40px)' }}>
        <h1 className="font-heading text-3xl mb-2" style={{ color: ink }}>Students</h1>
        <p className="font-body text-sm mb-6" style={{ color: dim }}>
          Everyone with an account, what they&apos;ve done, and when. &quot;Last active&quot; is the newest of: sign-in, essay save, AI review, counselor message, Spark entry.
        </p>

        {loading && <p className="font-body text-sm" style={{ color: dim }}>Loading…</p>}
        {denied && <p className="font-body text-sm" style={{ color: '#A35A6A' }}>Admin only — sign in with an address listed in SUPPORT_ADMIN_EMAILS (defaults to the owner&apos;s Gmail).</p>}
        {loadError && <p className="font-body text-sm" style={{ color: '#A35A6A' }}>Couldn&apos;t load: {loadError}</p>}

        {summary && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <Tile label="Students" value={summary.total} />
              <Tile label="New, 7 days" value={summary.new_7d} />
              <Tile label="New, 30 days" value={summary.new_30d} />
              <Tile label="Active, 7 days" value={summary.active_7d} />
              <Tile label="Active, 30 days" value={summary.active_30d} />
              <Tile label="Essay saves, 7d" value={summary.essay_saves_7d} />
              <Tile label="Round Tables, 7d" value={summary.round_tables_7d} />
            </div>

            <div className="font-body text-sm" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px', color: dim }}>
              <span>Grade:</span>
              {['all', '12', '11', '10', '9', 'unset'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGradeFilter(g)}
                  className="font-body text-xs uppercase tracking-wider"
                  style={{ background: gradeFilter === g ? gold : 'transparent', color: gradeFilter === g ? '#0B1320' : dim, border: '1px solid rgba(201,169,119,0.35)', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                >
                  {g === 'all' ? `All (${summary.total})` : g === 'unset' ? `Unset (${summary.by_grade['unset'] || 0})` : `${g} (${summary.by_grade[g] || 0})`}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', color: faint }}>Click a column header to sort.</span>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid rgba(232,221,201,0.12)', borderRadius: '6px' }}>
              <table className="font-body text-sm" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px' }}>
                <thead>
                  <tr>
                    <Th k="name" label="Student" />
                    <Th k="grade" label="Grade" />
                    <Th k="last_active" label="Last active" />
                    <Th k="last_sign_in" label="Last sign-in" />
                    <Th k="signed_up" label="Signed up" />
                    <Th k="schools" label="Schools" title="Schools on list / with an early plan / submitted" />
                    <Th k="story_answers" label="Story" title="Story Builder answers (of 12)" />
                    <Th k="essays" label="Essays" title="Essays started (Common App of those) / total saved versions" />
                    <Th k="last_essay_save" label="Last save" />
                    <Th k="si_runs" label="SI" title="Strategic Intelligence runs" />
                    <Th k="round_tables" label="RT" title="Round Table runs" />
                    <Th k="conversation_msgs" label="Convo" title="Foundations conversation messages sent" />
                    <Th k="counselor_qs" label="Counselor" title="Counselor questions asked" />
                    <Th k="spark_entries" label="Spark" />
                    <Th k="activities" label="Acts" title="Activities on profile" />
                    <Th k="subscription" label="Access" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(232,221,201,0.06)' }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ color: ink }}>{s.name || '(no name)'}</div>
                        <div style={{ color: faint, fontSize: '12px' }}>{s.email}</div>
                      </td>
                      <td style={{ padding: '8px 10px', color: s.grade ? ink : '#A35A6A' }}>{s.grade ?? 'unset'}{s.class_of ? <span style={{ color: faint, fontSize: '12px' }}> ’{String(s.class_of).slice(2)}</span> : null}</td>
                      <td style={{ padding: '8px 10px', color: warmth(s.last_active), whiteSpace: 'nowrap' }}>{ago(s.last_active)}</td>
                      <td style={{ padding: '8px 10px', color: dim, whiteSpace: 'nowrap' }}>{ago(s.last_sign_in)}</td>
                      <td style={{ padding: '8px 10px', color: dim, whiteSpace: 'nowrap' }}>{new Date(s.signed_up).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                      <td style={{ padding: '8px 10px', color: dim }}>{s.schools}{s.early_plans ? ` / ${s.early_plans} early` : ''}{s.submitted ? ` / ${s.submitted} sent` : ''}</td>
                      <td style={{ padding: '8px 10px', color: s.story_answers >= 12 ? '#8FB89A' : dim }}>{s.story_answers}/12</td>
                      <td style={{ padding: '8px 10px', color: dim }}>{s.essays}{s.common_app_essays ? ` (${s.common_app_essays} CA)` : ''} / {s.essay_versions}v</td>
                      <td style={{ padding: '8px 10px', color: warmth(s.last_essay_save), whiteSpace: 'nowrap' }}>{ago(s.last_essay_save)}</td>
                      <td style={{ padding: '8px 10px', color: dim }}>{s.si_runs}</td>
                      <td style={{ padding: '8px 10px', color: s.round_tables ? '#8FB89A' : dim }}>{s.round_tables}{s.last_round_table ? <span style={{ color: faint, fontSize: '12px' }}> {ago(s.last_round_table)}</span> : null}</td>
                      <td style={{ padding: '8px 10px', color: dim }}>{s.conversation_msgs}</td>
                      <td style={{ padding: '8px 10px', color: dim }}>{s.counselor_qs}</td>
                      <td style={{ padding: '8px 10px', color: dim }}>{s.spark_entries}</td>
                      <td style={{ padding: '8px 10px', color: dim }}>{s.activities}</td>
                      <td style={{ padding: '8px 10px', color: s.subscription === 'active' ? '#8FB89A' : faint }}>{s.subscription || 'free'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
