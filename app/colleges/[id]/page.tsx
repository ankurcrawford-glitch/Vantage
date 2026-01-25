'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentApplicationYear } from '@/lib/config';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface College {
  id: string;
  name: string;
  location: string;
}

interface Prompt {
  id: string;
  prompt_text: string;
  word_limit: number | null;
  sort_order: number;
}

export default function CollegeDetailPage() {
  const params = useParams();
  const collegeId = params.id as string;

  const [college, setCollege] = useState<College | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadCollegeData();
  }, [collegeId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Redirect handled by loadCollegeData
    }
  };

  const loadCollegeData = async () => {
    try {
      const currentYear = getCurrentApplicationYear();

      const { data: collegeData } = await supabase
        .from('colleges')
        .select('*')
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
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
            <Link href="/colleges" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Portfolio</Link>
            <Link href="/personal-statement" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Essays</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <Link href="/colleges" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}>← Back to Portfolio</Link>
          <h1 className="font-heading text-5xl mb-4" style={{ color: 'white' }}>{college.name}</h1>
          <p className="font-body text-lg" style={{ color: '#F3E5AB' }}>{college.location}</p>
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
      </div>
    </div>
  );
}