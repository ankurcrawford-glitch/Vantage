'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// NOTE FOR MAINTAINERS: This is a starter Privacy Policy drafted by an AI,
// not a lawyer. Have a licensed attorney review before publishing, especially
// because Vantage handles personal content from minors. Legal frameworks to
// verify coverage for:
//   - COPPA (under-13 users — we block at signup)
//   - CCPA / CPRA (California users — deletion rights implemented)
//   - California "Eraser Button" law (under-18 deletion — implemented)
//   - GDPR / GDPR-K (EU users, if any)
//   - SOPIPA and other state student-data laws
//   - FERPA (only if partnering with schools)
//   - State data breach notification laws
// Last substantive edit: fill in on publication.

const EFFECTIVE_DATE = 'April 18, 2026';

export default function PrivacyPage() {
  const pathname = usePathname();
  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#D4AF37' }}>.</span>
          </Link>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/privacy" style={{ color: pathname === '/privacy' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Privacy</Link>
            <Link href="/terms" style={{ color: pathname === '/terms' ? '#F3E5AB' : 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>Terms</Link>
          </div>
        </div>
      </nav>

      <article style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 32px', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-body)', lineHeight: '1.7' }}>
        <h1 className="font-heading" style={{ color: 'white', fontSize: '42px', marginBottom: '12px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '40px' }}>
          Effective: {EFFECTIVE_DATE}
        </p>

        <Section title="Quick summary">
          <ul style={ulStyle}>
            <li>We collect what you give us (essay drafts, profile, Insight Question
              answers) plus basic usage data to run the Service.</li>
            <li>We send your essays to Google Gemini to generate AI feedback. Gemini does
              not use your data for training under its enterprise API terms.</li>
            <li>We do not sell your data to advertisers, data brokers, or third parties.</li>
            <li>You can delete your account and all its data at any time from the{' '}
              <Link href="/profile" style={linkStyle}>Profile</Link> page.</li>
            <li>We take reasonable security steps (encryption in transit, row-level
              database access controls, authenticated APIs), but no system is perfectly
              secure.</li>
          </ul>
          <p>Details follow below.</p>
        </Section>

        <Section title="1. What we collect">
          <h3 style={subheadingStyle}>You give us, when you sign up:</h3>
          <ul style={ulStyle}>
            <li>Email address and password (password is hashed; we never see it in plain text)</li>
            <li>Your full name</li>
            <li>Age confirmation (13+) and optional indication of whether you are under 18</li>
          </ul>

          <h3 style={subheadingStyle}>You give us, when you use the Service:</h3>
          <ul style={ulStyle}>
            <li>Academic profile: GPA, SAT/ACT scores, AP classes, extracurriculars, awards</li>
            <li>College list (which schools you&apos;re applying to)</li>
            <li>Essay drafts, revisions, and all content you type into the essay editor</li>
            <li>Insight Question reflections (private brainstorming notes)</li>
            <li>AI guidance history (feedback we&apos;ve generated for you)</li>
            <li>Invitations and comments (if you invite a counselor or parent to review)</li>
          </ul>

          <h3 style={subheadingStyle}>We automatically collect:</h3>
          <ul style={ulStyle}>
            <li>Session information (when you log in, which pages you use, how often)</li>
            <li>Usage metrics (AI feedback request counts, for rate limiting and budgeting)</li>
            <li>Technical data (browser type, IP address, errors) through our hosting
              provider, used for debugging and security</li>
          </ul>

          <h3 style={subheadingStyle}>If you subscribe:</h3>
          <ul style={ulStyle}>
            <li>Payment information is handled by Stripe. We receive a subscription
              status and a Stripe customer ID; we do not store your card number.</li>
          </ul>
        </Section>

        <Section title="2. How we use your information">
          <p>We use your information to:</p>
          <ul style={ulStyle}>
            <li>Provide the Service — store your work, show it back to you, transmit it
              to our AI subprocessor for feedback generation</li>
            <li>Personalize AI feedback by drawing on your profile and Insight Question
              context</li>
            <li>Enforce usage limits, prevent abuse, and detect fraud</li>
            <li>Email you operational notices (subscription receipts, security alerts,
              significant product changes)</li>
            <li>Improve the Service (aggregated, de-identified analytics about which
              features are used; we never use your essays themselves for this)</li>
          </ul>
          <p>
            We do <strong>not</strong> use your essays, Insight Question answers, or
            profile to train AI models — neither our own, nor our subprocessors&apos;. We
            do not sell or rent your data to advertisers or data brokers. We do not use
            your content to generate content shown to other users.
          </p>
        </Section>

        <Section title="3. Who we share it with (subprocessors)">
          <p>
            We rely on trusted third parties to operate the Service. Each processes data
            only on our instructions and has its own privacy commitments:
          </p>
          <ul style={ulStyle}>
            <li><strong>Supabase</strong> (database, auth) — stores all your essays,
              profile data, and authentication records. US-hosted.</li>
            <li><strong>Google Gemini API</strong> — receives your essay content + context
              at the moment of AI feedback generation. Under Google&apos;s enterprise API
              terms, inputs and outputs are not used for training.</li>
            <li><strong>Vercel</strong> (web hosting) — serves the web application and
              handles API requests. Logs technical metadata (IP, request path).</li>
            <li><strong>Stripe</strong> (payments) — processes subscription billing.
              Stores payment card details on their systems; we never see them.</li>
            <li><strong>Resend</strong> (email) — delivers transactional email (invitation
              emails, system notices). Receives recipient email + email body.</li>
            <li><strong>Upstash</strong> (rate limiting, usage tracking) — stores counters
              keyed by your user ID; does not store essay content.</li>
          </ul>
          <p>
            We will only change subprocessors without notice in an emergency. For
            non-emergency changes, we will update this list and, where we think it matters
            to you, notify you by email or through the Service.
          </p>
        </Section>

        <Section title="4. How we protect your information">
          <ul style={ulStyle}>
            <li>All traffic between your browser and our servers is encrypted via HTTPS</li>
            <li>Database rows are protected by row-level security — User A cannot read
              User B&apos;s essays or Insight Question answers even at the database level</li>
            <li>Authentication uses signed session tokens; passwords are hashed (we never
              see them)</li>
            <li>AI feedback calls are rate-limited and bounded by monthly usage caps</li>
            <li>Internal access to user data is restricted and logged</li>
          </ul>
          <p>
            No system is perfectly secure. If we ever discover a breach affecting your
            personal information, we will notify you within the time required by law and
            take appropriate remedial steps.
          </p>
        </Section>

        <Section title="5. How long we keep your information">
          <p>
            We keep your content for as long as your account is active. If you delete
            your account (from the{' '}
            <Link href="/profile" style={linkStyle}>Profile</Link> page), we delete your
            essays, essay versions, Insight Question answers, college list, activities,
            awards, AI guidance history, subscription record, and sign-in record. This is
            immediate and cannot be undone.
          </p>
          <p>
            We may retain minimal records of a deleted account (e.g., email address + a
            deletion timestamp) to comply with legal obligations or fraud prevention. We
            do not retain your essay content, Insight Questions, or profile after deletion.
          </p>
          <p>
            Backup systems may retain deleted data for up to 30 days before they are
            overwritten on their normal cycle.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>Regardless of where you live, you have the right to:</p>
          <ul style={ulStyle}>
            <li><strong>Access</strong> — see what we have about you (much of it is
              visible in the app; you can also email us for a full export)</li>
            <li><strong>Correct</strong> — fix inaccurate information about you</li>
            <li><strong>Delete</strong> — remove your account and all associated data</li>
            <li><strong>Object or restrict</strong> — ask us to stop or limit certain
              processing of your data</li>
          </ul>

          <h3 style={subheadingStyle}>If you are in California</h3>
          <p>
            Under the California Consumer Privacy Act (CCPA/CPRA), you have rights to
            know, delete, correct, and opt out of sale/sharing (we don&apos;t sell or share
            your data, so opt-out is automatic). You also have the right to be free from
            discrimination for exercising these rights.
          </p>
          <p>
            If you are under 18 in California, you have an additional right to request
            removal of content you have posted (the &quot;Eraser Button&quot; law). The
            account deletion option on the Profile page satisfies this; or email us.
          </p>

          <h3 style={subheadingStyle}>How to exercise your rights</h3>
          <p>
            For most requests, use the{' '}
            <Link href="/profile" style={linkStyle}>Profile</Link> page (to edit or
            delete) or email{' '}
            <span style={{ color: '#D4AF37' }}>privacy@my-vantage.app</span>. We will
            respond within 30 days and may need to verify your identity before honoring
            requests about sensitive data.
          </p>
        </Section>

        <Section title="7. Cookies and tracking">
          <p>
            We use cookies that are necessary to operate the Service — primarily to keep
            you logged in. We do not use third-party advertising cookies or cross-site
            tracking cookies.
          </p>
          <p>
            We may use privacy-preserving analytics to count things like total monthly
            active users or which features are used, with no personally identifiable
            information transmitted.
          </p>
        </Section>

        <Section title="8. Users under 18">
          <p>
            Vantage is intended for students aged 13 and older, with a focus on high
            school students preparing for college. We collect the minimum age information
            we need (13+ confirmation) and do not ask for a precise birth date unless
            required for a specific feature.
          </p>
          <p>
            If you are under 18, we encourage you to review this policy and our{' '}
            <Link href="/terms" style={linkStyle}>Terms of Service</Link> with a parent or
            guardian. Paid subscriptions require that a parent or guardian authorize the
            purchase on your behalf.
          </p>
          <p>
            We do not knowingly collect personal information from children under 13. If
            you are a parent and believe your child under 13 has created an account or
            submitted information to us, contact{' '}
            <span style={{ color: '#D4AF37' }}>privacy@my-vantage.app</span> and we will
            delete the account.
          </p>
        </Section>

        <Section title="9. International users">
          <p>
            Vantage is operated from the United States. If you access the Service from
            outside the US, your information will be transferred to and processed in the
            US, where privacy laws may differ from your home country. By using the
            Service, you consent to this transfer.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will
            update the &quot;Effective&quot; date above. For material changes — especially
            changes to what we collect or how we share it — we will notify you through
            the Service or by email before they take effect.
          </p>
        </Section>

        <Section title="11. Contact us">
          <p>
            Questions, concerns, or data requests? Email{' '}
            <span style={{ color: '#D4AF37' }}>privacy@my-vantage.app</span>.
          </p>
        </Section>

        <div style={{ marginTop: '48px', padding: '16px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '4px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.6' }}>
            <strong style={{ color: '#D4AF37' }}>Note:</strong> This document is a
            starter template, not legal advice. Vantage has had it reviewed by a
            qualified attorney before publication. If anything here is unclear or
            inconsistent with our practices, contact us and we will fix it.
          </p>
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 className="font-heading" style={{ color: '#D4AF37', fontSize: '22px', marginBottom: '12px' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

const linkStyle: React.CSSProperties = {
  color: '#D4AF37',
  textDecoration: 'underline',
};

const ulStyle: React.CSSProperties = {
  margin: '12px 0 12px 24px',
  padding: 0,
  listStyleType: 'disc',
};

const subheadingStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.85)',
  fontSize: '16px',
  marginTop: '20px',
  marginBottom: '8px',
  fontFamily: 'var(--font-heading)',
};
