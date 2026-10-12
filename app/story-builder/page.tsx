'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import Navigation from '@/components/Navigation';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';
import { draftBackupKey, readDraftBackup, writeDraftBackup, clearDraftBackup, type DraftBackup } from '@/lib/draftBackup';

export default function DiscoveryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [discoveryAnswers, setDiscoveryAnswers] = useState<Record<string, string>>({});
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editAnswerText, setEditAnswerText] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // Local backups of answers that were being typed but never saved
  // (tab closed, crash, failed save). See lib/draftBackup.ts.
  const [draftBackups, setDraftBackups] = useState<Record<string, DraftBackup>>({});
  const backupKeyFor = (questionId: string) => (userId ? draftBackupKey(userId, `story-builder:${questionId}`) : null);
  const [accessCode, setAccessCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    checkAuthAndSubscription();
  }, []);

  const checkAuthAndSubscription = async () => {
    let signedIn = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      signedIn = true;

      setUserId(user.id);
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
          // Any answer typed but not saved last time? Offer it back.
          const found: Record<string, DraftBackup> = {};
          for (const q of DISCOVERY_QUESTIONS) {
            const b = readDraftBackup(draftBackupKey(user.id, `story-builder:${q.id}`));
            if (b && b.content.trim() && b.content.trim() !== (answersMap[q.id] || '').trim()) found[q.id] = b;
          }
          setDraftBackups(found);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      // Stay on loading until login redirect if there is no session.
      if (signedIn) setLoading(false);
    }
  };

  useEffect(() => {
    if (!editingAnswer) return;
    const key = backupKeyFor(editingAnswer);
    if (!key) return;
    const saved = (discoveryAnswers[editingAnswer] || '').trim();
    if (editAnswerText.trim() === saved || !editAnswerText.trim()) {
      clearDraftBackup(key);
      return;
    }
    const id = setTimeout(() => writeDraftBackup(key, editAnswerText), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAnswer, editAnswerText]);

  const handleEditAnswer = (questionId: string) => {
    setEditingAnswer(questionId);
    setEditAnswerText(discoveryAnswers[questionId] || '');
  };

  const handleCancelEditAnswer = () => {
    const k = editingAnswer ? backupKeyFor(editingAnswer) : null;
    if (k) clearDraftBackup(k);
    setEditingAnswer(null);
    setEditAnswerText('');
  };

  const handleCheckout = async () => {
    if (!userId) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to start checkout. Please try again.');
      }
    } catch {
      alert('Unable to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!userId || !accessCode.trim()) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim(), userId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccessCode('');
        await checkAuthAndSubscription();
      } else {
        setCodeError(data.error || 'Invalid code');
      }
    } catch {
      setCodeError('Unable to verify code. Please try again.');
    } finally {
      setCodeLoading(false);
    }
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
      const k = backupKeyFor(questionId);
      if (k) clearDraftBackup(k);
      setDraftBackups((prev) => { const n = { ...prev }; delete n[questionId]; return n; });
      setEditingAnswer(null);
      setEditAnswerText('');
      alert('Answer saved.');

      // Fire-and-forget: ask the server to look at the updated Story
      // Builder and surface any new activities to the Profile page as
      // suggestions. The endpoint debounces and dedupes, so calling it
      // after every save is safe.
      void fetch('/api/extract-activities', { method: 'POST' }).catch(() => {});
    } catch {
      alert('Error saving answer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div style={{ color: '#C9A977' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        {!hasSubscription ? (
          <Card>
            <h1 className="font-heading text-3xl mb-4" style={{ color: '#E8DDC9' }}>Story Builder</h1>
            <p className="font-body text-lg mb-6" style={{ color: 'rgba(232,221,201,0.9)' }}>
              The 12 reflective questions unlock after a one-time purchase—
              <strong style={{ color: '#E8DDC9', fontWeight: 600 }}>
                {' '}or use an access code if you were given one
              </strong>
              . They help us understand your story and power Strategic Intelligence for your essays.
            </p>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              style={{
                background: '#C9A977',
                color: '#0B1320',
                padding: '12px 24px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '2px',
                cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                opacity: checkoutLoading ? 0.7 : 1,
              }}
            >
              {checkoutLoading ? 'Redirecting...' : 'Unlock full access'}
            </button>
            <p className="font-body text-sm mt-4" style={{ color: 'rgba(232,221,201,0.45)' }}>
              One-time payment. Full access to Story Builder and Strategic Intelligence.
            </p>

            <div
              style={{
                marginTop: '28px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(232,221,201,0.12)',
              }}
            >
              <p className="font-body text-sm mb-3" style={{ color: 'rgba(232,221,201,0.68)' }}>
                Have an access code? Redeem it here to unlock without paying.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxWidth: '440px' }}>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setCodeError('');
                  }}
                  placeholder="Enter code"
                  autoComplete="off"
                  aria-label="Access code"
                  style={{
                    flex: '1 1 200px',
                    minWidth: '180px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(201,169,119,0.35)',
                    color: '#E8DDC9',
                    padding: '12px 14px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    borderRadius: '2px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleRedeemCode();
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleRedeemCode()}
                  disabled={codeLoading || !accessCode.trim()}
                  style={{
                    background: 'transparent',
                    color: '#C9A977',
                    border: '1px solid rgba(201,169,119,0.55)',
                    padding: '12px 22px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '2px',
                    cursor: codeLoading || !accessCode.trim() ? 'not-allowed' : 'pointer',
                    opacity: codeLoading || !accessCode.trim() ? 0.55 : 1,
                  }}
                >
                  {codeLoading ? 'Verifying…' : 'Redeem code'}
                </button>
              </div>
              {codeError ? (
                <p className="font-body text-sm mt-3" style={{ color: '#C98E99' }}>
                  {codeError}
                </p>
              ) : null}
            </div>
          </Card>
        ) : (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 className="font-heading text-4xl mb-2" style={{ color: '#E8DDC9' }}>Story Builder</h1>
              <p className="font-body text-lg" style={{ color: '#E8DDC9' }}>
                12 reflective questions that help us understand your story and power Strategic Intelligence for your essays.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {DISCOVERY_QUESTIONS.map((question, index) => {
                const answer = discoveryAnswers[question.id];
                const isEditing = editingAnswer === question.id;

                return (
                  <Card key={question.id}>
                    <div style={{ padding: '20px', borderLeft: '3px solid #C9A977' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        <span className="font-heading text-lg" style={{ color: '#C9A977', minWidth: '32px' }}>{index + 1}.</span>
                        <h3 className="font-heading text-lg" style={{ color: '#E8DDC9', flex: 1 }}>{question.question}</h3>
                      </div>
                      <div style={{ marginLeft: '44px' }}>
                        {draftBackups[question.id] && !isEditing && (
                          <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(201,169,119,0.10)', border: '1px solid rgba(201,169,119,0.35)', borderRadius: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                            <span className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.85)', flex: 1, minWidth: '200px' }}>
                              Unsaved answer from {new Date(draftBackups[question.id].at).toLocaleString()} on this device.
                            </span>
                            <button
                              type="button"
                              onClick={() => { setEditingAnswer(question.id); setEditAnswerText(draftBackups[question.id].content); }}
                              className="font-body font-bold text-xs uppercase tracking-wider"
                              style={{ background: '#C9A977', color: '#0B1320', padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => { const k = backupKeyFor(question.id); if (k) clearDraftBackup(k); setDraftBackups((prev) => { const n = { ...prev }; delete n[question.id]; return n; }); }}
                              className="font-body text-xs uppercase tracking-wider"
                              style={{ background: 'transparent', color: 'rgba(232,221,201,0.68)', padding: '6px 10px', border: '1px solid rgba(232,221,201,0.25)', cursor: 'pointer' }}
                            >
                              Discard
                            </button>
                          </div>
                        )}
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <textarea
                              value={editAnswerText}
                              onChange={(e) => setEditAnswerText(e.target.value)}
                              style={{
                                width: '100%',
                                minHeight: '150px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(201,169,119,0.5)',
                                color: '#E8DDC9',
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
                                  background: '#C9A977',
                                  color: '#0B1320',
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
                                  color: 'rgba(232,221,201,0.68)',
                                  border: '1px solid rgba(232,221,201,0.3)',
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
                                <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.9)', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>{answer}</p>
                                <button
                                  onClick={() => handleEditAnswer(question.id)}
                                  style={{
                                    background: 'transparent',
                                    color: '#C9A977',
                                    border: '1px solid rgba(201,169,119,0.5)',
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
                                <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.45)', fontStyle: 'italic', marginBottom: '12px' }}>Not answered yet</p>
                                <button
                                  onClick={() => handleEditAnswer(question.id)}
                                  style={{
                                    background: '#C9A977',
                                    color: '#0B1320',
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