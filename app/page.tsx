import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Vantage — Guidance for every stage of high school',
  description:
    'For high-school students (13 and up), with parents and counselors able to review. Vantage Foundations for grades 9 through the first half of grade 11. Vantage Applications from the middle of grade 11 through grade 12. Essay feedback, not ghostwriting. Free to start.',
};

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />

      {/* Hero */}
      <section
        className="relative flex flex-col items-center overflow-hidden"
        style={{ background: '#0B1320', padding: '72px 24px 64px' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,169,119,0.1), transparent)' }}
        />

        <div
          className="relative z-10 text-center"
          style={{ width: '100%', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto' }}
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <span
              className="font-heading text-5xl sm:text-6xl md:text-7xl font-semibold"
              style={{ color: '#E8DDC9', letterSpacing: '-0.02em' }}
            >
              VANTAGE
            </span>
            <span className="text-5xl sm:text-6xl md:text-7xl" style={{ color: '#C9A977' }}>
              .
            </span>
          </div>

          <h1
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-semibold mb-6 leading-tight"
            style={{ color: '#E8DDC9' }}
          >
            Guidance for every stage of high school
          </h1>
          <p
            className="font-body text-base sm:text-lg mb-10 mx-auto font-light leading-relaxed"
            style={{ color: 'rgba(232,221,201,0.68)', maxWidth: '640px' }}
          >
            For high-school students (13 and up) preparing for college. Parents and
            counselors can review. Essay help is feedback and brainstorming — we do
            not write essays for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button>Begin Assessment</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Two stages — side by side on desktop, stacked on small screens */}
      <section
        className="px-6 sm:px-8"
        style={{ background: '#101a2b', borderTop: '1px solid #1B2740', borderBottom: '1px solid #1B2740', paddingTop: '72px', paddingBottom: '72px' }}
      >
        <div className="max-w-6xl mx-auto">
          <p
            className="font-body text-center mb-3"
            style={{ color: '#C9A977', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            Two stages, one account
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-center mb-12" style={{ color: '#E8DDC9' }}>
            Start where you are
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="flex flex-col h-full">
              <p
                className="font-body mb-3"
                style={{ color: '#C9A977', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}
              >
                Grade 9 through first half of grade 11
              </p>
              <h3 className="font-heading text-2xl sm:text-3xl font-semibold mb-4" style={{ color: '#E8DDC9' }}>
                Vantage Foundations
              </h3>
              <p className="font-body font-light leading-relaxed mb-8" style={{ color: 'rgba(232,221,201,0.68)', flex: 1 }}>
                Explore your interests, understand your strengths, and make thoughtful
                choices about classes, activities, and experiences. Vantage Foundations
                helps you develop a meaningful high-school journey without turning every
                decision into an admissions calculation.
              </p>
              <p
                className="font-body leading-relaxed mb-8"
                style={{ color: '#C9A977', fontSize: '15px', fontStyle: 'italic', borderLeft: '2px solid rgba(201,169,119,0.4)', paddingLeft: '16px' }}
              >
                We meet you in 9th grade, bank four years of your story — then spend it
                when it matters most.
              </p>
              <Link href="/signup" className="inline-block">
                <Button className="px-6">Explore Vantage Foundations</Button>
              </Link>
            </Card>

            <Card className="flex flex-col h-full">
              <p
                className="font-body mb-3"
                style={{ color: '#C9A977', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}
              >
                Middle of grade 11 through grade 12
              </p>
              <h3 className="font-heading text-2xl sm:text-3xl font-semibold mb-4" style={{ color: '#E8DDC9' }}>
                Vantage Applications
              </h3>
              <p className="font-body font-light leading-relaxed mb-8" style={{ color: 'rgba(232,221,201,0.68)', flex: 1 }}>
                Bring your experiences together and prepare for the college application
                process. Vantage Applications helps you develop your strategy, organize
                your college list, identify the stories that matter, and strengthen your
                essays while keeping the work authentically yours.
              </p>
              <p
                className="font-body leading-relaxed mb-8"
                style={{ color: '#C9A977', fontSize: '15px', fontStyle: 'italic', borderLeft: '2px solid rgba(201,169,119,0.4)', paddingLeft: '16px' }}
              >
                Starting as a senior? A few honest questions rebuild your story fast — so
                every essay starts from who you are, never from a blank page.
              </p>
              <Link href="/signup" className="inline-block">
                <Button className="px-6">Explore Vantage Applications</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works — the two journeys, and the thread between them */}
      <section className="px-6 sm:px-8" style={{ background: '#0D1626', paddingTop: '72px', paddingBottom: '72px' }}>
        <div style={{ width: '100%', maxWidth: '52rem', marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-center mb-4" style={{ color: '#E8DDC9' }}>
            How it works
          </h2>
          <p className="font-body font-light text-center leading-relaxed mb-12" style={{ color: 'rgba(232,221,201,0.68)', maxWidth: '38rem', margin: '0 auto 48px' }}>
            One counselor, all four years. It starts in 9th grade with a conversation —
            and by the time you apply, it remembers everything that shaped you.
          </p>

          {[
            {
              eyebrow: 'Grades 9–11 · Foundations',
              steps: ['Conversation', 'Story', 'Activities', 'Roadmap', 'Spark'],
              blurb:
                'Talk with your counselor, and everything builds itself: your story takes shape, your activities gain depth, your roadmap fits your grade, and a monthly Spark reflection banks the raw, true material most students wish they had written down.',
            },
            {
              eyebrow: 'Grade 12 · Applications',
              steps: ['Profile', 'Strategy', 'Essays', 'Round Table'],
              blurb:
                'Build a balanced list with real odds, commit to your early round, write every essay with coaching that knows your story — then convene the Round Table for a full-committee read of your application, school by school.',
            },
          ].map((j) => (
            <div key={j.eyebrow} style={{ marginBottom: '36px' }}>
              <p
                className="font-body mb-3"
                style={{ color: '#C9A977', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}
              >
                {j.eyebrow}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px 0', marginBottom: '12px' }}>
                {j.steps.map((s, i) => (
                  <span key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    {i > 0 && (
                      <span aria-hidden style={{ width: 'clamp(14px, 3vw, 32px)', height: '1px', background: 'rgba(201,169,119,0.4)', margin: '0 10px' }} />
                    )}
                    <span
                      className="font-body"
                      style={{
                        fontSize: '12px',
                        letterSpacing: '1.2px',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: 'rgba(232,221,201,0.68)',
                        border: '1px solid rgba(201,169,119,0.35)',
                        borderRadius: '999px',
                        padding: '6px 14px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s}
                    </span>
                  </span>
                ))}
              </div>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.68)', fontSize: '15px', maxWidth: '44rem' }}>
                {j.blurb}
              </p>
            </div>
          ))}

          <div
            style={{
              borderLeft: '3px solid #C9A977',
              background: 'rgba(201,169,119,0.07)',
              padding: '18px 24px',
              marginTop: '8px',
            }}
          >
            <p className="font-body leading-relaxed" style={{ color: '#E8DDC9', fontSize: '15px', margin: 0 }}>
              <span style={{ color: '#C9A977', fontWeight: 600 }}>Why the years matter:</span>{' '}
              a counselor who has known you since 9th grade remembers the small stuff — the
              month you changed your mind, the project that flopped, the thing you fixed and
              never mentioned again. That&apos;s what shapes how you see the world and how you
              express yourself. When essay season comes, your counselor brings all of it to
              the table — your reflections become essay ideas, your threads become your story.
            </p>
          </div>

          <p className="font-body text-center" style={{ marginTop: '32px' }}>
            <Link
              href="/how-it-works"
              style={{ color: '#C9A977', textDecoration: 'none', fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}
            >
              The full story: how Vantage works →
            </Link>
          </p>
        </div>
      </section>

      {/* What you do here — single stacked column so prose stays readable */}
      <section className="px-6 sm:px-8" style={{ background: '#0B1320', paddingTop: '72px', paddingBottom: '72px' }}>
        <div style={{ width: '100%', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-center mb-12" style={{ color: '#E8DDC9' }}>
            What you do here
          </h2>
          <div className="flex flex-col gap-8">
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-3" style={{ color: '#C9A977' }}>
                Build your story
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.68)' }}>
                Insight Questions and Story Builder help you find the experiences that
                matter — so later essays start from your own material, not a blank page.
              </p>
            </Card>
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-3" style={{ color: '#C9A977' }}>
                Keep a college list
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.68)' }}>
                Organize schools and strategy in one place as you move from exploration
                into applications.
              </p>
            </Card>
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-3" style={{ color: '#C9A977' }}>
                Essay feedback, not ghostwriting
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.68)' }}>
                AI helps you brainstorm and revise. It does not write essays for you.
                Submitting generated text as your own work can violate a college&apos;s
                integrity rules.
              </p>
            </Card>
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-3" style={{ color: '#C9A977' }}>
                Invite a parent or counselor
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.68)' }}>
                Share drafts for review when you want a second set of eyes. Each student
                keeps their own account.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy + access */}
      <section
        className="px-6 sm:px-8"
        style={{ background: '#101a2b', borderTop: '1px solid #1B2740', borderBottom: '1px solid #1B2740', paddingTop: '64px', paddingBottom: '64px' }}
      >
        <div
          className="text-center"
          style={{ width: '100%', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto' }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold mb-6" style={{ color: '#E8DDC9' }}>
            Private, and free to start
          </h2>
          <p className="font-body font-light leading-relaxed mb-4" style={{ color: 'rgba(232,221,201,0.68)' }}>
            Your essays are not used to train AI models. Traffic is encrypted, and your
            work stays in your account.
          </p>
          <p className="font-body font-light leading-relaxed mb-10" style={{ color: 'rgba(232,221,201,0.68)' }}>
            Create an account for free. AI features have monthly usage caps. Obtain a
            one-time code for access.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button>Create Account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
