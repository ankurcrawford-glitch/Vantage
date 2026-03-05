'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';

interface InvitationData {
  id: string;
  essay_id: string;
  student_id: string;
  invitee_email: string;
  invitee_name: string | null;
  role: string;
  status: string;
  essays: {
    id: string;
    user_id: string;
    college_prompt_id: string;
    college_prompts: {
      id: string;
      college_id: string;
      prompt_text: string;
      sort_order: number;
      colleges: {
        id: string;
        name: string;
      };
    };
  };
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Auth form states
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Look up invitation by token
      const { data: invData, error: invError } = await supabase
        .from('essay_invitations')
        .select(`
          id, essay_id, student_id, invitee_email, invitee_name, role, status,
          essays:essay_id (
            id, user_id, college_prompt_id,
            college_prompts:college_prompt_id (
              id, college_id, prompt_text, sort_order,
              colleges:college_id ( id, name )
            )
          )
        `)
        .eq('token', token)
        .single();

      if (invError || !invData) {
        setError('This invitation link is invalid or has expired.');
        setLoading(false);
        return;
      }

      const inv = invData as unknown as InvitationData;
      setInvitation(inv);

      // Pre-fill email from invitation
      if (inv.invitee_email) {
        setAuthEmail(inv.invitee_email);
      }
      if (inv.invitee_name) {
        setAuthName(inv.invitee_name);
      }

