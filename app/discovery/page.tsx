'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';

export default function DiscoveryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<Record<string, string>>({});
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuthAndSubscription();
  }, []);

  const checkAuthAndSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      let subscribed = false;
      try {
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        subscribed = !!sub;
        setHasSubscription(!!sub);
      } catch {
        setHasSubscription(false);
      }
      // Bypass payment for now – let everyone in
      subscribed = true;
      setHasSubscription(true);

      if (subscribed) {
        const { data: discoveryData } = await supabase
          .from('discovery_answers')
          .select('question_id, answer')
          .eq('user_id', user.id);

        if (discoveryData) {
          const answersMap: Record<string, string> = {};
          discoveryData.forEach((item: { question_id: string; answer: string }) => {
            answersMap[item.question_id] = item.answer;
          });
          setDiscoveryAnswers(answersMap);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAnswer = (questionId: string) => {
    setEditingAnswer(questionId);
    setEditAnswerText(discoveryAnswers[questionId] || '');
  };

  const handleCancelEditAnswer = () => {
    setEditingAnswer(null);
    setEditAnswerText('');
  };

  const handleSaveAnswer = async (questionId: string) => {
    if (!editAnswerText.trim()) {
      alert('Please enter an answer.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('discovery_answers')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          answer: editAnswerText.trim(),
        });

      if (error) throw error;

      setDiscoveryAnswers((prev) => ({ ...prev, [questionId]: editAnswerText.trim() }));
      setEditingAnswer(null);
      setEditAnswerText('');
      alert('Answer saved.');
    } catch {
      alert('Error saving answer. Please try again.');
    } finally {
      setSaving(false);
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
        {!hasSubscription ? (
          <Card>
            <h1 className="font-heading text-3xl mb-4" style={{ color: 'white' }}>Insight Questions</h1>
            <p className="font-body text-lg mb-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
              The 12 reflective questions are available after you subscribe. They help us understand your story, values, and what makes you unique—and power Strategic Intelligence for your essays.
            </p>
            <Link href="/dashboard">
              <button style={{
                background: '#D4AF37',
                color: '#0B1623',
                padding: '12px 24px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
              }}>
                Go to Dashboard
              </button>
            </Link>
          </Card>
        ) : (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 className="font-heading text-4xl mb-2" style={{ color: 'white' }}>Insight Questions</h1>
              <p className="font-body text-lg" style={{ color: '#F3E5AB' }}>
                12 reflective questions that help us understand your story and power Strategic Intelligence for your essays.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {DISCOVERY_QUESTIONS.map((question, index) => {
                const answer = discoveryAnswers[question.id];
                const isEditing = editingAnswer === question.id;

                return (
                  <Card key={question.id}>
                    <div style={{ padding: '20px', borderLeft: '3px solid #D4AF37' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        <span className="font-heading text-lg" style={{ color: '#D4AF37', minWidth: '32px' }}>{index + 1}.</span>
                        <h3 className="font-heading text-lg" style={{ color: 'white', flex: 1 }}>{question.question}</h3>
                      </div>
                      <div style={{ marginLeft: '44px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <textarea
                              value={editAnswerText}
                              onChange={(e) => setEditAnswerText(e.target.value)}
                              style={{
                                width: '100%',
                                minHeight: '150px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(212,175,55,0.5)',
                                color: 'white',
                                padding: '12px',
                                fontFamily: 'var(--font-body)',
                                fontSize: '14px',
                                outline: 'none',
                                borderRadius: '2px',
                                resize: 'vertical',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleSaveAnswer(question.id)}
                                disabled={saving}
                                style={{
                                  background: '#D4AF37',
                                  color: '#0B1623',
                                  padding: '8px 16px',
                                  fontFamily: 'var(--font-body)',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  border: 'none',
                                  borderRadius: '2px',
                                  cursor: saving ? 'not-allowed' : 'pointer',
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEditAnswer}
                                style={{
                                  background: 'transparent',
                                  color: 'rgba(255,255,255,0.7)',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  padding: '8px 16px',
                                  fontFamily: 'var(--font-body)',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {answer ? (
                              <>
                                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>{answer}</p>
                                <button
                                  onClick={() => handleEditAnswer(question.id)}
                                  style={{
                                    background: 'transparent',
                                    color: '#D4AF37',
                                    border: '1px solid rgba(212,175,55,0.5)',
                                    padding: '6px 12px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Edit Answer
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: '12px' }}>Not answered yet</p>
                                <button
                                  onClick={() => handleEditAnswer(question.id)}
                                  style={{
                                    background: '#D4AF37',
                                    color: '#0B1623',
                                    padding: '6px 12px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Add Answer
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}