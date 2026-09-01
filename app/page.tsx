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
            style={{ color: 'rgba(232,221,201,0.85)', maxWidth: '640px' }}
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
        style={{ background: '#0F1828', borderTop: '1px solid #1B2740', borderBottom: '1px solid #1B2740', paddingTop: '72px', paddingBottom: '72px' }}
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
              <p className="font-body font-light leading-relaxed mb-8" style={{ color: 'rgba(232,221,201,0.85)', flex: 1 }}>
                Explore your interests, understand your strengths, and make thoughtful
                choices about classes, activities, and experiences. Vantage Foundations
                helps you develop a meaningful high-school journey without turning every
                decision into an admissions calculation.
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
              <p className="font-body font-light leading-relaxed mb-8" style={{ color: 'rgba(232,221,201,0.85)', flex: 1 }}>
                Bring your experiences together and prepare for the college application
                process. Vantage Applications helps you develop your strategy, organize
                your college list, identify the stories that matter, and strengthen your
                essays while keeping the work authentically yours.
              </p>
              <Link href="/signup" className="inline-block">
                <Button className="px-6">Explore Vantage Applications</Button>
              </Link>
            </Card>
          </div>
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
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.85)' }}>
                Insight Questions and Story Builder help you find the experiences that
                matter — so later essays start from your own material, not a blank page.
              </p>
            </Card>
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-3" style={{ color: '#C9A977' }}>
                Keep a college list
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.85)' }}>
                Organize schools and strategy in one place as you move from exploration
                into applications.
              </p>
            </Card>
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-3" style={{ color: '#C9A977' }}>
                Essay feedback, not ghostwriting
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.85)' }}>
                AI helps you brainstorm and revise. It does not write essays for you.
                Submitting generated text as your own work can violate a college&apos;s
                integrity rules.
              </p>
            </Card>
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-3" style={{ color: '#C9A977' }}>
                Invite a parent or counselor
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.85)' }}>
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
        style={{ background: '#0F1828', borderTop: '1px solid #1B2740', borderBottom: '1px solid #1B2740', paddingTop: '64px', paddingBottom: '64px' }}
      >
        <div
          className="text-center"
          style={{ width: '100%', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto' }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold mb-6" style={{ color: '#E8DDC9' }}>
            Private, and free to start
          </h2>
          <p className="font-body font-light leading-relaxed mb-4" style={{ color: 'rgba(232,221,201,0.85)' }}>
            Your essays are not used to train AI models. Traffic is encrypted, and your
            work stays in your account.
          </p>
          <p className="font-body font-light leading-relaxed mb-10" style={{ color: 'rgba(232,221,201,0.85)' }}>
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
