(function(){
const { Card, CardHeader, Button, FilingProgress, StickyActionBar, LedgerBlock, HeroFigure, RegimeComparison, Dialog, StatusPill } = window.NRITAX20DesignSystem_c86cd4;

const newRows = [
  { label: 'Total income', statute: 's.288A', amount: 1447320 },
  { label: 'Tax on total income', amount: 95638 },
  { label: 'Add: cess 4%', amount: 3826 },
];
const oldRows = [
  { label: 'Total income', statute: 's.288A', amount: 1285320 },
  { label: 'Tax on total income', amount: 122946 },
  { label: 'Add: cess 4%', amount: 4918 },
];

function ReviewStep({ go }) {
  const [regime, setRegime] = React.useState('new');
  const [ask, setAsk] = React.useState(false);
  return (
    <Page title="Review" kicker="Step 5 of 7" wide>
      <FilingProgress current={4} onStep={() => {}} />
      <div className="ntx-grid-aside">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card>
            <CardHeader title="Which regime" meta="You can switch until you file" action={<StatusPill status="ready_to_file" />} />
            <RegimeComparison selected={regime} onSelect={(r) => { setRegime(r); if (r === 'old') setAsk(true); }}
              newRegime={{ tax: 99464, rows: newRows }} oldRegime={{ tax: 127864, rows: oldRows }}
              switchNote="Switching to the old regime brings back 4 deductions worth ₹1,62,000." />
          </Card>
          <Card>
            <CardHeader title="Computation of total income" meta="Every row traces to a section or a document" />
            <LedgerBlock rows={[
              { label: 'Gross salary', statute: 'u/s 17(1)', amount: 1480000, head: 'salary' },
              { label: 'Less: standard deduction', statute: 'u/s 16(ia)', amount: 75000 },
              { label: 'Income from salary', amount: 1405000, kind: 'subtotal' },
              { label: 'Income from other sources', statute: 'AIS', amount: 42318, head: 'other', edited: true },
              { label: 'Gross total income', amount: 1447318, kind: 'subtotal' },
              { label: 'Less: Chapter VI-A', statute: 'not available', amount: 0 },
              { label: 'Total income (rounded)', statute: 's.288A', amount: 1447320, kind: 'subtotal' },
              { label: 'Tax on total income', amount: 95638 },
              { label: 'Add: health and education cess 4%', amount: 3826 },
              { label: 'Less: TDS', statute: '26AS', amount: 112000 },
              { label: 'Refund due', amount: 12536, kind: 'final' },
            ]} caption="Rounded under s.288A and s.288B. Nothing here is abbreviated to lakh or crore." />
          </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card><HeroFigure label="Refund due" amount={12536} tone="credit" note="Credited to HDFC ****4412 after the department processes this return." /></Card>
          <Card>
            <CardHeader title="Before you file" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['Bank account validated', 'credit'], ['Aadhaar linked to PAN', 'credit'], ['One AIS entry unmatched', 'due']].map(([l, t]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', fontSize: 'var(--body-sm)' }}>
                  <span style={{ color: 'var(--ink)' }}>{l}</span><StatusPill tone={t} label={t === 'credit' ? 'Done' : 'Check'} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Dialog open={ask} onClose={() => setAsk(false)} title="Switch to the old regime?"
        description="This brings back 4 deductions worth ₹1,62,000 and raises your tax by ₹28,400."
        footer={<><Button variant="secondary" onClick={() => { setRegime('new'); setAsk(false); }}>Keep the new regime</Button><Button onClick={() => setAsk(false)}>Switch</Button></>} />
      <StickyActionBar note={regime === 'new' ? 'Filing under the new regime' : 'Filing under the old regime'}>
        <Button variant="secondary" onClick={() => go('income')}>Back</Button>
        <Button onClick={() => go('filed')}>File my return</Button>
      </StickyActionBar>
    </Page>
  );
}

Object.assign(window, { ReviewStep });

})();
