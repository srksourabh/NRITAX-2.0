export function CTA() {
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-brand-blue px-6 py-12 text-center shadow-fintech sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
          Ready for first review
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Start with a guided profile, then grow into validation, JSON generation, and ERI filing.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-blue-50">
          This frontend foundation is intentionally focused: a polished landing
          experience, a safe onboarding start, and clear seams for future backend
          integration.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#onboarding"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-brand-blue transition hover:bg-blue-50"
          >
            Start Filing
          </a>
          <a
            href="#trust"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Review trust model
          </a>
        </div>
      </div>
    </section>
  );
}
