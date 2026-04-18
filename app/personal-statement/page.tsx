'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';

interface Essay {
  // Present only for started essays
  id?: string;
  latest_version?: number;
  latest_word_count?: number;
  updated_at?: string;
  // Always present (built from college_prompts + user_colleges)
  college_id: string;
  college_name: string;
  prompt_id: string;
  prompt_text: string;
  prompt_sort_order: number;
  word_limit?: number;
  started: boolean;
}

export default function PersonalStatementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadEssays();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadEssays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load the user's portfolio colleges. Common App is always implicitly
      // in the portfolio; other colleges come from user_colleges.
      const { data: userColleges } = await supabase
        .from('user_colleges')
        .select('college_id, colleges:college_id(id, name)')
        .eq('user_id', user.id);

      const collegeNameMap = new Map<string, string>();
      const collegeIds: string[] = [];
      if (userColleges) {
        for (const uc of userColleges as any[]) {
          const c = uc.colleges;
          if (c?.id) {
            collegeNameMap.set(c.id, c.name);
            collegeIds.push(c.id);
          }
        }
      }

      // Always include the Common App pseudo-college so its prompts appear
      // on this page even if the user hasn't explicitly added it.
      const COMMON_APP_COLLEGE_ID = 'a0000000-0000-0000-0000-000000000000';
      if (!collegeNameMap.has(COMMON_APP_COLLEGE_ID)) {
        collegeIds.push(COMMON_APP_COLLEGE_ID);
        collegeNameMap.set(COMMON_APP_COLLEGE_ID, 'Common Application');
      }

      if (collegeIds.length === 0) {
        setEssays([]);
        return;
      }

      // Load all prompts for those colleges so unstarted ones still appear.
      const { data: prompts, error: promptsError } = await supabase
        .from('college_prompts')
        .select('id, prompt_text, sort_order, college_id, word_limit')
        .in('college_id', collegeIds)
        .order('sort_order', { ascending: true });

      if (promptsError) throw promptsError;

      // Load the user's existing essays so we can mark which prompts have
      // been started and show version/word-count info for those.
      const { data: essaysData } = await supabase
        .from('essays')
        .select(`
          id,
          college_prompt_id,
          updated_at,
          essay_versions (
            version_number,
            word_count,
            is_current
          )
        `)
        .eq('user_id', user.id);

      const essaysByPromptId = new Map<string, any>();
      for (const e of (essaysData ?? []) as any[]) {
        if (e.college_prompt_id) essaysByPromptId.set(e.college_prompt_id, e);
      }

      // Merge prompts with existing essays into the unified list.
      const combined: Essay[] = (prompts ?? []).map((p: any) => {
        const existing = essaysByPromptId.get(p.id);
        const currentVersion = existing?.essay_versions?.find((v: any) => v.is_current)
          || existing?.essay_versions?.[0];
        return {
          id: existing?.id,
          college_id: p.college_id,
          college_name: collegeNameMap.get(p.college_id) || 'Unknown',
          prompt_id: p.id,
          prompt_text: p.prompt_text,
          prompt_sort_order: p.sort_order,
          word_limit: p.word_limit,
          started: !!existing,
          latest_version: currentVersion?.version_number,
          latest_word_count: currentVersion?.word_count,
          updated_at: existing?.updated_at,
        };
      });

      setEssays(combined);
    } catch (error) {
      console.error('Error loading essays:', error);
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

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/dashboard' ? 600 : 400 }}>Dashboard</Link>
            <Link href="/personal-statement" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays') || pathname.startsWith('/common-app')) ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays') || pathname.startsWith('/common-app')) ? 600 : 400 }}>Essays</Link>
            <Link href="/colleges" style={{ color: pathname.startsWith('/colleges') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname.startsWith('/colleges') ? 600 : 400 }}>Portfolio</Link>
            <Link href="/profile" style={{ color: pathname === '/profile' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/profile' ? 600 : 400 }}>Profile</Link>
            <Link href="/discovery" style={{ color: pathname === '/discovery' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/discovery' ? 600 : 400 }}>Insight Questions</Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#F3E5AB'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 className="font-heading text-5xl mb-4" style={{ color: 'white' }}>My Essays</h1>
          <p className="font-body text-lg" style={{ color: '#F3E5AB' }}>
            Manage and continue writing your college application essays
          </p>
        </div>

        {essays.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '64px 32px' }}>
              <h3 className="font-heading text-2xl mb-4" style={{ color: '#D4AF37' }}>No Essays Yet</h3>
              <p className="font-body mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Start writing essays by visiting a college in your portfolio and clicking "Write Essay" on any prompt.
              </p>
              <Link href="/colleges">
                <button
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
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212,175,55,0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#D4AF37';
                  }}
                >
                  Go to Portfolio
                </button>
              </Link>
            </div>
          </Card>
        ) : (
          (() => {
            // Group essays by college so the list reads as sections rather than
            // a flat dump. Common App is pinned to the top; other colleges
            // follow alphabetically. Within each section, essays are ordered
            // by prompt sort order.
            const COMMON_APP_COLLEGE_ID = 'a0000000-0000-0000-0000-000000000000';
            const groupsMap = new Map<string, { collegeId: string; collegeName: string; essays: Essay[] }>();
            for (const essay of essays) {
              const existing = groupsMap.get(essay.college_id);
              if (existing) {
                existing.essays.push(essay);
              } else {
                groupsMap.set(essay.college_id, {
                  collegeId: essay.college_id,
                  collegeName: essay.college_name,
                  essays: [essay],
                });
              }
            }
            const allGroups = Array.from(groupsMap.values());
            allGroups.forEach((g) => g.essays.sort((a, b) => a.prompt_sort_order - b.prompt_sort_order));

            // Common App behaves differently from school supplementals:
            // students pick ONE of the 7 Common App prompts to answer, so once
            // they've started one we only show that one. Before they pick, we
            // show all 7 so they can choose. Other colleges show every prompt
            // because all supplementals are typically required.
            const commonAppGroup = allGroups.find((g) => g.collegeId === COMMON_APP_COLLEGE_ID);
            if (commonAppGroup) {
              const startedCommonApp = commonAppGroup.essays.filter((e) => e.started);
              if (startedCommonApp.length > 0) {
                commonAppGroup.essays = startedCommonApp;
              }
            }

            const otherGroups = allGroups
              .filter((g) => g.collegeId !== COMMON_APP_COLLEGE_ID)
              .sort((a, b) => a.collegeName.localeCompare(b.collegeName));
            const orderedGroups = commonAppGroup ? [commonAppGroup, ...otherGroups] : otherGroups;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {orderedGroups.map((group) => (
                  <section key={group.collegeId}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(212,175,55,0.25)',
                    }}>
                      <h2 className="font-heading text-3xl" style={{ color: 'white' }}>
                        {group.collegeName}
                      </h2>
                      <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {(() => {
                          const total = group.essays.length;
                          const started = group.essays.filter((e) => e.started).length;
                          return `${started} of ${total} started`;
                        })()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {group.essays.map((essay) => (
              <Card key={essay.prompt_id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Prompt {essay.prompt_sort_order}
                      </p>
                      {essay.word_limit && (
                        <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          · {essay.word_limit} word limit
                        </span>
                      )}
                      {!essay.started && (
                        <span
                          className="font-body"
                          style={{
                            color: '#D4AF37',
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            border: '1px solid rgba(212,175,55,0.4)',
                            padding: '2px 8px',
                            borderRadius: '2px',
                          }}
                        >
                          Not started
                        </span>
                      )}
                    </div>
                    <p className="font-body mb-4" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>
                      {essay.prompt_text.length > 200
                        ? `${essay.prompt_text.substring(0, 200)}...`
                        : essay.prompt_text}
                    </p>
                    {essay.started && (
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Version {essay.latest_version ?? 0} • {essay.latest_word_count ?? 0} words
                        </span>
                        {essay.updated_at && (
                          <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            Updated {new Date(essay.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Link href={`/essays/${essay.college_id}/${essay.prompt_id}`}>
                    <button
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
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
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
                      {essay.started ? 'Continue Writing' : 'Start Writing'}
                    </button>
                  </Link>
                </div>
              </Card>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}