import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUser, getAdminClient } from '@/lib/auth';

/**
 * Deletes the authenticated user's account and ALL of their personal data.
 *
 * Required by California's "Eraser Button" law (for users under 18) and
 * more broadly by CCPA / state student-privacy laws. Any user can invoke
 * this on their own data; no one can invoke it on someone else's data
 * because the userId comes from the authenticated session.
 *
 * Order of deletion matters: delete child rows before parents, and delete
 * the auth.users row last via the admin API.
 *
 * Tables we purge:
 *   - user_colleges
 *   - discovery_answers
 *   - strategic_guidance_history
 *   - user_stats
 *   - user_ap_classes
 *   - user_extracurriculars
 *   - user_awards
 *   - user_subscriptions
 *   - essay_invitations (as student OR as invitee)
 *   - essay_permissions (as granted user)
 *   - essay_versions (via essays owner)
 *   - essays
 *   - student_commenters (if applicable)
 *   - auth.users (finally — via admin API)
 *
 * Any table not listed here that references user_id should be added. Grep
 * the SQL files for `user_id uuid references auth.users` to audit.
 */

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthedUser(request);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    // Require an explicit confirmation in the body so this can't be
    // triggered accidentally by a CSRF or a retried-on-refresh form.
    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Missing confirmation. Send { "confirm": "DELETE MY ACCOUNT" } in the body.' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    // Ordered deletions. Some tables cascade via FK ON DELETE CASCADE —
    // those deletions are technically redundant but harmless.
    const perUserTables = [
      'user_colleges',
      'discovery_answers',
      'strategic_guidance_history',
      'user_stats',
      'user_ap_classes',
      'user_extracurriculars',
      'user_awards',
      'user_subscriptions',
    ];

    for (const table of perUserTables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(`[delete-account] Error clearing ${table}:`, error);
        // Continue on best-effort: we still want to try to delete the rest.
      }
    }

    // Essay-related tables. Permissions and invitations may reference the
    // user as either student_id or user_id/invitee depending on the role.
    // Clear both sides defensively.
    const { error: permErr } = await supabase
      .from('essay_permissions')
      .delete()
      .eq('user_id', userId);
    if (permErr) console.error('[delete-account] essay_permissions:', permErr);

    const { error: inv1 } = await supabase
      .from('essay_invitations')
      .delete()
      .eq('student_id', userId);
    if (inv1) console.error('[delete-account] essay_invitations(student):', inv1);

    // Best-effort purge of invitations sent to the user's email (as invitee).
    // We don't always have their auth email here, so we skip gracefully.
    if (auth.email) {
      const { error: inv2 } = await supabase
        .from('essay_invitations')
        .delete()
        .eq('invitee_email', auth.email);
      if (inv2) console.error('[delete-account] essay_invitations(invitee):', inv2);
    }

    // Essays and versions. Versions cascade-delete from essays via FK, but
    // we'll clear versions first to be explicit.
    const { data: essayRows } = await supabase
      .from('essays')
      .select('id')
      .eq('user_id', userId);
    const essayIds = (essayRows ?? []).map((r: any) => r.id).filter(Boolean);

    if (essayIds.length > 0) {
      const { error: verErr } = await supabase
        .from('essay_versions')
        .delete()
        .in('essay_id', essayIds);
      if (verErr) console.error('[delete-account] essay_versions:', verErr);
    }

    const { error: essayErr } = await supabase.from('essays').delete().eq('user_id', userId);
    if (essayErr) console.error('[delete-account] essays:', essayErr);

    // Student commenters table (if present in schema). Best-effort: ignore
    // "relation does not exist" style errors by logging and moving on.
    {
      const { error } = await supabase.from('student_commenters').delete().eq('user_id', userId);
      if (error && !String(error.message).toLowerCase().includes('does not exist')) {
        console.error('[delete-account] student_commenters:', error);
      }
    }

    // Finally, delete the auth.users row itself. Must use admin API —
    // authenticated users cannot delete themselves via the standard client.
    const { error: authDeleteErr } = await supabase.auth.admin.deleteUser(userId);
    if (authDeleteErr) {
      console.error('[delete-account] auth.users deletion failed:', authDeleteErr);
      return NextResponse.json(
        { error: 'Account data was cleared, but the sign-in record could not be removed. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[delete-account] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please contact support.' },
      { status: 500 }
    );
  }
}
