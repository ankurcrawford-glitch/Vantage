'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';

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
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const promptId = params.promptId as string;

  const [prompt, setPrompt] = useState<any>(null);
  const [essayId, setEssayId] = useState<string | null>(null);
  const [versions, setVersions] = useState<EssayVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<EssayVersion | null>(null);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [showThinkingPartner, setShowThinkingPartner] = useState(false);
  const [thinkingPartnerResponse, setThinkingPartnerResponse] = useState<string | null>(null);
  const [loadingThinkingPartner, setLoadingThinkingPartner] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [showAllInvitations, setShowAllInvitations] = useState(false);

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
    setWordCount(countWords(content));
  }, [content]);

  // Accurate word count function
  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(word => {
      const cleaned = word.replace(/[^\w\s-]/g, '');
      return cleaned.length > 0;
    });
    return words.length;
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setCurrentUser(user);
    }
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Subscription required for essay writing
      let subscribed = false;
      try {
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        subscribed = !!sub;
        setHasSubscription(subscribed);
      } catch {
        setHasSubscription(false);
      }
      // TODO: remove bypass when subscription/payments are live
      subscribed = true;
      setHasSubscription(true);

      // Find the prompt (slug like common-app-1)
      const selectedPrompt = COMMON_APP_PROMPTS.find(p => p.id === promptId);
      if (selectedPrompt) {
        setPrompt(selectedPrompt);
      }

      if (!subscribed) {
        setLoading(false);
        return;
      }

      // college_prompt_id in DB is UUID; get prompt row for Common App by sort_order
      const promptNum = (selectedPrompt?.number ?? parseInt(promptId.replace('common-app-', ''), 10)) || 1;
      const { data: promptRow } = await supabase
        .from('college_prompts')
        .select('id')
        .eq('college_id', COMMON_APP_COLLEGE_ID)
        .eq('sort_order', promptNum)
        .maybeSingle();
      const collegePromptUuid = promptRow?.id ?? null;

      // Check if essay exists (college_prompt_id must be UUID)
      let essayData: { id: string; user_id: string } | null = null;
      if (collegePromptUuid) {
        const res = await supabase
          .from('essays')
          .select('id, user_id')
          .eq('user_id', user.id)
          .eq('college_prompt_id', collegePromptUuid)
          .maybeSingle();
        essayData = res.data;
      }

      if (essayData) {
        setEssayId(essayData.id);
        setIsOwner(essayData.user_id === user.id);
        setHasPermission(true);
        loadVersions(essayData.id);
      } else {
        // No essay yet – current user can create one
        setIsOwner(true);
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      // Always allow editing for logged-in user (fixes disabled editor in production)
      setIsOwner(true);
      setHasPermission(true);
    }
  };

  const loadVersions = async (essayIdParam: string) => {
    try {
      const { data: versionsData } = await supabase
        .from('essay_versions')
        .select('*')
        .eq('essay_id', essayIdParam)
        .order('version_number', { ascending: false });

      if (versionsData) {
        setVersions(versionsData);
        const current = versionsData.find(v => v.is_current) || versionsData[0];
        if (current) {
          setCurrentVersion(current);
          setContent(current.content);
        }
      }
    } catch (error) {
      console.error('Error loading versions:', error);
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
        alert('Save your essay first (click "Save New Version" above), then you can invite commenters.');
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

  const loadThinkingPartner = async () => {
    if (!currentUser || !promptId) return;

    setLoadingThinkingPartner(true);
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
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to load guidance');
      }

      const data = await response.json();
      setThinkingPartnerResponse(data.response);
      setShowThinkingPartner(true);
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

  const saveNewVersion = async () => {
    if (!content.trim()) {
      alert('Please write something before saving.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      let currentEssayId = essayId;

      // Create essay if it doesn't exist
      if (!currentEssayId) {
        // college_prompts.id is UUID; look up by college_id + sort_order for Common App
        const promptNumber = (prompt?.number ?? parseInt(promptId.replace('common-app-', ''), 10)) || 1;
        const { data: promptData } = await supabase
          .from('college_prompts')
          .select('id')
          .eq('college_id', COMMON_APP_COLLEGE_ID)
          .eq('sort_order', promptNumber)
          .maybeSingle();

        let promptDbId: string | null = promptData?.id ?? null;

        if (!promptDbId) {
          // Ensure "Common App" college exists (college_prompts.college_id FK references colleges.id)
          await supabase
            .from('colleges')
            .upsert(
              { id: COMMON_APP_COLLEGE_ID, name: 'Common Application' },
              { onConflict: 'id' }
            );

          const { data: newPrompt, error: promptError } = await supabase
            .from('college_prompts')
            .insert({
              college_id: COMMON_APP_COLLEGE_ID,
              prompt_text: prompt?.prompt || '',
              word_limit: prompt?.word_limit ?? 650,
              year: 2025,
              sort_order: promptNumber,
            })
            .select('id')
            .single();

          if (promptError && !promptError.message.includes('duplicate')) {
            throw promptError;
          }
          promptDbId = newPrompt?.id ?? null;
        }

        if (!promptDbId) {
          throw new Error('Could not find or create Common App prompt. Check college_prompts table.');
        }

        // Create essay (college_prompt_id must be UUID)
        const { data: newEssay, error: essayError } = await supabase
          .from('essays')
          .insert({
            user_id: user.id,
            college_prompt_id: promptDbId,
          })
          .select()
          .single();

        if (essayError) throw essayError;
        currentEssayId = newEssay.id;
        setEssayId(currentEssayId);
        setIsOwner(true);
        setHasPermission(true);
      }

      // Get next version number
      const nextVersion = versions.length > 0 
        ? Math.max(...versions.map(v => v.version_number)) + 1 
        : 1;

      // Mark all previous versions as not current
      if (versions.length > 0) {
        await supabase
          .from('essay_versions')
          .update({ is_current: false })
          .eq('essay_id', currentEssayId);
      }

      // Create new version
      const { data: newVersion, error: versionError } = await supabase
        .from('essay_versions')
        .insert({
          essay_id: currentEssayId,
          version_number: nextVersion,
          content: content.trim(),
          word_count: wordCount,
          is_current: true,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Reload versions
      await loadVersions(currentEssayId);

      setSaveSuccessMessage('Saved');
      setTimeout(() => setSaveSuccessMessage(null), 2500);
    } catch (error: any) {
      console.error('Error saving version:', error);
      const msg = error?.message || error?.error_description || 'Unknown error';
      const hint = msg.toLowerCase().includes('policy') || msg.toLowerCase().includes('rls') || msg.toLowerCase().includes('row-level security')
        ? '\n\nCheck Supabase: Table Editor → essays & essay_versions → enable RLS and add INSERT policy for auth.uid() = user_id.'
        : '';
      alert('Error saving essay: ' + msg + hint);
    } finally {
      setSaving(false);
    }
  };

  const switchVersion = (version: EssayVersion) => {
    setCurrentVersion(version);
    setContent(version.content);
  };

  const deleteVersion = async (e: React.MouseEvent, version: EssayVersion) => {
    e.stopPropagation();
    if (!essayId || !isOwner || deletingVersionId) return;
    if (!confirm(`Delete Version ${version.version_number}? This cannot be undone.`)) return;
    setDeletingVersionId(version.id);
    try {
      const { error } = await supabase.from('essay_versions').delete().eq('id', version.id);
      if (error) throw error;
      const remaining = versions.filter((v) => v.id !== version.id);
      if (version.is_current && remaining.length > 0) {
        await supabase.from('essay_versions').update({ is_current: true }).eq('id', remaining[0].id);
      }
      await loadVersions(essayId);
      if (version.is_current && remaining.length > 0) {
        setCurrentVersion(remaining[0]);
        setContent(remaining[0].content);
      } else if (version.is_current && remaining.length === 0) {
        setCurrentVersion(null);
        setContent('');
        setVersions([]);
      }
    } catch (err: any) {
      console.error('Error deleting version:', err);
      alert('Could not delete version: ' + (err?.message || 'Unknown error'));
    } finally {
      setDeletingVersionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>Loading...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1623' }}>
        <div style={{ color: '#D4AF37' }}>Prompt not found</div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-screen" style={{ background: '#0B1623' }}>
        <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/common-app" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
              <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
              <Link href="/colleges" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Portfolio</Link>
              <Link href="/personal-statement" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Essays</Link>
              <Link href="/profile" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Profile</Link>
              <Link href="/discovery" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Insight Questions</Link>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>Logout</button>
            </div>
          </div>
        </nav>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
          <Link href="/common-app" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}>← Back to Common App Prompts</Link>
          <div style={{ marginTop: '24px' }}>
            <Card>
              <h1 className="font-heading text-3xl mb-4" style={{ color: 'white' }}>Essay writing requires a subscription</h1>
            <p className="font-body text-lg mb-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
              To write, save, and use Strategic Intelligence for Common App essays (Prompt {prompt.number}), subscribe to VANTAGE.
            </p>
            <Link href="/dashboard">
              <button style={{ background: '#D4AF37', color: '#0B1623', padding: '12px 24px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '2px', cursor: 'pointer' }}>Go to Dashboard</button>
            </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = isOwner;
  const canComment = hasPermission || isOwner;

  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/common-app" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/dashboard' ? 600 : 400 }}>Dashboard</Link>
            <Link href="/personal-statement" style={{ color: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays') || pathname.startsWith('/common-app')) ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: (pathname.startsWith('/personal-statement') || pathname.startsWith('/essays') || pathname.startsWith('/common-app')) ? 600 : 400 }}>Essays</Link>
            <Link href="/colleges" style={{ color: pathname.startsWith('/colleges') ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname.startsWith('/colleges') ? 600 : 400 }}>Portfolio</Link>
            <Link href="/profile" style={{ color: pathname === '/profile' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/profile' ? 600 : 400 }}>Profile</Link>
            <Link href="/discovery" style={{ color: pathname === '/discovery' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: pathname === '/discovery' ? 600 : 400 }}>Insight Questions</Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer', padding: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#F3E5AB'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/common-app"
            style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '16px' }}
          >
            ← Back to Common App Prompts
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="font-heading text-4xl mb-2" style={{ color: 'white' }}>Common Application Essay</h1>
              <h2 className="font-heading text-xl mb-4" style={{ color: '#D4AF37' }}>Prompt {prompt.number}</h2>
            </div>
            {!isOwner && hasPermission && (
              <div style={{
                padding: '8px 16px',
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: '4px',
              }}>
                <p className="font-body text-sm" style={{ color: '#D4AF37' }}>
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
                <p className="font-body" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.6', marginBottom: '12px' }}>
                  {prompt.prompt}
                </p>
                {prompt.word_limit && (
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Word Limit: {prompt.word_limit} words
                  </p>
                )}
              </div>
            </Card>

            <div style={{ marginTop: '32px' }}>
              <Card>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="font-heading text-lg" style={{ color: '#D4AF37' }}>Your Essay</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {wordCount} {prompt.word_limit ? `/ ${prompt.word_limit}` : ''} words
                    </span>
                    {prompt.word_limit && wordCount > prompt.word_limit && (
                      <span className="font-body text-sm" style={{ color: '#F87171' }}>Over limit</span>
                    )}
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your essay here..."
                  disabled={!canEdit}
                  style={{
                    width: '100%',
                    minHeight: '400px',
                    background: canEdit ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    color: canEdit ? 'white' : 'rgba(255,255,255,0.7)',
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
                    if (canEdit) e.target.style.borderColor = 'rgba(212,175,55,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.2)';
                  }}
                />
                {canEdit && (
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={saveNewVersion}
                      disabled={saving}
                      style={{
                        background: saving ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                        color: '#0B1623',
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
                      {saving ? 'Saving...' : 'Save New Version'}
                    </button>
                    {saveSuccessMessage && (
                      <span className="font-body text-sm" style={{ color: '#4ADE80' }}>
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
                  <h3 className="font-heading text-lg mb-4" style={{ color: '#D4AF37' }}>Comments</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {comments.map((comment) => (
                      <div key={comment.id} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', borderLeft: '3px solid #D4AF37' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <p className="font-body font-semibold text-sm" style={{ color: '#D4AF37', marginBottom: '4px' }}>
                              Comment from {comment.counselor_name}
                            </p>
                            <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <span className="font-body text-xs" style={{
                            color: comment.comment_type === 'praise' ? '#10B981' : comment.comment_type === 'concern' ? '#F87171' : '#D4AF37',
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

            {/* Add Comment Form */}
            {currentVersion && canComment && (
              <div style={{ marginTop: '32px' }}>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="font-heading text-lg" style={{ color: '#D4AF37' }}>Add Comment</h3>
                    <button
                      onClick={() => setShowCommentForm(!showCommentForm)}
                      style={{
                        background: 'transparent',
                        color: '#D4AF37',
                        border: '1px solid rgba(212,175,55,0.5)',
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
                          border: '1px solid rgba(212,175,55,0.2)',
                          color: 'white',
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
                          border: '1px solid rgba(212,175,55,0.2)',
                          color: 'white',
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
                          background: savingComment ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                          color: '#0B1623',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 className="font-heading text-lg" style={{ color: '#D4AF37' }}>Strategic Intelligence</h3>
                    <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                      {content.trim() ? 'Get strategic guidance + feedback on your essay' : 'Get strategic guidance on how to approach this prompt'}
                    </p>
                  </div>
                  <button
                    onClick={loadThinkingPartner}
                    disabled={loadingThinkingPartner}
                    style={{
                      background: loadingThinkingPartner ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                      color: '#0B1623',
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
                    {loadingThinkingPartner ? 'Analyzing...' : content.trim() ? 'Get Feedback' : 'Get Strategic Guidance'}
                  </button>
                </div>

                {thinkingPartnerResponse && (
                  <div style={{
                    marginTop: '16px',
                    padding: '20px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '4px',
                    borderLeft: '3px solid #D4AF37',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 className="font-heading text-md" style={{ color: '#D4AF37' }}>
                        {content.trim() ? 'Strategic Guidance & Feedback' : 'Strategic Guidance'}
                      </h4>
                      <button
                        onClick={() => { setShowThinkingPartner(false); setThinkingPartnerResponse(null); }}
                        style={{
                          background: 'transparent',
                          color: 'rgba(255,255,255,0.5)',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                      {thinkingPartnerResponse}
                    </div>
                  </div>
                )}

                {showThinkingPartner && !thinkingPartnerResponse && !loadingThinkingPartner && (
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginTop: '16px' }}>
                    Click the button above to get strategic guidance tailored to your entire application.
                  </p>
                )}
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <h3 className="font-heading text-lg mb-4" style={{ color: '#D4AF37' }}>Versions</h3>
              {versions.length === 0 ? (
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  No versions saved yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      style={{
                        padding: '12px',
                        background: version.is_current ? 'rgba(212,175,55,0.2)' : 'transparent',
                        border: version.is_current ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.1)',
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
                        <span style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: 600 }}>
                          Version {version.version_number}
                        </span>
                        <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '4px' }}>
                          {version.word_count} words · {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {version.is_current && (
                          <span className="font-body text-xs" style={{ color: '#D4AF37' }}>Current</span>
                        )}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={(e) => deleteVersion(e, version)}
                            disabled={!!deletingVersionId}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.25)',
                              color: 'rgba(255,255,255,0.8)',
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
                    <h3 className="font-heading text-lg" style={{ color: '#D4AF37' }}>Invite Commenters</h3>
                    <button
                      onClick={() => setShowInviteForm(!showInviteForm)}
                      style={{
                        background: 'transparent',
                        color: '#D4AF37',
                        border: '1px solid rgba(212,175,55,0.5)',
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
                          border: '1px solid rgba(212,175,55,0.2)',
                          color: 'white',
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
                          border: '1px solid rgba(212,175,55,0.2)',
                          color: 'white',
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
                          border: '1px solid rgba(212,175,55,0.2)',
                          color: 'white',
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
                          background: sendingInvitation ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                          color: '#0B1623',
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
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '4px' }}>
                          {emailSent && (
                            <p className="font-body text-xs" style={{ color: '#10B981', marginBottom: '8px', fontWeight: 600 }}>
                              Email sent successfully
                            </p>
                          )}
                          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
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
                                border: '1px solid rgba(212,175,55,0.2)',
                                color: 'white',
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
                                background: linkCopied ? '#10B981' : '#D4AF37',
                                color: linkCopied ? 'white' : '#0B1623',
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
                        <p className="font-body text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Invited Reviewers:
                        </p>
                        {unique.map((inv) => (
                          <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            <p className="font-body text-xs" style={{ color: 'white', margin: 0 }}>
                              {inv.invitee_name || inv.invitee_email}
                            </p>
                            <span className="font-body text-xs" style={{ color: inv.status === 'accepted' ? '#10B981' : 'rgba(255,255,255,0.4)' }}>
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
