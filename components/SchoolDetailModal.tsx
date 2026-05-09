'use client';

import { type SchoolClassification, type Tier } from '@/lib/classifier';

const TIER_PILL_BG: Record<Tier, string> = {
  Safety: 'rgba(74, 222, 128, 0.15)',
  Likely: 'rgba(134, 239, 172, 0.15)',
  Target: 'rgba(201,169,119, 0.18)',
  Reach: 'rgba(251, 191, 36, 0.18)',
  'Hard Reach': 'rgba(248, 113, 113, 0.18)',
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
  onClose: () => void;
  onRemove?: () => void;
}

export default function SchoolDetailModal({ classification, onClose, onRemove }: Props) {
  const { college, bucket, probabilityRange, score, effectiveAdmitRate, whyThisBucket, whatWouldMoveIt, programOverrideTriggered, appliedAdjustments } = classification;
  const rounds = college.available_rounds ?? ['RD'];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,19,32, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0F1828',
          borderTop: '4px solid #C9A977',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '40px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'rgba(232,221,201,0.5)',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 12px',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A977'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,221,201,0.5)'; }}
        >
          ×
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <h2 className="font-heading" style={{ color: '#C9A977', fontSize: '32px', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
              {college.name}
            </h2>
            <p className="font-body" style={{ color: 'rgba(232,221,201,0.6)', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
              {college.location}
            </p>
          </div>
          <span
            className="font-body"
            style={{
              background: TIER_PILL_BG[bucket],
              color: TIER_PILL_TEXT[bucket],
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {bucket}
          </span>
        </div>

        {/* Stat row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            margin: '24px 0',
            padding: '16px',
            background: 'rgba(11,19,32,0.4)',
            border: '1px solid rgba(201,169,119,0.18)',
          }}
        >
          <Stat label="Admit Probability" value={probabilityRange} />
          <Stat label="Admit Rate" value={`${(effectiveAdmitRate * 100).toFixed(1)}%`} highlight={programOverrideTriggered} />
          {college.sat_range_low != null && college.sat_range_high != null && (
            <Stat label="SAT 25/75" value={`${college.sat_range_low}–${college.sat_range_high}`} />
          )}
          {college.gpa_median_uw != null && (
            <Stat label="GPA 50th" value={college.gpa_median_uw.toFixed(2)} />
          )}
          <Stat label="Fit Score" value={`${score}`} />
          <Stat label="Rounds" value={rounds.join(' · ')} />
        </div>

        {/* Why this bucket */}
        <Section title="Why this bucket">
          <p className="font-body" style={{ color: 'rgba(232,221,201,0.85)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
            {whyThisBucket}
          </p>
        </Section>

        {/* Adjustments */}
        {appliedAdjustments.length > 0 && (
          <Section title="Adjustments applied">
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {appliedAdjustments.map((a, i) => (
                <li
                  key={i}
                  className="font-body"
                  style={{
                    fontSize: '13px',
                    color: 'rgba(232,221,201,0.78)',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span aria-hidden="true" style={{ marginTop: '6px', width: '6px', height: '6px', borderRadius: '999px', background: '#C9A977', flexShrink: 0 }} />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* What would move it */}
        <Section title="What would move it">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {whatWouldMoveIt.map((tip, i) => (
              <li
                key={i}
                className="font-body"
                style={{
                  fontSize: '13px',
                  color: 'rgba(232,221,201,0.85)',
                  lineHeight: 1.6,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <span aria-hidden="true" style={{ marginTop: '8px', width: '4px', height: '4px', borderRadius: '999px', background: 'rgba(232,221,201,0.45)', flexShrink: 0 }} />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Section>

        {onRemove && (
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { onRemove(); onClose(); }}
              className="font-body"
              style={{
                background: 'transparent',
                color: '#A35A6A',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                padding: '10px 20px',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Remove from List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        className="font-body"
        style={{
          fontSize: '10.5px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          color: '#C9A977',
          marginBottom: '10px',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span
        className="font-body"
        style={{
          fontSize: '9.5px',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'rgba(232,221,201,0.5)',
        }}
      >
        {label}
      </span>
      <span
        className="font-body"
        style={{
          fontSize: '15px',
          color: highlight ? '#C9A977' : 'rgba(232,221,201,0.95)',
          fontWeight: highlight ? 600 : 500,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}
