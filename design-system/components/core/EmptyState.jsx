import React from 'react';

export function EmptyState({ line, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px',
      padding: '24px', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <p style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--neutral-700)' }}>{line}</p>
      {action}
    </div>
  );
}
