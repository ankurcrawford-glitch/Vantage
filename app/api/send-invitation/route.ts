import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { invitationId, inviteeEmail, inviteeName, role, essayInfo, invitationToken, studentName } = await request.json();

    if (!inviteeEmail || !invitationToken) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-vantage.app';
    const invitationLink = `${baseUrl}/invitations/${invitationToken}`;

    const roleLabel = role === 'parent' ? 'Parent' : role === 'counselor' ? 'Counselor' : role === 'mentor' ? 'Mentor' : 'Reviewer';
    const collegeName = essayInfo?.collegeName || 'Common Application';
    const senderName = studentName || 'A student';

    const { data, error } = await resend.emails.send({
      from: 'Vantage <noreply@my-vantage.app>',
      to: [inviteeEmail],
      subject: `${senderName} invited you to review their essay on Vantage`,
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
                    <a href="${invitationLink}" style="display: inline-block; background-color: #D4AF37; color: #0B1623; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 2px;">
                      Review Essay
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: rgba(255,255,255,0.4); font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
                Or copy this link: <a href="${invitationLink}" style="color: #D4AF37; text-decoration: underline; word-break: break-all;">${invitationLink}</a>
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
      return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return Response.json({ success: true, emailId: data?.id });
  } catch (error: any) {
    console.error('Send invitation email error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}