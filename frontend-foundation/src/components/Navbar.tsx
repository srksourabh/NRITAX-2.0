export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-rule bg-brand-surface">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-3" aria-label="NRITAX.AI 2.0 home">
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand-navy font-mono text-sm font-bold text-brand-surface">
            N2
          </span>
          <span className="text-lg font-bold text-brand-ink">NRITAX.AI 2.0</span>
        </a>
        <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <a className="transition hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue" href="#features">Features</a>
          <a className="transition hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue" href="#how-it-works">How it works</a>
          <a className="transition hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue" href="#trust">Security</a>
          <a className="transition hover:text-brand-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue" href="#onboarding">Onboarding</a>
        </div>
        <a
          href="#onboarding"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-blue bg-brand-blue px-5 text-sm font-semibold text-brand-surface transition hover:bg-[#093C60] focus-visible:outline-brand-blue"
        >
          Start Filing
        </a>
      </nav>
    </header>
  );
}
