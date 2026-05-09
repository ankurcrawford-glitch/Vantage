'use client';

import type { Tier } from '@/lib/classifier';

export interface BalanceDiagnosticData {
  headline: string;
  pillLabel: string;
  pillVariant: 'balanced' | 'imbalanced';
  counts: Record<Tier, number>;
  recommendations: string[];
}

interface Props {
  data: BalanceDiagnosticData;
}

export default function BalanceDiagnostic({ data }: Props) {
  const { headline, counts, recommendations } = data;
  const total =
    counts.Safety + counts.Likely + counts.Target + counts.Reach + counts['Hard Reach'];

  if (total === 0) return null;

  const summary = (
    <>
      You have{' '}
      <span style={{ color: '#F3E5AB' }}>{counts.Safety} safet{counts.Safety === 1 ? 'y' : 'ies'}</span>,{' '}
      <span style={{ color: '#F3E5AB' }}>{counts.Likely} likel{counts.Likely === 1 ? 'y' : 'ies'}</span>,{' '}
      <span style={{ color: '#F3E5AB' }}>{counts.Target} target{counts.Target === 1 ? '' : 's'}</span>,{' '}
      <span style={{ color: '#F3E5AB' }}>{counts.Reach} reach{counts.Reach === 1 ? '' : 'es'}</span>, and{' '}
      <span style={{ color: '#F3E5AB' }}>{counts['Hard Reach']} hard reach{counts['Hard Reach'] === 1 ? '' : 'es'}</span>.{' '}
      We recommend{' '}
      <span style={{ color: '#F3E5AB' }}>2–3 safeties (including 1–2 financial safeties)</span>,{' '}
      <span style={{ color: '#F3E5AB' }}>1–2 likelies</span>,{' '}
      <span style={{ color: '#F3E5AB' }}>3–4 targets</span>,{' '}
      <span style={{ color: '#F3E5AB' }}>2–3 reaches</span>, and at most{' '}
      <span style={{ color: '#F3E5AB' }}>1–2 hard reaches</span>.
    </>
  );

  return (
    <div
      style={{
        background: 'rgba(11, 22, 35, 0.55)',
        border: '1px solid rgba(243, 229, 171, 0.18)',
        borderRadius: '6px',
        padding: '24px 28px',
        marginBottom: '32px',
      }}
    >
      <h3
        className="font-body"
        style={{
          color: '#F3E5AB',
          fontSize: '15px',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '0.01em',
        }}
      >
        {headline}
      </h3>
      <p
        className="font-body"
        style={{
          color: 'rgba(243, 229, 171, 0.62)',
          fontSize: '14px',
          lineHeight: 1.65,
          marginTop: '10px',
          margin: '10px 0 0 0',
        }}
      >
        {summary}
      </p>

      {recommendations.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: '18px 0 0 0',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {recommendations.map((r, i) => (
            <li
              key={i}
              className="font-body"
              style={{
                fontSize: '13.5px',
                color: 'rgba(243, 229, 171, 0.78)',
                lineHeight: 1.55,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  marginTop: '8px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '999px',
                  background: 'rgba(212, 175, 55, 0.7)',
                  flexShrink: 0,
                }}
              />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------ logic ------------------------------ */

export function buildBalanceDiagnostic(counts: Record<Tier, number>): BalanceDiagnosticData {
  const safeties = counts.Safety;
  const likelies = counts.Likely;
  const targets = counts.Target;
  const reaches = counts.Reach;
  const hardReaches = counts['Hard Reach'];
  const reachy = reaches + hardReaches;
  const easy = safeties + likelies + targets;

  let headline: string;
  let pillLabel: string;
  let pillVariant: 'balanced' | 'imbalanced';

  if (reachy >= easy) {
    headline = 'Your list is reach-heavy';
    pillLabel = 'IMBALANCED';
    pillVariant = 'imbalanced';
  } else if (safeties + likelies > reachy + targets) {
    headline = 'Your list is safety-heavy';
    pillLabel = 'IMBALANCED';
    pillVariant = 'imbalanced';
  } else if (targets < 2) {
    headline = 'Your list is target-light';
    pillLabel = 'TARGET-LIGHT';
    pillVariant = 'imbalanced';
  } else if (
    safeties >= 2 &&
    safeties <= 4 &&
    targets >= 3 &&
    targets <= 5 &&
    hardReaches <= 2 &&
    reachy <= easy + 1
  ) {
    headline = 'Your list looks balanced';
    pillLabel = 'BALANCED';
    pillVariant = 'balanced';
  } else {
    headline = 'Your list could be tuned';
    pillLabel = 'IMBALANCED';
    pillVariant = 'imbalanced';
  }

  const recs: string[] = [];

  if (hardReaches >= 3) {
    recs.push("Too many hard reaches. The math doesn't favor you—replace one with a target.");
  }
  if (reachy > easy) {
    recs.push('Reaches and hard reaches outnumber the rest of your list combined.');
  }
  if (targets < 3) {
    recs.push('Fewer than 3 targets. Targets are where most admits happen—aim for 3–4.');
  }
  if (safeties === 0) {
    recs.push("You don't have any safeties. Every list needs 2–3 you'd be happy to attend.");
  } else if (safeties === 1) {
    recs.push('Only 1 safety. Add a second so a single denial doesn\'t leave you stranded.');
  }
  if (safeties >= 2 && !recs.some((r) => r.startsWith('Verify'))) {
    recs.push('Verify at least one safety is also a financial safety—affordable without need-based aid.');
  }
  if (likelies === 0 && safeties + targets < 5) {
    recs.push('Consider 1–2 likelies — schools where you have a strong shot but aren\'t a lock.');
  }

  return {
    headline,
    pillLabel,
    pillVariant,
    counts,
    recommendations: recs.slice(0, 4),
  };
}
