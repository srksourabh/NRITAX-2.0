import React from 'react';

export function Select({ label, hint, error, required, options = [], value, onChange, id, disabled }) {
  const rid = React.useMemo(() => id || 'sel-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label ? <label htmlFor={rid} style={{ fontSize: 'var(--label)', lineHeight: 'var(--label-lh)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>
        {label}{required ? <span style={{ color: 'var(--neutral-500)', fontWeight: 400 }}> (required)</span> : null}
      </label> : null}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          id={rid} value={value} disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? rid + '-err' : undefined}
          style={{
            appearance: 'none', WebkitAppearance: 'none', width: '100%',
            height: 'var(--control-height)', padding: '0 36px 0 var(--input-pad-x)',
            background: disabled ? 'var(--neutral-100)' : 'var(--surface)',
            color: disabled ? 'var(--neutral-400)' : 'var(--ink)',
            border: '1px solid ' + (error ? 'var(--notice)' : focus ? 'var(--primary)' : 'var(--neutral-300)'),
            borderRadius: 'var(--radius-sm)', fontSize: 'var(--body)',
            boxShadow: focus ? 'var(--focus-ring)' : 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span aria-hidden="true" style={{
          position: 'absolute', right: '12px', width: '8px', height: '8px',
          borderRight: '1.5px solid var(--neutral-400)', borderBottom: '1.5px solid var(--neutral-400)',
          transform: 'translateY(-2px) rotate(45deg)', pointerEvents: 'none',
        }} />
      </div>
      {error ? <span id={rid + '-err'} role="alert" style={{ fontSize: 'var(--body-sm)', color: 'var(--notice-text)' }}>{error}</span>
        : hint ? <span style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)' }}>{hint}</span> : null}
    </div>
  );
}
