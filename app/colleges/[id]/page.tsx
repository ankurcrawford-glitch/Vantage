'use client';
// edits: tier pill, classification panel, direct nav (no modal).

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentApplicationYear } from '@/lib/config';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Navigation from '@/components/Navigation';
import {
  classify,
  profileFromUserStats,
  type College as BaseCollege,
  type SchoolClassification,
  type StudentProfile,
  type Tier,
} from '@/lib/classifier';
import {
  evaluatePromptReadiness,
  allReady,
  ROUND_TABLE_WORD_RATIO,
  ROUND_TABLE_MIN_VERSIONS,
  type PromptReadiness,
} from '@/lib/roundTableGate';

type College = BaseCollege & {
  motto?: string | null;
  motto_translation?: string | null;
  website_url?: string | null;
};

const TIER_PILL_BG: Record<Tier, string> = {
  Safety: 'rgba(74, 222, 128, 0.15)',
  Likely: 'rgba(134, 239, 172, 0.15)',
  Target: 'rgba(201,169,119, 0.18)',
  Reach: 'rgba(251, 191, 36, 0.18)',
  'Hard Reach': 'rgba(248, 113, 113, 0.18)',
};
const TIER_PILL_TEXT: Record<Tier, string> = {
  Safety: '#8FB89A',
  Likely: '#8FB89A',
  Target: '#E8DDC9',
  Reach: '#C9A977',
  'Hard Reach': '#A35A6A',
};

// Inline renderer for **bold** markers inside prose text — the AI feedback
// comes back as plain prose with occasional bold markers, no lists.
function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const COMMON_APP_COLLEGE_ID = 'a0000000-0000-0000-0000-000000000000';

interface Prompt {
  id: string;
  prompt_text: string;
  word_limit: number | null;
  sort_order: number;
}

