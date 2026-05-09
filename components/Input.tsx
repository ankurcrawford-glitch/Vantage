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
          color: 'rgba(232,221,201,0.7)', 
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
          border: '1px solid rgba(201,169,119,0.2)',
          borderRadius: '6px',
          color: '#E8DDC9',
          padding: '0 20px',
          fontFamily: 'var(--font-body)',
          fontSize: '16px',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(201,169,119,0.5)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(201,169,119,0.2)';
        }}
        className={className}
        {...props}
      />
    </div>
  );
}