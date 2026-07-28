import React from 'react';

export function Acknowledgement({ ackNumber, filedOn, regime, itrForm, figure, animate = true }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)',
      padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: 'var(--ledger-max-width)',
    }}>
      <div style={{
        border: '1px solid var(--credit-border)', background: 'var(--credit-tint)',
        borderRadius: 'var(--radius-none)', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: '4px',
        animation: animate ? 'nritax-stamp var(--motion-stamp) both' : undefined,
      }}>
        <span style={{ fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)', color: 'var(--credit-text)' }}>Acknowledgement number</span>
        <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--figure-lg)', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums lining-nums', color: 'var(--credit-text)' }}>{ackNumber}</span>
      </div>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '16px' }}>
        {[['Filed on', filedOn], ['Form', itrForm], ['Regime', regime], ['Result', figure]].filter(([, v]) => v).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <dt style={{ fontSize: 'var(--caption)', color: 'var(--neutral-500)' }}>{k}</dt>
            <dd style={{ margin: 0, fontFamily: 'var(--font-figure)', fontSize: 'var(--figure)', fontVariantNumeric: 'tabular-nums lining-nums', color: 'var(--ink)' }}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
