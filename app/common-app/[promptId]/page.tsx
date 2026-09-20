'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import { useEssayDraft } from '@/hooks/useEssayDraft';
import Navigation from '@/components/Navigation';
import ApplicationsSubNav from '@/components/ApplicationsSubNav';

const COMMON_APP_PROMPTS = [
  {
    id: 'common-app-1',
    number: 1,
    prompt: 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.',
    word_limit: 650,
  },
  {
    id: 'common-app-2',
    number: 2,
    prompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
    word_limit: 650,
  },
  {
    id: 'common-app-3',
    number: 3,
    prompt: 'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?',
    word_limit: 650,
  },
  {
    id: 'common-app-4',
    number: 4,
    prompt: 'Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?',
    word_limit: 650,
  },
  {
    id: 'common-app-5',
    number: 5,
    prompt: 'Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.',
    word_limit: 650,
  },
  {
    id: 'common-app-6',
    number: 6,
    prompt: 'Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?',
    word_limit: 650,
  },
  {
    id: 'common-app-7',
    number: 7,
    prompt: 'Share an essay on any topic of your choice. It can be one you\'ve already written, one that responds to a different prompt, or one of your own design.',
    word_limit: 650,
  },
];

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
  section_start: number | null;
  section_end: number | null;
  comment_type: string;
  created_at: string;
}

interface Invitation {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  role: string;
  status: string;
  created_at: string;
}

// Fixed UUID for the "Common Application" row in the colleges table
const COMMON_APP_COLLEGE_ID = 'a0000000-0000-0000-0000-000000000000';

export default function CommonAppEssayPage() {
  const route = useParams();
  return <EssayEditor key={String(route.collegeId ?? '') + ':' + String(route.promptId)} />;
}

