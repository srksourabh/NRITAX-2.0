import { IconBadge } from "./ui/IconBadge";

const features = [
  {
    icon: "spark",
    title: "AI-Powered Tax Guidance",
    text: "Guide NRI users through filing decisions with structured, explainable next steps.",
    metric: "RAG-ready"
  },
  {
    icon: "shield",
    title: "Secure Data Handling",
    text: "Start with minimal collection, explicit consent readiness, and no password capture.",
    metric: "Privacy first"
  },
  {
    icon: "review",
    title: "CA Review Support",
    text: "Keep the product ready for expert review, premium support, and assisted filing.",
    metric: "Expert path"
  },
  {
    icon: "workflow",
    title: "Simplified Filing Experience",
    text: "Turn complex NRI tax preparation into a calm, step-by-step workflow.",
    metric: "Guided flow"
  }
] as const;

export function Features() {
  return (
    <section id="features" className="bg-slate-50 px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-brand-blue">Platform capabilities</p>
            <h2 className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
              A premium filing experience with security and expertise at the core.
            </h2>
          </div>
          <p className="max-w-md text-base leading-8 text-slate-600">
            The interface sets the expectation for a modern NRI filing product:
            intelligent, calm, explainable, and ready for backend engines.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group animate-rise rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-fintech"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between gap-4">
                <IconBadge icon={feature.icon} tone={index === 2 ? "emerald" : "blue"} />
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-100">
                  {feature.metric}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-brand-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.text}</p>
              <div className="mt-6 h-px bg-[linear-gradient(90deg,#2563EB,rgba(37,99,235,0))] opacity-0 transition group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