      // If already accepted and user is logged in, redirect to essay
      if (inv.status === 'accepted' && user) {
        redirectToEssay(inv);
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Something went wrong loading this invitation.');
    } finally {
      setLoading(false);
    }
  };

  const redirectToEssay = (inv: InvitationData) => {
    const essay = inv.essays;
    if (essay) {
      const prompt = essay.college_prompts;
      if (prompt) {
        const collegeId = prompt.college_id;
        const promptId = prompt.id;
        if (collegeId === 'a0000000-0000-0000-0000-000000000000') {
          const sortOrder = prompt.sort_order || 1;
          router.push(`/common-app/common-app-${sortOrder}`);
        } else {
          router.push(`/essays/${collegeId}/${promptId}`);
        }
        return;
      }
    }
    router.push('/dashboard');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (authPassword.length < 6) {
          setAuthError('Password must be at least 6 characters.');
          setAuthLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              full_name: authName.trim() || invitation?.invitee_name || '',
              role: 'commenter',
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
            setAuthError('This email is already registered. Switch to "Sign In" below.');
          } else {
            setAuthError(signUpError.message);
          }
          setAuthLoading(false);
          return;
        }

        if (data.user) {
          setCurrentUser(data.user);
          // Auto-accept after signup
          await acceptInvitation(data.user);
        }
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes('invalid login')) {
            setAuthError('Invalid email or password.');
          } else if (signInError.message.toLowerCase().includes('rate limit')) {
            setAuthError('Too many attempts. Please wait a few minutes.');
          } else {
            setAuthError(signInError.message);
          }
          setAuthLoading(false);
          return;
        }

        if (data.user) {
          setCurrentUser(data.user);
          // Auto-accept after signin
          await acceptInvitation(data.user);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong.');
    } finally {
      setAuthLoading(false);
    }
  };

  const acceptInvitation = async (user: any) => {
    if (!invitation) return;

    setAccepting(true);
    try {
      // Add permission for this user on the essay
      const { error: permError } = await supabase
        .from('essay_permissions')
        .upsert({
          essay_id: invitation.essay_id,
          user_id: user.id,
          role: invitation.role || 'reviewer',
          commenter_name: invitation.invitee_name || user.user_metadata?.full_name || invitation.invitee_email || 'Reviewer',
        }, { onConflict: 'essay_id,user_id' });

      if (permError) {
        console.error('Permission error:', permError);
        throw permError;
      }

      // Update invitation status to accepted
      const { error: updateError } = await supabase
        .from('essay_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Update error:', updateError);
        // Non-fatal
      }

      // Redirect to the essay
      redirectToEssay(invitation);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError('Could not accept the invitation: ' + (err.message || 'Unknown error'));
    } finally {
      setAccepting(false);
    }
  };

  const handleAccept = async () => {
    if (!currentUser) return;
    await acceptInvitation(currentUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ maxWidth: '500px', textAlign: 'center' }}>
          <Card>
            <h1 className="font-heading text-2xl mb-4" style={{ color: '#D4AF37' }}>Invitation Error</h1>
            <p className="font-body" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '24px' }}>{error}</p>
            <Link href="/">
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
                Go Home
              </button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  const essay = invitation.essays;
  const collegeName = essay?.college_prompts?.colleges?.name || 'Unknown College';
  const promptPreview = essay?.college_prompts?.prompt_text
    ? essay.college_prompts.prompt_text.slice(0, 120) + (essay.college_prompts.prompt_text.length > 120 ? '...' : '')
    : '';
  const isCommonApp = essay?.college_prompts?.college_id === 'a0000000-0000-0000-0000-000000000000';
  const roleLabel = invitation.role === 'parent' ? 'Parent' : invitation.role === 'counselor' ? 'Counselor' : invitation.role === 'mentor' ? 'Mentor' : 'Reviewer';

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
      <div style={{ maxWidth: '550px', width: '100%', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-3xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-3xl" style={{ color: '#D4AF37' }}>.</span>
          </Link>
        </div>

        <Card>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 className="font-heading text-2xl mb-2" style={{ color: '#D4AF37' }}>
              You&apos;re Invited to Review
            </h1>
            <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {invitation.invitee_name
                ? `${invitation.invitee_name}, you've been invited as a ${roleLabel}`
                : `You've been invited as a ${roleLabel}`}
            </p>
          </div>

          <div style={{
            padding: '20px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            borderLeft: '3px solid #D4AF37',
            marginBottom: '24px',
          }}>
            <p className="font-heading text-lg" style={{ color: 'white', marginBottom: '8px' }}>
              {isCommonApp ? 'Common Application Essay' : collegeName}
            </p>
            {promptPreview && (
              <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                {promptPreview}
              </p>
            )}
          </div>

          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', lineHeight: '1.6' }}>
            As a {roleLabel}, you&apos;ll be able to read the essay and leave comments with feedback, suggestions, and encouragement.
          </p>

          {invitation.status === 'revoked' ? (
            <p className="font-body text-sm" style={{ color: '#F87171', textAlign: 'center' }}>
              This invitation has been revoked.
            </p>
          ) : currentUser ? (
            /* User is already logged in — just accept */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleAccept}
                disabled={accepting}
                style={{
                  width: '100%',
                  background: accepting ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                  color: '#0B1623',
                  padding: '14px 24px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: accepting ? 'not-allowed' : 'pointer',
                }}
              >
                {accepting
                  ? 'Accepting...'
                  : invitation.status === 'accepted'
                  ? 'View Essay'
                  : 'Accept Invitation'}
              </button>
            </div>
          ) : (
            /* User is NOT logged in — show auth form */
            <div>
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '24px',
              }}>
                <h3 className="font-heading text-lg" style={{ color: 'white', textAlign: 'center', marginBottom: '4px' }}>
                  {authMode === 'signup' ? 'Create Your Reviewer Account' : 'Sign In'}
                </h3>
                <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '20px' }}>
                  {authMode === 'signup'
                    ? 'Quick sign-up to start reviewing — no student account needed'
                    : 'Already have an account? Sign in below'}
                </p>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {authMode === 'signup' && (
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Your name"
                      style={{
                        height: '44px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        color: 'white',
                        padding: '0 14px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        outline: 'none',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    style={{
                      height: '44px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      color: 'white',
                      padding: '0 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      outline: 'none',
                      borderRadius: '2px',
                    }}
                  />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Password"
                    required
                    style={{
                      height: '44px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      color: 'white',
                      padding: '0 14px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      outline: 'none',
                      borderRadius: '2px',
                    }}
                  />

                  {authError && (
                    <p className="font-body text-xs" style={{ color: '#F87171' }}>{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading || accepting}
                    style={{
                      width: '100%',
                      background: (authLoading || accepting) ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                      color: '#0B1623',
                      padding: '14px 24px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '16px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: (authLoading || accepting) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {authLoading || accepting
                      ? 'Please wait...'
                      : authMode === 'signup'
                      ? 'Create Account & Review Essay'
                      : 'Sign In & Review Essay'}
                  </button>
                </form>

                <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '16px' }}>
                  {authMode === 'signup' ? (
                    <>Already have an account?{' '}
                      <button
                        onClick={() => { setAuthMode('signin'); setAuthError(''); }}
                        style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '12px', padding: 0 }}
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>Need an account?{' '}
                      <button
                        onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                        style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '12px', padding: 0 }}
                      >
                        Create one
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}