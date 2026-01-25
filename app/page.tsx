import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#0B1623' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24" style={{ background: '#0B1623' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.1), transparent)' }}></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 text-center">
          {/* Prominent VANTAGE Branding */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="font-heading text-7xl md:text-8xl lg:text-9xl font-semibold" style={{ color: 'white', letterSpacing: '-0.02em' }}>VANTAGE</span>
              <span className="text-7xl md:text-8xl lg:text-9xl" style={{ color: '#D4AF37' }}>.</span>
            </div>
            <p className="font-body text-lg md:text-xl" style={{ color: '#F3E5AB', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Strategic Admissions Intelligence
            </p>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-semibold mb-8 leading-tight" style={{ color: 'white', maxWidth: '100%' }}>
            Admissions Strategy.<br />
            Elevated by Intelligence.
          </h1>
          <p className="font-body text-xl md:text-2xl mb-12 mx-auto font-light leading-relaxed" style={{ color: '#F3E5AB', maxWidth: '900px' }}>
            A secure, private platform that learns your history to architect your future.
          </p>
          <Link href="/signup">
            <Button>Begin Assessment</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-8" style={{ background: '#F9F9F9' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-5xl font-semibold text-center mb-16" style={{ color: '#1A1A1A' }}>
            Why VANTAGE
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-4" style={{ color: '#D4AF37' }}>
                Intelligent Analysis
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Our platform learns from your academic history, achievements, and aspirations to create a personalized admissions strategy.
              </p>
            </Card>

            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-4" style={{ color: '#D4AF37' }}>
                Secure & Private
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Your data is encrypted and protected with bank-level security. Your journey remains completely confidential.
              </p>
            </Card>

            <Card>
              <h3 className="font-heading text-2xl font-semibold mb-4" style={{ color: '#D4AF37' }}>
                Strategic Guidance
              </h3>
              <p className="font-body font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Receive expert insights and recommendations tailored to maximize your chances of admission to top institutions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8" style={{ background: '#0B1623' }}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-heading text-xl font-semibold" style={{ color: 'white' }}>VANTAGE</span>
            <span className="text-xl" style={{ color: '#D4AF37' }}>.</span>
          </div>
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Strategic Admissions Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}