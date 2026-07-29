export function CTA() {
  return (
    <section className="bg-white px-6 py-24 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-lg border border-brand-rule bg-brand-navy px-6 py-12 text-center shadow-premium sm:px-8">
        <div className="relative mx-auto max-w-4xl">
          <p className="text-caption uppercase tracking-wide text-brand-gold">Ready for founder review</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-heading text-section text-white">
            Start with a guided profile, then grow into validation, JSON generation, and ERI filing.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body text-white/76">
            This frontend foundation is intentionally focused: a polished landing
            experience, a safe onboarding start, and clear seams for future backend
            integration.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#onboarding"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-blue px-6 text-button text-white shadow-soft hover:bg-[#0757D7] focus-visible:outline-white sm:px-8"
            >
              Start Your Tax Journey
            </a>
            <a
              href="#trust"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 bg-white/[0.06] px-6 text-button text-white hover:bg-white/12 focus-visible:outline-white sm:px-8"
            >
              Review trust model
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
