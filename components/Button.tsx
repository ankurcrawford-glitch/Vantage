import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'font-body font-bold text-xs uppercase tracking-wider transition-colors';
  
  const variants = {
    primary: 'bg-gold-leaf text-midnight px-10 py-4 border border-gold-leaf hover:bg-transparent hover:text-gold-leaf',
    secondary: 'bg-transparent text-gold-leaf px-6 py-3 border border-gold-leaf hover:bg-gold-leaf hover:text-midnight',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}