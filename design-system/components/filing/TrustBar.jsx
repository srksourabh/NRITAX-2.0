import React from 'react';

export function TrustBar({ marks = [], align = 'flex-start' }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: align, gap: '24px',
      background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)',
      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
    }}>
      {marks.map((m) => (
        <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '32px', justifyContent: 'center', filter: 'grayscale(1)' }}>
          <span style={{ fontSize: 'var(--label)', fontWeight: 'var(--weight-semibold)', color: 'var(--neutral-700)', letterSpacing: '0.02em' }}>{m.name}</span>
          {m.reference ? <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--statute)', color: 'var(--neutral-500)' }}>{m.reference}</span> : null}
        </div>
      ))}
    </div>
  );
}
