'use client';

import Link from 'next/link';
import { type SchoolClassification, type Tier } from '@/lib/classifier';

const TIER_BAR: Record<Tier, string> = {
  Safety: '#8FB89A',
  Likely: '#8FB89A',
  Target: '#C9A977',
  Reach: '#C9A977',
  'Hard Reach': '#A35A6A',
};

const TIER_PILL_BG: Record<Tier, string> = {
  Safety: 'rgba(74, 222, 128, 0.12)',
  Likely: 'rgba(134, 239, 172, 0.12)',
  Target: 'rgba(201,169,119, 0.15)',
  Reach: 'rgba(251, 191, 36, 0.15)',
  'Hard Reach': 'rgba(248, 113, 113, 0.15)',
};

const TIER_PILL_TEXT: Record<Tier, string> = {
  Safety: '#8FB89A',
  Likely: '#8FB89A',
  Target: '#E8DDC9',
  Reach: '#C9A977',
  'Hard Reach': '#A35A6A',
};

interface Props {
  classification: SchoolClassification;
  onRemove?: () => void;
  hasPrompts?: boolean;
  /** Rounds this school actually offers, e.g. ['ED','REA','RD'] (REA/EA already resolved). */
  planOptions?: string[];
  /** The student's committed round for this school (null = undecided). */
  plan?: string | null;
  /** Set or clear the committed round. */
  onPlanChange?: (plan: string | null) => void;
  /** Application status: null/'not_started' | 'in_progress' | 'submitted' | 'decision'. */
  status?: string | null;
  onStatusChange?: (status: string) => void;
}

export default function SchoolCard({ classification, onRemove, hasPrompts, planOptions, plan, onPlanChange, status, onStatusChange }: Props) {
  const { college, probabilityRange, score, bucket, effectiveAdmitRate, programOverrideTriggered } = classification;
  const barColor = TIER_BAR[bucket];

  return (
    <div style={{ position: 'relative' }}>
      <Link
        href={`/colleges/${college.id}`}
        style={{
          display: 'block',
          background: '#101a2b',
          borderTop: `4px solid ${barColor}`,
          padding: '24px',
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(201,169,119, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <h3
              className="font-heading"
              style={{ color: '#C9A977', fontSize: '22px', fontWeight: 600, lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {college.name}
            </h3>
            <p
              className="font-body"
              style={{ color: 'rgba(232,221,201,0.68)', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}
            >
              {college.location}
            </p>
          </div>
          <span
            className="font-body"
            style={{
              background: TIER_PILL_BG[bucket],
              color: TIER_PILL_TEXT[bucket],
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {bucket}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Stat label="Odds" value={probabilityRange} />
          <Stat
            label="Admit"
            value={`${(effectiveAdmitRate * 100).toFixed(0)}%`}
            highlight={programOverrideTriggered}
          />
          {college.sat_range_low != null && college.sat_range_high != null && (
            <Stat label="SAT 25/75" value={`${college.sat_range_low}–${college.sat_range_high}`} />
          )}
          <Stat label="Fit" value={`${score}`} />
        </div>

        {hasPrompts && (
          <span
            className="font-body"
            style={{
              fontSize: '10px',
              color: '#C9A977',
              background: 'rgba(201,169,119,0.15)',
              padding: '2px 8px',
              borderRadius: '3px',
              display: 'inline-block',
              marginTop: '4px',
            }}
          >
            2025 Prompts Available
          </span>
        )}

        {/* Round commitment picker — inside the Link, so every click must
            preventDefault or the card navigates. Clicking the active round
            clears it back to undecided. */}
        {onPlanChange && planOptions && planOptions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span
              className="font-body"
              style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(232,221,201,0.45)' }}
            >
              Applying
            </span>
            {planOptions.map((opt) => {
              const active = plan === opt;
              return (
                <button
                  key={opt}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onPlanChange(active ? null : opt);
                  }}
                  className="font-body"
                  title={active ? 'Click to unset' : `Apply ${opt} to ${college.name}`}
                  style={{
                    background: active ? '#C9A977' : 'rgba(201,169,119,0.08)',
                    color: active ? '#0B1320' : 'rgba(232,221,201,0.68)',
                    border: active ? '1px solid #C9A977' : '1px solid rgba(201,169,119,0.3)',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {opt}
                </button>
              );
            })}
            {!plan && (
              <span className="font-body" style={{ fontSize: '10px', color: 'rgba(232,221,201,0.45)', fontStyle: 'italic' }}>
                undecided
              </span>
            )}
          </div>
        )}

        {/* Application status — same pill interaction as the Applying row,
            sized to be seen. Every click swallows the card's Link. */}
        {onStatusChange && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(201,169,119,0.15)',
            }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <span
              className="font-body"
              style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(232,221,201,0.45)' }}
            >
              Status
            </span>
            {([
              ['in_progress', 'In progress', '#C9A977'],
              ['submitted', '✓ Submitted', '#8FB89A'],
              ['decision', 'Decision', '#8FB89A'],
            ] as const).map(([value, label, color]) => {
              const active = (status || 'not_started') === value;
              return (
                <button
                  key={value}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStatusChange(active ? 'not_started' : value);
                  }}
                  className="font-body"
                  title={active ? 'Click to reset to Not started' : `Mark ${college.name} as ${label}`}
                  style={{
                    background: active ? color : 'transparent',
                    color: active ? '#0B1320' : color,
                    border: `1px solid ${active ? color : 'rgba(201,169,119,0.35)'}`,
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  {label}
                </button>
              );
            })}
            {(!status || status === 'not_started') && (
              <span className="font-body" style={{ fontSize: '10px', color: 'rgba(232,221,201,0.45)', fontStyle: 'italic' }}>
                not started
              </span>
            )}
          </div>
        )}
      </Link>

      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: 'rgba(232,221,201,0.68)',
            fontSize: '12px',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            zIndex: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#A35A6A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,221,201,0.68)'; }}
        >
          Remove
        </button>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span
        className="font-body"
        style={{
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'rgba(232,221,201,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        className="font-body"
        style={{
          fontSize: '13px',
          color: highlight ? '#C9A977' : 'rgba(232,221,201,0.92)',
          fontWeight: highlight ? 600 : 400,
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}
