import React from 'react';
import { Button } from '../core/Button.jsx';

export function ExpertPanel({ expert, messages = [], open = true, variant = 'drawer', onClose, onSend }) {
  const [draft, setDraft] = React.useState('');
  if (!open) return null;
  const drawer = variant === 'drawer';
  return (
    <aside aria-label="Your tax expert" style={{
      display: 'flex', flexDirection: 'column',
      width: drawer ? '400px' : '100%', maxWidth: '100%',
      background: 'var(--surface)',
      borderLeft: drawer ? '1px solid var(--neutral-200)' : 'none',
      borderTop: drawer ? 'none' : '1px solid var(--neutral-200)',
      borderRadius: drawer ? 0 : 'var(--radius-xl) var(--radius-xl) 0 0',
      boxShadow: drawer ? 'none' : 'var(--elev-overlay)',
      height: '100%', minHeight: 0,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--neutral-200)' }}>
        <span aria-hidden="true" style={{
          width: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: 'var(--primary-50)',
          color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-figure)', fontSize: 'var(--body-sm)', flex: '0 0 auto',
        }}>{expert.initials}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'var(--body)', fontWeight: 'var(--weight-medium)', color: 'var(--ink)' }}>{expert.name}</span>
          <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--statute)', color: 'var(--neutral-500)' }}>
            {expert.credential} · {expert.lastActive}
          </span>
        </div>
        {onClose ? <Button variant="quiet" size="compact" onClick={onClose}>Close</Button> : null}
      </header>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'you' ? 'flex-end' : 'flex-start', maxWidth: '85%',
            background: m.from === 'you' ? 'var(--primary-50)' : 'var(--neutral-50)',
            border: '1px solid ' + (m.from === 'you' ? 'var(--info-border)' : 'var(--neutral-200)'),
            color: 'var(--ink)', borderRadius: 'var(--radius-md)', padding: '10px 12px',
            fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)',
          }}>
            {m.text}
            {m.at ? <div style={{ marginTop: '4px', fontSize: 'var(--caption)', color: 'var(--neutral-500)' }}>{m.at}</div> : null}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--neutral-200)', padding: '12px 20px', display: 'flex', gap: '8px' }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about your return"
          aria-label="Message your tax expert"
          style={{
            flex: 1, minWidth: 0, height: 'var(--control-height)', padding: '0 var(--input-pad-x)',
            border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)', fontSize: 'var(--body)',
          }} />
        <Button onClick={() => { if (draft.trim() && onSend) { onSend(draft.trim()); setDraft(''); } }}>Send</Button>
      </div>
    </aside>
  );
}
