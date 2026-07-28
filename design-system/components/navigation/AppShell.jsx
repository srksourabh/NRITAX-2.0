import React from 'react';

/** No logo artwork was supplied with the brand materials, so the wordmark is plain type: Archivo Expanded 600. */
export function Wordmark({ color = 'var(--surface)', size = 17 }) {
  return (
    <span style={{
      fontFamily: 'var(--font-display)', fontVariationSettings: 'var(--font-display-settings)',
      fontWeight: 'var(--weight-semibold)', fontSize: size + 'px', letterSpacing: '0.01em',
      color, whiteSpace: 'nowrap', lineHeight: 1,
    }}>NRITAX <span style={{ fontFamily: 'var(--font-figure)', fontWeight: 'var(--weight-medium)', fontSize: size * 0.8 + 'px' }}>2.0</span></span>
  );
}

export function AppShell({ nav, right, children, footer }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--paper)' }}>
      <header style={{
        height: 'var(--shell-header-height)', flex: '0 0 auto', background: 'var(--ink)',
        color: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0 var(--gutter-mobile)', overflow: 'hidden',
      }}>
        <span style={{ flex: '0 0 auto' }}><Wordmark /></span>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 auto', minWidth: 0, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(nav || []).map((n) => (
            <button key={n.label} type="button" onClick={n.onClick} style={{
              background: n.active ? 'rgba(252,253,252,0.10)' : 'transparent', border: 'none',
              color: n.active ? 'var(--surface)' : 'rgba(252,253,252,0.72)',
              height: 'var(--control-height-compact)', padding: '0 12px', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)', cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto',
              transition: 'background-color var(--motion-instant), color var(--motion-instant)',
            }}>{n.label}</button>
          ))}
        </nav>
        <span style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>{right}</span>
      </header>
      <main style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</main>
      {footer}
    </div>
  );
}

export function StickyActionBar({ children, note }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, background: 'var(--surface)', boxShadow: 'var(--elev-sticky)',
      padding: '12px var(--gutter-mobile)', display: 'flex', alignItems: 'center', gap: '12px',
      flexWrap: 'wrap', justifyContent: 'space-between',
    }}>
      {note ? <span style={{ fontSize: 'var(--body-sm)', color: 'var(--neutral-500)' }}>{note}</span> : null}
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>{children}</div>
    </div>
  );
}
