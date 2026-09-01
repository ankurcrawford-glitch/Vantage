'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';

// ─── Vantage — What is the Round Table? ──────────────────────────
// The definition page the journey strip points to. Explains what the
// Round Table is, what it does for the student, what it requires, and
// where to convene one. No new nav entry — the strip and school pages
// are its doors.

const gold = '#C9A977';
const ink = '#E8DDC9';
const dim = 'rgba(232,221,201,0.68)';
const faint = 'rgba(232,221,201,0.45)';

function Point({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
      <span
        className="font-heading"
        style={{
          color: gold,
          fontSize: '15px',
          fontWeight: 600,
          border: '1px solid rgba(201,169,119,0.4)',
          borderRadius: '50%',
          width: '34px',
          height: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      <div>
        <h3 className="font-heading text-xl font-semibold mb-1" style={{ color: ink }}>{title}</h3>
        <p className="font-body text-sm" style={{ color: dim, lineHeight: 1.65, margin: 0 }}>{children}</p>
      </div>
    </div>
  );
}

export default function RoundTablePage() {
  return (
    <div className="min-h-screen" style={{ background: '#0B1320' }}>
      <Navigation />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 96px' }}>
        <p className="font-body mb-3" style={{ color: gold, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          The final read
        </p>
        <h1 className="font-heading text-5xl mb-5" style={{ color: ink, lineHeight: 1.1 }}>
          The Round Table
        </h1>
        <p className="font-body text-lg mb-12" style={{ color: dim, lineHeight: 1.7 }}>
          Before you hit submit, an admissions committee will read your application the way
          you never do: all of it at once, side by side, asking one question — <em style={{ color: ink }}>who
          is this person?</em> The Round Table is that reading, done for you, before it counts.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '48px' }}>
          <Point n="1" title="It reads everything, per school">
            Your Common App essay, every supplement for that college, your activities, your
            stats — reviewed together as one application to one school, not as separate pieces.
          </Point>
          <Point n="2" title="It knows what that school values">
            The read is tuned to the college in front of it. What lands at a place defined by
            research intensity is different from what lands at a place built on discussion and
            debate — the Round Table judges your application in that school&apos;s terms.
          </Point>
          <Point n="3" title="It catches what single-essay feedback can't">
            Two essays telling the same story. A thread you set up in one piece and abandoned.
            A supplement that could have been written by anyone. These only show up when
            everything is read together — which is exactly how it will be read.
          </Point>
          <Point n="4" title="It tells you the truth, while you can still act on it">
            You get the committee&apos;s honest verdict — what carries the application, what
            weakens it, what to fix — days before the deadline instead of months after.
          </Point>
        </div>

        <div style={{
          borderLeft: `3px solid ${gold}`,
          background: 'rgba(201,169,119,0.07)',
          borderRadius: '0 10px 10px 0',
          padding: '18px 24px',
          marginBottom: '48px',
        }}>
          <p className="font-body text-sm" style={{ color: ink, lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: gold }}>When it unlocks:</strong> the Round Table convenes
            once a school&apos;s essays are genuinely drafted — near their word limits, with at
            least a couple of revisions behind them. That&apos;s deliberate: a committee read of
            half-finished work would only tell you it&apos;s half-finished.
          </p>
        </div>

        <h2 className="font-heading text-2xl mb-3" style={{ color: ink }}>How to convene one</h2>
        <p className="font-body text-sm mb-8" style={{ color: dim, lineHeight: 1.7 }}>
          Open <Link href="/colleges" style={{ color: gold, textDecoration: 'underline' }}>My Schools</Link>,
          click into any college on your list, and look for the Round Table. Run it school by
          school as each application comes together — the read is different every time, because
          every school is.
        </p>

        <Link href="/colleges">
          <button
            className="font-body font-bold text-xs uppercase tracking-wider"
            style={{
              background: gold,
              color: '#0B1320',
              padding: '14px 32px',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            Go to My Schools
          </button>
        </Link>
        <p className="font-body text-xs mt-4" style={{ color: faint }}>
          Part of the journey: Profile → Strategy → Story Builder → Essays → <span style={{ color: gold }}>Round Table</span>.
        </p>
      </div>
    </div>
  );
}
