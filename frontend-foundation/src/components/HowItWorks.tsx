import { SectionReveal } from "./SectionReveal";
import { IconBadge } from "./ui/IconBadge";

const steps = [
  ["Profile", "Capture residency, country, PAN availability, and filing readiness.", "review"],
  ["Income", "Organize salary, house property, capital gains, foreign income, and other sources.", "file"],
  ["Validation", "Prepare clean data for rule checks, tax computation, and department JSON.", "shield"],
  ["CA Review", "Route sensitive NRI cases into expert review before final submission.", "check"]
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white px-6 py-10 sm:py-14 lg:px-8 lg:py-[72px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionReveal className="text-center">
          <p className="text-caption uppercase tracking-wide text-brand-blue">How it works</p>
          <h2 className="mx-auto mt-3 max-w-[700px] font-heading text-section text-brand-ink">
            A premium visual journey from profile to ITR submission.
          </h2>
        </SectionReveal>

        <SectionReveal className="mt-6 rounded-lg border border-brand-rule bg-brand-mist p-5 shadow-premium">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-rule bg-brand-surface px-4 py-3">
            <span className="text-caption uppercase tracking-wide text-brand-muted">NRITAX filing path</span>
            <span className="rounded-md bg-[rgba(25,195,125,0.10)] px-3 py-1 text-caption text-brand-credit">Consent based</span>
          </div>
          <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([step, text, icon], index) => (
              <div
                key={step}
                className="group relative flex h-full min-h-[168px] flex-col rounded-lg border border-brand-rule bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] hover:border-brand-blue hover:shadow-fintech"
              >
                {index < steps.length - 1 ? (
                  <span className="absolute -right-3 top-12 hidden h-px w-6 bg-brand-rule lg:block" />
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <IconBadge icon={icon} tone={index > 4 ? "emerald" : "blue"} />
                  <span className="font-mono text-[12px] font-bold text-brand-blue">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-3 font-heading text-card text-brand-ink">{step}</h3>
                <p className="mt-2 text-body text-brand-muted">{text}</p>
                <span className="mt-auto pt-3 text-caption font-semibold text-brand-blue">
                  {index < steps.length - 1 ? "Continue" : "Ready for review"}
                </span>
              </div>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
