import React from 'react';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function DataTable({ columns = [], rows = [], stacked = false, caption, rowAction }) {
  if (stacked) {
    const lead = columns.find((c) => c.amount) || columns[0];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--figure-lg)', fontVariantNumeric: 'tabular-nums lining-nums', color: 'var(--ink)' }}>
              ₹{inr.format(r[lead.key])}
            </span>
            {columns.filter((c) => c.key !== lead.key).map((c) => (
              <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: 'var(--body-sm)' }}>
                <span style={{ color: 'var(--neutral-500)' }}>{c.header}</span>
                <span style={{ color: 'var(--ink)', fontFamily: c.amount ? 'var(--font-figure)' : 'var(--font-ui)', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  {c.amount ? '₹' + inr.format(r[c.key]) : r[c.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {caption ? <caption style={{ captionSide: 'bottom', textAlign: 'left', padding: '12px 16px', fontSize: 'var(--caption)', color: 'var(--neutral-500)' }}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{
                position: 'sticky', top: 0, background: 'var(--neutral-50)', textAlign: c.amount ? 'right' : 'left',
                padding: '10px 16px', fontSize: 'var(--label)', lineHeight: 'var(--label-lh)',
                fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)',
                borderBottom: '1px solid var(--neutral-200)', whiteSpace: 'nowrap',
              }}>{c.header}</th>
            ))}
            {rowAction ? <th scope="col" style={{ position: 'sticky', top: 0, background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)', width: '44px' }}><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Actions</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? 'var(--surface)' : 'var(--neutral-50)' }}>
              {columns.map((c) => (
                <td key={c.key} style={{
                  padding: '10px 16px', textAlign: c.amount ? 'right' : 'left',
                  fontFamily: c.amount ? 'var(--font-figure)' : 'var(--font-ui)',
                  fontSize: c.amount ? 'var(--figure)' : 'var(--body-sm)',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  color: 'var(--ink)', borderBottom: '1px solid var(--neutral-200)',
                }}>{c.amount ? '₹' + inr.format(r[c.key]) : r[c.key]}</td>
              ))}
              {rowAction ? <td style={{ padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid var(--neutral-200)' }}>{rowAction(r, i)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
