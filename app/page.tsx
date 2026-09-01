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

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 text-center">
          {/* Prominent VANTAGE Branding */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="font-heading text-7xl md:text-8xl lg:text-9xl font-semibold" style={{ color: '#E8DDC9', letterSpacing: '-0.02em' }}>VANTAGE</span>
              <span className="text-7xl md:text-8xl lg:text-9xl" style={{ color: '#C9A977' }}>.</span>
            </div>
            <p className="font-body text-lg md:text-xl" style={{ color: '#E8DDC9', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Thoughtful guidance for every step toward college
            </p>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold mb-8 leading-tight" style={{ color: '#E8DDC9', maxWidth: '100%' }}>
            Your path to college.<br />
            Thoughtfully guided.
          </h1>
          <p className="font-body text-xl md:text-2xl mb-12 mx-auto font-light leading-relaxed" style={{ color: '#E8DDC9', maxWidth: '900px' }}>
            A private, personalized platform that meets students where they are—from grade 9 through grade 12—and helps them move forward with clarity and confidence.
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
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
              <Button>Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-8" style={{ background: '#0F1828', borderTop: '1px solid #1B2740', borderBottom: '1px solid #1B2740' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-5xl font-semibold text-center mb-16" style={{ color: '#E8DDC9' }}>
            Guidance that grows with you
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-4" style={{ color: '#C9A977' }}>
                Vantage Foundations
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.9)' }}>
                From grade 9 through the middle of grade 11, explore your interests, shape meaningful goals, and build a strong foundation—one step at a time.
      {/* Two stages */}
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

          <div className="grid md:grid-cols-2 gap-8">
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

            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-4" style={{ color: '#C9A977' }}>
                Vantage
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.9)' }}>
                From the middle of grade 11 through grade 12, bring your story, college list, applications, and essays together with guidance tailored to you.
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

      {/* What you get — facts already in the product and legal pages */}
      <section className="px-6 sm:px-8" style={{ background: '#0B1320', paddingTop: '72px', paddingBottom: '72px' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-center mb-12" style={{ color: '#E8DDC9' }}>
            What you do here
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
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
              <h3 className="font-heading text-2xl font-semibold mb-4" style={{ color: '#C9A977' }}>
                Personal and private
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.9)' }}>
                Your experience reflects your goals, your progress, and your questions. Your information stays secure and confidential along the way.
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

      {/* Footer */}
      <footer className="py-16 px-8" style={{ background: '#0B1320' }}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-heading text-xl font-semibold" style={{ color: '#E8DDC9' }}>VANTAGE</span>
            <span className="text-xl" style={{ color: '#C9A977' }}>.</span>
          </div>
          <p className="font-body text-sm" style={{ color: 'rgba(232,221,201,0.5)' }}>
            Thoughtful guidance for every step toward college
      {/* Privacy + access */}
      <section
        className="px-6 sm:px-8"
        style={{ background: '#0F1828', borderTop: '1px solid #1B2740', borderBottom: '1px solid #1B2740', paddingTop: '64px', paddingBottom: '64px' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold mb-6" style={{ color: '#E8DDC9' }}>
            Private, and free to start
          </h2>
          <p className="font-body font-light leading-relaxed mb-4" style={{ color: 'rgba(232,221,201,0.85)' }}>
            Your essays are not used to train AI models. Traffic is encrypted, and your
            work stays in your account.
          </p>
          <p className="font-body font-light leading-relaxed mb-10" style={{ color: 'rgba(232,221,201,0.85)' }}>
            Create an account for free. AI features have monthly usage caps. A $100
            one-time upgrade is available when you want full access.
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
