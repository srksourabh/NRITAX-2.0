type DashboardMockupProps = {
  compact?: boolean;
};

const rows = [
  ["Profile", "Complete", "100%", "bg-brand-credit"],
  ["AIS / 26AS", "Ready", "82%", "bg-brand-blue"],
  ["Computation", "Draft", "68%", "bg-brand-due"],
  ["CA review", "Queued", "42%", "bg-brand-credit"]
];

const ledgerRows = [
  ["Gross income", "AIS", "Rs 14.8L"],
  ["Eligible deductions", "Form 16", "Rs 1.62L"],
  ["Estimated refund", "s.288A", "Rs 8,557"]
];

export function DashboardMockup({ compact = false }: DashboardMockupProps) {
  return (
    <div
      className="rounded-lg border border-brand-rule bg-white p-2 shadow-premium"
      aria-label="NRITAX filing dashboard preview"
    >
      <div className="overflow-hidden rounded-lg border border-brand-rule bg-brand-surface">
        <div className="flex items-center justify-between border-b-2 border-brand-credit bg-brand-navy px-5 py-3 text-white">
          <div>
            <p className="text-caption uppercase tracking-wide text-white/58">ITR-2 / AY 2026-27</p>
            <p className="mt-1 font-heading text-card text-white">Filing command sheet</p>
          </div>
          <span className="rounded-md border border-brand-credit/40 bg-brand-credit/15 px-3 py-1 text-caption text-white">
            Secure
          </span>
        </div>

        <div className={`grid gap-5 p-5 ${compact ? "" : "lg:grid-cols-[0.94fr_1.06fr]"}`}>
          <div className="rounded-lg border border-brand-rule bg-[#F8FAFC] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption text-brand-muted">Mandatory completion</p>
                <p className="mt-2 font-heading text-[32px] font-extrabold leading-none text-brand-ink">78%</p>
                <p className="mt-1 text-caption text-brand-muted">28 of 36 items captured</p>
              </div>
              <div className="grid size-14 place-items-center rounded-full border-2 border-brand-credit bg-brand-surface font-mono text-[12px] font-bold text-brand-credit">
                DONE
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {rows.map(([label, status, progress, color]) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-4 text-caption">
                    <span className="font-semibold text-brand-ink">{label}</span>
                    <span className="text-brand-muted">{status}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-rule">
                    <div className={`h-full rounded-full ${color}`} style={{ width: progress }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="overflow-hidden rounded-lg border border-brand-rule bg-brand-surface shadow-[0_1px_0_rgba(20,26,34,0.04)]">
              <div className="border-b border-brand-rule bg-[#F8FAFC] px-4 py-3">
                <p className="text-caption uppercase tracking-wide text-brand-muted">Traceable computation</p>
              </div>
              <div className="divide-y divide-brand-line">
                {ledgerRows.map(([label, source, amount]) => (
                  <div key={label} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-caption">
                    <div>
                      <p className="font-semibold text-brand-ink">{label}</p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-brand-muted">{source}</p>
                    </div>
                    <p className="font-mono font-bold tabular-nums text-brand-ink">{amount}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[rgba(11,107,255,0.22)] bg-brand-mist p-5 hover:shadow-soft">
              <p className="text-caption uppercase tracking-wide text-brand-blue">Filing assistant</p>
              <p className="mt-2 font-heading text-card text-brand-ink">Document verification pending</p>
              <p className="mt-2 text-body text-brand-muted">
                Validation, JSON generation, CA review, and filing workflow APIs attach through the service layer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
