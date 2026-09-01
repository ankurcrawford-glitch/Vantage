import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/Button';

// ─── Vantage — What is Vantage / How it works ────────────────────
// The full explainer: one counselor across four years, the two
// journeys stage by stage, and the thread that connects them.
// Public page, linked from the homepage's "How it works" section.

export const metadata: Metadata = {
  title: 'How Vantage Works — One Counselor, All Four Years',
  description:
    'Vantage is one counselor that knows you from 9th grade through your applications. Conversations become your story; reflections become essay ideas; four years become your application.',
};

const eyebrow: React.CSSProperties = {
  color: '#C9A977',
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
};

const pill: React.CSSProperties = {
  fontSize: '12px',
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  fontWeight: 600,
  color: 'rgba(232,221,201,0.68)',
  border: '1px solid rgba(201,169,119,0.35)',
  borderRadius: '999px',
  padding: '6px 14px',
  whiteSpace: 'nowrap',
};

function Stage({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <span
        className="font-heading"
        style={{
          color: '#C9A977',
          fontSize: '15px',
          fontWeight: 600,
          border: '1px solid rgba(201,169,119,0.4)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      <div>
        <h3 className="font-heading text-xl font-semibold mb-2" style={{ color: '#E8DDC9' }}>
          {title}
        </h3>
        <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.68)', fontSize: '15px' }}>
          {children}
        </p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div style={{ background: '#0B1320', minHeight: '100vh' }}>
      {/* Hero */}
      <section className="px-6 sm:px-8" style={{ paddingTop: '96px', paddingBottom: '64px' }}>
        <div className="text-center" style={{ maxWidth: '44rem', margin: '0 auto' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="font-heading text-2xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
            <span className="text-2xl" style={{ color: '#C9A977' }}>.</span>
          </Link>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold mt-10 mb-6" style={{ color: '#E8DDC9', lineHeight: 1.15 }}>
            One counselor, all four years.
          </h1>
          <p className="font-body font-light text-lg leading-relaxed" style={{ color: 'rgba(232,221,201,0.68)' }}>
            The best college counselor isn&apos;t the one you meet senior year. It&apos;s the
            one who has known you since 9th grade — who remembers the small stuff that shaped
            how you see the world and how you express yourself. That&apos;s what Vantage is.
          </p>
        </div>
      </section>

      {/* The Foundations years */}
      <section className="px-6 sm:px-8" style={{ background: '#0D1626', paddingTop: '72px', paddingBottom: '72px' }}>
        <div style={{ maxWidth: '44rem', margin: '0 auto' }}>
          <p className="font-body mb-3" style={eyebrow}>Grades 9–11 · Vantage Foundations</p>
          <h2 className="font-heading text-3xl font-semibold mb-4" style={{ color: '#E8DDC9' }}>
            It starts with a conversation
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px 0', margin: '20px 0 36px' }}>
            {['Conversation', 'Story', 'Activities', 'Roadmap', 'Spark'].map((s, i) => (
              <span key={s} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span aria-hidden style={{ width: 'clamp(14px, 3vw, 32px)', height: '1px', background: 'rgba(201,169,119,0.4)', margin: '0 10px' }} />}
                <span className="font-body" style={pill}>{s}</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Stage n="1" title="Conversation">
              You talk with your counselor about real life — your dream school, what you love,
              what you do after school. No forms, no wrong answers. Everything else on this page
              builds itself from what you share.
            </Stage>
            <Stage n="2" title="Story">
              Your counselor keeps living notes on who you are — and a narrative that sharpens
              every time you talk. You can read it anytime: it&apos;s you, written down.
            </Stage>
            <Stage n="3" title="Activities">
              Commitments are tracked over years, with depth and direction — because a thread
              you&apos;ve pulled since 9th grade says more than a long list of titles.
            </Stage>
            <Stage n="4" title="Roadmap">
              The right moves for your grade, checked off as you go — courses, tests,
              opportunities — without turning high school into an admissions calculation.
            </Stage>
            <Stage n="5" title="Spark">
              Once a month, one personal question — never &quot;college-y.&quot; Five minutes of
              honest writing, banked. The month you changed your mind. The thing you fixed.
              The moment you never want to forget.
            </Stage>
          </div>
        </div>
      </section>

      {/* The thread */}
      <section className="px-6 sm:px-8" style={{ paddingTop: '72px', paddingBottom: '72px' }}>
        <div style={{ maxWidth: '44rem', margin: '0 auto' }}>
          <div
            style={{
              borderLeft: '3px solid #C9A977',
              background: 'rgba(201,169,119,0.07)',
              padding: '28px 32px',
            }}
          >
            <p className="font-body mb-3" style={eyebrow}>The thread</p>
            <p className="font-body leading-relaxed" style={{ color: '#E8DDC9', fontSize: '17px', margin: 0 }}>
              None of it sits in a drawer. When application season arrives, your counselor
              brings four years to the table: your Spark reflections become essay ideas, your
              activity threads become your story, and the small stuff — the viewpoints only
              you have — becomes the way you write. Most students start their essays from a
              blank page. You start from a life already written down.
            </p>
          </div>
        </div>
      </section>

      {/* The application year */}
      <section className="px-6 sm:px-8" style={{ background: '#0D1626', paddingTop: '72px', paddingBottom: '72px' }}>
        <div style={{ maxWidth: '44rem', margin: '0 auto' }}>
          <p className="font-body mb-3" style={eyebrow}>Grade 12 · Vantage Applications</p>
          <h2 className="font-heading text-3xl font-semibold mb-4" style={{ color: '#E8DDC9' }}>
            Then it all comes together
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px 0', margin: '20px 0 36px' }}>
            {['Profile', 'Strategy', 'Essays', 'Round Table'].map((s, i) => (
              <span key={s} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <span aria-hidden style={{ width: 'clamp(14px, 3vw, 32px)', height: '1px', background: 'rgba(201,169,119,0.4)', margin: '0 10px' }} />}
                <span className="font-body" style={pill}>{s}</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Stage n="1" title="Profile">
              Your stats, courses, and activities in one place — much of it already there,
              carried over from your Foundations years.
            </Stage>
            <Stage n="2" title="Strategy">
              A balanced list with honest odds at every school — Safety to Hard Reach — and
              the one decision that matters most made deliberately: where you apply early,
              with the binding rules of ED and REA made plain.
            </Stage>
            <Stage n="3" title="Essays">
              Every prompt for every school on your list, with Strategic Intelligence beside
              you — coaching that knows your story and points you to material you&apos;d
              forgotten you had. Feedback, never ghostwriting: the words are yours.
            </Stage>
            <Stage n="4" title="Round Table">
              Before you submit, convene the Round Table: a full-committee read of your entire
              application, school by school — the way an admissions office will actually see it.
            </Stage>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-8" style={{ borderTop: '1px solid #1B2740', paddingTop: '72px', paddingBottom: '96px' }}>
        <div className="text-center" style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <h2 className="font-heading text-3xl font-semibold mb-4" style={{ color: '#E8DDC9' }}>
            Start where you are
          </h2>
          <p className="font-body font-light leading-relaxed mb-10" style={{ color: 'rgba(232,221,201,0.68)' }}>
            9th grade or 12th — the best time to give your counselor a head start is today.
            Free to start, and your work stays yours.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button>Create Account</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
