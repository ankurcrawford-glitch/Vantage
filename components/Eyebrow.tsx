'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}

export default function Eyebrow({ children, className = '', muted }: Props) {
  return (
    <div
      className={`font-body ${className}`}
      style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: muted ? '0.18em' : '0.22em',
        color: muted ? 'rgba(232,221,201,0.55)' : '#C9A977',
      }}
    >
      {children}
    </div>
  );
}
