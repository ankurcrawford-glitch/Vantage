'use client';

import Link from 'next/link';

// ─── Vantage — journey strip ─────────────────────────────────────
// The product's logic, written down once: a horizontal map of the
// stages, with the student's current position lit. Each stage is
// clickable. Used on the senior dashboard (Profile → Strategy →
// Essays → Round Table) and, without a lit stage, as the Foundations
// loop map on Compass.

export interface JourneyStep {
  label: string;
  href: string;
  /** One line shown under the strip for the active stage (and as hover text). */
  desc: string;
}

interface Props {
  title: string;
  steps: JourneyStep[];
  /** Index of the student's current stage; -1 for a pure map with no position. */
  activeIndex: number;
  /** Optional trailing note, e.g. where the loop leads. */
  tail?: string;
}

export default function JourneyStrip({ title, steps, activeIndex, tail }: Props) {
  return (
    <div
      style={{
        border: '1px solid rgba(201,169,119,0.25)',
        background: 'rgba(201,169,119,0.04)',
        padding: '18px 24px 16px',
        marginBottom: '32px',
      }}
    >
      <p
        className="font-body"
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(201,169,119,0.8)',
          margin: '0 0 12px',
        }}
      >
        {title}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px 0' }}>
        {steps.map((s, i) => {
          const isActive = i === activeIndex;
          const isDone = activeIndex >= 0 && i < activeIndex;
          return (
            <div key={s.href} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <span
                  aria-hidden
                  style={{
                    width: 'clamp(16px, 3vw, 36px)',
                    height: '1px',
                    background: isDone || isActive ? 'rgba(201,169,119,0.5)' : 'rgba(232,221,201,0.15)',
                    margin: '0 10px',
                  }}
                />
              )}
              <Link
                href={s.href}
                title={s.desc}
                className="font-body"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#C9A977' : isDone ? 'rgba(232,221,201,0.75)' : 'rgba(232,221,201,0.4)',
                  background: isActive ? 'rgba(201,169,119,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(201,169,119,0.5)' : '1px solid transparent',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isActive ? '#C9A977' : isDone ? 'rgba(201,169,119,0.55)' : 'rgba(232,221,201,0.2)',
                  }}
                />
                {isDone ? '✓ ' : ''}{s.label}
              </Link>
            </div>
          );
        })}
        {tail && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              aria-hidden
              style={{ width: 'clamp(16px, 3vw, 36px)', height: '1px', background: 'rgba(232,221,201,0.15)', margin: '0 10px' }}
            />
            <span className="font-body" style={{ fontSize: '12px', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(201,169,119,0.6)', whiteSpace: 'nowrap' }}>
              {tail}
            </span>
          </div>
        )}
      </div>
      {activeIndex >= 0 && steps[activeIndex] && (
        <p className="font-body" style={{ fontSize: '13px', color: 'rgba(232,221,201,0.6)', margin: '10px 0 0', lineHeight: 1.5 }}>
          <span style={{ color: '#C9A977', fontWeight: 600 }}>You are here:</span> {steps[activeIndex].desc}
        </p>
      )}
    </div>
  );
}
