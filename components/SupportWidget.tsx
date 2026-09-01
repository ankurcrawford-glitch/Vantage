'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Vantage — "Need help?" support widget ───────────────────────
// Floating button on every page (signed in or not — the person who
// can't log in needs it most). Opens a small panel; submissions go
// to /api/support which emails the admin with reply-to set.

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — humans never see it
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Prefill the email for signed-in students.
  useEffect(() => {
    if (!open || email) return;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } catch { /* signed out — they type it */ }
    })();
  }, [open, email]);

  const submit = async () => {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          email,
          website,
          page: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'send failed');
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Couldn't send that. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen((o) => !o); setError(''); }}
        aria-label="Need help?"
        className="font-body"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 90,
          background: open ? '#101a2b' : '#C9A977',
          color: open ? '#C9A977' : '#0B1320',
          border: '1px solid #C9A977',
          borderRadius: '999px',
          padding: '10px 18px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
        }}
      >
        {open ? 'Close' : 'Need help?'}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '76px',
            right: '24px',
            zIndex: 90,
            width: 'min(360px, calc(100vw - 48px))',
            background: '#101a2b',
            border: '1px solid rgba(232,221,201,0.12)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 16px 48px -12px rgba(0,0,0,0.6)',
          }}
        >
          {sent ? (
            <div>
              <p className="font-heading" style={{ color: '#E8DDC9', fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>
                Got it. ✓
              </p>
              <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.68)', lineHeight: 1.6, margin: 0 }}>
                We&apos;ll reply to <span style={{ color: '#C9A977' }}>{email}</span> — usually within a day.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p className="font-heading" style={{ color: '#E8DDC9', fontSize: '20px', fontWeight: 600, margin: '0 0 4px' }}>
                  Something not working?
                </p>
                <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.45)', margin: 0, lineHeight: 1.5 }}>
                  Tell us what happened — a real person reads every one of these.
                </p>
              </div>
              {error && (
                <p className="font-body text-xs" style={{ color: '#A35A6A', margin: 0 }}>{error}</p>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="font-body"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(232,221,201,0.12)',
                  borderRadius: '6px',
                  color: '#E8DDC9',
                  padding: '10px 12px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              {/* Honeypot — hidden from humans, tempting to bots */}
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }}
                placeholder="Website"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's going wrong? The more detail, the faster we can fix it."
                rows={4}
                className="font-body"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(232,221,201,0.12)',
                  borderRadius: '6px',
                  color: '#E8DDC9',
                  padding: '10px 12px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
              <button
                onClick={submit}
                disabled={sending || message.trim().length < 5}
                className="font-body"
                style={{
                  background: '#C9A977',
                  color: '#0B1320',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '11px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: sending || message.trim().length < 5 ? 'not-allowed' : 'pointer',
                  opacity: sending || message.trim().length < 5 ? 0.6 : 1,
                }}
              >
                {sending ? 'Sending…' : 'Send to support'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
