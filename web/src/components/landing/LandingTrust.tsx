const TRUST = [
  {
    label: 'Ephemeral credentials',
    detail:
      'Optional e-Filing fetch uses your portal password only for that job, in transit over HTTPS, then wipes it. We do not keep it for later use.',
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
              Useful from the first click, and disciplined about taxpayer data. Encrypted,
              ephemeral credential handling is a hard rule, not a slogan.
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
