import { SectionReveal } from "./SectionReveal";
import { IconBadge } from "./ui/IconBadge";

const previewCards = [
  ["Tax Summary", "Rs 14.8L", "Income captured", "file"],
  ["Estimated Refund", "Rs 8,557", "Section 288A ready", "check"],
  ["Validation Status", "Ready", "No password required", "shield"],
  ["Department JSON", "Prepared", "Service adapter connected", "workflow"]
] as const;

export function ProductShowcase() {
  return (
    <section id="showcase" className="relative overflow-hidden px-6 py-10 sm:py-14 lg:px-8 lg:py-[72px]">
      <div className="absolute inset-0 bg-brand-mist" />
      <div className="mx-auto grid max-w-[1280px] gap-5 lg:grid-cols-12 lg:items-center">
        <SectionReveal className="relative lg:col-span-7">
          <div className="overflow-hidden rounded-lg border border-brand-rule bg-brand-surface p-4 shadow-premium">
            <div className="rounded-lg border border-brand-rule bg-brand-navy p-5 text-white">
              <p className="text-caption uppercase tracking-wide text-brand-gold">Regime preview</p>
              <h3 className="mt-2 font-heading text-card">Old vs New regime readiness</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <RegimeCard title="Old Regime" amount="Rs 1.62L" label="Deductions identified" active />
                <RegimeCard title="New Regime" amount="Rs 0" label="Simplified slab preference" />
              </div>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {previewCards.map(([title, value, label, icon]) => (
                <div
                  key={title}
                  className="min-h-[132px] rounded-lg border border-brand-rule bg-white p-5 shadow-soft"
                >
                  <IconBadge icon={icon} />
                  <p className="mt-3 text-caption uppercase tracking-wide text-brand-muted">{title}</p>
                  <p className="mt-2 font-heading text-card text-brand-ink">{value}</p>
                  <p className="mt-1 text-body text-brand-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
        <SectionReveal className="relative lg:col-span-5 lg:pl-3">
          <p className="text-caption uppercase tracking-wide text-brand-blue">Regime and filing preview</p>
          <h2 className="mt-3 max-w-[700px] font-heading text-section text-brand-ink">
            Show users a clear tax position before they commit.
          </h2>
          <p className="mt-4 max-w-[700px] text-body-lg text-brand-muted">
            NRITAX 2.0 presents filing readiness like enterprise software: concise totals,
            validation status, regime context, JSON readiness, and CA review checkpoints.
          </p>
          <div className="mt-5 rounded-lg border border-brand-rule bg-white p-5 shadow-soft">
            <p className="font-heading text-card text-brand-ink">Progress tracker</p>
            <div className="mt-5 grid gap-3">
              {["Profile", "Income", "Validation", "CA review"].map((item, index) => (
                <div key={item}>
                  <div className="flex items-center justify-between text-caption">
                    <span className="font-semibold text-brand-ink">{item}</span>
                    <span className="text-brand-muted">{index < 2 ? "Complete" : "Ready"}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-brand-line">
                    <div className="h-full rounded-full bg-brand-blue" style={{ width: `${90 - index * 14}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

function RegimeCard({ title, amount, label, active = false }: { title: string; amount: string; label: string; active?: boolean }) {
  return (
    <div className={`rounded-lg border p-5 ${active ? "border-brand-blue bg-white text-brand-ink" : "border-white/15 bg-white/[0.06] text-white"}`}>
      <p className={`text-caption uppercase tracking-wide ${active ? "text-brand-blue" : "text-white/56"}`}>{title}</p>
      <p className="mt-3 font-heading text-card">{amount}</p>
      <p className={`mt-1 text-caption ${active ? "text-brand-muted" : "text-white/64"}`}>{label}</p>
    </div>
  );
}
