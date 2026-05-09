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
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [isUnder18, setIsUnder18] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!ageConfirmed) {
      setError('You must confirm you are at least 13 years old to create an account.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }

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
      // Sign up without triggering email confirmation. Age + terms attestation
      // flags are stored in user_metadata so admin/reporting can audit them
      // without a separate table. terms_accepted_version lets us prompt users
      // to re-accept if we make material changes to the Terms.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            age_confirmed_13_plus: true,
            age_confirmed_at: new Date().toISOString(),
            self_reported_under_18: isUnder18,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            terms_accepted_version: '2026-04-18',
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
        // Immediately redirect to profile page - no email confirmation needed
        router.push('/profile');
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
    <div className="min-h-screen flex items-center justify-center px-8 py-24" style={{ background: '#0B1320' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-heading text-3xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
            <span className="text-3xl" style={{ color: '#C9A977' }}>.</span>
          </div>
          <p className="font-body text-sm" style={{ color: '#E8DDC9' }}>Begin Your Journey</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
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

          {/* Age attestation. The 13+ checkbox is the legally-required
              COPPA gate. The under-18 checkbox is optional (no data gate)
              and just triggers a soft parental-guidance banner. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px', padding: '14px 16px', background: 'rgba(232,221,201,0.03)', border: '1px solid rgba(232,221,201,0.08)', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                required
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <span className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.85)', lineHeight: '1.5' }}>
                I am at least 13 years old.
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isUnder18}
                onChange={(e) => setIsUnder18(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <span className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.7)', lineHeight: '1.5' }}>
                I am under 18. (Optional — just so we can show you age-appropriate information.)
              </span>
            </label>

            {isUnder18 && (
              <div style={{ marginTop: '4px', padding: '10px 12px', background: 'rgba(201,169,119,0.08)', borderLeft: '2px solid rgba(201,169,119,0.5)', borderRadius: '2px' }}>
                <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.8)', lineHeight: '1.6' }}>
                  Since you're under 18, we recommend you review our{' '}
                  <Link href="/terms" style={{ color: '#C9A977', textDecoration: 'underline' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: '#C9A977', textDecoration: 'underline' }}>Privacy Policy</Link>
                  {' '}with a parent or guardian before continuing. Paid subscriptions require a parent or guardian to authorize the purchase.
                </p>
              </div>
            )}

            {/* Required agreement to Terms + Privacy. Storing the acceptance
                timestamp + version in user_metadata gives a paper trail for
                legal compliance. */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <span className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.85)', lineHeight: '1.5' }}>
                I agree to the{' '}
                <Link href="/terms" target="_blank" style={{ color: '#C9A977', textDecoration: 'underline' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" style={{ color: '#C9A977', textDecoration: 'underline' }}>Privacy Policy</Link>.
              </span>
            </label>
          </div>

          <div style={{ marginTop: '8px' }}>
            <Button type="submit" style={{ width: '100%', height: '48px' }} disabled={loading || !ageConfirmed || !agreedToTerms}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.5)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#C9A977', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}