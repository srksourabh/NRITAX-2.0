export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-3" aria-label="NRITAX 2.0 home">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-navy text-sm font-bold text-white shadow-soft">
            N2
          </span>
          <span className="text-lg font-bold tracking-tight text-brand-ink">NRITAX 2.0</span>
        </a>
        <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <a className="transition hover:text-brand-blue" href="#features">Features</a>
          <a className="transition hover:text-brand-blue" href="#how-it-works">How it works</a>
          <a className="transition hover:text-brand-blue" href="#trust">Trust</a>
          <a className="transition hover:text-brand-blue" href="#onboarding">Onboarding</a>
        </div>
        <a
          href="#onboarding"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-blue px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700"
        >
          Start Filing
        </a>
      </nav>
    </header>
  );
}
