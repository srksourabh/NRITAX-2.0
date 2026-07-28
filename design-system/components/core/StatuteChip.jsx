import React from 'react';

export function StatuteChip({ children, source = false, onClick, title }) {
  const [hover, setHover] = React.useState(false);
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 6px',
        borderRadius: 'var(--radius-xs)', fontFamily: 'var(--font-figure)',
        fontSize: 'var(--statute)', lineHeight: 'var(--statute-lh)', fontWeight: 'var(--weight-medium)',
        background: source ? 'var(--info-tint)' : 'transparent',
        border: '1px solid ' + (source ? 'var(--info-border)' : 'transparent'),
        color: source ? 'var(--info-text)' : 'var(--neutral-500)',
        cursor: onClick ? 'pointer' : 'default',
        textDecoration: onClick && hover ? 'underline' : 'none',
        transition: 'color var(--motion-instant)',
      }}
    >{children}</Tag>
  );
}
