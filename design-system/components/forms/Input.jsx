import React from 'react';

export function Input({
  label, hint, error, required, prefix, suffix, id, align = 'left', mono = false,
  value, onChange, ...rest
}) {
  const rid = React.useMemo(() => id || 'in-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--notice)' : focus ? 'var(--primary)' : 'var(--neutral-300)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label ? (
        <label htmlFor={rid} style={{ fontSize: 'var(--label)', lineHeight: 'var(--label-lh)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>
          {label}{required ? <span style={{ color: 'var(--neutral-500)', fontWeight: 400 }}> (required)</span> : null}
        </label>
      ) : null}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)',
        border: '1px solid ' + borderColor, borderRadius: 'var(--radius-sm)',
        padding: '0 var(--input-pad-x)', height: 'var(--control-height)',
        boxShadow: focus ? (error ? 'var(--focus-ring-danger)' : 'var(--focus-ring)') : 'none',
        transition: 'border-color var(--motion-instant)',
      }}>
        {prefix ? <span style={{ color: 'var(--neutral-500)', fontFamily: mono ? 'var(--font-figure)' : 'inherit' }}>{prefix}</span> : null}
        <input
          id={rid} value={value} onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? rid + '-err' : hint ? rid + '-hint' : undefined}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            padding: 'var(--input-pad-y) 0', textAlign: align, color: 'var(--ink)',
            fontFamily: mono ? 'var(--font-figure)' : 'var(--font-ui)',
            fontSize: mono ? 'var(--figure)' : 'var(--body)',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
          {...rest}
        />
        {suffix}
      </div>
      {error ? (
        <span id={rid + '-err'} role="alert" style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--notice-text)' }}>{error}</span>
      ) : hint ? (
        <span id={rid + '-hint'} style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)' }}>{hint}</span>
      ) : null}
    </div>
  );
}
