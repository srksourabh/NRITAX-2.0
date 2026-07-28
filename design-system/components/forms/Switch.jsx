import React from 'react';

export function Switch({ label, hint, checked = false, onChange, disabled, id }) {
  const rid = React.useMemo(() => id || 'sw-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minHeight: '44px' }}>
      <label htmlFor={rid} style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <span style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: disabled ? 'var(--neutral-400)' : 'var(--ink)' }}>{label}</span>
        {hint ? <span style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)' }}>{hint}</span> : null}
      </label>
      <span style={{ position: 'relative', flex: '0 0 auto', width: '44px', height: '26px' }}>
        <input type="checkbox" role="switch" id={rid} checked={checked} disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.checked)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ position: 'absolute', inset: 0, margin: 0, opacity: 0, width: '100%', height: '100%' }} />
        <span aria-hidden="true" style={{
          display: 'block', width: '44px', height: '26px', borderRadius: 'var(--radius-full)',
          background: disabled ? 'var(--neutral-100)' : checked ? 'var(--primary)' : 'var(--neutral-300)',
          boxShadow: focus ? 'var(--focus-ring)' : 'none',
          transition: 'background-color var(--motion-quick)',
        }} />
        <span aria-hidden="true" style={{
          position: 'absolute', top: '3px', left: checked ? '21px' : '3px',
          width: '20px', height: '20px', borderRadius: 'var(--radius-full)', background: 'var(--surface)',
          transition: 'left var(--motion-quick)',
        }} />
      </span>
    </div>
  );
}
