import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24" style={{ background: '#0B1320' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,169,119,0.1), transparent)' }}></div>

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
              </p>
            </Card>

            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-4" style={{ color: '#C9A977' }}>
                Vantage
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.9)' }}>
                From the middle of grade 11 through grade 12, bring your story, college list, applications, and essays together with guidance tailored to you.
              </p>
            </Card>

            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-4" style={{ color: '#C9A977' }}>
                Personal and private
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(232,221,201,0.9)' }}>
                Your experience reflects your goals, your progress, and your questions. Your information stays secure and confidential along the way.
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
          </p>
        </div>
      </footer>
    </div>
  );
}
