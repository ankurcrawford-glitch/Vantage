'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';

interface Essay {
  id: string;
  college_id: string;
  college_name: string;
  prompt_id: string;
  prompt_text: string;
  prompt_sort_order: number;
  latest_version: number;
  latest_word_count: number;
  updated_at: string;
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

      // Load essays with college and prompt info
      const { data: essaysData, error } = await supabase
        .from('essays')
        .select(`
          id,
          college_prompt_id,
          updated_at,
          college_prompts:college_prompt_id (
            id,
            prompt_text,
            sort_order,
            college_id,
            colleges:college_id (
              id,
              name
            )
          ),
          essay_versions (
            version_number,
            word_count,
            is_current
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (essaysData) {
        const formattedEssays: Essay[] = essaysData.map((essay: any) => {
          const prompt = essay.college_prompts;
          const college = prompt.colleges;
          const currentVersion = essay.essay_versions?.find((v: any) => v.is_current) || essay.essay_versions?.[0];

          return {
            id: essay.id,
            college_id: college.id,
            college_name: college.name,
            prompt_id: prompt.id,
            prompt_text: prompt.prompt_text,
            prompt_sort_order: prompt.sort_order,
            latest_version: currentVersion?.version_number || 0,
            latest_word_count: currentVersion?.word_count || 0,
            updated_at: essay.updated_at,
          };
        });

        setEssays(formattedEssays);
      }
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {essays.map((essay) => (
              <Card key={essay.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="font-heading text-xl mb-2" style={{ color: '#D4AF37' }}>
                      {essay.college_name}
                    </h3>
                    <p className="font-body text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Prompt {essay.prompt_sort_order}
                    </p>
                    <p className="font-body mb-4" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>
                      {essay.prompt_text.length > 200 
                        ? `${essay.prompt_text.substring(0, 200)}...` 
                        : essay.prompt_text}
                    </p>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Version {essay.latest_version} • {essay.latest_word_count} words
                      </span>
                      <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Updated {new Date(essay.updated_at).toLocaleDateString()}
                      </span>
                    </div>
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
                      Continue Writing
                    </button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}