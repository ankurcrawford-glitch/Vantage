'use client';

import { type SchoolClassification, type Tier } from '@/lib/classifier';

const TIER_BAR: Record<Tier, string> = {
  Safety: '#4ADE80',
  Likely: '#86EFAC',
  Target: '#D4AF37',
  Reach: '#FBBF24',
  'Hard Reach': '#F87171',
};

const TIER_PILL_BG: Record<Tier, string> = {
  Safety: 'rgba(74, 222, 128, 0.12)',
  Likely: 'rgba(134, 239, 172, 0.12)',
  Target: 'rgba(212, 175, 55, 0.15)',
  Reach: 'rgba(251, 191, 36, 0.15)',
  'Hard Reach': 'rgba(248, 113, 113, 0.15)',
};

const TIER_PILL_TEXT: Record<Tier, string> = {
  Safety: '#4ADE80',
  Likely: '#86EFAC',
  Target: '#F3E5AB',
  Reach: '#FBBF24',
  'Hard Reach': '#F87171',
};

interface Props {
  classification: SchoolClassification;
  onOpen: () => void;
  onRemove?: () => void;
  hasPrompts?: boolean;
}

export default function SchoolCard({ classification, onOpen, onRemove, hasPrompts }: Props) {
  const { college, probabilityRange, score, bucket, effectiveAdmitRate, programOverrideTriggered } = classification;
  const barColor = TIER_BAR[bucket];

  return (
    <div
      onClick={onOpen}
      style={{
        position: 'relative',
        background: '#152C45',
        borderTop: `4px solid ${barColor}`,
        padding: '24px',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(212, 175, 55, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            className="font-heading"
            style={{ color: '#D4AF37', fontSize: '22px', fontWeight: 600, lineHeight: 1.2, margin: 0 }}
          >
            {college.name}
          </h3>
          <p
            className="font-body"
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}
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
            color: '#D4AF37',
            background: 'rgba(212,175,55,0.15)',
            padding: '2px 8px',
            borderRadius: '3px',
            display: 'inline-block',
            marginTop: '4px',
          }}
        >
          2025 Prompts Available
        </span>
      )}

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
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
          color: 'rgba(255,255,255,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        className="font-body"
        style={{
          fontSize: '13px',
          color: highlight ? '#D4AF37' : 'rgba(255,255,255,0.92)',
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
