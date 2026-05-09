'use client';

import { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export default function PageHeader({ title, subtitle, right }: Props) {
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
          {title}
        </h1>
        <div
          style={{
            width: '180px',
            height: '1px',
            background: 'rgba(232,221,201, 0.35)',
            marginTop: '14px',
          }}
        />
        {subtitle && (
          <p
            className="font-body"
            style={{
              color: 'rgba(232,221,201, 0.65)',
              fontSize: '14px',
              fontStyle: 'italic',
              margin: '14px 0 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {right && <div style={{ flexShrink: 0, paddingTop: '12px' }}>{right}</div>}
    </div>
  );
}
