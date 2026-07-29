const FEATURES = [
  {
    title: 'AI review on the finished return',
    text: 'A second pass flags missing schedules, inconsistent heads and residency traps before you download the JSON.',
  },
  {
    title: 'No portal password, ever',
    text: 'We never ask for or store your Income Tax Department password. Phase 1 ends with a departmental JSON you upload yourself.',
  },
  {
    title: 'CA review when you need it',
    text: 'Complex NRI cases can route to a CA without restarting the return: foreign income, capital gains, or a notice to answer.',
  },
  {
    title: 'Helpers that stay optional',
    text: 'Prefill JSON, DigiLocker, Form 16 OCR and mutual-fund CAS fill schedules when available. Hand entry always works.',
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="features" className="ntx-section" aria-labelledby="features-heading">
      <div className="ntx-shell">
        <p className="ntx-landing-kicker">What you get</p>
        <h2 id="features-heading" className="ntx-display-lg mt-3 text-[var(--ink)]">
          Guidance, security and a filing path that stays honest
        </h2>
        <p className="ntx-landing-section-lede">
          Intelligent guidance, secure onboarding, CA review when you need it, and a calm
          step-by-step filing path that already runs for AY 2026-27.
        </p>
        <div className="ntx-landing-feature-grid">
          {FEATURES.map((feature, index) => (
            <article key={feature.title} className="ntx-panel ntx-landing-feature">
              <span className="ntx-landing-step-num">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
