import React from 'react';

export const FILING_STEPS = ['Your details', 'Income', 'Deductions', 'Taxes paid', 'Review', 'Pay', 'File and verify'];

export function FilingProgress({ steps = FILING_STEPS, current = 0, onStep, compact = false }) {
  if (compact) {
    const pct = ((current + 1) / steps.length) * 100;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>{steps[current]}</span>
          <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--statute)', color: 'var(--neutral-500)' }}>Step {current + 1} of {steps.length}</span>
        </div>
        <div role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={steps.length}
          style={{ height: '4px', borderRadius: 'var(--radius-full)', background: 'var(--neutral-200)', overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: 'var(--primary)', transition: 'width var(--motion-panel)' }} />
        </div>
      </div>
    );
  }
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
      {steps.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <li key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button type="button" disabled={!done && !active} onClick={done && onStep ? () => onStep(i) : undefined}
              aria-current={active ? 'step' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', height: 'var(--control-height-compact)',
                padding: '0 10px', borderRadius: 'var(--radius-md)', border: 'none',
                background: active ? 'var(--info-tint)' : 'transparent',
                color: active ? 'var(--primary)' : done ? 'var(--neutral-700)' : 'var(--neutral-400)',
                fontSize: 'var(--label)', fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                cursor: done ? 'pointer' : 'default',
              }}>
              <span aria-hidden="true" style={{
                width: '18px', height: '18px', borderRadius: 'var(--radius-full)', flex: '0 0 auto',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--credit)' : active ? 'var(--primary)' : 'var(--neutral-100)',
                color: done || active ? 'var(--surface)' : 'var(--neutral-500)',
                fontFamily: 'var(--font-figure)', fontSize: '10px',
              }}>{done ? '✓' : i + 1}</span>
              {s}
            </button>
            {i < steps.length - 1 ? <span aria-hidden="true" style={{ width: '12px', height: '1px', background: 'var(--neutral-200)' }} /> : null}
          </li>
        );
      })}
    </ol>
  );
}
