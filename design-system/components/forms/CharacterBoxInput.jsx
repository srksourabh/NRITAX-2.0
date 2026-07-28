import React from 'react';

const PRESETS = {
  pan: { length: 10, groups: [5, 4, 1], inputMode: 'text', autoCapitalize: 'characters', pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/ },
  tan: { length: 10, groups: [4, 5, 1], inputMode: 'text', autoCapitalize: 'characters', pattern: /^[A-Z]{4}[0-9]{5}[A-Z]$/ },
  aadhaar: { length: 12, groups: [4, 4, 4], inputMode: 'numeric', autoCapitalize: 'off', pattern: /^[0-9]{12}$/ },
  ifsc: { length: 11, groups: [4, 7], inputMode: 'text', autoCapitalize: 'characters', pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
};

export function maskAadhaar(v) {
  const d = String(v || '').replace(/\D/g, '');
  return d.length < 12 ? d : 'XXXX XXXX ' + d.slice(-4);
}

export function CharacterBoxInput({ kind = 'pan', label, hint, error, value = '', onChange, id, name }) {
  const cfg = PRESETS[kind];
  const rid = React.useMemo(() => id || 'cbox-' + Math.random().toString(36).slice(2, 8), [id]);
  const ref = React.useRef(null);
  const [caret, setCaret] = React.useState(-1);
  const clean = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, cfg.length);
  const chars = clean.split('');
  const boxes = [];
  let idx = 0;
  cfg.groups.forEach((size, g) => {
    for (let i = 0; i < size; i++, idx++) {
      const active = caret === idx || (caret === -1 && false);
      const filled = chars[idx] !== undefined;
      boxes.push(
        <div key={idx} aria-hidden="true" style={{
          width: 'var(--charbox-width)', height: 'var(--charbox-height)',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid ' + (error ? 'var(--notice)' : active ? 'var(--primary)' : 'var(--neutral-300)'),
          borderBottom: filled ? '2px solid var(--primary-300)' : undefined,
          background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-figure)', fontSize: 'var(--figure)', color: 'var(--ink)',
          boxShadow: active ? (error ? 'var(--focus-ring-danger)' : 'var(--focus-ring)') : 'none',
          transition: 'border-color var(--motion-instant)',
        }}>{chars[idx] || ''}</div>
      );
    }
    if (g < cfg.groups.length - 1) boxes.push(<span key={'g' + g} aria-hidden="true" style={{ width: 'calc(var(--charbox-group-gap) - var(--charbox-gap))' }} />);
  });
  const valid = clean.length === cfg.length ? cfg.pattern.test(clean) : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label ? <label htmlFor={rid} style={{ fontSize: 'var(--label)', lineHeight: 'var(--label-lh)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>{label}</label> : null}
      <div style={{ position: 'relative' }} onClick={() => ref.current && ref.current.focus()}>
        <div style={{ display: 'flex', gap: 'var(--charbox-gap)', alignItems: 'center' }}>{boxes}</div>
        <input
          ref={ref} id={rid} name={name} value={clean}
          inputMode={cfg.inputMode} autoCapitalize={cfg.autoCapitalize} autoComplete="off"
          maxLength={cfg.length} aria-describedby={error ? rid + '-err' : rid + '-hint'}
          aria-invalid={error ? true : undefined}
          onChange={(e) => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, cfg.length); onChange && onChange(v); setCaret(Math.min(v.length, cfg.length - 1)); }}
          onFocus={() => setCaret(Math.min(clean.length, cfg.length - 1))}
          onBlur={() => setCaret(-1)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, border: 'none', background: 'transparent', font: 'inherit', letterSpacing: '1em', color: 'transparent', caretColor: 'transparent' }}
        />
      </div>
      {error ? (
        <span id={rid + '-err'} role="alert" style={{ fontSize: 'var(--body-sm)', color: 'var(--notice-text)' }}>{error}</span>
      ) : (
        <span id={rid + '-hint'} style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: valid === false ? 'var(--notice-text)' : 'var(--neutral-500)' }}>
          {valid === false ? kind.toUpperCase() + ' format looks wrong. Check the characters against your card.' : hint}
        </span>
      )}
    </div>
  );
}