export default function CollegeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const collegeId = params.id as string;

  const [college, setCollege] = useState<College | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [inPortfolio, setInPortfolio] = useState<boolean>(false);

  // Round Table state — moved here from the per-essay page so the holistic
  // application review lives with the college it reviews, not inside an
  // individual essay.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roundTableResponse, setRoundTableResponse] = useState<string | null>(null);
  const [loadingRoundTable, setLoadingRoundTable] = useState(false);
  const [roundTableGateMessage, setRoundTableGateMessage] = useState<string | null>(null);
  const [roundTableHistory, setRoundTableHistory] = useState<any[]>([]);
  const [showRoundTableHistory, setShowRoundTableHistory] = useState(false);

  // Proactive Round Table gate. Mirrors the server-side check in
  // /api/round-table so users see a Locked state up front instead of
  // clicking a gold button and getting told "not yet." Round Table is
  // a final-stage tool — meant for "almost ready to submit," not a
  // first-draft review. Threshold (shared with the API via
  // lib/roundTableGate): each supplemental must hit at least
  // ROUND_TABLE_WORD_RATIO of its word limit AND have at least
  // ROUND_TABLE_MIN_VERSIONS saved versions.
  const [readiness, setReadiness] = useState<PromptReadiness[] | null>(null);

  useEffect(() => {
    checkAuth();
    loadCollegeData();
  }, [collegeId]);

  useEffect(() => {
    if (currentUserId && collegeId && collegeId !== COMMON_APP_COLLEGE_ID) {
      loadRoundTableHistory();
    }
  }, [currentUserId, collegeId]);

  // Recompute readiness whenever prompts or user changes. Per-essay we
  // need: current version word count, total version count. Mirrors the
  // server gate exactly via lib/roundTableGate.
  useEffect(() => {
    if (!currentUserId || !collegeId || collegeId === COMMON_APP_COLLEGE_ID) return;
    if (!prompts || prompts.length === 0) {
      setReadiness(null);
      return;
    }
    void loadReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, collegeId, prompts]);

  const loadReadiness = async () => {
    if (!currentUserId || prompts.length === 0) return;
    try {
      const promptIds = prompts.map((p) => p.id);
      const { data: essays } = await supabase
        .from('essays')
        .select('college_prompt_id, essay_versions(version_number, word_count, content, is_current)')
        .eq('user_id', currentUserId)
        .in('college_prompt_id', promptIds);

      // Build a per-prompt summary from the essays. If a user somehow
      // has multiple essay rows for the same prompt (legacy data), take
      // the one with the most versions.
      const byPrompt = new Map<string, { versionCount: number; wordCount: number; hasContent: boolean }>();
      essays?.forEach((essay: any) => {
        const versions = essay.essay_versions ?? [];
        const current = versions.find((v: any) => v.is_current);
        const summary = {
          versionCount: versions.length,
          wordCount: current?.word_count ?? 0,
          hasContent: !!(current?.content && current.content.trim().length > 0),
        };
        const existing = byPrompt.get(essay.college_prompt_id);
        if (!existing || summary.versionCount > existing.versionCount) {
          byPrompt.set(essay.college_prompt_id, summary);
        }
      });

      const items: PromptReadiness[] = prompts.map((p) => {
        const s = byPrompt.get(p.id) ?? { versionCount: 0, wordCount: 0, hasContent: false };
        return evaluatePromptReadiness({
          promptId: p.id,
          promptOrder: p.sort_order,
          wordLimit: p.word_limit,
          wordCount: s.wordCount,
          versionCount: s.versionCount,
          hasContent: s.hasContent,
        });
      });
      setReadiness(items);
    } catch (e) {
      console.error('Error loading readiness for Round Table gate:', e);
      setReadiness(null);
    }
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadRoundTableHistory = async () => {
    if (!collegeId || collegeId === COMMON_APP_COLLEGE_ID) return;
    try {
      const res = await fetch(`/api/round-table?collegeId=${collegeId}`);
      if (res.ok) {
        const data = await res.json();
        setRoundTableHistory(data.history || []);
      }
    } catch (e) {
      console.error('Error loading round table history:', e);
    }
  };

  const triggerRoundTable = async () => {
    if (!collegeId || collegeId === COMMON_APP_COLLEGE_ID) return;
    setLoadingRoundTable(true);
    setRoundTableGateMessage(null);
    try {
      const response = await fetch('/api/round-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate review');
      }

      const data = await response.json();
      if (data.gated) {
        setRoundTableGateMessage(data.message);
        setRoundTableResponse(null);
        return;
      }
      setRoundTableResponse(data.response);
      loadRoundTableHistory();
    } catch (error: any) {
      console.error('Error loading round table:', error);
      alert('Error loading Round Table: ' + (error.message || 'Unknown error'));
    } finally {
      setLoadingRoundTable(false);
    }
  };

  const loadCollegeData = async () => {
    try {
      const currentYear = getCurrentApplicationYear();
      const { data: { user } } = await supabase.auth.getUser();

      const [collegeRes, promptsRes, statsRes, userCollegeRes] = await Promise.all([
        supabase
          .from('colleges')
          .select('*')
          .eq('id', collegeId)
          .single(),
        supabase
          .from('college_prompts')
          .select('*')
          .eq('college_id', collegeId)
          .eq('cycle', '2026-27')
          .order('sort_order'),
        user
          ? supabase.from('user_stats').select('*').eq('user_id', user.id).single()
          : Promise.resolve({ data: null }),
        user
          ? supabase.from('user_colleges').select('college_id').eq('user_id', user.id).eq('college_id', collegeId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (collegeRes.data) {
        setCollege(collegeRes.data as College);
      }
      if (promptsRes.data) {
        setPrompts(promptsRes.data);
      }
      if (statsRes.data) {
        setProfile(profileFromUserStats(statsRes.data));
      } else if (user) {
        // Neutral defaults so the panel still renders.
        setProfile(profileFromUserStats({
          gpa_unweighted: null, gpa_weighted: null, sat_score: null, act_score: null,
          state: null, intended_major: null, ap_count: null, test_optional: null,
          hook_recruited_athlete: null, hook_first_gen: null, hook_urm: null,
          hook_low_income: null, hook_legacy_active: null, hook_legacy_college_ids: null,
        }));
      }
      if (userCollegeRes.data) {
        setInPortfolio(true);
      }
    } catch (error) {
      console.error('Error loading college data:', error);
    } finally {
      setLoading(false);
    }
  };

  const classification: SchoolClassification | null = useMemo(() => {
    if (!college || !profile || college.id === COMMON_APP_COLLEGE_ID) return null;
    try {
      return classify(college, profile, 'RD');
    } catch (e) {
      console.error('Classification failed:', e);
      return null;
    }
  }, [college, profile]);

  const handleRemoveFromPortfolio = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!confirm(`Remove ${college?.name} from your list?`)) return;
    const { error } = await supabase
      .from('user_colleges')
      .delete()
      .eq('user_id', user.id)
      .eq('college_id', collegeId);
    if (error) {
      alert('Could not remove: ' + error.message);
      return;
    }
    router.push('/colleges');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div style={{ color: '#C9A977' }}>Loading...</div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div style={{ color: '#C9A977' }}>College not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <Link href="/colleges" style={{ color: '#C9A977', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}>← Back to My Schools</Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 className="font-heading text-5xl mb-4" style={{ color: '#E8DDC9' }}>{college.name}</h1>
              <p className="font-body text-lg" style={{ color: '#E8DDC9' }}>{college.location}</p>
            </div>
            {classification && (
              <span
                className="font-body"
                style={{
                  background: TIER_PILL_BG[classification.bucket],
                  color: TIER_PILL_TEXT[classification.bucket],
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  alignSelf: 'flex-start',
                  marginTop: '8px',
                }}
              >
                {classification.bucket}
              </span>
            )}
          </div>
          {(college.motto || college.website_url) && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {college.motto && (
                <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.6)', fontStyle: 'italic' }}>
                  &ldquo;{college.motto}&rdquo;
                  {college.motto_translation && (
                    <span style={{ color: 'rgba(232,221,201,0.4)', fontStyle: 'normal' }}>
                      {' '}— {college.motto_translation}
                    </span>
                  )}
                </p>
              )}
              {college.website_url && (
                <a
                  href={college.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm"
                  style={{ color: '#C9A977', textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {college.website_url.replace(/^https?:\/\/(www\.)?/, '')} ↗
                </a>
              )}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {college.acceptance_rate != null && college.acceptance_rate !== undefined && (
              <p className="font-body text-base" style={{ color: 'rgba(232,221,201,0.8)' }}>
                Acceptance Rate: {(college.acceptance_rate * 100).toFixed(1)}%
              </p>
            )}
            {college.sat_range_low != null && college.sat_range_high != null && (
              <p className="font-body text-base" style={{ color: 'rgba(232,221,201,0.8)' }}>
                SAT Range: {college.sat_range_low} – {college.sat_range_high}
              </p>
            )}
          </div>
        </div>

        {classification && (
          <div style={{ marginBottom: '48px' }}>
            <Card>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
                padding: '20px',
                background: 'rgba(11,19,32,0.4)',
                border: '1px solid rgba(201,169,119,0.18)',
                marginBottom: '28px',
              }}>
                <ClassificationStat label="Admit Probability" value={classification.probabilityRange} />
                <ClassificationStat
                  label="Admit Rate"
                  value={`${(classification.effectiveAdmitRate * 100).toFixed(1)}%`}
                  highlight={classification.programOverrideTriggered}
                />
                {college.gpa_median_uw != null && (
                  <ClassificationStat label="GPA 50th" value={college.gpa_median_uw.toFixed(2)} />
                )}
                <ClassificationStat label="Fit Score" value={`${classification.score}`} />
                <ClassificationStat label="Rounds" value={(college.available_rounds ?? ['RD']).join(' · ')} />
              </div>

              <ClassificationSection title="Why this bucket">
                <p className="font-body" style={{ color: 'rgba(232,221,201,0.85)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                  {classification.whyThisBucket}
                </p>
              </ClassificationSection>

              {classification.appliedAdjustments.length > 0 && (
                <ClassificationSection title="Adjustments applied">
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {classification.appliedAdjustments.map((a, i) => (
                      <li
                        key={i}
                        className="font-body"
                        style={{
                          fontSize: '13px',
                          color: 'rgba(232,221,201,0.78)',
                          lineHeight: 1.5,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                        }}
                      >
                        <span aria-hidden="true" style={{ marginTop: '6px', width: '6px', height: '6px', borderRadius: '999px', background: '#C9A977', flexShrink: 0 }} />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </ClassificationSection>
              )}

              <ClassificationSection title="What would move it">
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {classification.whatWouldMoveIt.map((tip, i) => (
                    <li
                      key={i}
                      className="font-body"
                      style={{
                        fontSize: '13px',
                        color: 'rgba(232,221,201,0.85)',
                        lineHeight: 1.6,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <span aria-hidden="true" style={{ marginTop: '8px', width: '4px', height: '4px', borderRadius: '999px', background: 'rgba(232,221,201,0.45)', flexShrink: 0 }} />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </ClassificationSection>

              {inPortfolio && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(232,221,201,0.08)' }}>
                  <button
                    onClick={handleRemoveFromPortfolio}
                    className="font-body"
                    style={{
                      background: 'transparent',
                      color: '#A35A6A',
                      border: '1px solid rgba(248, 113, 113, 0.4)',
                      padding: '8px 16px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Remove from List
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}

        <div>
          <h2 className="font-heading text-2xl mb-6" style={{ color: '#E8DDC9' }}>Essay Prompts ({getCurrentApplicationYear()})</h2>
          {prompts.length === 0 ? (
            <Card>
              <p style={{ color: 'rgba(232,221,201,0.7)', textAlign: 'center', padding: '32px' }}>
                No prompts available for {getCurrentApplicationYear()}. Prompts are typically released in August.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {prompts.map((prompt) => (
                <Card key={prompt.id}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 className="font-heading text-lg mb-2" style={{ color: '#C9A977' }}>
                      Prompt {prompt.sort_order}
                    </h3>
                    <p className="font-body" style={{ color: 'rgba(232,221,201,0.9)', lineHeight: '1.6' }}>
                      {prompt.prompt_text}
                    </p>
                    {prompt.word_limit && (
                      <p className="font-body text-sm mt-2" style={{ color: 'rgba(232,221,201,0.5)' }}>
                        Word Limit: {prompt.word_limit} words
                      </p>
                    )}
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(201,169,119,0.2)' }}>
                    <Link 
                      href={`/essays/${collegeId}/${prompt.id}`}
                      style={{
                        display: 'inline-block',
                        background: '#C9A977',
                        color: '#0B1320',
                        padding: '12px 24px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        textDecoration: 'none',
                        borderRadius: '2px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#C9A977';
                        e.currentTarget.style.border = '1px solid #C9A977';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#C9A977';
                        e.currentTarget.style.color = '#0B1320';
                        e.currentTarget.style.border = 'none';
                      }}
                    >
                      Write Essay
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* The Round Table — holistic application review. Positioned AFTER
            the Essay Prompts list because it's a later-stage tool: students
            should first see what essays they need to write, then use
            Round Table once they have drafts. Hidden for the Common App
            "pseudo-college" since there are no supplementals to review. */}
        {collegeId !== COMMON_APP_COLLEGE_ID && (
          <div style={{ marginTop: '48px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <h3 className="font-heading text-xl" style={{ color: '#C9A977', marginBottom: '6px' }}>The Round Table</h3>
                  <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.75)', lineHeight: '1.6', marginBottom: '8px' }}>
                    A panel-style review of your full {college.name} application package — your Common App essay read alongside all of your {college.name} supplemental essays — by a simulated admissions committee.
                  </p>
                  <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.5)', lineHeight: '1.6' }}>
                    <strong style={{ color: 'rgba(232,221,201,0.7)' }}>When to use this:</strong> this is your final-stage review — for when you are almost ready to submit. The Round Table looks at how your essays work together, what story emerges across them, whether anything is redundant, and what parts of your story are missing. It is not for line-editing a single essay — use the per-essay Strategic Intelligence review for that.
                  </p>
                </div>
                {readiness && allReady(readiness) ? (
                  <button
                    onClick={triggerRoundTable}
                    disabled={loadingRoundTable}
                    style={{
                      background: '#C9A977',
                      color: '#0B1320',
                      padding: '12px 24px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: loadingRoundTable ? 'not-allowed' : 'pointer',
                      opacity: loadingRoundTable ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {loadingRoundTable ? 'Reviewing...' : 'Convene the Round Table'}
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '6px',
                      padding: '12px 18px',
                      border: '1px dashed rgba(232,221,201,0.18)',
                      borderRadius: '4px',
                      minWidth: '160px',
                    }}
                  >
                    <span
                      className="font-body"
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.18em',
                        color: 'rgba(232,221,201,0.5)',
                        fontWeight: 600,
                      }}
                    >
                      Locked
                    </span>
                    <span
                      className="font-body"
                      style={{
                        fontSize: '13px',
                        color: 'rgba(232,221,201,0.75)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {readiness
                        ? `${readiness.filter((r) => r.ready).length} of ${readiness.length} essays ready`
                        : 'Checking your drafts…'}
                    </span>
                  </div>
                )}
              </div>

              {readiness && readiness.length > 0 && !allReady(readiness) && (
                <ReadinessBreakdown readiness={readiness} prompts={prompts} collegeName={college.name} />
              )}

              {roundTableGateMessage && (
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(201,169,119,0.08)', borderRadius: '4px', borderLeft: '3px solid rgba(201,169,119,0.5)' }}>
                  <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.85)', lineHeight: '1.7' }}>{roundTableGateMessage}</p>
                </div>
              )}

              {roundTableResponse && (
                <div style={{ marginTop: '16px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: '3px solid #C9A977' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 className="font-heading text-md" style={{ color: '#C9A977' }}>Holistic Application Review — {college.name}</h4>
                    <button onClick={() => { setRoundTableResponse(null); setRoundTableGateMessage(null); }} style={{ background: 'transparent', color: 'rgba(232,221,201,0.5)', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0', lineHeight: '1' }}>×</button>
                  </div>
                  <div className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.9)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                    {renderBoldText(roundTableResponse)}
                  </div>
                </div>
              )}

              {roundTableHistory.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => setShowRoundTableHistory(!showRoundTableHistory)}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(201,169,119,0.7)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ transform: showRoundTableHistory ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
                    Past Reviews ({roundTableHistory.length})
                  </button>
                  {showRoundTableHistory && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {roundTableHistory.map((entry: any) => (
                        <details key={entry.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid rgba(232,221,201,0.08)' }}>
                          <summary style={{ padding: '10px 14px', cursor: 'pointer', color: 'rgba(232,221,201,0.7)', fontFamily: 'var(--font-body)', fontSize: '12px', listStyle: 'none' }}>
                            <span>Round Table Review — {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                          </summary>
                          <div className="font-body text-sm" style={{ padding: '12px 14px', color: 'rgba(232,221,201,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap', borderTop: '1px solid rgba(232,221,201,0.06)' }}>
                            {renderBoldText(entry.guidance_text)}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassificationSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        className="font-body"
        style={{
          fontSize: '10.5px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          color: '#C9A977',
          marginBottom: '10px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ClassificationStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span
        className="font-body"
        style={{
          fontSize: '9.5px',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'rgba(232,221,201,0.5)',
        }}
      >
        {label}
      </span>
      <span
        className="font-body"
        style={{
          fontSize: '15px',
          color: highlight ? '#C9A977' : 'rgba(232,221,201,0.95)',
          fontWeight: highlight ? 600 : 500,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Transparent gate for The Round Table. Shows each supplemental and
// exactly which of the two refinement criteria it does and doesn't yet
// meet. The threshold is intentionally visible so students understand
// what "ready" means and can finish what's needed without guesswork.
function ReadinessBreakdown({
  readiness,
  prompts,
  collegeName,
}: {
  readiness: PromptReadiness[];
  prompts: Prompt[];
  collegeName: string;
}) {
  const readyCount = readiness.filter((r) => r.ready).length;
  return (
    <div style={{ marginTop: '20px', padding: '18px 18px 8px', background: 'rgba(232,221,201,0.04)', borderRadius: '4px', borderLeft: '3px solid rgba(232,221,201,0.18)' }}>
      <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.85)', lineHeight: '1.7', margin: 0, marginBottom: '6px' }}>
        <strong style={{ color: '#C9A977' }}>The Round Table opens when every supplemental is refined.</strong>
      </p>
      <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.65)', lineHeight: '1.7', margin: 0, marginBottom: '16px' }}>
        Each essay needs to hit two marks: at least <strong>{Math.round(ROUND_TABLE_WORD_RATIO * 100)}% of its word limit</strong> and at least <strong>{ROUND_TABLE_MIN_VERSIONS} saved versions</strong>. That signals you've moved past first draft, which is when a holistic review is actually useful. You're at <span style={{ fontVariantNumeric: 'tabular-nums', color: '#C9A977' }}>{readyCount} of {readiness.length}</span> for {collegeName}.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
        {readiness.map((r) => {
          const prompt = prompts.find((p) => p.id === r.promptId);
          return (
            <div
              key={r.promptId}
              style={{
                padding: '12px 14px',
                background: 'rgba(11,19,32,0.4)',
                border: '1px solid rgba(232,221,201,0.08)',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <span className="font-body" style={{ color: '#E8DDC9', fontSize: '13px', fontWeight: 600 }}>
                    {r.promptLabel}
                  </span>
                  {r.wordLimit && (
                    <span className="font-body" style={{ color: 'rgba(232,221,201,0.5)', fontSize: '12px', marginLeft: '8px' }}>
                      · {r.wordLimit} word limit
                    </span>
                  )}
                </div>
                <span
                  className="font-body"
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    fontWeight: 600,
                    color: r.ready ? '#8FB89A' : 'rgba(232,221,201,0.55)',
                  }}
                >
                  {r.ready ? 'Ready' : r.started ? 'In progress' : 'Not started'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                <ReadinessCriterion
                  met={r.meetsWords}
                  label={r.wordTarget
                    ? `${r.wordCount} / ${r.wordTarget}+ words`
                    : `${r.wordCount} words written`}
                />
                <ReadinessCriterion
                  met={r.meetsVersions}
                  label={`${r.versionCount} / ${ROUND_TABLE_MIN_VERSIONS}+ versions`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReadinessCriterion({ met, label }: { met: boolean; label: string }) {
  return (
    <span
      className="font-body"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: met ? '#8FB89A' : 'rgba(232,221,201,0.55)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '11px', lineHeight: 1 }}>{met ? '✓' : '○'}</span>
      <span>{label}</span>
    </span>
  );
}