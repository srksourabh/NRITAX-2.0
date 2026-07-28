(function(){
const { Card, CardHeader, Button, StatusPill, DeadlineBanner, LedgerBlock, HeroFigure, EmptyState, DataTable } = window.NRITAX20DesignSystem_c86cd4;

function Dashboard({ go }) {
  return (
    <Page title="My returns" kicker="AY 2026-27 · PAN ABCPD1234E" wide>
      <DeadlineBanner days={9} dueDate="31 July 2026" action={<Button onClick={() => go('income')}>Continue my return</Button>} />
      <div className="ntx-grid-sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <CardHeader title="FY 2025-26 · ITR-2" meta="Started 4 June 2026 · saved 2 minutes ago" action={<StatusPill status="review_user" />} />
            <LedgerBlock currencyHeader={false} style={{ border: 'none', padding: 0, maxWidth: 'none' }} rows={[
              { label: 'Gross total income', statute: 'Form 16, AIS', amount: 1447318, head: 'salary' },
              { label: 'Less: Chapter VI-A', statute: 'u/s 80C, 80D', amount: 0 },
              { label: 'Total income (rounded)', statute: 's.288A', amount: 1447320, kind: 'subtotal' },
            ]} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <Button onClick={() => go('income')}>Continue my return</Button>
              <Button variant="secondary" onClick={() => go('documents')}>Add a document</Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Tax already paid" meta="From 26AS, as on 12 June 2026" action={<Button variant="quiet" size="compact">Open 26AS</Button>} />
            {(() => {
              const cols = [{ key: 'd', header: 'Deductor' }, { key: 't', header: 'TAN' }, { key: 'a', header: 'Tax deducted', amount: true }];
              const rows = [{ d: 'Infosys Ltd', t: 'BLRI12345A', a: 104000 }, { d: 'HDFC Bank', t: 'MUMH04567B', a: 8000 }];
              const cap = 'Two deductors. Add a challan if you paid advance tax yourself.';
              return (<>
                <div className="ntx-wide-only"><DataTable columns={cols} rows={rows} caption={cap} /></div>
                <div className="ntx-narrow-only"><DataTable stacked columns={cols} rows={rows} /></div>
              </>);
            })()}
          </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <HeroFigure label="Refund due" amount={8557} tone="credit" note="Estimated on the new regime. Final after processing." />
          </Card>
          <Card>
            <CardHeader title="Earlier returns" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[['AY 2025-26', 'processed', 'Refund ₹4,120'], ['AY 2024-25', 'processed', 'No refund']].map(([y, s, note]) => (
                <div key={y} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--neutral-200)' }}>
                  <span style={{ flex: 1, fontSize: 'var(--body-sm)', color: 'var(--ink)' }}>{y}<br /><span style={{ color: 'var(--neutral-500)' }}>{note}</span></span>
                  <StatusPill status={s} />
                </div>
              ))}
            </div>
          </Card>
          <EmptyState line="No notices against your PAN." action={<Button variant="quiet" size="compact">How we check</Button>} />
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { Dashboard });

})();
