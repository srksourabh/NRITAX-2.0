(function(){
const { Button, MoneyInput, LedgerBlock, RegimeComparison, Card, CardHeader, StatuteChip, Explainer, Acknowledgement, StatusPill } = window.NRITAX20DesignSystem_c86cd4;

const CESS = 0.04;
function newRegimeTax(ti) {
  const slabs = [[400000, 0], [800000, 0.05], [1200000, 0.10], [1600000, 0.15], [2000000, 0.20], [2400000, 0.25]];
  let tax = 0, prev = 0;
  for (const [cap, rate] of slabs) { if (ti > prev) tax += Math.min(ti, cap) > prev ? (Math.min(ti, cap) - prev) * rate : 0; prev = cap; }
  if (ti > 2400000) tax += (ti - 2400000) * 0.30;
  return Math.round(tax * (1 + CESS));
}
function oldRegimeTax(ti) {
  let tax = 0;
  if (ti > 1000000) tax += (ti - 1000000) * 0.30;
  if (ti > 500000) tax += (Math.min(ti, 1000000) - 500000) * 0.20;
  if (ti > 250000) tax += (Math.min(ti, 500000) - 250000) * 0.05;
  return Math.round(tax * (1 + CESS));
}

function HomeScreen({ go }) {
  const [salary, setSalary] = React.useState('1480000');
  const gross = Number(salary || 0);
  const tiNew = Math.max(0, Math.round((gross - 75000) / 10) * 10);
  const tiOld = Math.max(0, Math.round((gross - 50000 - 162000) / 10) * 10);
  const taxNew = newRegimeTax(tiNew), taxOld = oldRegimeTax(tiOld);
  return (
    <div>
      <section className="ntx-section" style={{ background: 'var(--paper)' }}>
        <div className="ntx-shell ntx-grid-hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 className="ntx-display-xl" style={{ color: 'var(--ink)' }}>We file your tax return in India</h1>
            <p style={{ fontSize: '17px', lineHeight: 1.55, color: 'var(--neutral-700)', maxWidth: '44ch' }}>
              Upload Form 16, <Explainer term="26AS" definition="A statement from the department showing tax already deducted against your PAN. We read it so you do not have to type TDS by hand." /> and AIS. Answer plain questions. See both regimes side by side, then file. A CA can take over at any point.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button size="mobilePrimary" onClick={() => go('pricing')}>Start my return</Button>
              <Button size="mobilePrimary" variant="secondary" onClick={() => go('guide')}>Read the regime guide</Button>
            </div>
            <p style={{ fontSize: 'var(--body-sm)', color: 'var(--neutral-500)' }}>Filing for AY 2026-27 is open. Due date 31 July 2026.</p>
          </div>
          <Card>
            <CardHeader title="See your two regimes" meta="Enter one figure. Nothing is stored until you sign in." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <MoneyInput label="Gross salary for FY 2025-26" value={salary} onChange={setSalary} />
              <div aria-live="polite">
                <RegimeComparison selected="new"
                  newRegime={{ tax: taxNew, rows: [{ label: 'Total income', statute: 's.288A', amount: tiNew }, { label: 'Tax before cess', amount: Math.round(taxNew / 1.04) }] }}
                  oldRegime={{ tax: taxOld, rows: [{ label: 'Total income', statute: 's.288A', amount: tiOld }, { label: 'Tax before cess', amount: Math.round(taxOld / 1.04) }] }}
                  switchNote="Old regime assumes ₹1,62,000 of Chapter VI-A deductions. Your real figures replace this once you upload Form 16." />
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="ntx-section" style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
        <div className="ntx-shell ntx-grid-band">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 className="ntx-display-lg" style={{}}>Every figure traces to a line and a section</h2>
            <p style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'rgba(252,253,252,0.82)', maxWidth: '48ch' }}>
              The computation sheet is the product. Each row names where the number came from, so you can check it against the paper in front of you before you file.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <StatuteChip source>Form 16 Part B</StatuteChip><StatuteChip source>26AS</StatuteChip><StatuteChip source>AIS</StatuteChip><StatuteChip>u/s 16(ia)</StatuteChip><StatuteChip>s.288A</StatuteChip>
            </div>
          </div>
          <LedgerBlock rows={[
            { label: 'Gross salary', statute: 'u/s 17(1)', amount: 1480000, head: 'salary' },
            { label: 'Less: standard deduction', statute: 'u/s 16(ia)', amount: 75000 },
            { label: 'Income from salary', amount: 1405000, kind: 'subtotal' },
            { label: 'Income from other sources', statute: 'AIS', amount: 42318, head: 'other' },
            { label: 'Total income (rounded)', statute: 's.288A', amount: 1447320, kind: 'subtotal' },
            { label: 'Less: TDS', statute: '26AS', amount: 112000 },
            { label: 'Refund due', amount: 8557, kind: 'final' },
          ]} caption="A real sheet from a salaried return, figures changed." />
        </div>
      </section>

      <section className="ntx-section" style={{ background: 'var(--paper)' }}>
        <div className="ntx-shell" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <h2 className="ntx-display-lg" style={{ color: 'var(--ink)' }}>Four steps, once a year</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '16px' }}>
            {[['01', 'Upload', 'Photograph Form 16. We read it, along with 26AS and AIS.'],
              ['02', 'Answer', 'Plain questions, no schedule numbers. Character boxes for PAN and Aadhaar so nothing is mistyped.'],
              ['03', 'Compare', 'Both regimes, side by side, with the difference in rupees.'],
              ['04', 'File and verify', 'We file, you verify within 30 days, and we track the refund.']].map(([n, t, d]) => (
              <Card key={n} padding="20px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-figure)', fontSize: 'var(--statute)', color: 'var(--primary)' }}>{n}</span>
                  <span style={{ fontSize: 'var(--h3)', fontWeight: 'var(--weight-semibold)', color: 'var(--ink)' }}>{t}</span>
                  <span style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-700)' }}>{d}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="ntx-section" style={{ background: 'var(--paper)', paddingTop: 0 }}>
        <div className="ntx-shell ntx-grid-band">
          <Acknowledgement ackNumber="284917650120726" filedOn="12 July 2026" itrForm="ITR-2" regime="New" figure="Refund ₹8,557" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 className="ntx-display-lg" style={{ color: 'var(--ink)' }}>You end with a receipt, not a promise</h2>
            <p style={{ fontSize: 'var(--body)', lineHeight: 'var(--body-lh)', color: 'var(--neutral-700)', maxWidth: '46ch' }}>The acknowledgement number is the department's, not ours. We show it the moment it arrives, and we keep the status honest: filed is not verified, and verified is not processed.</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <StatusPill status="filed_unverified" /><StatusPill status="everified" /><StatusPill status="processed" /><StatusPill status="refund_issued" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { HomeScreen });
})();
