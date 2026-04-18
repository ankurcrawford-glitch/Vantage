import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUser, getAdminClient, escapeHtml } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');

export async function POST(request: NextRequest) {
  try {
    // SECURITY: require an authenticated student. Without this, the route is
    // an open relay for sending emails from noreply@my-vantage.app to arbitrary
    // addresses with attacker-controlled HTML content.
    const auth = await getAuthedUser();
    if (!auth.ok) return auth.response;
    const studentId = auth.userId;

    const body = await request.json().catch(() => ({}));
    const invitationId = typeof body.invitationId === 'string' ? body.invitationId : null;

    if (!invitationId) {
      return NextResponse.json({ error: 'Missing invitationId' }, { status: 400 });
    }

    // SECURITY: fetch the invitation row from the database and verify it
    // belongs to the authenticated student. Never trust body-supplied email,
    // token, role, or college — derive them from the row.
    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const { data: invitation, error: invitationError } = await supabase
      .from('essay_invitations')
      .select(`
        id,
        essay_id,
        student_id,
        invitee_email,
        invitee_name,
        role,
        token,
        essays!inner ( college_prompt_id, college_prompts ( college_id, colleges ( name ) ) )
      `)
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.student_id !== studentId) {
      // Do not leak whether the invitation exists for a different student —
      // return 404 to keep the not-found / not-owned cases indistinguishable.
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Best-effort college name lookup from the joined relation. Fall back to
    // "Common Application" if not resolvable.
    let collegeNameRaw = 'Common Application';
    const essayRel = (invitation as any).essays;
    if (essayRel?.college_prompts?.colleges?.name) {
      collegeNameRaw = essayRel.college_prompts.colleges.name;
    } else if (Array.isArray(essayRel) && essayRel[0]?.college_prompts?.colleges?.name) {
      collegeNameRaw = essayRel[0].college_prompts.colleges.name;
    }

    // Look up the student's display name from user metadata (defense-in-depth
    // against a caller trying to impersonate another student by body name).
    const { data: studentRow } = await supabase
      .from('user_stats')
      .select('full_name')
      .eq('user_id', studentId)
      .single();
    const senderNameRaw = studentRow?.full_name || auth.email || 'A student';

    const inviteeEmailRaw = invitation.invitee_email;
    const inviteeNameRaw = invitation.invitee_name || '';
    const role = invitation.role || 'parent';
    const token = invitation.token;

    // SECURITY: escape every user-supplied value before template interpolation.
    // Template literals do NOT escape — this is a classic email-phishing vector.
    const inviteeName = escapeHtml(inviteeNameRaw);
    const senderName = escapeHtml(senderNameRaw);
    const collegeName = escapeHtml(collegeNameRaw);
    const roleLabel = escapeHtml(
      role === 'parent' ? 'Parent' :
      role === 'counselor' ? 'Counselor' :
      role === 'mentor' ? 'Mentor' : 'Reviewer'
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-vantage.app';
    const invitationLink = `${baseUrl}/invitations/${encodeURIComponent(token)}`;
    const invitationLinkHtml = escapeHtml(invitationLink);

    const { data, error } = await resend.emails.send({
      from: 'Vantage <noreply@my-vantage.app>',
      to: [inviteeEmailRaw],
      subject: `${senderNameRaw} invited you to review their essay on Vantage`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0B1623; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B1623; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <span style="font-size: 28px; font-weight: 700; color: white; letter-spacing: 0.05em;">VANTAGE</span>
              <span style="font-size: 28px; color: #D4AF37;">.</span>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.2); border-radius: 4px; padding: 40px 32px;">

              <!-- Greeting -->
              <p style="color: white; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">
                ${inviteeName ? `Hi ${inviteeName},` : 'Hello,'}
              </p>

              <p style="color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                <strong>${senderName}</strong> has invited you to review their college application essay as a <strong style="color: #D4AF37;">${roleLabel}</strong>.
              </p>

              <!-- Essay Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: rgba(0,0,0,0.3); border-left: 3px solid #D4AF37; padding: 16px 20px; border-radius: 0 4px 4px 0;">
                    <p style="color: #D4AF37; font-size: 13px; font-weight: 600; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.05em;">
                      Essay for
                    </p>
                    <p style="color: white; font-size: 16px; margin: 0;">
                      ${collegeName}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
                You'll be able to read the essay and leave comments with feedback, suggestions, and encouragement. Your perspective is valuable.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${invitationLinkHtml}" style="display: inline-block; background-color: #D4AF37; color: #0B1623; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 2px;">
                      Review Essay
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: rgba(255,255,255,0.4); font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
                Or copy this link: <a href="${invitationLinkHtml}" style="color: #D4AF37; text-decoration: underline; word-break: break-all;">${invitationLinkHtml}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 0;">
                Vantage — Strategic Admissions Intelligence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error: any) {
    console.error('Send invitation email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
