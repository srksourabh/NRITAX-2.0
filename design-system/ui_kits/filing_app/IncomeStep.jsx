(function(){
const { Card, CardHeader, Button, MoneyInput, Select, Checkbox, FilingProgress, StickyActionBar, LedgerBlock, Explainer, StatuteChip } = window.NRITAX20DesignSystem_c86cd4;

function IncomeStep({ go }) {
  const [salary, setSalary] = React.useState('1480000');
  const [other, setOther] = React.useState('42318');
  const gross = Number(salary || 0) + Number(other || 0);
  return (
    <Page title="Income" kicker="Step 2 of 7">
      <FilingProgress current={1} onStep={() => {}} />
      <div className="ntx-grid-aside">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <CardHeader title="Salary" meta="Read from Form 16 Part B" action={<StatuteChip source>Form 16</StatuteChip>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--field-gap)' }}>
              <MoneyInput label="Gross salary" value={salary} onChange={setSalary} source="Form 16" required />
              <MoneyInput label="Exempt allowances" value="0" onChange={() => {}} hint="HRA, LTA and similar. Only under the old regime." />
              <Select label="Employer type" options={[{ value: 'other', label: 'Other than government' }, { value: 'gov', label: 'Central or state government' }]} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Other sources" meta="Interest, dividends and small receipts" action={<StatuteChip source>AIS</StatuteChip>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--field-gap)' }}>
              <MoneyInput label="Savings and deposit interest" value={other} onChange={setOther} source="AIS" />
              <Checkbox label="I had income from house property this year" hint="Rent received, or interest on a home loan you want to set off" onChange={() => {}} />
              <Checkbox label="I sold shares, mutual funds or property" hint="Adds the capital gains schedule" onChange={() => {}} />
            </div>
          </Card>
          <p style={{ fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-700)' }}>
            Anything we read from <Explainer term="AIS" definition="The Annual Information Statement. It lists what banks and companies reported against your PAN, so interest and dividends do not have to be typed by hand." /> can be edited. Your figure wins, and we keep the parsed value so you can revert.
          </p>
        </div>
        <Card>
          <CardHeader title="As it stands" meta="Updates as you type" />
          <div aria-live="polite">
            <LedgerBlock currencyHeader={false} style={{ border: 'none', padding: 0, maxWidth: 'none' }} rows={[
              { label: 'Income from salary', statute: 'u/s 17(1)', amount: Number(salary || 0), head: 'salary' },
              { label: 'Income from other sources', statute: 'AIS', amount: Number(other || 0), head: 'other' },
              { label: 'Gross total income', amount: gross, kind: 'subtotal' },
            ]} />
          </div>
        </Card>
      </div>
      <StickyActionBar note="Saved just now">
        <Button variant="secondary" onClick={() => go('documents')}>Back</Button>
        <Button onClick={() => go('review')}>Continue to deductions</Button>
      </StickyActionBar>
    </Page>
  );
}

Object.assign(window, { IncomeStep });

})();
