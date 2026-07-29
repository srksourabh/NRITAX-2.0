import { SectionReveal } from "./SectionReveal";

const testimonials = [
  {
    quote: "The experience feels calm and credible. It explains the filing journey without asking for sensitive credentials.",
    name: "Founder review note",
    role: "Product readiness"
  },
  {
    quote: "The onboarding flow is simple enough for NRIs but structured enough for validation, CA review, and filing workflows.",
    name: "CA workflow review",
    role: "Tax operations"
  },
  {
    quote: "The product direction now feels enterprise-ready, with the right security signals before backend integrations arrive.",
    name: "Platform review",
    role: "Engineering"
  }
];

export function Testimonials() {
  return (
    <section className="bg-brand-mist px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionReveal className="max-w-[700px]">
          <p className="text-caption uppercase text-brand-blue">Testimonials</p>
          <h2 className="mt-3 font-heading text-section text-brand-ink">
            Built to earn confidence quickly.
          </h2>
        </SectionReveal>
        <div className="mt-6 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {testimonials.map((item) => (
            <SectionReveal key={item.name} className="flex h-full flex-col rounded-lg border border-brand-rule bg-brand-surface p-5 shadow-soft sm:p-6">
              <p className="text-body-lg text-brand-muted">"{item.quote}"</p>
              <div className="mt-auto border-t border-brand-rule pt-5">
                <p className="font-heading text-card text-brand-ink">{item.name}</p>
                <p className="mt-1 text-caption text-brand-muted">{item.role}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
