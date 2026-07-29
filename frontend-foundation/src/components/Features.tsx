import { IconBadge } from "./ui/IconBadge";
import { SectionReveal } from "./SectionReveal";

const features = [
  {
    icon: "spark",
    title: "Guided Tax Workspace",
    text: "Guide NRIs through filing decisions with verified context, structured questions, and explainable next steps."
  },
  {
    icon: "shield",
    title: "Smart ITR Validation",
    text: "Prepare the UI for Sourabh Sir's validation engine with clear error, warning, and review states."
  },
  {
    icon: "file",
    title: "JSON Tax Filing Engine",
    text: "Connect frontend data into the future JSON preparation engine without duplicating backend logic."
  },
  {
    icon: "link",
    title: "Investment Data Integration",
    text: "Designed for future Demat, mutual fund, DigiLocker, and approved third-party data connections."
  },
  {
    icon: "review",
    title: "CA Review Workflow",
    text: "Route complex NRI profiles to expert review while keeping progress transparent for users and CAs."
  }
] as const;

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-brand-mist px-6 py-10 sm:py-14 lg:px-8 lg:py-[72px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionReveal className="relative max-w-[700px]">
          <p className="text-caption uppercase tracking-wide text-brand-blue">Product</p>
          <h2 className="mt-3 font-heading text-section text-brand-ink">
            Premium infrastructure for global tax confidence.
          </h2>
          <p className="mt-4 text-body-lg text-brand-muted">
            NRITAX 2.0 combines guided filing, tax expertise, and secure product design for a high-trust NRI filing journey.
          </p>
        </SectionReveal>

        <div className="relative mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group flex h-full min-h-[188px] flex-col rounded-lg border border-brand-rule bg-brand-surface p-6 shadow-soft hover:border-brand-blue hover:shadow-fintech"
            >
              <IconBadge icon={feature.icon} tone={index === 4 ? "emerald" : index === 3 ? "cyan" : "blue"} />
              <h3 className="mt-4 font-heading text-card text-brand-ink">{feature.title}</h3>
              <p className="mt-2 line-clamp-2 text-body text-brand-muted">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
