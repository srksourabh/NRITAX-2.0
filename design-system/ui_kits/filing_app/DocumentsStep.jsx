(function(){
const { Card, CardHeader, Button, DocumentUpload, TrustBar, FilingProgress, CharacterBoxInput, StickyActionBar } = window.NRITAX20DesignSystem_c86cd4;

function DocumentsStep({ go }) {
  const [pan, setPan] = React.useState('ABCPD1234E');
  return (
    <Page title="Your details" kicker="Step 1 of 7">
      <FilingProgress current={0} onStep={() => {}} />
      <Card>
        <CardHeader title="Who is filing" meta="We read these off your PAN card and Aadhaar" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--field-gap)' }}>
          <CharacterBoxInput kind="pan" label="PAN" value={pan} onChange={setPan} hint="Ten characters, as printed on your card" />
          <CharacterBoxInput kind="aadhaar" label="Aadhaar" value="123412341234" onChange={() => {}} hint="Masked to XXXX XXXX 1234 the moment you leave this field" />
        </div>
      </Card>
      <Card>
        <CardHeader title="Your documents" meta="Form 16, 26AS and AIS cover most salaried returns" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DocumentUpload state="parsed" fileName="Form 16 — FY 2025-26.pdf" fields={[
            { label: 'Gross salary', value: '14,80,000' },
            { label: 'Standard deduction', value: '75,000' },
            { label: 'Professional tax', value: '2,400', uncertain: true },
          ]} />
          <DocumentUpload state="parsing" fileName="AIS — AY 2026-27.pdf" />
          <DocumentUpload state="password" fileName="HDFC statement Apr-Mar.pdf" />
          <DocumentUpload state="idle" />
        </div>
      </Card>
      <TrustBar marks={[{ name: 'e-Return Intermediary', reference: 'ERIP00XXXX' }, { name: 'ISO/IEC 27001:2022', reference: 'Cert. XXXXXX' }, { name: 'AES-256 at rest' }]} />
      <StickyActionBar note="Saved 2 minutes ago">
        <Button variant="secondary" onClick={() => go('dashboard')}>Back</Button>
        <Button onClick={() => go('income')}>Continue to income</Button>
      </StickyActionBar>
    </Page>
  );
}

Object.assign(window, { DocumentsStep });

})();
