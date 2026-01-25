'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
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
      // Sign up without triggering email confirmation
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Don't set emailRedirectTo to avoid triggering emails
        },
      });

      if (signUpError) {
        // Handle rate limit errors
        if (signUpError.message.toLowerCase().includes('rate limit') || 
            signUpError.message.toLowerCase().includes('too many requests') ||
            signUpError.message.toLowerCase().includes('email rate limit')) {
          throw new Error('Too many signup attempts. Please wait a few minutes and try again.');
        }
        throw signUpError;
      }

      if (data.user) {
        // Immediately redirect to onboarding - no email confirmation needed
        router.push('/onboarding');
        router.refresh();
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-24" style={{ background: '#0B1623' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-heading text-3xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-3xl" style={{ color: '#D4AF37' }}>.</span>
          </div>
          <p className="font-body text-sm" style={{ color: '#F3E5AB' }}>Begin Your Journey</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {error && (
            <div style={{ 
              background: 'rgba(248,113,113,0.2)', 
              border: '1px solid rgba(248,113,113,0.5)', 
              color: '#F87171', 
              padding: '12px 16px', 
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              wordBreak: 'break-word'
            }}>
              {error}
            </div>
          )}

          <Input
            type="text"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="John Doe"
          />

          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            autoComplete="email"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="new-password"
          />

          <Input
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="new-password"
          />

          <div style={{ marginTop: '8px' }}>
            <Button type="submit" style={{ width: '100%', height: '48px' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#D4AF37', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}