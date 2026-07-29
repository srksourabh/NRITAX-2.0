import { DashboardMockup } from "./DashboardMockup";

const trustBadges = ["Secure Filing", "NRI Focused", "CA Ready", "Privacy First"];

const heroStats = [
  [8, "", "guided filing stages"],
  [0, "", "passwords collected"],
  [100, "%", "consent-led flow"]
] as const;

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-brand-rule bg-white px-6 py-10 sm:py-14 lg:px-8 lg:py-[72px]">
      <div className="absolute inset-0 bg-white" />

      <div className="relative mx-auto grid max-w-[1280px] gap-5 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-lg border border-brand-rule bg-white px-4 py-2 text-caption uppercase tracking-wide text-brand-blue shadow-soft">
            <span className="size-2 rounded-full bg-brand-credit" />
            NRITAX 2.0 / AY 2026-27
          </div>
          <h1 className="mt-5 max-w-3xl font-heading text-[40px] font-extrabold leading-[1.04] text-brand-ink sm:text-[48px] lg:text-hero">
            Complete Your NRI Tax Filing with Confidence
          </h1>
          <p className="mt-4 max-w-xl text-[18px] font-[450] leading-7 text-brand-muted">
            A secure, CA-assisted filing platform for NRIs who need clarity, verified calculations, and a polished path from profile to submission.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <a
              href="#onboarding"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-blue px-6 text-button text-white shadow-glow hover:bg-[#0757D7] focus-visible:outline-brand-blue"
            >
              Start Your Tax Journey
            </a>
            <a
              href="#showcase"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-brand-rule bg-white px-6 text-button text-brand-ink shadow-soft hover:border-brand-blue hover:text-brand-blue focus-visible:outline-brand-blue"
            >
              Talk to a CA Expert
            </a>
          </div>

          <div className="mt-5 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-lg border border-brand-rule bg-white px-3 py-2.5 text-center text-caption text-brand-muted shadow-[0_1px_0_rgba(15,23,42,0.04)]"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="mt-5 grid max-w-2xl gap-2.5 sm:grid-cols-3">
            {heroStats.map(([value, suffix, label]) => (
              <div
                key={label}
                className="rounded-lg border border-brand-rule bg-white p-3.5 shadow-soft"
              >
                <p className="font-heading text-[24px] font-extrabold leading-none text-brand-ink">
                  {value}{suffix}
                </p>
                <p className="mt-1.5 text-caption text-brand-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl lg:col-span-7 lg:max-w-none">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
