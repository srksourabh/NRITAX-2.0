const features = [
  {
    title: "AI-Powered Tax Guidance",
    text: "Guide NRI users through filing decisions with structured, explainable next steps."
  },
  {
    title: "Secure Data Handling",
    text: "Start with minimal collection, explicit consent readiness, and no password capture."
  },
  {
    title: "CA Review Support",
    text: "Keep the product ready for expert review, premium support, and assisted filing."
  },
  {
    title: "Simplified Filing Experience",
    text: "Turn complex NRI tax preparation into a calm, step-by-step workflow."
  }
];

export function Features() {
  return (
    <section id="features" className="bg-slate-50 px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-blue">
            Trust and features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
            Everything a first filing journey needs to feel clear and credible.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            The landing page highlights the core promise: intelligent guidance,
            secure handling, expert review, and a simplified filing path.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="animate-rise rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-blue-200"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-brand-blue">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold text-brand-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
