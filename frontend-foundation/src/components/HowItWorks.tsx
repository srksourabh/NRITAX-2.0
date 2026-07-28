const steps = [
  "Tell us about yourself",
  "Understand your tax requirements",
  "Prepare your filing workflow",
  "Complete filing with confidence"
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-blue">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
              A guided flow from profile to filing readiness.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              This foundation keeps onboarding simple today while leaving space
              for future tax calculation, document, CA review, and ERI workflows.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-brand-blue">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-xl font-bold text-brand-ink">{step}</h3>
                <div className="mt-5 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-blue"
                    style={{ width: `${(index + 1) * 25}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
