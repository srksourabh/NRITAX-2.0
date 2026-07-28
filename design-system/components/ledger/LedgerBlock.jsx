import React from 'react';
import { StatuteChip } from '../core/StatuteChip.jsx';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const formatFigure = (v) => (typeof v === 'number' ? inr.format(Math.round(v)) : v);

const HEADS = {
  salary: 'var(--head-salary)', house: 'var(--head-house)', capgains: 'var(--head-capgains)',
  business: 'var(--head-business)', other: 'var(--head-other)', foreign: 'var(--head-foreign)',
};

export function LedgerBlock({ rows = [], caption, currencyHeader = true, style }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-none)',
      padding: '20px', maxWidth: 'var(--ledger-max-width)', ...style,
    }}>
      {currencyHeader ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '8px' }}>
          <span style={{ width: 'var(--ledger-amount-col)', textAlign: 'right', fontFamily: 'var(--font-figure)', fontSize: 'var(--statute)', color: 'var(--neutral-500)' }}>₹</span>
        </div>
      ) : null}
      <div role="table" style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((r, i) => <LedgerRow key={i} {...r} />)}
      </div>
      {caption ? <p style={{ marginTop: '12px', fontSize: 'var(--caption)', lineHeight: 'var(--caption-lh)', color: 'var(--neutral-500)' }}>{caption}</p> : null}
    </div>
  );
}

export function LedgerRow({ label, statute, amount, kind = 'row', head, edited, onEditRevert }) {
  const isFinal = kind === 'final';
  const isSub = kind === 'subtotal';
  return (
    <div role="row" style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: 'var(--ledger-row-pad-y) 0',
      borderLeft: head ? '3px solid ' + HEADS[head] : '3px solid transparent',
      paddingLeft: '9px', marginLeft: '-12px',
    }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px' }}>
        <span style={{
          fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--ink)',
          fontWeight: isFinal ? 'var(--weight-semibold)' : isSub ? 'var(--weight-medium)' : 'var(--weight-regular)',
        }}>{label}</span>
        {edited ? (
          <button type="button" onClick={onEditRevert} style={{
            background: 'var(--due-tint)', color: 'var(--due-text)', border: '1px solid var(--due-border)',
            borderRadius: 'var(--radius-xs)', fontSize: 'var(--statute)', fontFamily: 'var(--font-figure)',
            padding: '1px 5px', cursor: 'pointer',
          }}>Edited</button>
        ) : null}
      </div>
      {statute ? <div style={{ flex: '0 0 auto', textAlign: 'right', paddingTop: '2px' }}><StatuteChip>{statute}</StatuteChip></div> : null}
      <div style={{ flex: '0 0 var(--ledger-amount-col)', width: 'var(--ledger-amount-col)' }}>
        {isSub || isFinal ? <Rule double={isFinal} /> : null}
        <span style={{
          display: 'block', textAlign: 'right', fontFamily: 'var(--font-figure)',
          fontVariantNumeric: 'tabular-nums lining-nums',
          fontSize: isFinal ? 'var(--figure-lg)' : 'var(--figure)',
          lineHeight: isFinal ? 'var(--figure-lg-lh)' : 'var(--figure-lh)',
          fontWeight: isFinal ? 'var(--weight-medium)' : 'var(--weight-regular)',
          color: 'var(--ink)',
        }}>{formatFigure(amount)}</span>
      </div>
    </div>
  );
}

function Rule({ double }) {
  return (
    <div aria-hidden="true" style={{ marginBottom: '6px' }}>
      <div style={{ height: '1px', background: double ? 'var(--ink)' : 'var(--neutral-200)' }} />
      {double ? <div style={{ height: '1px', background: 'var(--ink)', marginTop: 'var(--ledger-double-rule-gap)' }} /> : null}
    </div>
  );
}
