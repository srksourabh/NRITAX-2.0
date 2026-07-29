const heroStats = [
  ["AI-guided", "NRI tax preparation"],
  ["Secure", "Credential-safe onboarding"],
  ["CA-ready", "Review support path"]
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,#EFF6FF_0%,rgba(255,255,255,0)_100%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-rise">
          <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-brand-blue shadow-soft">
            Premium fintech filing experience for NRIs
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">
            Simplify Your NRI Tax Filing with AI
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Prepare, review, and manage your Indian income tax filing journey
            with intelligent guidance, secure workflows, and future CA-assisted
            filing support.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#onboarding"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-blue px-7 text-base font-semibold text-white shadow-fintech transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Start Filing
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-7 text-base font-semibold text-brand-ink transition hover:border-brand-blue hover:text-brand-blue"
            >
              See workflow
            </a>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {heroStats.map(([value, label]) => (
              <div key={value} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <dt className="text-lg font-bold text-brand-ink">{value}</dt>
                <dd className="mt-1 text-sm text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="animate-rise rounded-[2rem] border border-slate-200 bg-white p-4 shadow-fintech [animation-delay:120ms]">
          <div className="rounded-[1.5rem] bg-[linear-gradient(145deg,#10243E_0%,#123D75_100%)] p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-blue-100">Filing Journey</p>
                <p className="mt-1 text-2xl font-bold">NRI ITR Workspace</p>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                Secure
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {["Profile created", "Tax context captured", "Regime preference selected", "Credential status checked"].map(
                (item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-blue">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-blue-50">{item}</span>
                  </div>
                )
              )}
            </div>
            <div className="mt-6 rounded-2xl bg-white p-5 text-brand-ink">
              <p className="text-sm font-semibold text-slate-500">Next milestone</p>
              <p className="mt-2 text-xl font-bold">Guided filing workflow</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Future integrations can connect consent, validation, JSON
                generation, CA review, and ERI filing readiness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
