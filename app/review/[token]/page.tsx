'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';

interface EssayVersion {
  id: string;
  version_number: number;
  content: string;
  word_count: number;
  created_at: string;
  is_current: boolean;
}

interface Comment {
  id: string;
  counselor_id: string;
  counselor_name: string;
  comment_text: string;
  comment_type: string;
  created_at: string;
}

export default function ReviewEssayPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Essay data
  const [collegeName, setCollegeName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [essayContent, setEssayContent] = useState('');
  const [essayId, setEssayId] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [reviewerRole, setReviewerRole] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [studentName, setStudentName] = useState('');

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ text: '', type: 'general' });
  const [savingComment, setSavingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Other reviews
  const [otherReviews, setOtherReviews] = useState<any[]>([]);

  useEffect(() => {
    loadReview();
  }, [token]);

  const loadReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/invitations/${token}`);
        return;
      }
      setCurrentUser(user);

      // Get invitation by token
      const { data: inv, error: invError } = await supabase
        .from('essay_invitations')
        .select(`
          id, essay_id, student_id, invitee_email, invitee_name, role, status,
          essays:essay_id (
            id, user_id, college_prompt_id,
            college_prompts:college_prompt_id (
              id, college_id, prompt_text, sort_order, word_limit,
              colleges:college_id ( id, name )
            )
          )
        `)
        .eq('token', token)
        .single();

      if (invError || !inv) {
        setError('This review link is invalid or has expired.');
        setLoading(false);
        return;
      }

      if (inv.status !== 'accepted') {
        // Redirect to accept first
        router.push(`/invitations/${token}`);
        return;
      }

      const essay = (inv as any).essays;
      const prompt = essay?.college_prompts;
      const college = prompt?.colleges;

      setEssayId(essay?.id);
      setReviewerRole(inv.role);
      setReviewerName(inv.invitee_name || user.user_metadata?.full_name || '');
      setStudentName(inv.student_id ? '' : ''); // We'll show generic if no name

      const isCommonApp = prompt?.college_id === 'a0000000-0000-0000-0000-000000000000';
      setCollegeName(isCommonApp ? 'Common Application Essay' : (college?.name || 'College Essay'));
      setPromptText(prompt?.prompt_text || '');

      // Load the current essay version
      if (essay?.id) {
        const { data: versions } = await supabase
          .from('essay_versions')
          .select('*')
          .eq('essay_id', essay.id)
          .order('version_number', { ascending: false });

        if (versions && versions.length > 0) {
          const current = versions.find(v => v.is_current) || versions[0];
          setEssayContent(current.content);
          setCurrentVersionId(current.id);
          setWordCount(current.word_count);

          // Load comments
          await loadComments(current.id, essay.id);
        }
      }

      // Load other essay reviews for this user
      const { data: allInvitations } = await supabase
        .from('essay_invitations')
        .select(`
          id, token, role, status, invitee_name,
          essays:essay_id (
            id,
            college_prompts:college_prompt_id (
              college_id, sort_order,
              colleges:college_id ( name )
            )
          )
        `)
        .eq('invitee_email', inv.invitee_email)
        .eq('status', 'accepted');

      if (allInvitations && allInvitations.length > 1) {
        const others = allInvitations
          .filter((i: any) => i.token !== token)
          .map((i: any) => {
            const e = i.essays;
            const p = e?.college_prompts;
            const c = p?.colleges;
            const isCA = p?.college_id === 'a0000000-0000-0000-0000-000000000000';
            return {
              token: i.token,
              collegeName: isCA ? 'Common App' : (c?.name || 'Essay'),
              role: i.role,
            };
          });
        setOtherReviews(others);
      }

    } catch (err) {
      console.error('Error loading review:', err);
      setError('Something went wrong loading this review.');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (versionId: string, essayIdParam: string) => {
    try {
      const { data: commentsData } = await supabase
        .from('counselor_comments')
        .select('id, counselor_id, comment_text, comment_type, created_at')
        .eq('essay_version_id', versionId)
        .order('created_at', { ascending: false });

      if (commentsData) {
        // Look up names from permissions and invitations
        const nameMap: Record<string, string> = {};
        const { data: perms } = await supabase
          .from('essay_permissions')
          .select('user_id, commenter_name, role')
          .eq('essay_id', essayIdParam);
        if (perms) {
          for (const perm of perms) {
            nameMap[perm.user_id] = perm.commenter_name
              || (perm.role ? perm.role.charAt(0).toUpperCase() + perm.role.slice(1) : 'Reviewer');
          }
        }
        const { data: invs } = await supabase
          .from('essay_invitations')
          .select('invitee_name, role')
          .eq('essay_id', essayIdParam)
          .eq('status', 'accepted');
        if (invs && perms) {
          for (const perm of perms) {
            if (!nameMap[perm.user_id] || nameMap[perm.user_id] === 'Reviewer') {
              const match = invs.find(i => i.role === perm.role && i.invitee_name);
              if (match) nameMap[perm.user_id] = match.invitee_name!;
            }
          }
        }

        const { data: { user: me } } = await supabase.auth.getUser();

        const formatted: Comment[] = commentsData.map((c: any) => ({
          id: c.id,
          counselor_id: c.counselor_id,
          counselor_name: me && c.counselor_id === me.id ? 'You' : (nameMap[c.counselor_id] || 'Student'),
          comment_text: c.comment_text,
          comment_type: c.comment_type,
          created_at: c.created_at,
        }));
        setComments(formatted);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.text.trim()) return;
    if (!currentVersionId || !currentUser) return;

    setSavingComment(true);
    setCommentSuccess(false);
    try {
      const { error } = await supabase
        .from('counselor_comments')
        .insert({
          essay_version_id: currentVersionId,
          counselor_id: currentUser.id,
          comment_text: newComment.text.trim(),
          comment_type: newComment.type || 'general',
        });

      if (error) throw error;

      setNewComment({ text: '', type: 'general' });
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);

      if (currentVersionId && essayId) {
        await loadComments(currentVersionId, essayId);
      }
    } catch (err: any) {
      console.error('Error posting comment:', err);
      alert('Error posting comment: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingComment(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>Loading review...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ maxWidth: '500px', textAlign: 'center' }}>
          <Card>
            <h1 className="font-heading text-2xl mb-4" style={{ color: '#D4AF37' }}>Error</h1>
            <p className="font-body" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '24px' }}>{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  const roleLabel = reviewerRole === 'parent' ? 'Parent' : reviewerRole === 'counselor' ? 'Counselor' : reviewerRole === 'mentor' ? 'Mentor' : 'Reviewer';

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      {/* Reviewer Nav — simple, no student links */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="font-heading text-xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span style={{ color: '#D4AF37', fontSize: '20px' }}>.</span>
            <span className="font-body text-xs" style={{
              color: '#D4AF37',
              background: 'rgba(212,175,55,0.15)',
              padding: '4px 10px',
              borderRadius: '2px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {roleLabel} Review
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="font-heading text-3xl mb-2" style={{ color: 'white' }}>{collegeName}</h1>
          {reviewerName && (
            <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Reviewing as {reviewerName} ({roleLabel})
            </p>
          )}
        </div>

        {/* Other Reviews */}
        {otherReviews.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '12px 16px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '4px' }}>
            <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
              You also have other essays to review:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {otherReviews.map((r) => (
                <Link
                  key={r.token}
                  href={`/review/${r.token}`}
                  style={{
                    color: '#D4AF37',
                    fontSize: '12px',
                    fontFamily: 'var(--font-body)',
                    textDecoration: 'none',
                    padding: '4px 10px',
                    background: 'rgba(212,175,55,0.1)',
                    borderRadius: '2px',
                    border: '1px solid rgba(212,175,55,0.2)',
                  }}
                >
                  {r.collegeName}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prompt */}
        {promptText && (
          <div style={{ marginBottom: '24px' }}>
            <Card>
              <p className="font-body text-xs font-semibold" style={{ color: '#D4AF37', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Essay Prompt
              </p>
              <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                {promptText}
              </p>
            </Card>
          </div>
        )}

        {/* Essay Content — read only */}
        <div style={{ marginBottom: '32px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p className="font-body text-xs font-semibold" style={{ color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Essay
              </p>
              <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {wordCount} words
              </span>
            </div>
            {essayContent ? (
              <div
                className="font-body"
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: '1.8',
                  fontSize: '15px',
                  whiteSpace: 'pre-wrap',
                  padding: '20px',
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {essayContent}
              </div>
            ) : (
              <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                The student hasn&apos;t written their essay yet.
              </p>
            )}
          </Card>
        </div>

        {/* Leave Feedback — always visible, prominent */}
        <div style={{ marginBottom: '32px' }}>
          <Card>
            <h2 className="font-heading text-xl mb-2" style={{ color: '#D4AF37' }}>Leave Your Feedback</h2>
            <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>
              Share your thoughts, suggestions, and encouragement. The student will see your name and feedback type.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select
                value={newComment.type}
                onChange={(e) => setNewComment({ ...newComment, type: e.target.value })}
                style={{
                  height: '40px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '0 12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  outline: 'none',
                  borderRadius: '2px',
                }}
              >
                <option value="general">General Feedback</option>
                <option value="suggestion">Suggestion</option>
                <option value="praise">Praise</option>
                <option value="concern">Concern</option>
              </select>

              <textarea
                value={newComment.text}
                onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                placeholder="Write your feedback here..."
                style={{
                  minHeight: '150px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  color: 'white',
                  padding: '16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  outline: 'none',
                  borderRadius: '2px',
                  resize: 'vertical',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.2)'; }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleSubmitComment}
                  disabled={savingComment || !newComment.text.trim()}
                  style={{
                    background: (savingComment || !newComment.text.trim()) ? 'rgba(212,175,55,0.4)' : '#D4AF37',
                    color: '#0B1623',
                    padding: '12px 24px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: (savingComment || !newComment.text.trim()) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingComment ? 'Posting...' : 'Submit Feedback'}
                </button>
                {commentSuccess && (
                  <span className="font-body text-sm" style={{ color: '#10B981' }}>
                    Feedback posted
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Previous Comments */}
        {comments.length > 0 && (
          <div>
            <Card>
              <h3 className="font-heading text-lg mb-4" style={{ color: '#D4AF37' }}>
                All Feedback ({comments.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {comments.map((comment) => (
                  <div key={comment.id} style={{
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${
                      comment.comment_type === 'praise' ? '#10B981' :
                      comment.comment_type === 'concern' ? '#F87171' :
                      comment.comment_type === 'suggestion' ? '#60A5FA' :
                      '#D4AF37'
                    }`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <p className="font-body font-semibold text-sm" style={{ color: '#D4AF37', marginBottom: '4px' }}>
                          {comment.counselor_name}
                        </p>
                        <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="font-body text-xs" style={{
                        color: comment.comment_type === 'praise' ? '#10B981' :
                               comment.comment_type === 'concern' ? '#F87171' :
                               comment.comment_type === 'suggestion' ? '#60A5FA' :
                               '#D4AF37',
                        textTransform: 'capitalize',
                        padding: '4px 8px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '4px',
                      }}>
                        {comment.comment_type}
                      </span>
                    </div>
                    <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {comment.comment_text}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}