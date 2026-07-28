import React from 'react';
import { StatuteChip } from '../core/StatuteChip.jsx';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const formatINR = (n) => inr.format(Math.round(Number(n) || 0));

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function under100(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); }
function under1000(n) { const h = Math.floor(n / 100), r = n % 100; return [h ? ONES[h] + ' hundred' : '', r ? under100(r) : ''].filter(Boolean).join(' '); }

/** Indian-system words: crore, lakh, thousand, hundred. */
export function amountInWords(value) {
  let n = Math.round(Number(value) || 0);
  if (n === 0) return 'Zero';
  const parts = [];
  const cr = Math.floor(n / 10000000); n %= 10000000;
  const lk = Math.floor(n / 100000); n %= 100000;
  const th = Math.floor(n / 1000); n %= 1000;
  if (cr) parts.push(under1000(cr) + ' crore');
  if (lk) parts.push(under100(lk) + ' lakh');
  if (th) parts.push(under100(th) + ' thousand');
  if (n) parts.push(under1000(n));
  const s = parts.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MoneyInput({ label, hint, error, required, value = '', onChange, source, onSourceClick, id, disabled }) {
  const rid = React.useMemo(() => id || 'money-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  const raw = String(value).replace(/[^0-9.]/g, '');
  const display = focus ? raw : raw === '' ? '' : formatINR(raw);
  const num = Number(raw || 0);
  const borderColor = error ? 'var(--notice)' : focus ? 'var(--primary)' : 'var(--neutral-300)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label ? (
        <label htmlFor={rid} style={{ fontSize: 'var(--label)', lineHeight: 'var(--label-lh)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>
          {label}{required ? <span style={{ color: 'var(--neutral-500)', fontWeight: 400 }}> (required)</span> : null}
        </label>
      ) : null}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: disabled ? 'var(--neutral-100)' : 'var(--surface)',
        border: '1px solid ' + borderColor, borderRadius: 'var(--radius-sm)',
        padding: '0 var(--input-pad-x)', height: 'var(--control-height)',
        boxShadow: focus ? (error ? 'var(--focus-ring-danger)' : 'var(--focus-ring)') : 'none',
      }}>
        <span aria-hidden="true" style={{ color: 'var(--neutral-500)', fontFamily: 'var(--font-figure)', fontSize: 'var(--figure)' }}>₹</span>
        <input
          id={rid} inputMode="decimal" disabled={disabled} value={display}
          onChange={(e) => onChange && onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? rid + '-err' : rid + '-words'}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            textAlign: 'right', fontFamily: 'var(--font-figure)', fontSize: 'var(--figure)',
            fontVariantNumeric: 'tabular-nums lining-nums', color: 'var(--ink)', padding: 'var(--input-pad-y) 0',
          }}
        />
        {source ? <StatuteChip source onClick={onSourceClick}>{source}</StatuteChip> : null}
      </div>
      {error ? (
        <span id={rid + '-err'} role="alert" style={{ fontSize: 'var(--body-sm)', color: 'var(--notice-text)' }}>{error}</span>
      ) : (
        <span id={rid + '-words'} style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)' }}>
          {num >= 100000 ? amountInWords(num) : hint}
        </span>
      )}
    </div>
  );
}
