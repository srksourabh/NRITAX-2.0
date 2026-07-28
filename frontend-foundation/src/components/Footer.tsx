export function Footer() {
  return (
    <footer className="bg-brand-navy px-4 py-10 text-brand-surface sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-surface font-mono text-sm font-bold text-brand-blue">
              N2
            </span>
            <p className="text-lg font-bold">NRITAX.AI 2.0</p>
          </div>
          <p className="mt-1 text-sm text-blue-100">
            Frontend foundation for the NRI income tax filing platform.
          </p>
        </div>
        <p className="max-w-sm text-sm leading-6 text-blue-100">
          Frontend foundation. Backend validation, JSON generation, and ERI integrations pending.
        </p>
      </div>
    </footer>
  );
}
