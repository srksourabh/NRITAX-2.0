import { SectionReveal } from "./SectionReveal";
import { IconBadge } from "./ui/IconBadge";

const stats = [
  ["0", "Passwords collected", "Credential-safe onboarding", "lock"],
  ["6", "Trust controls", "Security, consent, validation, JSON, CA review, privacy", "shield"],
  ["4", "Filing stages", "Profile, income, validation, CA review", "workflow"]
] as const;

export function TrustStrip() {
  return (
    <section className="relative bg-brand-mist px-6 py-10 sm:py-14 lg:px-8 lg:py-[72px]">
      <SectionReveal className="mx-auto max-w-[1280px]">
        <div className="grid gap-5 md:grid-cols-3">
          {stats.map(([value, label, text, icon]) => (
            <div
              key={label}
              className="flex min-h-[106px] gap-4 rounded-lg border border-brand-rule bg-white p-5 shadow-soft"
            >
              <IconBadge icon={icon} tone="blue" />
              <div>
                <p className="font-heading text-[28px] font-extrabold leading-none text-brand-ink">{value}</p>
                <p className="mt-2 font-heading text-[18px] font-bold leading-tight text-brand-ink">{label}</p>
                <p className="mt-1 text-caption text-brand-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
