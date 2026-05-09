'use client';

interface Props {
  variant: 'balanced' | 'warn' | 'info';
  label: string;
}

const palette = {
  balanced: {
    bg: 'rgba(143, 184, 154, 0.10)',
    border: 'rgba(143, 184, 154, 0.40)',
    color: '#B8D9C2',
    dot: '#8FB89A',
  },
  warn: {
    bg: 'rgba(163, 90, 106, 0.12)',
    border: 'rgba(163, 90, 106, 0.45)',
    color: '#C98E99',
    dot: '#A35A6A',
  },
  info: {
    bg: 'rgba(201, 169, 119, 0.10)',
    border: 'rgba(201, 169, 119, 0.40)',
    color: '#E8DDC9',
    dot: '#C9A977',
  },
};

export default function StatusPill({ variant, label }: Props) {
  const c = palette[variant];
  return (
    <span
      className="font-body"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '999px',
        padding: '7px 16px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: c.color,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '999px',
          background: c.dot,
        }}
      />
      {label}
    </span>
  );
}
