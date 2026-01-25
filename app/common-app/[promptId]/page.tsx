'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';

const COMMON_APP_PROMPTS = [
  {
    id: 'common-app-1',
    number: 1,
    prompt: 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.',
    word_limit: 650,
  },
  {
    id: 'common-app-2',
    number: 2,
    prompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
    word_limit: 650,
  },
  {
    id: 'common-app-3',
    number: 3,
    prompt: 'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?',
    word_limit: 650,
  },
  {
    id: 'common-app-4',
    number: 4,
    prompt: 'Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?',
    word_limit: 650,
  },
  {
    id: 'common-app-5',
    number: 5,
    prompt: 'Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.',
    word_limit: 650,
  },
  {
    id: 'common-app-6',
    number: 6,
    prompt: 'Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?',
    word_limit: 650,
  },
  {
    id: 'common-app-7',
    number: 7,
    prompt: 'Share an essay on any topic of your choice. It can be one you\'ve already written, one that responds to a different prompt, or one of your own design.',
    word_limit: 650,
  },
];

interface EssayVersion {
  id: string;
  version_number: number;
  content: string;
  word_count: number;
  created_at: string;
  is_current: boolean;
}

export default function CommonAppEssayPage() {
  const params = useParams();
  const router = useRouter();
  const promptId = params.promptId as string;

  const [prompt, setPrompt] = useState<any>(null);
  const [essayId, setEssayId] = useState<string | null>(null);
  const [versions, setVersions] = useState<EssayVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<EssayVersion | null>(null);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, [promptId]);

  useEffect(() => {
    setWordCount(countWords(content));
  }, [content]);

  // Accurate word count function
  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(word => {
      const cleaned = word.replace(/[^\w\s-]/g, '');
      return cleaned.length > 0;
    });
    return words.length;
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Find the prompt
      const selectedPrompt = COMMON_APP_PROMPTS.find(p => p.id === promptId);
      if (selectedPrompt) {
        setPrompt(selectedPrompt);
      }

      // Check if essay exists
      const { data: essayData } = await supabase
        .from('essays')
        .select('id')
        .eq('user_id', user.id)
        .eq('college_prompt_id', promptId)
        .single()
        .catch(() => ({ data: null }));

      if (essayData) {
        setEssayId(essayData.id);
        loadVersions(essayData.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (essayIdParam: string) => {
    try {
      const { data: versionsData } = await supabase
        .from('essay_versions')
        .select('*')
        .eq('essay_id', essayIdParam)
        .order('version_number', { ascending: false });

      if (versionsData) {
        setVersions(versionsData);
        const current = versionsData.find(v => v.is_current) || versionsData[0];
        if (current) {
          setCurrentVersion(current);
          setContent(current.content);
        }
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const saveNewVersion = async () => {
    if (!content.trim()) {
      alert('Please write something before saving.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      let currentEssayId = essayId;

      // Create essay if it doesn't exist
      if (!currentEssayId) {
        // First, ensure the prompt exists in college_prompts
        const { data: promptData } = await supabase
          .from('college_prompts')
          .select('id')
          .eq('id', promptId)
          .single()
          .catch(() => ({ data: null }));

        let promptDbId = promptData?.id;

        if (!promptDbId) {
          // Create the prompt in the database
          const { data: newPrompt, error: promptError } = await supabase
            .from('college_prompts')
            .insert({
              id: promptId,
              college_id: 'common-app',
              prompt_text: prompt?.prompt || '',
              word_limit: prompt?.word_limit || 650,
              year: 2025,
              sort_order: prompt?.number || 1,
            })
            .select()
            .single();

          if (promptError && !promptError.message.includes('duplicate')) {
            throw promptError;
          }
          promptDbId = newPrompt?.id || promptId;
        }

        // Create essay
        const { data: newEssay, error: essayError } = await supabase
          .from('essays')
          .insert({
            user_id: user.id,
            college_prompt_id: promptDbId,
          })
          .select()
          .single();

        if (essayError) throw essayError;
        currentEssayId = newEssay.id;
        setEssayId(currentEssayId);
      }

      // Get next version number
      const nextVersion = versions.length > 0 
        ? Math.max(...versions.map(v => v.version_number)) + 1 
        : 1;

      // Mark all previous versions as not current
      if (versions.length > 0) {
        await supabase
          .from('essay_versions')
          .update({ is_current: false })
          .eq('essay_id', currentEssayId);
      }

      // Create new version
      const { data: newVersion, error: versionError } = await supabase
        .from('essay_versions')
        .insert({
          essay_id: currentEssayId,
          version_number: nextVersion,
          content: content.trim(),
          word_count: wordCount,
          is_current: true,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Reload versions
      await loadVersions(currentEssayId);

      alert('Essay saved as version ' + nextVersion);
    } catch (error: any) {
      console.error('Error saving version:', error);
      alert('Error saving essay: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const switchVersion = (version: EssayVersion) => {
    setCurrentVersion(version);
    setContent(version.content);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>Loading...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>Prompt not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/common-app" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/colleges" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Portfolio</Link>
            <Link href="/personal-statement" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Essays</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link 
            href="/common-app" 
            style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}
          >
            ← Back to Common App Prompts
          </Link>
          <h1 className="font-heading text-4xl mb-2" style={{ color: 'white' }}>Common Application Essay</h1>
          <h2 className="font-heading text-xl mb-4" style={{ color: '#D4AF37' }}>Prompt {prompt.number}</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
          <div>
            <Card>
              <div style={{ marginBottom: '24px' }}>
                <p className="font-body" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.6', marginBottom: '12px' }}>
                  {prompt.prompt}
                </p>
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Word Limit: {prompt.word_limit} words
                </p>
              </div>
            </Card>

            <Card style={{ marginTop: '32px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="font-heading text-lg" style={{ color: '#D4AF37' }}>Your Essay</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {wordCount} / {prompt.word_limit} words
                  </span>
                  {wordCount > prompt.word_limit && (
                    <span className="font-body text-sm" style={{ color: '#F87171' }}>
                      Over limit
                    </span>
                  )}
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your Common App essay here..."
                style={{
                  width: '100%',
                  minHeight: '400px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '20px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(212,175,55,0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(212,175,55,0.2)';
                }}
              />
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={saveNewVersion}
                  disabled={saving}
                  style={{
                    background: saving ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                    color: '#0B1623',
                    padding: '12px 24px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {saving ? 'Saving...' : 'Save New Version'}
                </button>
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <h3 className="font-heading text-lg mb-4" style={{ color: '#D4AF37' }}>Versions</h3>
              {versions.length === 0 ? (
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  No versions saved yet. Write your essay and click "Save New Version" to create your first version.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => switchVersion(version)}
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        background: version.is_current ? 'rgba(212,175,55,0.2)' : 'transparent',
                        border: version.is_current ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!version.is_current) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!version.is_current) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="font-body text-sm font-semibold" style={{ color: 'white' }}>
                          Version {version.version_number}
                        </span>
                        {version.is_current && (
                          <span className="font-body text-xs" style={{ color: '#D4AF37' }}>Current</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {version.word_count} words
                        </span>
                        <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
