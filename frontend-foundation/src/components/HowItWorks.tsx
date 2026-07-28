const steps = [
  {
    title: "Tell us about yourself",
    detail: "Capture the minimum profile fields needed to begin a secure NRI filing journey."
  },
  {
    title: "Understand your tax requirements",
    detail: "Collect PAN, residency context, and tax regime selection without sensitive passwords."
  },
  {
    title: "Prepare your filing workflow",
    detail: "Route the profile through mock validation and JSON draft adapters for backend readiness."
  },
  {
    title: "Complete filing with confidence",
    detail: "Leave clear space for CA review, official integrations, ERI flow, and filing completion."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-blue">How it works</p>
            <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
              A visual filing timeline from profile to readiness.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              This foundation keeps onboarding simple today while leaving space
              for future tax calculation, document, CA review, and ERI workflows.
            </p>
            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/70 p-5 text-sm leading-6 text-slate-700">
              Designed to keep each tax step explainable before sensitive data
              or official integrations are introduced.
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-7 hidden h-[calc(100%-3.5rem)] w-px bg-blue-100 sm:block" />
            <div className="grid gap-4">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-fintech sm:ml-12"
              >
                <span className="absolute -left-12 top-5 hidden size-10 items-center justify-center rounded-2xl bg-brand-blue text-sm font-bold text-white shadow-soft ring-4 ring-white sm:flex">
                  {index + 1}
                </span>
                <div className="flex gap-4 sm:hidden">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-brand-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <h3 className="text-xl font-bold text-brand-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
