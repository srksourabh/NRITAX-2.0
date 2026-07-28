const heroStats = [
  ["Fast", "Guided onboarding"],
  ["Secure", "No password storage"],
  ["CA Reviewed", "Expert-ready workflow"]
];

const trustBadges = [
  "AI-powered NRI Tax Filing",
  "Government-ready JSON path",
  "Privacy-first design"
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_85%_5%,rgba(14,165,233,0.16),transparent_32%),linear-gradient(180deg,#F8FBFF_0%,rgba(255,255,255,0)_78%)]" />
      <div className="absolute left-1/2 top-24 hidden h-72 w-72 -translate-x-1/2 rounded-full border border-blue-100 bg-white/30 blur-3xl lg:block" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="animate-rise">
          <div className="flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-blue-100 bg-white/85 px-3 py-2 text-xs font-semibold text-brand-blue shadow-soft backdrop-blur"
              >
                {badge}
              </span>
            ))}
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold text-brand-ink sm:text-5xl lg:text-6xl">
            AI-powered NRI tax filing, built for secure Indian compliance.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Prepare, review, and manage your filing journey with a premium
            workflow for NRIs: fast onboarding, CA-reviewed paths, secure data
            handling, and government-ready filing preparation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#onboarding"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-blue px-7 text-base font-semibold text-white shadow-fintech transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
            >
              Start Filing
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white/90 px-7 text-base font-semibold text-brand-ink shadow-soft transition hover:-translate-y-0.5 hover:border-brand-blue hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
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
        <div className="animate-rise rounded-[2rem] border border-white/70 bg-white/70 p-3 shadow-fintech backdrop-blur [animation-delay:120ms]">
          <div className="rounded-[1.5rem] bg-[linear-gradient(145deg,#0B172A_0%,#123D75_58%,#2563EB_100%)] p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-blue-100">Secure filing command center</p>
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
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 text-brand-ink">
                <p className="text-sm font-semibold text-slate-500">Next milestone</p>
                <p className="mt-2 text-xl font-bold">Guided filing</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                <p className="text-sm font-semibold text-blue-100">Backend ready</p>
                <p className="mt-2 text-xl font-bold">Validation + JSON</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
