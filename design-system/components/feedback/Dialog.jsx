import React from 'react';

export function Dialog({ open, title, description, children, footer, onClose, variant = 'modal' }) {
  const id = React.useMemo(() => 'dlg-' + Math.random().toString(36).slice(2, 8), []);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const sheet = variant === 'sheet';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', alignItems: sheet ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--overlay-backdrop)' }} />
      <div role="dialog" aria-modal="true" aria-labelledby={id + '-t'} aria-describedby={description ? id + '-d' : undefined}
        style={{
          position: 'relative', background: 'var(--surface)', width: sheet ? '100%' : 'min(520px, calc(100% - 32px))',
          borderRadius: sheet ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
          boxShadow: 'var(--elev-overlay)', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          animation: 'nritax-fade var(--motion-panel) both',
        }}>
        <style>{'@keyframes nritax-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 id={id + '-t'} style={{ fontSize: 'var(--h2)', lineHeight: 'var(--h2-lh)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)' }}>{title}</h2>
          {description ? <p id={id + '-d'} style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--neutral-700)' }}>{description}</p> : null}
        </div>
        {children}
        {footer ? <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>{footer}</div> : null}
      </div>
    </div>
  );
}
