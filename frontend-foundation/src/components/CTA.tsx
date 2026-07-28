export function CTA() {
  return (
    <section className="bg-brand-mist px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl rounded-xl border border-brand-rule bg-brand-surface px-6 py-12 text-center sm:px-10">
        <p className="text-sm font-semibold uppercase text-brand-blue">Ready for first review</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold leading-tight text-brand-ink sm:text-4xl">
          Start with a guided profile, then grow into validation, JSON generation, and ERI filing.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-700">
          This frontend foundation is intentionally focused: a polished landing
          experience, a safe onboarding start, and clear seams for future backend
          integration.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#onboarding"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-brand-blue bg-brand-blue px-7 text-base font-semibold text-brand-surface transition hover:bg-[#093C60] focus-visible:outline-brand-blue"
          >
            Start Filing
          </a>
          <a
            href="#trust"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-brand-surface px-7 text-base font-semibold text-brand-ink transition hover:border-brand-cyan hover:bg-slate-50 focus-visible:outline-brand-blue"
          >
            Review trust model
          </a>
        </div>
      </div>
    </section>
  );
}
