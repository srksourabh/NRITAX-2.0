import React from 'react';

export function Explainer({ term, definition, children }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useMemo(() => 'exp-' + Math.random().toString(36).slice(2, 8), []);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button" aria-expanded={open} aria-controls={id}
        onClick={() => setOpen((v) => !v)} onBlur={() => setOpen(false)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'help', color: 'inherit',
          font: 'inherit', textDecoration: 'underline dotted', textDecorationColor: 'var(--neutral-300)',
          textDecorationThickness: '1px', textUnderlineOffset: '3px',
        }}>{term || children}</button>
      {open ? (
        <span id={id} role="dialog" style={{
          position: 'absolute', zIndex: 20, top: 'calc(100% + 8px)', left: 0, width: 'min(300px, 76vw)',
          background: 'var(--surface)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--elev-raised)', padding: '12px 14px', display: 'block',
          fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-700)',
          fontWeight: 'var(--weight-regular)', textAlign: 'left',
        }}>{definition}</span>
      ) : null}
    </span>
  );
}
