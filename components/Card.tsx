import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(11,19,32,0.55)',
        border: '1px solid rgba(232,221,201,0.18)',
        borderRadius: '6px',
        padding: '28px',
      }}
    >
      {children}
    </div>
  );
}
