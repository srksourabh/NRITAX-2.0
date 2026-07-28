export function CTA() {
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:py-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#10243E_0%,#2563EB_100%)] px-6 py-12 text-center shadow-fintech sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(14,165,233,0.26),transparent_34%)]" />
        <div className="relative">
        <p className="text-sm font-semibold uppercase text-blue-100">Ready for first review</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold text-white sm:text-4xl">
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
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-brand-blue shadow-soft transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Start Filing
          </a>
          <a
            href="#trust"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-7 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Review trust model
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}
