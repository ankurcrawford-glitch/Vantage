import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-royal-blue border-t-4 border-gold-leaf p-8 ${className}`}>
      {children}
    </div>
  );
}