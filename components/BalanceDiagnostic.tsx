'use client';

import { useState } from 'react';
import type { Tier } from '@/lib/classifier';
import type { SchoolSuggestion, TierSuggestion } from '@/lib/geoRecommendations';

export interface BalanceDiagnosticData {
  headline: string;
  pillLabel: string;
  pillVariant: 'balanced' | 'imbalanced';
  counts: Record<Tier, number>;
  recommendations: string[];
}

interface Props {
  data: BalanceDiagnosticData;
  /** @deprecated use tierSuggestions */
  suggestions?: SchoolSuggestion[];
  /** @deprecated use tierSuggestions */
  neededTier?: Tier | null;
  /** Multi-tier suggestion blocks — preferred over (suggestions, neededTier). */
  tierSuggestions?: TierSuggestion[];
  onAddSchool?: (collegeId: string) => void;
}

const TIER_HEADLINE: Record<Tier, string> = {
  Safety: 'Add a safety',
  Likely: 'Add a likely',
  Target: 'Add a target',
  Reach: 'Add a reach',
  'Hard Reach': 'Add a hard reach',
};

export default function BalanceDiagnostic({
  data,
  suggestions,
  neededTier,
  tierSuggestions,
  onAddSchool,
}: Props) {
  const { headline, counts, recommendations } = data;
  const total =
    counts.Safety + counts.Likely + counts.Target + counts.Reach + counts['Hard Reach'];

  if (total === 0) return null;

  const summary = (
    <>
      You have{' '}
      <span style={{ color: '#E8DDC9' }}>{counts.Safety} safet{counts.Safety === 1 ? 'y' : 'ies'}</span>,{' '}
      <span style={{ color: '#E8DDC9' }}>{counts.Likely} likel{counts.Likely === 1 ? 'y' : 'ies'}</span>,{' '}
      <span style={{ color: '#E8DDC9' }}>{counts.Target} target{counts.Target === 1 ? '' : 's'}</span>,{' '}
      <span style={{ color: '#E8DDC9' }}>{counts.Reach} reach{counts.Reach === 1 ? '' : 'es'}</span>, and{' '}
      <span style={{ color: '#E8DDC9' }}>{counts['Hard Reach']} hard reach{counts['Hard Reach'] === 1 ? '' : 'es'}</span>.{' '}
      We recommend{' '}
      <span style={{ color: '#E8DDC9' }}>2–3 safeties (including 1–2 financial safeties)</span>,{' '}
      <span style={{ color: '#E8DDC9' }}>1–2 likelies</span>,{' '}
      <span style={{ color: '#E8DDC9' }}>3–4 targets</span>,{' '}
      <span style={{ color: '#E8DDC9' }}>2–3 reaches</span>, and at most{' '}
      <span style={{ color: '#E8DDC9' }}>1–2 hard reaches</span>.
    </>
  );

  return (
    <div
      style={{
        background: 'rgba(11,19,32, 0.55)',
        border: '1px solid rgba(232,221,201, 0.18)',
        borderRadius: '6px',
        padding: '24px 28px',
        marginBottom: '32px',
      }}
    >
      <h3
        className="font-body"
        style={{
          color: '#E8DDC9',
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
          color: 'rgba(232,221,201, 0.62)',
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
                color: 'rgba(232,221,201, 0.78)',
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
                  background: 'rgba(201,169,119, 0.7)',
                  flexShrink: 0,
                }}
              />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Multi-tier suggestion blocks (preferred path) */}
      {tierSuggestions && tierSuggestions.length > 0 ? (
        <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(232,221,201, 0.1)' }}>
          <p
            className="font-body"
            style={{
              color: '#C9A977',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 16px 0',
            }}
          >
            Suggested additions to balance your list
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {tierSuggestions.map((block) => (
              <SuggestionBlock
                key={block.tier}
                tierLabel={TIER_HEADLINE[block.tier]}
                deficit={block.deficit}
                suggestions={block.suggestions}
                onAddSchool={onAddSchool}
              />
            ))}
          </div>
        </div>
      ) : (
        // Legacy single-tier path (kept for any caller still using it)
        suggestions && suggestions.length > 0 && neededTier && (
          <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(232,221,201, 0.1)' }}>
            <SuggestionBlock
              tierLabel={TIER_HEADLINE[neededTier]}
              deficit={1}
              suggestions={suggestions}
              onAddSchool={onAddSchool}
            />
          </div>
        )
      )}
    </div>
  );
}

const COLLAPSED_COUNT = 3;

function SuggestionBlock({
  tierLabel,
  deficit,
  suggestions,
  onAddSchool,
}: {
  tierLabel: string;
  deficit: number;
  suggestions: SchoolSuggestion[];
  onAddSchool?: (collegeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const deficitText = deficit > 1 ? ` (${deficit} more)` : '';
  const visible = expanded ? suggestions : suggestions.slice(0, COLLAPSED_COUNT);
  const hiddenCount = suggestions.length - visible.length;
  return (
    <div>
      <p
        className="font-body"
        style={{
          color: '#E8DDC9',
          fontSize: '13px',
          fontWeight: 600,
          margin: '0 0 8px 0',
        }}
      >
        {tierLabel}
        <span style={{ color: 'rgba(232,221,201, 0.5)', fontWeight: 400 }}>{deficitText}</span>
      </p>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {visible.map((s) => (
          <li
            key={s.classification.college.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              padding: '10px 14px',
              background: 'rgba(15, 24, 40, 0.6)',
              border: '1px solid rgba(201,169,119, 0.18)',
              borderRadius: '4px',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                className="font-body"
                style={{
                  color: '#E8DDC9',
                  fontSize: '14px',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.classification.college.name}
              </div>
              <div
                className="font-body"
                style={{
                  color: 'rgba(232,221,201, 0.6)',
                  fontSize: '12px',
                  marginTop: '2px',
                }}
              >
                {s.reason}
              </div>
            </div>
            {onAddSchool && (
              <button
                onClick={() => onAddSchool(s.classification.college.id)}
                className="font-body"
                style={{
                  background: 'transparent',
                  color: '#C9A977',
                  border: '1px solid rgba(201,169,119, 0.5)',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '2px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,169,119, 0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                + Add
              </button>
            )}
          </li>
        ))}
      </ul>
      {suggestions.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-body"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#C9A977',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '8px 0 0 0',
            marginTop: '4px',
          }}
        >
          {expanded ? 'Show fewer' : `Show all ${suggestions.length} options${hiddenCount ? ` (+${hiddenCount} more)` : ''}`}
        </button>
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
  const total = safeties + likelies + targets + reaches + hardReaches;

  if (total === 0) {
    return {
      headline: '',
      pillLabel: '',
      pillVariant: 'balanced',
      counts,
      recommendations: [],
    };
  }

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
