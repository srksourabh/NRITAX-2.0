(function(){
const { Card, CardHeader, Button, LedgerBlock, Explainer, StatuteChip, DataTable } = window.NRITAX20DesignSystem_c86cd4;

function GuideScreen() {
  return (
    <div style={{ background: 'var(--paper)' }}>
      <article className="ntx-section" style={{ maxWidth: 'var(--content-max-reading)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--statute)', color: 'var(--neutral-500)' }}>Guides · updated 2 June 2026 · 6 min</span>
          <h1 className="ntx-display-lg" style={{ color: 'var(--ink)' }}>Old regime or new regime</h1>
          <p style={{ fontSize: '17px', lineHeight: 1.55, color: 'var(--neutral-700)' }}>The answer depends on one thing: how much you can actually claim under Chapter VI-A. Here is how to check in five minutes.</p>
        </div>
        <p style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--ink)' }}>
          The new regime gives you lower slab rates and a larger standard deduction, and takes away most deductions. The old regime keeps the deductions and charges higher rates. There is no universally better one. There is only a better one for your numbers this year.
        </p>
        <p style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--ink)' }}>
          Start with what you can prove. Add up your <Explainer term="Chapter VI-A" definition="The group of deductions you can claim from your income, like 80C and 80D. They apply under the old regime only." /> claims with receipts in hand, not intentions: provident fund, insurance premiums paid, the home loan principal, medical cover. If that total is under about ₹3,00,000, the new regime is usually lower.
        </p>
        <Card>
          <CardHeader title="The same salary, both ways" meta="Gross salary ₹14,80,000 · FY 2025-26" />
          <div className="ntx-grid-2">
            <div>
              <span style={{ fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>New regime</span>
              <LedgerBlock currencyHeader={false} style={{ border: 'none', padding: 0, maxWidth: 'none' }} rows={[
                { label: 'Standard deduction', statute: 'u/s 16(ia)', amount: 75000 },
                { label: 'Chapter VI-A', statute: 'not available', amount: 0 },
                { label: 'Total income', statute: 's.288A', amount: 1405000, kind: 'subtotal' },
                { label: 'Tax with cess', amount: 99464 },
              ]} />
            </div>
            <div>
              <span style={{ fontSize: 'var(--label)', fontWeight: 'var(--weight-medium)', color: 'var(--neutral-700)' }}>Old regime</span>
              <LedgerBlock currencyHeader={false} style={{ border: 'none', padding: 0, maxWidth: 'none' }} rows={[
                { label: 'Standard deduction', statute: 'u/s 16(ia)', amount: 50000 },
                { label: 'Chapter VI-A claimed', statute: 'u/s 80C, 80D', amount: 162000 },
                { label: 'Total income', statute: 's.288A', amount: 1268000, kind: 'subtotal' },
                { label: 'Tax with cess', amount: 127864 },
              ]} />
            </div>
          </div>
          <p style={{ marginTop: '16px', fontSize: 'var(--body)', color: 'var(--ink)' }}>New regime saves you ₹28,400 on these figures.</p>
        </Card>
        <h2 style={{ fontSize: 'var(--h2)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)' }}>Where the crossover sits</h2>
        <p style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--ink)' }}>
          For most salaried filers the two regimes meet somewhere between ₹3,00,000 and ₹4,25,000 of claimed deductions. Below the crossover the new regime wins; above it the old one does.
        </p>
        {(() => {
          const cols = [{ key: 'g', header: 'Gross salary', amount: true }, { key: 'c', header: 'Deductions where they break even', amount: true }];
          const rows = [{ g: 900000, c: 262500 }, { g: 1200000, c: 312500 }, { g: 1480000, c: 358000 }, { g: 2000000, c: 425000 }];
          return (<>
            <div className="ntx-wide-only"><DataTable columns={cols} rows={rows} caption="Illustrative, assuming no exempt allowances. Your own crossover appears in the app once your documents are read." /></div>
            <div className="ntx-narrow-only"><DataTable stacked columns={cols} rows={rows} /></div>
          </>);
        })()}
        <h2 style={{ fontSize: 'var(--h2)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)' }}>Three things people get wrong</h2>
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--ink)' }}>
          <li>Counting deductions they intend to make rather than ones already paid in the year.</li>
          <li>Forgetting that the employer's regime choice in April does not bind the return in July.</li>
          <li>Choosing the old regime for a ₹300 saving. Under ₹500 the two are the same decision.</li>
        </ol>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <StatuteChip>u/s 115BAC</StatuteChip><StatuteChip>u/s 16(ia)</StatuteChip><StatuteChip>Chapter VI-A</StatuteChip>
        </div>
        <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button>Compare with my own figures</Button>
          <span style={{ fontSize: 'var(--body-sm)', color: 'var(--neutral-500)' }}>Takes one number and about a minute.</span>
        </div>
      </article>
    </div>
  );
}

Object.assign(window, { GuideScreen });
})();
