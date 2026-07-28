import React from 'react';

export function Card({ padding, interactive = false, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      style={{
        background: hover ? 'var(--neutral-50)' : 'var(--surface)',
        border: '1px solid ' + (hover ? 'var(--primary-200)' : 'var(--neutral-200)'),
        borderRadius: 'var(--radius-lg)',
        padding: padding ?? 'var(--card-pad)',
        boxShadow: 'none',
        transition: 'background-color var(--motion-instant), border-color var(--motion-instant)',
        ...style,
      }}
      {...rest}
    >{children}</div>
  );
}

export function CardHeader({ title, meta, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--h2)', lineHeight: 'var(--h2-lh)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)' }}>{title}</h2>
        {meta ? <span style={{ fontSize: 'var(--caption)', lineHeight: 'var(--caption-lh)', color: 'var(--neutral-500)' }}>{meta}</span> : null}
      </div>
      {action}
    </div>
  );
}
