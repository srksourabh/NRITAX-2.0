(function(){
const { Card, CardHeader, Button, StatusPill, LedgerBlock, TrustBar, Explainer } = window.NRITAX20DesignSystem_c86cd4;

const PLANS = [
  { name: 'Self filing', price: 499, who: 'Salary from one employer, no capital gains.', includes: ['Form 16, 26AS and AIS read for you', 'Both regimes compared', 'e-Filing and e-Verification', 'Refund tracking'] },
  { name: 'Reviewed by a CA', price: 1499, who: 'Multiple employers, capital gains, house property.', includes: ['Everything in self filing', 'A CA checks the return before filing', 'Chat with the same CA until it is processed', 'Notice reply drafting for one notice'], recommended: true },
  { name: 'Expert filed', price: 3999, who: 'Foreign income, presumptive business, or a defective return to fix.', includes: ['A CA prepares the return end to end', 'Schedule FA and foreign asset reporting', 'Advance tax planning for next year', 'Notice handling through the year'] },
];

function PricingScreen() {
  return (
    <div style={{ background: 'var(--paper)' }}>
      <section className="ntx-section" style={{ paddingBottom: '32px' }}>
        <div className="ntx-shell" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h1 className="ntx-display-lg" style={{ color: 'var(--ink)' }}>One price per return</h1>
          <p style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--neutral-700)', maxWidth: '56ch' }}>You pay after you see the computation and before you file. No charge if we cannot file your return.</p>
        </div>
      </section>
      <section className="ntx-section" style={{ paddingTop: 0 }}>
        <div className="ntx-shell" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '16px', alignItems: 'start' }}>
          {PLANS.map((p) => (
            <div key={p.name} style={{
              background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--card-pad)',
              border: p.recommended ? '2px solid var(--primary)' : '1px solid var(--neutral-200)',
              display: 'flex', flexDirection: 'column', gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h2 style={{ fontSize: 'var(--h2)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)' }}>{p.name}</h2>
                {p.recommended ? <StatusPill tone="primary" label="Most returns" /> : null}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--figure-xl)', fontWeight: 'var(--weight-medium)', fontVariantNumeric: 'tabular-nums lining-nums', color: 'var(--ink)' }}>₹{p.price.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: 'var(--body-sm)', color: 'var(--neutral-500)' }}>per return, incl. GST</span>
              </div>
              <p style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-700)' }}>{p.who}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {p.includes.map((i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--ink)' }}>
                    <span aria-hidden="true" style={{ color: 'var(--credit)', fontFamily: 'var(--font-figure)' }}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <Button variant={p.recommended ? 'primary' : 'secondary'} fullWidth>Start with {p.name.toLowerCase()}</Button>
            </div>
          ))}
        </div>
      </section>
      <section className="ntx-section" style={{ paddingTop: 0 }}>
        <div className="ntx-shell ntx-grid-aside">
          <Card>
            <CardHeader title="What a late filing costs" meta="So the deadline is a number, not a mood" />
            <LedgerBlock currencyHeader={false} style={{ border: 'none', padding: 0, maxWidth: 'none' }} rows={[
              { label: 'Late fee, total income above ₹5,00,000', statute: 's.234F', amount: 5000 },
              { label: 'Late fee, total income up to ₹5,00,000', statute: 's.234F', amount: 1000 },
              { label: 'Interest on unpaid tax, per month', statute: 's.234A', amount: '1%' },
            ]} caption="Belated returns for AY 2026-27 close on 31 December 2026." />
          </Card>
          <Card>
            <CardHeader title="Common questions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-700)' }}>
              <p><strong style={{ color: 'var(--ink)' }}>Do I need my <Explainer term="AIS" definition="The Annual Information Statement lists what banks and companies reported against your PAN. We fetch it so interest and dividends are not missed." />?</strong><br />No. We fetch it once you consent.</p>
              <p><strong style={{ color: 'var(--ink)' }}>Can I switch regime after paying?</strong><br />Yes, until the return is filed. The computation updates and the price does not change.</p>
              <p><strong style={{ color: 'var(--ink)' }}>Who sees my documents?</strong><br />Only you, and the CA you are assigned if you choose a reviewed plan.</p>
            </div>
          </Card>
        </div>
      </section>
      <section className="ntx-section" style={{ paddingTop: 0 }}>
        <div className="ntx-shell">
          <TrustBar align="space-between" marks={[{ name: 'e-Return Intermediary', reference: 'ERIP00XXXX' }, { name: 'ISO/IEC 27001:2022', reference: 'Cert. XXXXXX' }, { name: 'SOC 2 Type II' }, { name: 'AES-256 at rest' }]} />
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { PricingScreen });
})();
