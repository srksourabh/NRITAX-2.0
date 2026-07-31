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
    <section id="features" className="ntx-section ntx-landing-alt" aria-labelledby="features-heading">
      <div className="ntx-shell">
        <div className="max-w-2xl">
          <p className="ntx-landing-kicker">Trust and features</p>
          <h2 id="features-heading" className="ntx-display-lg mt-3 text-[var(--ink)]">
            Everything a first filing journey needs to feel clear and credible
          </h2>
          <p className="ntx-landing-section-lede">
            Intelligent guidance, secure onboarding, CA review when you need it, and a calm
            step-by-step filing path that already runs for AY 2026-27.
          </p>
        </div>
        <div className="ntx-landing-feature-grid">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className="ntx-landing-feature ntx-landing-rise"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
