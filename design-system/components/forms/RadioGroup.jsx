import React from 'react';

export function RadioGroup({ label, hint, name, options = [], value, onChange }) {
  const gid = React.useMemo(() => name || 'rg-' + Math.random().toString(36).slice(2, 8), [name]);
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label ? <legend style={{ padding: 0, marginBottom: '6px', fontSize: 'var(--label)', lineHeight: 'var(--label-lh)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>{label}</legend> : null}
      {hint ? <span style={{ fontSize: 'var(--body-sm)', color: 'var(--neutral-500)', marginBottom: '4px' }}>{hint}</span> : null}
      {options.map((o) => <Radio key={o.value} name={gid} option={o} checked={value === o.value} onChange={onChange} />)}
    </fieldset>
  );
}

function Radio({ name, option, checked, onChange }) {
  const rid = name + '-' + option.value;
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minHeight: '44px' }}>
      <span style={{ position: 'relative', display: 'inline-flex', width: '20px', height: '20px', marginTop: '11px', flex: '0 0 auto' }}>
        <input type="radio" id={rid} name={name} checked={checked} value={option.value}
          onChange={() => onChange && onChange(option.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ position: 'absolute', inset: 0, margin: 0, opacity: 0, width: '100%', height: '100%' }} />
        <span aria-hidden="true" style={{
          width: '20px', height: '20px', borderRadius: 'var(--radius-full)',
          border: '1px solid ' + (checked ? 'var(--primary)' : 'var(--neutral-300)'),
          background: 'var(--surface)', boxShadow: focus ? 'var(--focus-ring)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {checked ? <span style={{ width: '10px', height: '10px', borderRadius: 'var(--radius-full)', background: 'var(--primary)' }} /> : null}
        </span>
      </span>
      <label htmlFor={rid} style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '9px', cursor: 'pointer' }}>
        <span style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--ink)' }}>{option.label}</span>
        {option.hint ? <span style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-500)' }}>{option.hint}</span> : null}
      </label>
    </div>
  );
}
