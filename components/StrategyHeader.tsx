'use client';

interface Props {
  totalSchools: number;
  pillLabel: string;
  pillVariant: 'balanced' | 'imbalanced';
}

export default function StrategyHeader({ totalSchools, pillLabel, pillVariant }: Props) {
  const subtitle =
    totalSchools === 0
      ? 'No schools yet — add a few to see your tier breakdown.'
      : `${totalSchools} ${totalSchools === 1 ? 'school' : 'schools'}, classified across five tiers.`;

  const isBalanced = pillVariant === 'balanced';
  const pillBg = isBalanced ? 'rgba(143, 184, 154, 0.10)' : 'rgba(163, 90, 106, 0.12)';
  const pillBorder = isBalanced ? 'rgba(143, 184, 154, 0.40)' : 'rgba(163, 90, 106, 0.45)';
  const pillColor = isBalanced ? '#B8D9C2' : '#C98E99';
  const dotColor = isBalanced ? '#8FB89A' : '#A35A6A';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '24px',
        marginBottom: '32px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          className="font-heading"
          style={{
            color: '#E8DDC9',
            fontSize: '54px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Your School List
        </h1>
        <div
          style={{
            width: '180px',
            height: '1px',
            background: 'rgba(232,221,201, 0.35)',
            marginTop: '14px',
          }}
        />
        <p
          className="font-body"
          style={{
            color: 'rgba(232,221,201, 0.65)',
            fontSize: '14px',
            fontStyle: 'italic',
            marginTop: '14px',
            margin: '14px 0 0 0',
          }}
        >
          {subtitle}
        </p>
      </div>

      <div style={{ flexShrink: 0, paddingTop: '12px' }}>
        <span
          className="font-body"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: pillBg,
            border: `1px solid ${pillBorder}`,
            borderRadius: '999px',
            padding: '7px 16px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: pillColor,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: dotColor,
            }}
          />
          {pillLabel}
        </span>
      </div>
    </div>
  );
}
