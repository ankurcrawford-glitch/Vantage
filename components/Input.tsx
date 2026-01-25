import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          fontFamily: 'var(--font-body)', 
          fontSize: '14px', 
          fontWeight: 500, 
          color: 'rgba(255,255,255,0.7)', 
          marginBottom: '8px' 
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          height: '48px',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(212,175,55,0.2)',
          color: 'white',
          padding: '0 20px',
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(212,175,55,0.5)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(212,175,55,0.2)';
        }}
        className={className}
        {...props}
      />
    </div>
  );
}