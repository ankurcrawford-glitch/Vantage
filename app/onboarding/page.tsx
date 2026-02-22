'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';
import Button from '@/components/Button';
import Input from '@/components/Input';

type Step = 'welcome' | 'discovery' | 'stats' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    gpaWeighted: '',
    gpaUnweighted: '',
    satScore: '',
    actScore: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < DISCOVERY_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      saveDiscoveryAnswers();
      setStep('stats');
    }
  };

  const saveDiscoveryAnswers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const [questionId, answer] of Object.entries(answers)) {
      await supabase.from('discovery_answers').upsert({
        user_id: user.id,
        question_id: questionId,
        answer: answer,
      });
    }
  };

  const handleSaveStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      await supabase.from('user_stats').upsert({
        user_id: user.id,
        gpa_weighted: stats.gpaWeighted ? parseFloat(stats.gpaWeighted) : null,
        gpa_unweighted: stats.gpaUnweighted ? parseFloat(stats.gpaUnweighted) : null,
        sat_score: stats.satScore ? parseInt(stats.satScore) : null,
        act_score: stats.actScore ? parseInt(stats.actScore) : null,
      });
      setStep('complete');  // Changed from 'colleges' to 'complete'
    } catch (error) {
      console.error('Error saving stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  // Welcome Step
  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center px-8 py-24" style={{ background: '#0B1623' }}>
        <div style={{ width: '100%', maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            <span className="font-heading text-5xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-5xl" style={{ color: '#D4AF37' }}>.</span>
          </div>
          <h1 className="font-heading text-4xl mb-6" style={{ color: 'white' }}>Welcome to VANTAGE</h1>
          <p className="font-body text-lg mb-12" style={{ color: '#F3E5AB', maxWidth: '600px', margin: '0 auto 48px' }}>
            Let's get to know the real you. We'll ask you 12 thoughtful questions to understand your story, values, and what makes you unique. This will help us craft your personalized admissions strategy.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Button onClick={() => setStep('discovery')}>Begin</Button>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              Skip to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Discovery Questions Step
  if (step === 'discovery') {
    const currentQuestion = DISCOVERY_QUESTIONS[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id] || '';

    return (
      <div className="min-h-screen flex items-center justify-center px-8 py-24" style={{ background: '#0B1623' }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Question {currentQuestionIndex + 1} of {DISCOVERY_QUESTIONS.length}
              </span>
              <div style={{ width: '300px', height: '4px', background: '#152C45', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{ 
                    height: '100%', 
                    background: '#D4AF37', 
                    transition: 'width 0.3s',
                    width: `${((currentQuestionIndex + 1) / DISCOVERY_QUESTIONS.length) * 100}%` 
                  }}
                />
              </div>
            </div>
            <h2 className="font-heading text-3xl mb-4" style={{ color: 'white', lineHeight: '1.3' }}>
              {currentQuestion.question}
            </h2>
            {currentQuestion.hint && (
              <p className="font-body text-sm" style={{ color: 'rgba(243,229,171,0.7)', fontStyle: 'italic', marginTop: '8px' }}>
                {currentQuestion.hint}
              </p>
            )}
          </div>

          <textarea
            value={currentAnswer}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="Take your time. Be specific and authentic. Share details that help us understand your unique perspective..."
            style={{
              width: '100%',
              minHeight: '300px',
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
              borderRadius: '2px',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(212,175,55,0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(212,175,55,0.2)';
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                }
              }}
              disabled={currentQuestionIndex === 0}
              style={{
                background: currentQuestionIndex === 0 ? 'transparent' : 'transparent',
                color: currentQuestionIndex === 0 ? 'rgba(255,255,255,0.3)' : '#D4AF37',
                padding: '12px 24px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '1px solid',
                borderColor: currentQuestionIndex === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.5)',
                borderRadius: '2px',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Previous
            </button>
            <button
              onClick={handleNextQuestion}
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
              {currentQuestionIndex < DISCOVERY_QUESTIONS.length - 1 ? 'Next' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stats Step
  if (step === 'stats') {
    return (
      <div className="min-h-screen" style={{ background: '#0B1623', padding: '64px 32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <h2 className="font-heading text-4xl mb-4" style={{ color: 'white', textAlign: 'left' }}>Academic Profile</h2>
            <p className="font-body text-lg" style={{ color: '#F3E5AB', textAlign: 'left' }}>
              Share your academic statistics. You can update these later.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '48px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block', 
                  fontFamily: 'var(--font-body)', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'rgba(255,255,255,0.7)', 
                  marginBottom: '12px' 
                }}>
                  Weighted GPA
                </label>
                <input
                  type="number"
                  value={stats.gpaWeighted}
                  onChange={(e) => setStats({ ...stats, gpaWeighted: e.target.value })}
                  placeholder="4.0"
                  step="0.01"
                  min="0"
                  max="5"
                  style={{
                    width: '100%',
                    height: '56px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: 'white',
                    padding: '0 24px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    borderRadius: '2px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.2)';
                  }}
                />
              </div>
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block', 
                  fontFamily: 'var(--font-body)', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'rgba(255,255,255,0.7)', 
                  marginBottom: '12px' 
                }}>
                  Unweighted GPA
                </label>
                <input
                  type="number"
                  value={stats.gpaUnweighted}
                  onChange={(e) => setStats({ ...stats, gpaUnweighted: e.target.value })}
                  placeholder="3.8"
                  step="0.01"
                  min="0"
                  max="4"
                  style={{
                    width: '100%',
                    height: '56px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: 'white',
                    padding: '0 24px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    borderRadius: '2px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.2)';
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block', 
                  fontFamily: 'var(--font-body)', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'rgba(255,255,255,0.7)', 
                  marginBottom: '12px' 
                }}>
                  SAT Score
                </label>
                <input
                  type="number"
                  value={stats.satScore}
                  onChange={(e) => setStats({ ...stats, satScore: e.target.value })}
                  placeholder="1500"
                  min="400"
                  max="1600"
                  style={{
                    width: '100%',
                    height: '56px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: 'white',
                    padding: '0 24px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    borderRadius: '2px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.2)';
                  }}
                />
              </div>
              <div style={{ width: '100%' }}>
                <label style={{ 
                  display: 'block', 
                  fontFamily: 'var(--font-body)', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: 'rgba(255,255,255,0.7)', 
                  marginBottom: '12px' 
                }}>
                  ACT Score
                </label>
                <input
                  type="number"
                  value={stats.actScore}
                  onChange={(e) => setStats({ ...stats, actScore: e.target.value })}
                  placeholder="34"
                  min="1"
                  max="36"
                  style={{
                    width: '100%',
                    height: '56px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: 'white',
                    padding: '0 24px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    borderRadius: '2px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.2)';
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={handleSaveStats}
              disabled={loading}
              style={{
                background: loading ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                color: '#0B1623',
                padding: '14px 32px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: 'none',
                borderRadius: '2px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#D4AF37';
                }
              }}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete Step (removed colleges step entirely)
  // Complete Step
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-8 py-24">
        <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div style={{ width: '80px', height: '80px', background: '#D4AF37', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#0B1623', fontSize: '48px' }}>✓</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 className="font-heading text-5xl" style={{ color: 'white', marginBottom: '12px', whiteSpace: 'nowrap' }}>Setup Complete!</h2>
              <p className="font-body text-lg" style={{ color: '#F3E5AB', maxWidth: '600px' }}>
                Your VANTAGE profile is ready. Let's start building your admissions strategy.
              </p>
            </div>
          </div>
          <div style={{ marginTop: '48px' }}>
            <Button onClick={handleComplete}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}