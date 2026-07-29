const TRUST = [
  {
    label: 'No portal password',
    detail:
      'We never collect, log or store your Income Tax Department password. If a screen asks for it, that screen is a bug.',
  },
  {
    label: 'Consent before fetches',
    detail:
      'Prefill, DigiLocker and OCR only run when you choose them. Hand entry is always available.',
  },
  {
    label: 'CA review without a restart',
    detail:
      'Complex returns can move to a CA with the same draft: foreign assets, capital gains, or a notice reply.',
  },
  {
    label: 'Statements are not kept',
    detail:
      'Uploaded CAS PDFs are parsed and discarded. PAN and Aadhaar are masked in application logs.',
  },
] as const;

export function LandingTrust() {
  return (
    <section id="trust" className="ntx-section" aria-labelledby="trust-heading">
      <div className="ntx-shell">
        <div className="ntx-landing-trust">
          <div>
            <p className="ntx-landing-kicker ntx-landing-kicker-on-ink">Trust by design</p>
            <h2 id="trust-heading" className="ntx-display-lg mt-3">
              Built around secure, auditable filing preparation
            </h2>
            <p>
              Useful from the first click, and disciplined about taxpayer data. Credential-safe
              onboarding is a hard rule, not a slogan.
            </p>
          </div>
          <div className="ntx-landing-trust-grid">
            {TRUST.map((item) => (
              <article key={item.label}>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
