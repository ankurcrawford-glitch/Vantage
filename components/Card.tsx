import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// House card: one surface color, one cream hairline, soft radius.
// (The old gold top-bar treatment is retired — gold now appears as
// washes and accents, not a stripe on every box.)
export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-royal-blue border border-hairline rounded-[10px] p-8 ${className}`}>
      {children}
    </div>
  );
}
