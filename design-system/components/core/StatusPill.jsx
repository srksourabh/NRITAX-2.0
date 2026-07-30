import React from 'react';

export const FILING_STATUSES = {
  draft: { label: 'Draft', tone: 'draft' },
  docs_pending: { label: 'Documents needed', tone: 'due' },
  parsing: { label: 'Reading your documents', tone: 'info' },
  review_user: { label: 'Ready for your review', tone: 'due' },
  review_expert: { label: 'With your tax expert', tone: 'info' },
  ready_to_file: { label: 'Ready to file', tone: 'primary' },
  payment_due: { label: 'Tax payment pending', tone: 'due' },
  filed_unverified: { label: 'Filed, verify within 30 days', tone: 'due' },
  everified: { label: 'e-Verified', tone: 'credit' },
  processed: { label: 'Processed by the department', tone: 'credit' },
  refund_issued: { label: 'Refund credited', tone: 'credit' },
  defective: { label: 'Defective return, s.139(9)', tone: 'notice' },
  notice_received: { label: 'Notice received', tone: 'notice' },
  demand_raised: { label: 'Demand raised', tone: 'notice' },
};

const tones = {
  credit: { background: 'var(--credit-tint)', color: 'var(--credit-text)', border: '1px solid var(--credit-border)' },
  due: { background: 'var(--due-tint)', color: 'var(--due-text)', border: '1px solid var(--due-border)' },
  notice: { background: 'var(--notice-tint)', color: 'var(--notice-text)', border: '1px solid var(--notice-border)' },
  info: { background: 'var(--info-tint)', color: 'var(--info-text)', border: '1px solid var(--info-border)' },
  primary: { background: 'var(--info-tint)', color: 'var(--primary)', border: '1px solid var(--info-border)' },
  draft: { background: 'var(--draft-tint)', color: 'var(--draft-text)', border: '1px solid var(--draft-border)' },
};

const DOTS = { credit: 'var(--credit)', due: 'var(--due)', notice: 'var(--notice)', info: 'var(--primary-200)', primary: 'var(--primary-200)', draft: 'var(--neutral-300)' };
const ON_INK_DOTS = { credit: '#8FE3D0', due: '#D89A3C', notice: '#F08279', info: 'var(--primary-200)', primary: 'var(--primary-200)', draft: 'var(--neutral-300)' };

export function StatusPill({ status, tone, label, dot = false, onInk = false }) {
  const resolved = status ? FILING_STATUSES[status] : null;
  const key = tone || (resolved ? resolved.tone : 'draft');
  const t = onInk
    ? { background: 'rgba(255,255,255,0.10)', color: 'var(--surface)', border: '1px solid rgba(255,255,255,0.28)' }
    : tones[key];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px', height: '24px', padding: '0 10px',
      borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-ui)', fontSize: '12px',
      fontWeight: 'var(--weight-medium)', lineHeight: 1, whiteSpace: 'nowrap', ...t,
    }}>
      {dot || onInk ? <span aria-hidden="true" style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', flex: '0 0 auto', background: onInk ? ON_INK_DOTS[key] : 'currentColor' }} /> : null}
      {label || (resolved ? resolved.label : status)}
    </span>
  );
}
