(function(){
const { BrandLockup, Wordmark, Button, StatusPill } = window.NRITAX20DesignSystem_c86cd4;

function SiteNav({ page, go }) {
  const items = [['home', 'How it works'], ['pricing', 'Pricing'], ['guide', 'Guides']];
  return (
    <header style={{ background: 'var(--ink)', color: 'var(--surface)', height: 'var(--shell-header-height)', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 var(--gutter-mobile)', overflow: 'hidden', borderBottom: '3px solid var(--seal)' }}>
      <button type="button" onClick={() => go('home')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flex: '0 0 auto' }}><BrandLockup /></button>
      <nav style={{ display: 'flex', gap: '20px', flex: '1 1 auto', minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {items.map(([k, l]) => (
          <button key={k} type="button" onClick={() => go(k)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)',
            color: page === k ? 'var(--surface)' : 'rgba(255,255,255,0.72)',
            borderBottom: page === k ? '1px solid var(--surface)' : '1px solid transparent', whiteSpace: 'nowrap', flex: '0 0 auto',
          }}>{l}</button>
        ))}
      </nav>
      <span className="ntx-wide-only" style={{ flex: '0 0 auto' }}><Button size="compact" variant="secondary">Sign in</Button></span>
      <span style={{ flex: '0 0 auto' }}><Button size="compact">Start my return</Button></span>
    </header>
  );
}

function SiteFooter() {
  const { TrustBar } = window.NRITAX20DesignSystem_c86cd4;
  return (
    <footer className="ntx-section" style={{ background: 'var(--primary-800)', color: 'rgba(255,255,255,0.82)' }}>
      <div style={{ maxWidth: 'var(--content-max-app)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <BrandLockup />
            <p style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', maxWidth: '34ch' }}>We file your income tax return in India. Registered e-Return Intermediary.</p>
          </div>
          {[['Product', ['How it works', 'Pricing', 'Expert filing', 'Security']], ['Guides', ['Old vs new regime', 'Form 16 explained', '26AS and AIS', 'Belated returns']], ['Company', ['About', 'Contact', 'Terms', 'Privacy']]].map(([h, links]) => (
            <div key={h} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: 'var(--label)', fontWeight: 'var(--weight-semibold)', color: 'var(--surface)' }}>{h}</span>
              {links.map((l) => <a key={l} href="#" style={{ fontSize: 'var(--body-sm)', color: 'rgba(255,255,255,0.82)', textDecoration: 'none' }}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{ filter: 'invert(1) grayscale(1)', opacity: 0.9 }}>
          <TrustBar marks={[{ name: 'e-Return Intermediary', reference: 'ERIP00XXXX' }, { name: 'ISO/IEC 27001:2022', reference: 'Cert. XXXXXX' }, { name: 'SOC 2 Type II' }, { name: 'AES-256 at rest' }]} />
        </div>
        <p style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--statute)' }}>© 2026 NRITAX 2.0. Figures shown are illustrative. Registration numbers are placeholders pending real credentials.</p>
      </div>
    </footer>
  );
}

Object.assign(window, { SiteNav, SiteFooter });
})();
