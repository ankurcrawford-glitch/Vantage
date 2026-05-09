'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Handle rate limit errors
        if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.');
        }
        throw error;
      }

      if (data.user) {
        const next = searchParams.get('next');
        const redirect = next && next.startsWith('/') ? next : '/dashboard';
        router.push(redirect);
        router.refresh();
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    setError('');
    setSuccess('');
    setForgotPasswordLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Handle rate limit errors gracefully
        if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many requests')) {
          setError('Email rate limit exceeded. Please wait a few minutes before requesting another password reset.');
          return;
        }
        throw error;
      }

      setSuccess('Password reset email sent! Check your inbox for instructions.');
    } catch (error: any) {
      if (!error.message.toLowerCase().includes('rate limit')) {
        setError(error.message || 'Failed to send reset email');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-24" style={{ background: '#0B1320' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-heading text-3xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
            <span className="text-3xl" style={{ color: '#C9A977' }}>.</span>
          </div>
          <p className="font-body text-sm" style={{ color: '#E8DDC9' }}>Client Access</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {error && (
            <div style={{ 
              background: 'rgba(248,113,113,0.2)', 
              border: '1px solid rgba(248,113,113,0.5)', 
              color: '#A35A6A', 
              padding: '12px 16px', 
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              wordBreak: 'break-word'
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
              fontFamily: 'var(--font-body)'
            }}>
              {success}
            </div>
          )}

          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            autoComplete="email"
          />

          <div style={{ width: '100%' }}>
            <label style={{ 
              display: 'block', 
              fontFamily: 'var(--font-body)', 
              fontSize: '14px', 
              fontWeight: 500, 
              color: 'rgba(232,221,201,0.7)', 
              marginBottom: '8px' 
            }}>
              Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
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
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(201,169,119,0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(201,169,119,0.2)';
                }}
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
                  color: 'rgba(232,221,201,0.7)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#C9A977';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(232,221,201,0.7)';
                }}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotPasswordLoading}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#C9A977',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                textDecoration: 'none',
                padding: '4px 0',
                opacity: forgotPasswordLoading ? 0.5 : 1,
              }}
            >
              {forgotPasswordLoading ? 'Sending...' : 'Forgot password?'}
            </button>
          </div>

          <div style={{ marginTop: '8px' }}>
            <Button type="submit" style={{ width: '100%', height: '48px' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.5)' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#C9A977', textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}