(function(){
const { Card, CardHeader, Button, Acknowledgement, StatusPill, RadioGroup, FilingProgress } = window.NRITAX20DesignSystem_c86cd4;

function FiledScreen({ go }) {
  const [how, setHow] = React.useState('aadhaar');
  return (
    <Page title="File and verify" kicker="Step 7 of 7">
      <FilingProgress current={6} onStep={() => {}} />
      <Acknowledgement ackNumber="284917650120726" filedOn="12 July 2026" itrForm="ITR-2" regime="New" figure="Refund ₹12,536" />
      <Card>
        <CardHeader title="Verify within 30 days" meta="An unverified return is not a filed return" action={<StatusPill status="filed_unverified" />} />
        <RadioGroup label="How do you want to verify?" value={how} onChange={setHow} options={[
          { value: 'aadhaar', label: 'Aadhaar OTP', hint: 'Fastest. Needs the mobile linked to your Aadhaar.' },
          { value: 'net', label: 'Net banking', hint: 'Through your bank\u2019s income tax portal link.' },
          { value: 'dsc', label: 'Digital signature' },
        ]} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <Button>Send the OTP</Button>
          <Button variant="secondary" onClick={() => go('dashboard')}>Back to my returns</Button>
        </div>
      </Card>
      <Card>
        <CardHeader title="What happens next" />
        <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--body-sm)', lineHeight: 'var(--body-sm-lh)', color: 'var(--neutral-700)' }}>
          <li>You verify. The status changes to e-Verified.</li>
          <li>The department processes the return, usually in two to six weeks.</li>
          <li>If the refund is confirmed, it is credited to HDFC ****4412 and the status changes to Refund credited.</li>
        </ol>
      </Card>
    </Page>
  );
}

Object.assign(window, { FiledScreen });

})();
