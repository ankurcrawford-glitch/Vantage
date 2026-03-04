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
              id, college_id, prompt_text,
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

      setInvitation(invData as unknown as InvitationData);

      // If already accepted and user is logged in, redirect to essay
      if (invData.status === 'accepted' && user) {
        const essay = (invData as any).essays;
        if (essay) {
          const prompt = essay.college_prompts;
          if (prompt) {
            const collegeId = prompt.college_id;
            const promptId = prompt.id;
            if (collegeId === 'a0000000-0000-0000-0000-000000000000') {
              // Common App essay
              const sortOrder = prompt.sort_order || 1;
              router.push(`/common-app/common-app-${sortOrder}`);
            } else {
              router.push(`/essays/${collegeId}/${promptId}`);
            }
            return;
          }
        }
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Something went wrong loading this invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!currentUser) {
      // Redirect to signup/login, then back here
      const returnUrl = `/invitations/${token}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!invitation) return;

    setAccepting(true);
    try {
      // Add permission for this user on the essay
      const { error: permError } = await supabase
        .from('essay_permissions')
        .upsert({
          essay_id: invitation.essay_id,
          user_id: currentUser.id,
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
        // Non-fatal — permission was granted, just status didn't update
      }

      // Redirect to the essay
      const essay = invitation.essays;
      if (essay) {
        const prompt = essay.college_prompts;
        if (prompt) {
          const collegeId = prompt.college_id;
          const promptId = prompt.id;
          if (collegeId === 'a0000000-0000-0000-0000-000000000000') {
            const sortOrder = (prompt as any).sort_order || 1;
            router.push(`/common-app/common-app-${sortOrder}`);
          } else {
            router.push(`/essays/${collegeId}/${promptId}`);
          }
          return;
        }
      }

      // Fallback
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError('Could not accept the invitation: ' + (err.message || 'Unknown error'));
    } finally {
      setAccepting(false);
    }
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
                ? `${invitation.invitee_name}, you've been invited as a ${invitation.role}`
                : `You've been invited as a ${invitation.role}`}
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
            As a {invitation.role}, you&apos;ll be able to read the essay and leave comments with feedback, suggestions, and encouragement.
          </p>

          {invitation.status === 'revoked' ? (
            <p className="font-body text-sm" style={{ color: '#F87171', textAlign: 'center' }}>
              This invitation has been revoked.
            </p>
          ) : (
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
                {!currentUser
                  ? 'Sign In to Accept'
                  : accepting
                  ? 'Accepting...'
                  : invitation.status === 'accepted'
                  ? 'View Essay'
                  : 'Accept Invitation'}
              </button>

              {!currentUser && (
                <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                  You&apos;ll need to create an account or sign in first
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}