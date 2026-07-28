import React from 'react';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function HeroFigure({ label, amount, tone = 'ink', note, size = 'xl', stamp = false }) {
  const color = tone === 'credit' ? 'var(--credit)' : 'var(--ink)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', animation: stamp ? 'nritax-stamp var(--motion-stamp) both' : undefined }}>
      <span style={{ fontSize: 'var(--label)', lineHeight: 'var(--label-lh)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-figure)', fontVariantNumeric: 'tabular-nums lining-nums',
        fontSize: size === 'xl' ? 'var(--figure-xl)' : 'var(--figure-lg)',
        lineHeight: size === 'xl' ? 'var(--figure-xl-lh)' : 'var(--figure-lg-lh)',
        fontWeight: 'var(--weight-medium)', color,
      }}>₹{inr.format(Math.abs(Math.round(amount)))}</span>
      {note ? <span style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)' }}>{note}</span> : null}
    </div>
  );
}
