import { IconBadge } from "./ui/IconBadge";

const features = [
  {
    icon: "spark",
    title: "AI-assisted guidance",
    text: "Guide NRI users through filing decisions with structured, explainable next steps.",
    metric: "RAG-ready"
  },
  {
    icon: "shield",
    title: "Secure data handling",
    text: "Start with minimal collection, explicit consent readiness, and no password capture.",
    metric: "Privacy first"
  },
  {
    icon: "review",
    title: "CA review support",
    text: "Keep the product ready for expert review, premium support, and assisted filing.",
    metric: "Expert path"
  },
  {
    icon: "workflow",
    title: "Filing workflow",
    text: "Turn complex NRI tax preparation into a clear step-by-step preparation path.",
    metric: "API-ready"
  }
] as const;

export function Features() {
  return (
    <section id="features" className="bg-brand-mist px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-brand-blue">Platform capabilities</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-brand-ink sm:text-4xl">
              Built like a filing product, not a generic dashboard.
            </h2>
          </div>
          <p className="max-w-md text-base leading-8 text-slate-700">
            The design uses ledger-paper surfaces, official ink, source-backed
            language, and calm tax-specific status signals.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group animate-rise rounded-xl border border-brand-rule bg-brand-surface p-6 transition hover:border-brand-cyan hover:bg-slate-50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between gap-4">
                <IconBadge icon={feature.icon} tone={index === 2 ? "emerald" : "blue"} />
                <span className="rounded-full border border-brand-rule bg-slate-50 px-3 py-1 font-mono text-xs font-medium text-slate-600">
                  {feature.metric}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-brand-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">{feature.text}</p>
              <div className="mt-6 h-px bg-brand-rule" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
