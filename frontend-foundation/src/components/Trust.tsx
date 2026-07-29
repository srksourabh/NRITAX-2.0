import { SectionReveal } from "./SectionReveal";
import { IconBadge } from "./ui/IconBadge";

const securityItems = [
  [
    "No Password",
    "Portal passwords are never requested.",
    "lock"
  ],
  [
    "Encrypted",
    "Prepared for secure API transport.",
    "shield"
  ],
  [
    "CBDT Validation",
    "Validation engine adapter ready.",
    "check"
  ],
  [
    "CA Review",
    "Expert handoff for complex cases.",
    "review"
  ],
  [
    "Department JSON",
    "JSON generation service boundary ready.",
    "file"
  ],
  [
    "Consent Driven",
    "Designed around explicit user permission.",
    "workflow"
  ]
] as const;

export function Trust() {
  return (
    <section id="trust" className="relative overflow-hidden bg-brand-navy px-6 py-10 text-white sm:py-14 lg:px-8 lg:py-[72px]">
      <div className="relative mx-auto max-w-[1280px]">
        <SectionReveal className="grid gap-5 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <p className="text-caption uppercase tracking-wide text-brand-gold">Security architecture</p>
            <h2 className="mt-3 max-w-xl font-heading text-section text-white">
              Built for sensitive NRI tax data from day one.
            </h2>
            <p className="mt-3 max-w-lg text-body text-white/72">
              NRITAX 2.0 keeps the first workflow deliberately conservative:
              credential-safe, consent-led, and prepared for validated filing outputs.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            {securityItems.map(([title, text, icon]) => (
              <article
                key={title}
                className="min-h-[132px] rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-soft"
              >
                <IconBadge icon={icon} tone="dark" />
                <h3 className="mt-3 font-heading text-[18px] font-bold leading-tight text-white">{title}</h3>
                <p className="mt-1.5 text-caption text-white/68">{text}</p>
              </article>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
