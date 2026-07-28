(function(){
const NS = window.NRITAX20DesignSystem_c86cd4;

function Page({ title, kicker, children, wide }) {
  return (
    <div className="ntx-page" style={{ maxWidth: wide ? 'var(--content-max-app)' : '820px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {kicker ? <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--statute)', color: 'var(--neutral-500)' }}>{kicker}</span> : null}
        <h1 className="ntx-display-sm" style={{ color: 'var(--ink)' }}>{title}</h1>
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <h2 style={{ fontSize: 'var(--h3)', lineHeight: 'var(--h3-lh)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)' }}>{children}</h2>;
}

Object.assign(window, { Page, SectionLabel, NS });

})();
