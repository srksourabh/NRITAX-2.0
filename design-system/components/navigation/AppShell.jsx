import React from 'react';

/** Circular seal mark — ink disc, seal ring, mono NT / 2.0 (filing-sheet masthead). */
export function SealMark({ size = 36, title = 'NRITAX 2.0' }) {
  const gid = React.useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title} style={{ flex: 'none', display: 'block' }}>
      <circle cx="32" cy="32" r="30" fill="#141C29" stroke="#0D6B5B" strokeWidth="2.5" />
      <circle cx="32" cy="30" r="22" fill={`url(#${gid})`} />
      <text x="32" y="36" textAnchor="middle" fontFamily="ui-monospace,SF Mono,Menlo,monospace" fontSize="16" fontWeight="700" fill="#8FE3D0" letterSpacing="0.04em">NT</text>
      <text x="32" y="48" textAnchor="middle" fontFamily="ui-monospace,SF Mono,Menlo,monospace" fontSize="6.5" fontWeight="600" fill="#6E8FA0" letterSpacing="0.18em">2.0</text>
      <defs>
        <radialGradient id={gid} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#0D6B5B" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0D6B5B" stopOpacity="0.06" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** Brand name in Archivo Expanded + Plex Mono 2.0. Pair with SealMark in chrome. */
export function Wordmark({ color = 'var(--surface)', size = 17 }) {
  return (
    <span style={{
      fontFamily: 'var(--font-display)', fontVariationSettings: 'var(--font-display-settings)',
      fontWeight: 'var(--weight-semibold)', fontSize: size + 'px', letterSpacing: '0.01em',
      color, whiteSpace: 'nowrap', lineHeight: 1,
    }}>NRITAX <span style={{ fontFamily: 'var(--font-figure)', fontWeight: 'var(--weight-medium)', fontSize: size * 0.8 + 'px' }}>2.0</span></span>
  );
}

export function BrandLockup({ color = 'var(--surface)', sealSize = 36, wordSize = 17 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <SealMark size={sealSize} />
      <Wordmark color={color} size={wordSize} />
    </span>
  );
}

export function AppShell({ nav, right, children, footer }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--paper)' }}>
      <header style={{
        height: 'var(--shell-header-height)', flex: '0 0 auto', background: 'var(--ink)',
        color: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0 var(--gutter-mobile)', overflow: 'hidden',
        borderBottom: '3px solid var(--seal)',
      }}>
        <span style={{ flex: '0 0 auto' }}><BrandLockup /></span>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 auto', minWidth: 0, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(nav || []).map((n) => (
            <button key={n.label} type="button" onClick={n.onClick} style={{
              background: n.active ? 'rgba(255,255,255,0.10)' : 'transparent', border: 'none',
              color: n.active ? 'var(--surface)' : 'rgba(255,255,255,0.72)',
              height: 'var(--control-height-compact)', padding: '0 12px', borderRadius: 'var(--radius-control)',
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
