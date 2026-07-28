import React from 'react';

export function Checkbox({ label, hint, checked = false, onChange, disabled, id }) {
  const rid = React.useMemo(() => id || 'cb-' + Math.random().toString(36).slice(2, 8), [id]);
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minHeight: '44px', paddingTop: '2px' }}>
      <span style={{ position: 'relative', display: 'inline-flex', width: '20px', height: '20px', marginTop: '11px', flex: '0 0 auto' }}>
        <input
          type="checkbox" id={rid} checked={checked} disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.checked)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ position: 'absolute', inset: 0, margin: 0, opacity: 0, width: '100%', height: '100%' }}
        />
        <span aria-hidden="true" style={{
          width: '20px', height: '20px', borderRadius: 'var(--radius-sm)',
          border: '1px solid ' + (checked ? 'var(--primary)' : 'var(--neutral-300)'),
          background: disabled ? 'var(--neutral-100)' : checked ? 'var(--primary)' : 'var(--surface)',
          boxShadow: focus ? 'var(--focus-ring)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background-color var(--motion-instant), border-color var(--motion-instant)',
        }}>
          {checked ? <span style={{ width: '9px', height: '5px', borderLeft: '2px solid var(--surface)', borderBottom: '2px solid var(--surface)', transform: 'translateY(-1px) rotate(-45deg)' }} /> : null}
        </span>
      </span>
      <label htmlFor={rid} style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '9px', cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <span style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: disabled ? 'var(--neutral-400)' : 'var(--ink)' }}>{label}</span>
        {hint ? <span style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)' }}>{hint}</span> : null}
      </label>
    </div>
  );
}
