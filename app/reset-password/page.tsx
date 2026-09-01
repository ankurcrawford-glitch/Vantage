'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';

type LinkStatus = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('checking');
  const [linkError, setLinkError] = useState('');
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const settledRef = useRef(false);

  useEffect(() => {
    // Two ways a user can arrive here with a valid reset:
    //
    // 1. Token-hash link (preferred): the email links directly to
    //    /reset-password?token_hash=...&type=recovery. The token is NOT
    //    consumed until the user submits the form (verifyOtp), so the link
    //    works in any browser/device and survives corporate email scanners
    //    that prefetch URLs.
    //
    // 2. Legacy/PKCE flow: Supabase's verify endpoint redirected here after
    //    establishing a recovery session (?code= exchange handled
    //    automatically by the browser client). Same-browser only.

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search);

    // Explicit error from Supabase (expired / already-used link).
    const errorDescription =
      hashParams.get('error_description') || queryParams.get('error_description');
    const errorCode = hashParams.get('error_code') || queryParams.get('error_code');

    if (errorDescription || errorCode) {
      settledRef.current = true;
      setLinkError(
        errorCode === 'otp_expired'
          ? 'This reset link has expired. Please request a new one.'
          : errorDescription || 'This reset link is invalid.'
      );
      setLinkStatus('invalid');
      return;
    }

    // Path 1: token-hash link — show the form right away. The token is
    // validated when the user submits.
    const th = queryParams.get('token_hash');
    if (th) {
      settledRef.current = true;
      setTokenHash(th);
      setLinkStatus('ready');
      return;
    }

    // Path 2: watch for a recovery session being established.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (settledRef.current) return;
      if (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION'))) {
        settledRef.current = true;
        setHasSession(true);
        setLinkStatus('ready');
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (settledRef.current) return;
      if (data.session) {
        settledRef.current = true;
        setHasSession(true);
        setLinkStatus('ready');
      }
    });

    // Neither a token nor a session showed up — bad link or direct visit.
    const timeout = setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      setLinkError(
        'We could not verify your reset link. Please request a new one from the sign-in page.'
      );
      setLinkStatus('invalid');
    }, 5000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Redeem the token now, at submit time (works in any browser).
      // Skipped if a session already exists (legacy flow, or a previous
      // submit already verified the token but failed on updateUser).
      if (!hasSession && tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        });

        if (verifyError) {
          const msg = verifyError.message.toLowerCase();
          if (msg.includes('expired') || msg.includes('invalid') || msg.includes('not found')) {
            throw new Error(
              'This reset link has expired or was already used. Please request a new one from the sign-in page.'
            );
          }
          throw verifyError;
        }
        setHasSession(true);
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        if (
          updateError.message.toLowerCase().includes('rate limit') ||
          updateError.message.toLowerCase().includes('too many requests')
        ) {
          throw new Error('Too many attempts. Please wait a few minutes and try again.');
        }
        if (updateError.message.toLowerCase().includes('different from the old password')) {
          throw new Error('Your new password must be different from your current password.');
        }
        throw updateError;
      }

      setSuccess('Password updated! Taking you to your dashboard...');
      setTimeout(() => {
        router.push('/gateway');
        router.refresh();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const passwordInputStyle: React.CSSProperties = {
    width: '100%',
    height: '48px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(201,169,119,0.2)',
    color: '#E8DDC9',
    padding: '0 50px 0 20px',
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(232,221,201,0.68)',
    marginBottom: '8px',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-24" style={{ background: '#0B1320' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-heading text-3xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
            <span className="text-3xl" style={{ color: '#C9A977' }}>.</span>
          </div>
          <p className="font-body text-sm" style={{ color: '#E8DDC9' }}>Set a New Password</p>
        </div>

        {linkStatus === 'checking' && (
          <p className="font-body text-sm text-center" style={{ color: 'rgba(232,221,201,0.68)' }}>
            Verifying your reset link...
          </p>
        )}

        {linkStatus === 'invalid' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <div style={{
              background: 'rgba(248,113,113,0.2)',
              border: '1px solid rgba(248,113,113,0.5)',
              color: '#A35A6A',
              padding: '12px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              wordBreak: 'break-word',
            }}>
              {linkError}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link href="/login" style={{ color: '#C9A977', textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: '14px' }}>
                Back to sign in
              </Link>
            </div>
          </div>
        )}

        {linkStatus === 'ready' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.2)',
                border: '1px solid rgba(248,113,113,0.5)',
                color: '#A35A6A',
                padding: '12px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                wordBreak: 'break-word',
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: 'rgba(16,185,129,0.2)',
                border: '1px solid rgba(16,185,129,0.5)',
                color: '#8FB89A',
                padding: '12px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
              }}>
                {success}
              </div>
            )}

            <div style={{ width: '100%' }}>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={passwordInputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(201,169,119,0.5)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(201,169,119,0.2)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(232,221,201,0.68)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A977'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,221,201,0.68)'; }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                style={{ ...passwordInputStyle, padding: '0 20px' }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(201,169,119,0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(201,169,119,0.2)'; }}
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <Button type="submit" style={{ width: '100%', height: '48px' }} disabled={loading || !!success}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        )}

        {linkStatus === 'ready' && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.45)' }}>
              Remembered it after all?{' '}
              <Link href="/login" style={{ color: '#C9A977', textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
