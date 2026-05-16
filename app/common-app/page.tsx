'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import Navigation from '@/components/Navigation';
import ApplicationsSubNav from '@/components/ApplicationsSubNav';

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

export default function CommonAppPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div style={{ color: '#C9A977' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />
      <ApplicationsSubNav />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h1 className="font-heading text-5xl mb-4" style={{ color: '#E8DDC9' }}>
            Common Application Essay
            <span className="font-body" style={{ color: 'rgba(232,221,201,0.5)', fontSize: '20px', fontWeight: 400, marginLeft: '16px', letterSpacing: '0.05em' }}>
              2026–27
            </span>
          </h1>
          <p className="font-body text-lg" style={{ color: '#E8DDC9' }}>
            Choose one of the seven prompts below. You only need to answer one prompt for your Common App essay.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {COMMON_APP_PROMPTS.map((prompt) => (
            <Card key={prompt.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className="font-heading text-2xl" style={{ color: '#C9A977' }}>Prompt {prompt.number}</span>
                    <span className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.5)' }}>
                      {prompt.word_limit} words
                    </span>
                  </div>
                  <p className="font-body" style={{ color: 'rgba(232,221,201,0.9)', lineHeight: '1.6', marginBottom: '16px' }}>
                    {prompt.prompt}
                  </p>
                </div>
                <Link
                  href={`/common-app/${prompt.id}`}
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
                    whiteSpace: 'nowrap',
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
      </div>
    </div>
  );
}
