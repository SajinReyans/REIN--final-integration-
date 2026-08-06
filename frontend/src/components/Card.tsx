import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div
    className={`rounded-2xl border ${className}`}
    style={{
      background: 'var(--surface)',
      borderColor: 'var(--border)',
      boxShadow: 'var(--shadow)',
      padding: 'var(--card-pad)',
      ...style,
    }}
  >
    {children}
  </div>
);
