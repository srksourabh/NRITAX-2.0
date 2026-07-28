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
    <section id="how-it-works" className="bg-brand-surface px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-blue">How it works</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-brand-ink sm:text-4xl">
              A filing timeline with every step named.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              The design system is built around legibility under deadline
              pressure. This flow keeps each step visible without relying on
              learned behaviour.
            </p>
            <div className="mt-6 rounded-xl border border-brand-rule bg-brand-mist p-5 text-sm leading-6 text-slate-700">
              No hidden workflow. No password collection. Backend engines stay
              isolated behind service adapters.
            </div>
          </div>
          <div className="grid gap-0 rounded-xl border border-brand-rule bg-brand-surface">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="grid gap-4 border-b border-brand-rule p-5 last:border-b-0 sm:grid-cols-[48px_1fr]"
              >
                <span className="font-mono text-sm font-semibold text-brand-blue">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-brand-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{step.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
