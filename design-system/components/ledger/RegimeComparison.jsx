import React from 'react';
import { LedgerBlock } from './LedgerBlock.jsx';
import { StatusPill } from '../core/StatusPill.jsx';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function RegimeComparison({ oldRegime, newRegime, selected = 'new', onSelect, switchNote }) {
  const delta = oldRegime.tax - newRegime.tax;
  const material = Math.abs(delta) >= 500;
  const winner = !material ? null : delta > 0 ? 'new' : 'old';
  const sentence = !material
    ? 'Both regimes cost about the same'
    : (winner === 'new' ? 'New regime saves you ₹' : 'Old regime saves you ₹') + inr.format(Math.abs(delta));
  const columns = [
    { key: 'new', data: newRegime, title: 'New regime' },
    { key: 'old', data: oldRegime, title: 'Old regime' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
        {columns.map(({ key, data, title }) => {
          const isWinner = winner === key;
          const isSelected = selected === key;
          return (
            <div key={key} style={{
              border: isWinner ? '2px solid var(--credit)' : '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-lg)', background: 'var(--surface)', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h3 style={{ fontSize: 'var(--h3)', lineHeight: 'var(--h3-lh)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)' }}>{title}</h3>
                {isWinner ? <StatusPill tone="credit" label="Lower tax" /> : null}
              </div>
              <LedgerBlock currencyHeader={false} style={{ border: 'none', padding: 0, maxWidth: 'none' }} rows={data.rows} />
              <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--body-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--ink)' }}>Tax with cess</span>
                <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--figure-lg)', fontVariantNumeric: 'tabular-nums lining-nums', color: 'var(--ink)' }}>₹{inr.format(data.tax)}</span>
              </div>
              <button type="button" onClick={() => onSelect && onSelect(key)} style={{
                height: 'var(--control-height)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)',
                background: isSelected ? 'var(--primary)' : 'var(--surface)',
                color: isSelected ? 'var(--surface)' : 'var(--ink)',
                border: '1px solid ' + (isSelected ? 'var(--primary)' : 'var(--neutral-300)'),
              }}>{isSelected ? 'Filing under this regime' : 'File under this regime'}</button>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--ink)' }}>{sentence}</p>
      {switchNote ? <p style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)' }}>{switchNote}</p> : null}
    </div>
  );
}
