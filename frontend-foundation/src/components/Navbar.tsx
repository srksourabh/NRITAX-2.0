export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-3" aria-label="NRITAX.AI 2.0 home">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#10243E,#2563EB)] text-sm font-bold text-white shadow-soft ring-1 ring-blue-100">
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
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-blue px-5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
        >
          Start Filing
        </a>
      </nav>
    </header>
  );
}
