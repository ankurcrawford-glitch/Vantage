'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// NOTE FOR MAINTAINERS: This is a starter Terms of Service drafted by an AI,
// not a lawyer. Before publishing for real users (especially paying customers
// or minors), have a licensed attorney in your jurisdiction review and
// customize this document. In particular, review the sections on:
//   - Dispute resolution / arbitration (state-law specific)
//   - Refund policy (aligned with Stripe and your actual practice)
//   - Limitation of liability caps (jurisdiction-specific enforceability)
//   - Class-action waiver (enforceability varies by state)
//   - Age requirements vs. state-level student data laws (e.g. SOPIPA)
// Last substantive edit: fill in on publication.

const EFFECTIVE_DATE = 'April 18, 2026';

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '40px' }}>
          Effective: {EFFECTIVE_DATE}
        </p>

        <Section title="1. Agreement to these terms">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of Vantage (the
            &quot;Service&quot;), operated by Vantage (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;).
            By creating an account or using the Service, you agree to these Terms and our{' '}
            <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>. If you do not
            agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. Who can use Vantage">
          <p>
            You must be at least 13 years old to create an account. If you are under 18, you
            must review these Terms and our Privacy Policy with a parent or guardian before
            using the Service. By creating an account, you confirm you meet these age
            requirements.
          </p>
          <p>
            If you are under 18 and want a paid subscription, a parent or guardian must
            authorize the purchase on your behalf. Payment information entered during
            checkout is treated as provided by an adult with the authority to enter into
            this agreement.
          </p>
          <p>
            We do not knowingly collect personal information from children under 13. If we
            learn we have collected such information, we will delete it. If you believe a
            child under 13 has provided us information, contact us at{' '}
            <span style={{ color: '#D4AF37' }}>privacy@my-vantage.app</span>.
          </p>
        </Section>

        <Section title="3. Your account">
          <p>
            You are responsible for keeping your login credentials secure and for all
            activity under your account. Do not share your account with others, including
            family members who want to use the Service for their own applications — each
            user needs their own account.
          </p>
          <p>
            Notify us immediately at{' '}
            <span style={{ color: '#D4AF37' }}>support@my-vantage.app</span> if you suspect
            unauthorized access.
          </p>
        </Section>

        <Section title="4. What Vantage does (and doesn't do)">
          <p>
            Vantage helps students develop college application essays through AI-generated
            feedback, brainstorming support, and holistic application review. The feedback
            is automated and advisory. It is <strong>not</strong>:
          </p>
          <ul style={ulStyle}>
            <li>A guarantee, prediction, or endorsement of college admission</li>
            <li>A substitute for a school counselor, teacher, or admissions professional</li>
            <li>Legal, financial, medical, or mental-health advice</li>
            <li>A ghostwriting service — the AI guides your thinking but does not write
              your essays for you, and submitting AI-generated text as your own work may
              violate your target college&apos;s academic integrity policies
            </li>
          </ul>
          <p>
            Always use your own judgment, and consult your school counselor or the
            admissions office at your target schools when you need authoritative guidance.
          </p>
        </Section>

        <Section title="5. Ownership of content">
          <p>
            <strong>Your content is yours.</strong> The essays, Insight Question answers,
            profile information, and other content you write in Vantage remain your
            intellectual property. By using the Service, you grant us a limited license to
            store, process, and display your content to you — and to transmit it to our AI
            subprocessors — solely to provide the Service to you.
          </p>
          <p>
            We do not use your essays or other content to train AI models. Our AI
            subprocessor (Google Gemini) processes your content on a per-request basis and
            does not retain it for training by default under its enterprise API terms.
          </p>
          <p>
            <strong>Our platform is ours.</strong> The Service itself — software, AI
            system prompts, user interface, feedback methodology, branding, and trademarks —
            is the exclusive property of Vantage and is protected by copyright, trademark,
            and other laws. Nothing in these Terms transfers ownership of the Service to you.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>You agree not to:</p>
          <ul style={ulStyle}>
            <li>Attempt to reverse-engineer, extract, copy, or reproduce the AI system
              prompts, feedback logic, or underlying software</li>
            <li>Use the Service or its output to train another AI model or build a
              competing product</li>
            <li>Scrape, bulk-download, or automate requests beyond personal use</li>
            <li>Share your account, redistribute AI feedback to non-Vantage users, or use
              one account for multiple students</li>
            <li>Submit content that is illegal, defamatory, or infringes others&apos; rights</li>
            <li>Attempt to bypass authentication, rate limits, usage caps, or any other
              technical controls</li>
            <li>Use the Service to harass, impersonate, or harm another person</li>
          </ul>
          <p>
            Violation of this section may result in immediate termination of your account
            with no refund.
          </p>
        </Section>

        <Section title="7. Subscriptions, usage limits, and billing">
          <p>
            Vantage offers a free tier with monthly usage limits on AI features (per-user
            budget caps on AI feedback calls; specific limits may change over time). When
            you reach your monthly limit, AI features pause until the next calendar month
            or until you upgrade.
          </p>
          <p>
            Paid subscriptions are billed through Stripe. By subscribing, you authorize
            recurring charges to your chosen payment method. If you are under 18, a parent
            or guardian must authorize the purchase.
          </p>
          <p>
            You may cancel at any time from your account settings. Cancellation takes
            effect at the end of the current billing period; we do not provide prorated
            refunds for partial periods except where required by law.
          </p>
          <p>
            We reserve the right to change pricing with at least 30 days&apos; notice to
            current subscribers.
          </p>
        </Section>

        <Section title="8. Third-party services">
          <p>
            We rely on the following subprocessors to operate the Service. Each has its
            own terms and privacy policies:
          </p>
          <ul style={ulStyle}>
            <li><strong>Supabase</strong> — database and authentication</li>
            <li><strong>Google Gemini API</strong> — AI feedback generation</li>
            <li><strong>Vercel</strong> — web hosting and serverless functions</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>Resend</strong> — transactional email</li>
            <li><strong>Upstash</strong> — rate limiting and usage tracking</li>
          </ul>
          <p>
            See our <Link href="/privacy" style={linkStyle}>Privacy Policy</Link> for
            details on what data each subprocessor receives.
          </p>
        </Section>

        <Section title="9. Account termination">
          <p>
            You may delete your account at any time from the{' '}
            <Link href="/profile" style={linkStyle}>Profile</Link> page. Deletion is
            permanent and removes your essays, essay versions, Insight Question answers,
            college list, activities, awards, AI guidance history, and subscription record.
            This action cannot be undone.
          </p>
          <p>
            We may terminate your account, with or without notice, if you violate these
            Terms, abuse the Service, attempt fraud, or engage in activity that damages
            the Service or other users.
          </p>
        </Section>

        <Section title="10. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT
            WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not warrant that the Service
            will be uninterrupted, error-free, or secure, that AI feedback will be accurate
            or suitable for your purposes, or that your use of the Service will result in
            any particular college admissions outcome.
          </p>
          <p>
            To the maximum extent permitted by law, Vantage disclaims all implied
            warranties including merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </Section>

        <Section title="11. Limitation of liability">
          <p>
            To the maximum extent permitted by law, Vantage&apos;s total liability to you
            for any claims arising out of or related to the Service is limited to the
            greater of (a) the amount you paid us in the 12 months before the claim or
            (b) US $100.
          </p>
          <p>
            We are not liable for indirect, incidental, consequential, special, or
            punitive damages — including lost admissions decisions, lost scholarships,
            emotional distress, or reputational harm — even if we have been advised of
            the possibility of such damages.
          </p>
          <p>
            Some jurisdictions do not allow these limitations; in those jurisdictions,
            our liability is limited to the smallest amount permitted by law.
          </p>
        </Section>

        <Section title="12. Indemnification">
          <p>
            You agree to indemnify and hold Vantage harmless from claims, losses, and
            expenses arising out of (a) your content, (b) your violation of these Terms,
            or (c) your violation of any third party&apos;s rights.
          </p>
        </Section>

        <Section title="13. Changes to these Terms">
          <p>
            We may update these Terms from time to time. When we do, we will update the
            &quot;Effective&quot; date above and, for material changes, provide notice
            through the Service or by email. Continued use of the Service after the
            effective date of updated Terms constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="14. Governing law and disputes">
          <p>
            These Terms are governed by the laws of the State of{' '}
            <em style={{ color: 'rgba(255,255,255,0.5)' }}>[specify state — consult lawyer]</em>,
            without regard to conflict-of-laws principles. Any dispute that cannot be
            resolved informally will be brought in the state or federal courts located in{' '}
            <em style={{ color: 'rgba(255,255,255,0.5)' }}>[specify venue]</em>, and you
            consent to that jurisdiction and venue.
          </p>
          <p>
            <em style={{ color: 'rgba(255,255,255,0.5)' }}>
              [Reserved for arbitration and class-action-waiver clauses if applicable
              — consult your attorney.]
            </em>
          </p>
        </Section>

        <Section title="15. Contact">
          <p>
            Questions about these Terms? Reach us at{' '}
            <span style={{ color: '#D4AF37' }}>support@my-vantage.app</span>. For privacy
            requests specifically, see our{' '}
            <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>.
          </p>
        </Section>

        <div style={{ marginTop: '48px', padding: '16px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '4px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.6' }}>
            <strong style={{ color: '#D4AF37' }}>Note:</strong> This document is a
            starter template and not a substitute for legal advice. Vantage has had it
            reviewed by a qualified attorney before publication. If you notice anything
            unclear, please contact us.
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
