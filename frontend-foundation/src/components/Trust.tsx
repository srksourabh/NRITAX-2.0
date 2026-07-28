const trustItems = [
  {
    label: "No password collection",
    detail: "The onboarding flow asks only whether the user has Income Tax Department access. It never asks for portal passwords."
  },
  {
    label: "Consent-first architecture",
    detail: "Future data fetches should be tied to explicit consent, audit trails, and official integration paths."
  },
  {
    label: "CA review ready",
    detail: "The flow is structured so complex cases can be routed to CA-assisted review before filing."
  },
  {
    label: "Filing workflow separation",
    detail: "Guidance, validation, JSON generation, and filing submission can evolve as separate implementation layers."
  }
];

export function Trust() {
  return (
    <section id="trust" className="bg-white px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-fintech sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
              Trust by design
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built around secure, auditable filing preparation.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              NRITAX.AI 2.0 should feel useful from the first click while keeping
              sensitive taxpayer workflows disciplined, explainable, and ready
              for compliance review.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <article key={item.label} className="rounded-3xl border border-white/10 bg-white/8 p-5">
                <h3 className="text-base font-bold text-white">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
