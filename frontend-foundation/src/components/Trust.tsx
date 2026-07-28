import { IconBadge } from "./ui/IconBadge";

const trustItems = [
  {
    icon: "lock",
    label: "Encrypted",
    detail: "Frontend patterns are ready for encrypted transport and secure backend storage once APIs are connected."
  },
  {
    icon: "shield",
    label: "Privacy First",
    detail: "The flow keeps collection minimal and avoids sensitive credential capture."
  },
  {
    icon: "check",
    label: "No Password Storage",
    detail: "The onboarding flow asks only whether the user has Income Tax Department access."
  },
  {
    icon: "link",
    label: "Official Integrations",
    detail: "Future data fetches should use consent-based official APIs and auditable integration paths."
  }
] as const;

export function Trust() {
  return (
    <section id="trust" className="bg-white px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 rounded-[2rem] border border-slate-800 bg-[linear-gradient(145deg,#08111F_0%,#10243E_55%,#123D75_100%)] p-6 text-white shadow-fintech sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase text-sky-300">Trust and security</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Security signals that match the seriousness of taxpayer data.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              NRITAX.AI 2.0 should feel useful from the first click while keeping
              sensitive taxpayer workflows disciplined, explainable, and ready
              for compliance review.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="font-bold text-white">0</p>
                <p className="mt-1 text-slate-300">password fields</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="font-bold text-white">API-ready</p>
                <p className="mt-1 text-slate-300">validation layer</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <article key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
                <IconBadge icon={item.icon} tone="dark" />
                <h3 className="mt-5 text-base font-bold text-white">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