function EssayEditor() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const promptId = params.promptId as string;

  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tickNow, setTickNow] = useState(Date.now());
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState({ text: '', type: 'general' });
  const [savingComment, setSavingComment] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newInvitation, setNewInvitation] = useState({ email: '', name: '', role: 'parent' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [thinkingPartnerResponse, setThinkingPartnerResponse] = useState<string | null>(null);
  const [loadingThinkingPartner, setLoadingThinkingPartner] = useState(false);
  const [insightGateMessage, setInsightGateMessage] = useState<string | null>(null);
  const [focusDirective, setFocusDirective] = useState<string | null>(null);
  const [guidanceMode, setGuidanceMode] = useState<string | null>(null);
  const [guidanceHistory, setGuidanceHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [showAllInvitations, setShowAllInvitations] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [draftPromptId, setDraftPromptId] = useState<string | null>(null);
  const draft = useEssayDraft(draftPromptId, currentUser?.id ?? null, hasSubscription);
  const { content, essayId, versions, currentVersion, wordCount, status: autosaveStatus, lastSavedAt: lastAutosavedAt } = draft;
  const saveNewVersion = async () => {
    if (saving) return;
    setSaving(true);
    try { await draft.save(); setSaveSuccessMessage('Saved checkpoint'); }
    catch { setSaveSuccessMessage(null); }
    finally { setSaving(false); }
  };
  const switchVersion = (version: EssayVersion) => { void draft.restore(version); };
  const deleteVersion = async (event: React.MouseEvent, version: EssayVersion) => {
    event.stopPropagation(); if (deletingVersionId) return;
    setDeletingVersionId(version.id);
    try { await draft.remove(version); } finally { setDeletingVersionId(null); }
  };
  const loadData = async () => {
    setLoading(true); setLoadError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);
      const selected = COMMON_APP_PROMPTS.find(p => p.id === promptId);
      if (!selected) throw new Error('Prompt not found.');
      setPrompt(selected);
      const { data: rows, error: lookupError } = await supabase.from('college_prompts')
        .select('id, cycle').eq('college_id', COMMON_APP_COLLEGE_ID).eq('sort_order', selected.number);
      if (lookupError) throw lookupError;
      if (!rows?.length) throw new Error('This prompt is not ready yet. Your existing work is safe. Please contact support.');
      const { data: existing, error: essayError } = await supabase.from('essays').select('college_prompt_id')
        .eq('user_id', user.id).in('college_prompt_id', rows.map(p => p.id));
      if (essayError) throw essayError;
      if ((existing?.length ?? 0) > 1) throw new Error('There are multiple drafts attached to this prompt. Contact support to reconcile them; no draft has been replaced.');
      const currentRows = rows.filter(p => p.cycle === '2026-27');
      const id = existing?.[0]?.college_prompt_id ?? (currentRows.length === 1 ? currentRows[0].id : rows.length === 1 ? rows[0].id : null);
      if (!id) throw new Error('This prompt has duplicate records. Contact support before writing.');
      setDraftPromptId(id); setHasSubscription(true); setIsOwner(true); setHasPermission(true);
    } catch (err: any) { setLoadError(err?.message || 'Could not load this essay. Retry before editing.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    checkAuth();
    loadData();
  }, [promptId]);

  useEffect(() => {
    if (currentVersion) {
      loadComments(currentVersion.id);
    }
  }, [currentVersion]);

  useEffect(() => {
    if (essayId && currentUser && isOwner) {
      loadInvitations();
    }
  }, [essayId, currentUser, isOwner]);

  useEffect(() => {
    const id = setInterval(() => setTickNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Load guidance history when user is ready
  useEffect(() => {
    if (currentUser && promptId) {
      loadGuidanceHistory();
    }
  }, [currentUser, promptId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setCurrentUser(user);
    }
  };

  const loadComments = async (versionId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('counselor_comments')
        .select('id, counselor_id, comment_text, section_start, section_end, comment_type, created_at')
        .eq('essay_version_id', versionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (commentsData) {
        // Look up commenter names from essay_permissions and invitations
        const nameMap: Record<string, string> = {};
        if (essayId) {
          // Get reviewer names from permissions
          const { data: perms } = await supabase
            .from('essay_permissions')
            .select('user_id, commenter_name, role')
            .eq('essay_id', essayId);
          if (perms) {
            for (const perm of perms) {
              const label = perm.commenter_name
                || (perm.role ? perm.role.charAt(0).toUpperCase() + perm.role.slice(1) : 'Reviewer');
              nameMap[perm.user_id] = label;
            }
          }
          // Also get names from invitations (for accepted invites where permissions might not have name)
          const { data: invs } = await supabase
            .from('essay_invitations')
            .select('invitee_email, invitee_name, role, status')
            .eq('essay_id', essayId)
            .eq('status', 'accepted');
          if (invs && perms) {
            for (const perm of perms) {
              if (!nameMap[perm.user_id] || nameMap[perm.user_id] === 'Reviewer') {
                const matchInv = invs.find(i => i.role === perm.role && i.invitee_name);
                if (matchInv) {
                  nameMap[perm.user_id] = matchInv.invitee_name!;
                }
              }
            }
          }
        }

        const { data: { user: me } } = await supabase.auth.getUser();

        const formattedComments: Comment[] = commentsData.map((comment: any) => {
          // Always show the actual commenter's name from permissions/invitations
          const name = nameMap[comment.counselor_id]
            || (me && comment.counselor_id === me.id ? (me.user_metadata?.full_name || 'You') : 'Reviewer');
          return {
            id: comment.id,
            counselor_id: comment.counselor_id,
            counselor_name: name,
            comment_text: comment.comment_text,
            section_start: comment.section_start,
            section_end: comment.section_end,
            comment_type: comment.comment_type,
            created_at: comment.created_at,
          };
        });
        setComments(formattedComments);
      }
    } catch (error: unknown) {
      setComments([]);
      const msg = error && typeof error === 'object' && 'message' in error ? (error as Error).message : String(error);
      console.error('Error loading comments:', msg);
    }
  };

  const loadInvitations = async () => {
    if (!essayId) return;
    try {
      const { data: invitationsData, error } = await supabase
        .from('essay_invitations')
        .select('*')
        .eq('essay_id', essayId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (invitationsData) {
        setInvitations(invitationsData);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleSendInvitation = async () => {
      if (!essayId) {
        alert('Save your essay first (click "Save Draft" above), then you can invite commenters.');
        return;
      }
      if (!newInvitation.email.trim()) {
        alert('Please enter an email address.');
        return;
      }
    setSendingInvitation(true);
    setEmailSent(false);
    setGeneratedLink(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isOwner) {
        alert('Only the essay owner can send invitations.');
        return;
      }

      const { data, error } = await supabase
        .from('essay_invitations')
        .insert({
          essay_id: essayId,
          student_id: user.id,
          invitee_email: newInvitation.email.trim(),
          invitee_name: newInvitation.name.trim() || null,
          role: newInvitation.role,
          student_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        })
        .select()
        .single();

      if (error) throw error;

      const invitationLink = `${window.location.origin}/invitations/${(data as any).token}`;
      setGeneratedLink(invitationLink);

      // Send email
      try {
        const emailRes = await fetch('/api/send-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationId: data.id,
            inviteeEmail: newInvitation.email.trim(),
            inviteeName: newInvitation.name.trim() || null,
            role: newInvitation.role,
            essayInfo: { collegeName: 'Common Application' },
            invitationToken: (data as any).token,
            studentName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'A student',
          }),
        });
        if (emailRes.ok) {
          setEmailSent(true);
        }
      } catch (emailErr) {
        console.error('Email send failed (link still works):', emailErr);
      }

      setNewInvitation({ email: '', name: '', role: 'parent' });
      loadInvitations();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      alert('Error sending invitation: ' + (error.message || 'Unknown error'));
    } finally {
      setSendingInvitation(false);
    }
  };

  // Helper: render text with **bold** markdown
  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const modeLabel = (mode: string) => {
    switch (mode) {
      case 'pre_writing': return 'Pre-Writing';
      case 'early_draft': return 'Early Draft';
      case 'revision': return 'Revision';
      default: return mode;
    }
  };

  // Load guidance history for this prompt
  const loadGuidanceHistory = async () => {
    if (!currentUser || !promptId) return;
    try {
      const res = await fetch(`/api/thinking-partner?userId=${currentUser.id}&promptId=${promptId}`);
      if (res.ok) {
        const data = await res.json();
        setGuidanceHistory(data.history || []);
      }
    } catch (e) {
      console.error('Error loading guidance history:', e);
    }
  };

  const loadThinkingPartner = async () => {
    if (!currentUser || !promptId) return;

    setLoadingThinkingPartner(true);
    setInsightGateMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to get strategic guidance.');
        return;
      }

      const response = await fetch('/api/thinking-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId,
          collegeId: COMMON_APP_COLLEGE_ID,
          userId: currentUser.id,
          essayContent: content.trim() || null,
          focusDirective,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to load guidance');
      }

      const data = await response.json();
      
      // Check if gated (not enough insight answers)
      if (data.gated) {
        setInsightGateMessage(data.message);
        setThinkingPartnerResponse(null);
        return;
      }

      setThinkingPartnerResponse(data.response);
      if (!data.savedId) alert("This feedback was generated but could not be saved to history. Copy it before leaving this page.");
      setGuidanceMode(data.mode);
      // Refresh history since a new entry was auto-saved
      loadGuidanceHistory();
    } catch (error: any) {
      console.error('Error loading thinking partner:', error);
      alert('Error loading strategic guidance: ' + (error.message || 'Unknown error'));
    } finally {
      setLoadingThinkingPartner(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.text.trim()) {
      alert('Please enter a comment before posting.');
      return;
    }
    if (!currentVersion) {
      alert('Please select a version to comment on.');
      return;
    }
    if (!hasPermission && !isOwner) {
      alert('You do not have permission to comment on this essay.');
      return;
    }
    if (savingComment) return;

    setSavingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to comment.');
        setSavingComment(false);
        return;
      }

      const { data: savedComment, error } = await supabase
        .from('counselor_comments')
        .insert({
          essay_version_id: currentVersion.id,
          counselor_id: user.id,
          comment_text: newComment.text.trim(),
          comment_type: newComment.type || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      if (!savedComment) throw new Error('Comment was not saved.');

      setNewComment({ text: '', type: 'general' });
      setShowCommentForm(false);
      await loadComments(currentVersion.id);
      alert('Comment posted successfully!');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      alert('Error adding comment: ' + (error.message || 'Unknown error'));
    } finally {
      setSavingComment(false);
    }
  };

  if (loadError) return <div className="p-8" role="alert"><p>{loadError}</p><button onClick={() => void loadData()}>Retry loading</button></div>;

  if (loading || draft.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div style={{ color: '#C9A977' }}>Loading...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div style={{ color: '#C9A977' }}>Prompt not found</div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-screen" style={{ background: '#0B1320' }}>
        <Navigation />
        <ApplicationsSubNav />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
          <Link href="/common-app" style={{ color: '#C9A977', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}>← Back to Common App Prompts</Link>
          <div style={{ marginTop: '24px' }}>
            <Card>
              <h1 className="font-heading text-3xl mb-4" style={{ color: '#E8DDC9' }}>Essay writing requires a subscription</h1>
            <p className="font-body text-lg mb-6" style={{ color: 'rgba(232,221,201,0.9)' }}>
              To write, save, and use Strategic Intelligence for Common App essays (Prompt {prompt.number}), subscribe to VANTAGE.
            </p>
            <Link href="/dashboard">
              <button style={{ background: '#C9A977', color: '#0B1320', padding: '12px 24px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '2px', cursor: 'pointer' }}>Go to Dashboard</button>
            </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = isOwner && draft.canEdit;
  const canComment = hasPermission || isOwner;

  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />
      <ApplicationsSubNav />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/common-app"
            style={{ color: '#C9A977', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}
          >
            ← Back to Common App Prompts
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="font-heading text-4xl mb-2" style={{ color: '#E8DDC9' }}>Common Application Essay</h1>
              <h2 className="font-heading text-xl mb-4" style={{ color: '#C9A977' }}>Prompt {prompt.number}</h2>
            </div>
            {!isOwner && hasPermission && (
              <div style={{
                padding: '8px 16px',
                background: 'rgba(201,169,119,0.1)',
                border: '1px solid rgba(201,169,119,0.3)',
                borderRadius: '4px',
              }}>
                <p className="font-body text-sm" style={{ color: '#C9A977' }}>
                  View Only - You can comment but cannot edit
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
          {/* Main Writing Area */}
          <div>
            <Card>
              <div style={{ marginBottom: '24px' }}>
                <p className="font-body" style={{ color: 'rgba(232,221,201,0.9)', lineHeight: '1.6', marginBottom: '12px' }}>
                  {prompt.prompt}
                </p>
                {prompt.word_limit && (
                  <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.45)' }}>
                    Word Limit: {prompt.word_limit} words
                  </p>
                )}
              </div>
            </Card>

            <div style={{ marginTop: '32px' }}>
              <Card>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="font-heading text-lg" style={{ color: '#C9A977' }}>Your Essay</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {isOwner && (
                      <AutosaveIndicator
                        status={autosaveStatus}
                        lastSavedAt={lastAutosavedAt}
                        now={tickNow}
                      />
                    )}
                    <span className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.68)' }}>
                      {wordCount} {prompt.word_limit ? `/ ${prompt.word_limit}` : ''} words
                    </span>
                    {prompt.word_limit && wordCount > prompt.word_limit && (
                      <span className="font-body text-sm" style={{ color: '#A35A6A' }}>Over limit</span>
                    )}
                  </div>
                </div>
                {draft.error && <div role="alert" className="mb-4 text-amber-200"><p>{draft.error}</p>
                  <button onClick={() => void draft.retry().catch(() => undefined)} className="underline mr-4">Retry save</button>
                  <button onClick={draft.reload} className="underline">Reload server draft</button>
                </div>}
                <textarea
                  value={content}
                  onChange={(e) => { setSaveSuccessMessage(null); draft.edit(e.target.value); }}
                  placeholder="Start writing your essay here..."
                  disabled={!canEdit}
                  style={{
                    width: '100%',
                    minHeight: '400px',
                    background: canEdit ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
                    border: '1px solid rgba(201,169,119,0.2)',
                    color: canEdit ? 'white' : 'rgba(232,221,201,0.68)',
                    padding: '20px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    cursor: canEdit ? 'text' : 'not-allowed',
                  }}
                  onFocus={(e) => {
                    if (canEdit) e.target.style.borderColor = 'rgba(201,169,119,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(201,169,119,0.2)';
                  }}
                />
                {canEdit && (
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={saveNewVersion}
                      disabled={saving}
                      style={{
                        background: saving ? 'rgba(201,169,119,0.5)' : '#C9A977',
                        color: '#0B1320',
                        padding: '12px 24px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    {saveSuccessMessage && (
                      <span className="font-body text-sm" style={{ color: '#8FB89A' }}>
                        {saveSuccessMessage}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Comments Section */}
            {currentVersion && comments.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <Card>
                  <h3 className="font-heading text-lg mb-4" style={{ color: '#C9A977' }}>Comments</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {comments.map((comment) => (
                      <div key={comment.id} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', borderLeft: '3px solid #C9A977' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <p className="font-body font-semibold text-sm" style={{ color: '#C9A977', marginBottom: '4px' }}>
                              Comment from {comment.counselor_name}
                            </p>
                            <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.45)' }}>
                              {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <span className="font-body text-xs" style={{
                            color: comment.comment_type === 'praise' ? '#8FB89A' : comment.comment_type === 'concern' ? '#A35A6A' : '#C9A977',
                            textTransform: 'capitalize',
                            padding: '4px 8px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '4px',
                          }}>
                            {comment.comment_type}
                          </span>
                        </div>
                        <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.9)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {comment.comment_text}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Add Comment Form */}
            {currentVersion && canComment && (
              <div style={{ marginTop: '32px' }}>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="font-heading text-lg" style={{ color: '#C9A977' }}>Add Comment</h3>
                    <button
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      style={{
                        background: 'transparent',
                        color: '#C9A977',
                        border: '1px solid rgba(201,169,119,0.5)',
                        padding: '8px 16px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      {showCommentForm ? 'Cancel' : 'Add Comment'}
                    </button>
                  </div>
                  {showCommentForm && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <select
                        value={newComment.type}
                        onChange={(e) => setNewComment({ ...newComment, type: e.target.value })}
                        style={{
                          height: '40px',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(201,169,119,0.2)',
                          color: '#E8DDC9',
                          padding: '0 12px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          outline: 'none',
                          borderRadius: '2px',
                        }}
                      >
                        <option value="general">General</option>
                        <option value="suggestion">Suggestion</option>
                        <option value="praise">Praise</option>
                        <option value="concern">Concern</option>
                      </select>
                      <textarea
                        value={newComment.text}
                        onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                        placeholder="Write your comment..."
                        style={{
                          minHeight: '100px',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(201,169,119,0.2)',
                          color: '#E8DDC9',
                          padding: '12px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          outline: 'none',
                          borderRadius: '2px',
                          resize: 'vertical',
                        }}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={savingComment}
                        style={{
                          background: savingComment ? 'rgba(201,169,119,0.5)' : '#C9A977',
                          color: '#0B1320',
                          padding: '10px 20px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '2px',
                          cursor: savingComment ? 'not-allowed' : 'pointer',
                          alignSelf: 'flex-start',
                          opacity: savingComment ? 0.7 : 1,
                        }}
                      >
                        {savingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Strategic Intelligence */}
            <div style={{ marginTop: '32px' }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 className="font-heading text-lg" style={{ color: '#C9A977' }}>Strategic Intelligence</h3>
                    <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.45)', marginTop: '4px' }}>
                      Guidance that sharpens as your essay does.
                    </p>
                  </div>
                  <button
                    onClick={loadThinkingPartner}
                    disabled={loadingThinkingPartner}
                    style={{
                      background: loadingThinkingPartner ? 'rgba(201,169,119,0.5)' : '#C9A977',
                      color: '#0B1320',
                      padding: '10px 20px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '2px',
                      cursor: loadingThinkingPartner ? 'not-allowed' : 'pointer',
                      opacity: loadingThinkingPartner ? 0.7 : 1,
                    }}
                  >
                    {loadingThinkingPartner ? 'Analyzing...' : 'Get Guidance'}
                  </button>
                </div>

                <FocusChips
                  value={focusDirective}
                  onChange={setFocusDirective}
                  disabled={loadingThinkingPartner}
                />

                {/* Insight gate message */}
                {insightGateMessage && (
                  <div style={{ marginTop: '16px', padding: '20px', background: 'rgba(201,169,119,0.08)', borderRadius: '4px', borderLeft: '3px solid rgba(201,169,119,0.5)' }}>
                    <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.68)', lineHeight: '1.7' }}>
                      {insightGateMessage}
                    </p>
                    <a href="/story-builder" style={{ display: 'inline-block', marginTop: '16px', background: 'transparent', color: '#C9A977', padding: '8px 16px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, border: '1px solid #C9A977', borderRadius: '2px', textDecoration: 'none' }}>
                      Complete Story Builder
                    </a>
                  </div>
                )}

                {/* Current guidance response */}
                {thinkingPartnerResponse && (
                  <div style={{ marginTop: '16px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: '3px solid #C9A977' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 className="font-heading text-md" style={{ color: '#C9A977' }}>Latest Guidance</h4>
                        {guidanceMode && (
                          <span className="font-body" style={{ fontSize: '11px', color: 'rgba(201,169,119,0.6)', marginTop: '2px', display: 'block' }}>
                            {modeLabel(guidanceMode)} mode
                          </span>
                        )}
                      </div>
                      <button onClick={() => { setThinkingPartnerResponse(null); setInsightGateMessage(null); }} style={{ background: 'transparent', color: 'rgba(232,221,201,0.45)', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0', lineHeight: '1' }}>
                        ×
                      </button>
                    </div>
                    <div className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.9)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                      {renderBoldText(thinkingPartnerResponse)}
                    </div>
                  </div>
                )}

                {/* Guidance History Accordion */}
                {guidanceHistory.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(201,169,119,0.7)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span style={{ transform: showHistory ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
                      Past Guidance ({guidanceHistory.length})
                    </button>
                    {showHistory && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {guidanceHistory.map((entry: any) => (
                          <details key={entry.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid rgba(232,221,201,0.12)' }}>
                            <summary style={{ padding: '10px 14px', cursor: 'pointer', color: 'rgba(232,221,201,0.68)', fontFamily: 'var(--font-body)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', listStyle: 'none' }}>
                              <span>{modeLabel(entry.mode)} — {entry.essay_word_count || 0} words</span>
                              <span style={{ color: 'rgba(232,221,201,0.45)' }}>{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                            </summary>
                            <div className="font-body text-sm" style={{ padding: '12px 14px', color: 'rgba(232,221,201,0.68)', lineHeight: '1.7', whiteSpace: 'pre-wrap', borderTop: '1px solid rgba(232,221,201,0.06)' }}>
                              {renderBoldText(entry.guidance_text)}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <h3 className="font-heading text-lg mb-4" style={{ color: '#C9A977' }}>Versions</h3>
              {versions.length === 0 ? (
                <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.45)' }}>
                  No versions saved yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      style={{
                        padding: '12px',
                        background: version.is_current ? 'rgba(201,169,119,0.2)' : 'transparent',
                        border: version.is_current ? '1px solid rgba(201,169,119,0.5)' : '1px solid rgba(232,221,201,0.12)',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => switchVersion(version)}
                        style={{
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          flex: 1,
                          color: 'inherit',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <span style={{ display: 'block', color: '#E8DDC9', fontSize: '14px', fontWeight: 600 }}>
                          Version {version.version_number}
                        </span>
                        <span style={{ display: 'block', color: 'rgba(232,221,201,0.45)', fontSize: '12px', marginTop: '4px' }}>
                          {version.word_count} words · {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {version.is_current && (
                          <span className="font-body text-xs" style={{ color: '#C9A977' }}>Current</span>
                        )}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={(e) => deleteVersion(e, version)}
                            disabled={!!deletingVersionId}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(232,221,201,0.25)',
                              color: 'rgba(232,221,201,0.68)',
                              cursor: deletingVersionId ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontFamily: 'var(--font-body)',
                              padding: '4px 8px',
                              borderRadius: '2px',
                            }}
                          >
                            {deletingVersionId === version.id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {isOwner && (
              <div style={{ marginTop: '24px' }}>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="font-heading text-lg" style={{ color: '#C9A977' }}>Invite Commenters</h3>
                    <button
                      onClick={() => setShowInviteForm(!showInviteForm)}
                      style={{
                        background: 'transparent',
                        color: '#C9A977',
                        border: '1px solid rgba(201,169,119,0.5)',
                        padding: '6px 12px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      {showInviteForm ? 'Cancel' : '+ Invite'}
                    </button>
                  </div>

                  {showInviteForm && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      <input
                        type="email"
                        value={newInvitation.email}
                        onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                        placeholder="Email address"
                        style={{
                          height: '36px',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(201,169,119,0.2)',
                          color: '#E8DDC9',
                          padding: '0 12px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          outline: 'none',
                          borderRadius: '2px',
                        }}
                      />
                      <input
                        type="text"
                        value={newInvitation.name}
                        onChange={(e) => setNewInvitation({ ...newInvitation, name: e.target.value })}
                        placeholder="Name (optional)"
                        style={{
                          height: '36px',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(201,169,119,0.2)',
                          color: '#E8DDC9',
                          padding: '0 12px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          outline: 'none',
                          borderRadius: '2px',
                        }}
                      />
                      <select
                        value={newInvitation.role}
                        onChange={(e) => setNewInvitation({ ...newInvitation, role: e.target.value })}
                        style={{
                          height: '36px',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(201,169,119,0.2)',
                          color: '#E8DDC9',
                          padding: '0 12px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          outline: 'none',
                          borderRadius: '2px',
                        }}
                      >
                        <option value="parent">Parent</option>
                        <option value="counselor">Counselor</option>
                        <option value="mentor">Mentor</option>
                        <option value="other">Other</option>
                      </select>
                      <button
                        onClick={handleSendInvitation}
                        disabled={sendingInvitation}
                        style={{
                          background: sendingInvitation ? 'rgba(201,169,119,0.5)' : '#C9A977',
                          color: '#0B1320',
                          padding: '8px 16px',
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '2px',
                          cursor: sendingInvitation ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {sendingInvitation ? 'Sending...' : 'Send Invitation'}
                      </button>

                      {generatedLink && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(201,169,119,0.1)', border: '1px solid rgba(201,169,119,0.3)', borderRadius: '4px' }}>
                          {emailSent && (
                            <p className="font-body text-xs" style={{ color: '#8FB89A', marginBottom: '8px', fontWeight: 600 }}>
                              Email sent successfully
                            </p>
                          )}
                          <p className="font-body text-xs" style={{ color: 'rgba(232,221,201,0.68)', marginBottom: '8px' }}>
                            {emailSent ? 'You can also share this link directly:' : 'Share this link with your reviewer:'}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={generatedLink}
                              readOnly
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              style={{
                                flex: 1,
                                height: '32px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(201,169,119,0.2)',
                                color: '#E8DDC9',
                                padding: '0 10px',
                                fontFamily: 'var(--font-body)',
                                fontSize: '11px',
                                outline: 'none',
                                borderRadius: '2px',
                              }}
                            />
                            <button
                              onClick={() => copyToClipboard(generatedLink)}
                              style={{
                                background: linkCopied ? '#8FB89A' : '#C9A977',
                                color: linkCopied ? 'white' : '#0B1320',
                                padding: '6px 12px',
                                fontFamily: 'var(--font-body)',
                                fontSize: '11px',
                                fontWeight: 600,
                                border: 'none',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {linkCopied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {invitations.length > 0 && (() => {
                    const unique = invitations.filter((inv, idx, arr) =>
                      arr.findIndex(i => i.invitee_email === inv.invitee_email) === idx
                    );
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                        <p className="font-body text-xs font-semibold" style={{ color: 'rgba(232,221,201,0.68)', marginBottom: '4px' }}>
                          Invited Reviewers:
                        </p>
                        {unique.map((inv) => (
                          <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            <p className="font-body text-xs" style={{ color: '#E8DDC9', margin: 0 }}>
                              {inv.invitee_name || inv.invitee_email}
                            </p>
                            <span className="font-body text-xs" style={{ color: inv.status === 'accepted' ? '#8FB89A' : 'rgba(232,221,201,0.45)' }}>
                              {inv.status === 'accepted' ? 'Accepted' : inv.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preset lenses for Strategic Intelligence — mirror of the school
// editor's FocusChips. Kept in this file rather than a shared component
// so the two editors can diverge later without a refactor if they want.
const FOCUS_PRESETS: { key: string; label: string; directive: string }[] = [
  { key: 'opening', label: 'The opening', directive: 'Focus on the opening — is it earning the reader\'s attention, and is it doing the work of setting up the essay?' },
  { key: 'ending', label: 'The ending', directive: 'Focus on the ending — does the last paragraph land, or is it drifting into wrap-up mode?' },
  { key: 'cut', label: 'Where to cut', directive: 'Focus on what to cut — where is the essay padded, redundant, or slowing down?' },
  { key: 'weakest', label: 'Weakest paragraph', directive: 'Focus on which paragraph is the weakest and why — quote from it and explain what\'s not landing.' },
  { key: 'showing', label: 'Showing vs. telling', directive: 'Focus on show-don\'t-tell — where is the essay telling the reader something instead of putting them in the moment?' },
];

function FocusChips({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const selectedPreset = FOCUS_PRESETS.find((p) => p.directive === value)?.key ?? null;
  const usingCustom = value !== null && !selectedPreset;

  return (
    <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid rgba(232,221,201,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span
          className="font-body"
          style={{
            fontSize: '10.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'rgba(232,221,201,0.45)',
            fontWeight: 600,
          }}
        >
          Focus
        </span>
        {FOCUS_PRESETS.map((p) => {
          const active = selectedPreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange(active ? null : p.directive);
                setCustomOpen(false);
              }}
              className="font-body"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '999px',
                border: `1px solid ${active ? '#C9A977' : 'rgba(232,221,201,0.18)'}`,
                background: active ? 'rgba(201,169,119,0.14)' : 'transparent',
                color: active ? '#C9A977' : 'rgba(232,221,201,0.68)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setCustomOpen((v) => !v);
            if (customOpen && usingCustom) onChange(null);
          }}
          className="font-body"
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '999px',
            border: `1px solid ${usingCustom || customOpen ? '#C9A977' : 'rgba(232,221,201,0.18)'}`,
            background: usingCustom ? 'rgba(201,169,119,0.14)' : 'transparent',
            color: usingCustom || customOpen ? '#C9A977' : 'rgba(232,221,201,0.68)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
        >
          {usingCustom ? 'Custom ✓' : 'Custom…'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); setCustomOpen(false); setCustomText(''); }}
            className="font-body"
            style={{
              fontSize: '11px',
              color: 'rgba(232,221,201,0.45)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Clear
          </button>
        )}
      </div>
      {customOpen && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={customText}
            placeholder="What do you want the guidance to zero in on?"
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customText.trim()) {
                onChange(customText.trim());
              }
            }}
            style={{
              flex: 1,
              minWidth: '260px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(201,169,119,0.2)',
              color: '#E8DDC9',
              padding: '8px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            disabled={!customText.trim()}
            onClick={() => onChange(customText.trim())}
            className="font-body"
            style={{
              fontSize: '11px',
              padding: '8px 14px',
              borderRadius: '2px',
              border: `1px solid ${customText.trim() ? '#C9A977' : 'rgba(232,221,201,0.18)'}`,
              background: customText.trim() ? '#C9A977' : 'transparent',
              color: customText.trim() ? '#0B1320' : 'rgba(232,221,201,0.45)',
              cursor: customText.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Set focus
          </button>
        </div>
      )}
      {value && (
        <p
          className="font-body"
          style={{
            marginTop: '10px',
            fontSize: '11.5px',
            fontStyle: 'italic',
            color: 'rgba(232,221,201,0.68)',
            lineHeight: 1.5,
          }}
        >
          Guidance will zero in on: {selectedPreset ? FOCUS_PRESETS.find((p) => p.key === selectedPreset)?.label.toLowerCase() : `"${value}"`}
        </p>
      )}
    </div>
  );
}

function AutosaveIndicator({
  status,
  lastSavedAt,
  now,
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: number | null;
  now: number;
}) {
  let label = '';
  let color = 'rgba(232,221,201,0.45)';
  if (status === 'saving') {
    label = 'Saving…';
    color = 'rgba(232,221,201,0.68)';
  } else if (status === 'error') {
    label = 'Couldn’t save — retry on next edit';
    color = '#A35A6A';
  } else if (status === 'saved' && lastSavedAt) {
    const secs = Math.max(0, Math.round((now - lastSavedAt) / 1000));
    if (secs < 5) {
      label = 'Saved';
      color = '#8FB89A';
    } else if (secs < 60) {
      label = `Saved ${secs}s ago`;
    } else if (secs < 3600) {
      label = `Saved ${Math.floor(secs / 60)}m ago`;
    } else {
      label = `Saved ${Math.floor(secs / 3600)}h ago`;
    }
  }
  if (!label) return null;
  return (
    <span
      className="font-body text-sm"
      style={{
        color,
        fontSize: '12px',
        fontStyle: status === 'error' ? 'normal' : 'italic',
        transition: 'color 0.3s',
      }}
    >
      {label}
    </span>
  );
}