import React from 'react';

/** d > 45 → 'quiet' | 15..45 → 'inline' | 4..14 → 'due' | 0..3 → 'notice' | d < 0 → 'belated' */
export function deadlineTier(days) {
  if (days < 0) return 'belated';
  if (days <= 3) return 'notice';
  if (days <= 14) return 'due';
  if (days <= 45) return 'inline';
  return 'quiet';
}

const TONES = {
  inline: { background: 'var(--draft-tint)', color: 'var(--draft-text)', border: 'var(--draft-border)' },
  due: { background: 'var(--due-tint)', color: 'var(--due-text)', border: 'var(--due-border)' },
  notice: { background: 'var(--notice-tint)', color: 'var(--notice-text)', border: 'var(--notice-border)' },
  belated: { background: 'var(--notice-tint)', color: 'var(--notice-text)', border: 'var(--notice-border)' },
};

export function DeadlineBanner({ days, dueDate, hoursLeft, lateFee, revisedDeadline, action }) {
  const tier = deadlineTier(days);
  if (tier === 'quiet') {
    return (
      <p style={{ fontSize: 'var(--body-sm)', color: 'var(--neutral-500)' }}>
        Due date <span style={{ fontFamily: 'var(--font-figure)', fontVariantNumeric: 'tabular-nums lining-nums' }}>{dueDate}</span>
      </p>
    );
  }
  const t = TONES[tier];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      background: t.background, border: '1px solid ' + t.border, color: t.color,
      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
    }}>
      {tier === 'belated' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
          <span style={{ fontSize: 'var(--body)', fontWeight: 'var(--weight-medium)' }}>The due date of {dueDate} has passed. You can still file a belated return under s.139(4).</span>
          <span style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)' }}>
            Late fee under s.234F: <span style={{ fontFamily: 'var(--font-figure)', fontVariantNumeric: 'tabular-nums lining-nums' }}>₹{lateFee}</span>. Belated returns close on {revisedDeadline}.
          </span>
        </div>
      ) : (
        <>
          <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--figure-lg)', lineHeight: 1, fontVariantNumeric: 'tabular-nums lining-nums' }}>{days}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: '200px' }}>
            <span style={{ fontSize: 'var(--body)', fontWeight: 'var(--weight-medium)' }}>
              {days === 1 ? 'day' : 'days'} left to file for FY 2025-26
            </span>
            <span style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)' }}>
              Due {dueDate}{tier === 'notice' && hoursLeft != null ? ', about ' + hoursLeft + ' hours left' : ''}
            </span>
          </div>
        </>
      )}
      {action}
    </div>
  );
}
