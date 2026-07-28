import { IconBadge } from "./ui/IconBadge";

const trustItems = [
  {
    icon: "lock",
    label: "Encrypted",
    detail: "Frontend patterns are ready for encrypted transport and secure backend storage once APIs are connected."
  },
  {
    icon: "shield",
    label: "Privacy first",
    detail: "The flow keeps collection minimal and avoids sensitive credential capture."
  },
  {
    icon: "check",
    label: "No password storage",
    detail: "The onboarding flow asks only whether the user has Income Tax Department access."
  },
  {
    icon: "link",
    label: "Official integrations",
    detail: "Future data fetches should use consent-based official APIs and auditable integration paths."
  }
] as const;

export function Trust() {
  return (
    <section id="trust" className="bg-brand-surface px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 rounded-xl border border-brand-navy bg-brand-navy p-6 text-brand-surface sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase text-[#C9E0EF]">Trust and security</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-brand-surface sm:text-4xl">
              Security signals that match the seriousness of taxpayer data.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              The product should feel disciplined, auditable, and ready for
              compliance review from the first click.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-white/15 bg-white/10 p-4">
                <p className="font-mono font-bold text-brand-surface">0</p>
                <p className="mt-1 text-slate-300">password fields</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/10 p-4">
                <p className="font-mono font-bold text-brand-surface">API</p>
                <p className="mt-1 text-slate-300">validation ready</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <article key={item.label} className="rounded-xl border border-white/15 bg-white/10 p-5 transition hover:border-[#C9E0EF]">
                <IconBadge icon={item.icon} tone="dark" />
                <h3 className="mt-5 text-base font-semibold text-brand-surface">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
