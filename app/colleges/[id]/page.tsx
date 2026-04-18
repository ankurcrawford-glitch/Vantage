'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentApplicationYear } from '@/lib/config';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface College {
  id: string;
  name: string;
  location: string;
  acceptance_rate?: number | null;
  sat_range_low?: number | null;
  sat_range_high?: number | null;
  motto?: string | null;
  motto_translation?: string | null;
  website_url?: string | null;
}

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

  // Round Table state — moved here from the per-essay page so the holistic
  // application review lives with the college it reviews, not inside an
  // individual essay.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roundTableResponse, setRoundTableResponse] = useState<string | null>(null);
  const [loadingRoundTable, setLoadingRoundTable] = useState(false);
  const [roundTableGateMessage, setRoundTableGateMessage] = useState<string | null>(null);
  const [roundTableHistory, setRoundTableHistory] = useState<any[]>([]);
  const [showRoundTableHistory, setShowRoundTableHistory] = useState(false);

  useEffect(() => {
    checkAuth();
    loadCollegeData();
  }, [collegeId]);

  useEffect(() => {
    if (currentUserId && collegeId && collegeId !== COMMON_APP_COLLEGE_ID) {
      loadRoundTableHistory();
    }
  }, [currentUserId, collegeId]);

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

      const { data: collegeData } = await supabase
        .from('colleges')
        .select('id, name, location, acceptance_rate, sat_range_low, sat_range_high, motto, motto_translation, website_url')
        .eq('id', collegeId)
        .single();

      if (collegeData) {
        setCollege(collegeData);
      }

      // Load prompts for current application year only
      const { data: promptsData } = await supabase
        .from('college_prompts')
        .select('*')
        .eq('college_id', collegeId)
        .eq('year', currentYear)
        .order('sort_order');

      if (promptsData) {
        setPrompts(promptsData);
      }
    } catch (error) {
      console.error('Error loading college data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>Loading...</div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>College not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/colleges" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/dashboard' ? 600 : 400 }}>Dashboard</Link>
            <Link href="/personal-statement" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays')) ? 600 : 400 }}>Essays</Link>
            <Link href="/common-app" style={{ color: pathname.startsWith('/common-app') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname.startsWith('/common-app') ? 600 : 400 }}>Common App</Link>
            <Link href="/colleges" style={{ color: pathname.startsWith('/colleges') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname.startsWith('/colleges') ? 600 : 400 }}>Portfolio</Link>
            <Link href="/profile" style={{ color: pathname === '/profile' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/profile' ? 600 : 400 }}>Profile</Link>
            <Link href="/discovery" style={{ color: pathname === '/discovery' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/discovery' ? 600 : 400 }}>Insight Questions</Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#F3E5AB'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <Link href="/colleges" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}>← Back to Portfolio</Link>
          <h1 className="font-heading text-5xl mb-4" style={{ color: 'white' }}>{college.name}</h1>
          <p className="font-body text-lg" style={{ color: '#F3E5AB' }}>{college.location}</p>
          {(college.motto || college.website_url) && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {college.motto && (
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                  &ldquo;{college.motto}&rdquo;
                  {college.motto_translation && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'normal' }}>
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
                  style={{ color: '#D4AF37', textDecoration: 'none' }}
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
              <p className="font-body text-base" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Acceptance Rate: {(college.acceptance_rate * 100).toFixed(1)}%
              </p>
            )}
            {college.sat_range_low != null && college.sat_range_high != null && (
              <p className="font-body text-base" style={{ color: 'rgba(255,255,255,0.8)' }}>
                SAT Range: {college.sat_range_low} – {college.sat_range_high}
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-2xl mb-6" style={{ color: 'white' }}>Essay Prompts ({getCurrentApplicationYear()})</h2>
          {prompts.length === 0 ? (
            <Card>
              <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '32px' }}>
                No prompts available for {getCurrentApplicationYear()}. Prompts are typically released in August.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {prompts.map((prompt) => (
                <Card key={prompt.id}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 className="font-heading text-lg mb-2" style={{ color: '#D4AF37' }}>
                      Prompt {prompt.sort_order}
                    </h3>
                    <p className="font-body" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>
                      {prompt.prompt_text}
                    </p>
                    {prompt.word_limit && (
                      <p className="font-body text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Word Limit: {prompt.word_limit} words
                      </p>
                    )}
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                    <Link 
                      href={`/essays/${collegeId}/${prompt.id}`}
                      style={{
                        display: 'inline-block',
                        background: '#D4AF37',
                        color: '#0B1623',
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
                        e.currentTarget.style.color = '#D4AF37';
                        e.currentTarget.style.border = '1px solid #D4AF37';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#D4AF37';
                        e.currentTarget.style.color = '#0B1623';
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
                  <h3 className="font-heading text-xl" style={{ color: '#D4AF37', marginBottom: '6px' }}>The Round Table</h3>
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', marginBottom: '8px' }}>
                    A panel-style review of your full {college.name} application package — your Common App essay read alongside all of your {college.name} supplemental essays — by a simulated admissions committee.
                  </p>
                  <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                    <strong style={{ color: 'rgba(255,255,255,0.7)' }}>When to use this:</strong> once you have drafts of most or all of your essays for this school. The Round Table looks at how your essays work together, what story emerges across them, whether anything is redundant, and what parts of your story are missing. It is not for line-editing a single essay — use the per-essay Strategic Intelligence review for that.
                  </p>
                </div>
                <button
                  onClick={triggerRoundTable}
                  disabled={loadingRoundTable}
                  style={{
                    background: '#D4AF37',
                    color: '#0B1623',
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
                  {loadingRoundTable ? 'Reviewing...' : 'Get Holistic Review'}
                </button>
              </div>

              {roundTableGateMessage && (
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(212,175,55,0.08)', borderRadius: '4px', borderLeft: '3px solid rgba(212,175,55,0.5)' }}>
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: '1.7' }}>{roundTableGateMessage}</p>
                </div>
              )}

              {roundTableResponse && (
                <div style={{ marginTop: '16px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: '3px solid #D4AF37' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h4 className="font-heading text-md" style={{ color: '#D4AF37' }}>Holistic Application Review — {college.name}</h4>
                    <button onClick={() => { setRoundTableResponse(null); setRoundTableGateMessage(null); }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0', lineHeight: '1' }}>×</button>
                  </div>
                  <div className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                    {renderBoldText(roundTableResponse)}
                  </div>
                </div>
              )}

              {roundTableHistory.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => setShowRoundTableHistory(!showRoundTableHistory)}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(212,175,55,0.7)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ transform: showRoundTableHistory ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
                    Past Reviews ({roundTableHistory.length})
                  </button>
                  {showRoundTableHistory && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {roundTableHistory.map((entry: any) => (
                        <details key={entry.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <summary style={{ padding: '10px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', fontSize: '12px', listStyle: 'none' }}>
                            <span>Round Table Review — {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                          </summary>
                          <div className="font-body text-sm" style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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