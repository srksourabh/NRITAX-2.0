const heroStats = [
  ["PAN", "Identifier-safe onboarding"],
  ["26AS", "Future source-backed checks"],
  ["ITR", "JSON preparation ready"]
];

const trustBadges = ["AI-assisted", "CA review path", "No password storage", "Government ready"];

const ledgerRows = [
  ["Profile status", "Draft", "01"],
  ["Tax regime", "Selected by you", "02"],
  ["Validation engine", "Mock connected", "03"],
  ["JSON draft", "API-ready", "04"]
];

export function Hero() {
  return (
    <section id="top" className="bg-brand-mist px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="animate-rise">
          <div className="flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-brand-rule bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-blue"
              >
                {badge}
              </span>
            ))}
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-brand-ink sm:text-5xl lg:text-6xl">
            We prepare your NRI tax filing journey in India.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            Start with a secure profile, see each filing step clearly, and keep
            the path ready for validation, JSON preparation, CA review, and
            official filing integrations.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#onboarding"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-brand-blue bg-brand-blue px-7 text-base font-semibold text-brand-surface transition hover:bg-[#093C60] focus-visible:outline-brand-blue"
            >
              Start my filing profile
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-brand-surface px-7 text-base font-semibold text-brand-ink transition hover:border-brand-cyan hover:bg-slate-50 focus-visible:outline-brand-blue"
            >
              See the workflow
            </a>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {heroStats.map(([value, label]) => (
              <div key={value} className="rounded-xl border border-brand-rule bg-brand-surface p-4">
                <dt className="font-mono text-lg font-bold text-brand-ink">{value}</dt>
                <dd className="mt-1 text-sm text-slate-600">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-rise rounded-xl border border-brand-rule bg-brand-surface p-4 [animation-delay:120ms]">
          <div className="border-b border-brand-rule bg-brand-navy px-5 py-4 text-brand-surface">
            <p className="font-mono text-xs text-slate-300">NRITAX.AI 2.0</p>
            <p className="mt-1 text-2xl font-bold">Filing preparation sheet</p>
          </div>
          <div className="p-5">
            <div className="grid gap-3">
              {ledgerRows.map(([label, value, statute]) => (
                <div key={label} className="grid grid-cols-[1fr_auto_40px] items-center gap-4 border-b border-brand-rule py-3">
                  <span className="text-sm font-medium text-brand-ink">{label}</span>
                  <span className="text-right text-sm text-slate-700">{value}</span>
                  <span className="text-right font-mono text-xs text-brand-blue">{statute}</span>
                </div>
              ))}
              <div className="mt-2 border-y-2 border-brand-ink py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-brand-ink">Next action</span>
                  <span className="text-right font-mono text-lg font-semibold text-brand-credit">
                    Review
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Each future figure should trace to a source, section, or backend
              engine result before filing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
