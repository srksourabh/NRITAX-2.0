import { useEffect, useState } from "react";

export function Navbar() {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setHasScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-brand-rule text-brand-ink backdrop-blur-xl ${
        hasScrolled ? "bg-white/90 shadow-soft" : "bg-white/95"
      }`}
    >
      <nav>
        <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-5 px-6 lg:px-8">
        <a href="#top" className="flex min-w-0 shrink-0 items-center gap-3 rounded-lg focus-visible:outline-brand-blue" aria-label="NRITAX home">
          <span className="relative shrink-0 rounded-lg bg-white">
            <img
              src="/nritax-logo-cropped.jpeg"
              alt="NRITAX"
              className="h-9 w-auto max-w-[158px] object-contain sm:max-w-[176px]"
            />
          </span>
          <span className="hidden min-w-0 border-l border-brand-rule pl-3 xl:block">
            <span className="block text-[12px] font-bold uppercase tracking-[0.12em] text-brand-blue">For NRIs worldwide</span>
            <span className="mt-1 block text-caption leading-5 text-brand-muted">Premium Indian tax filing</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 text-nav text-brand-muted lg:flex">
          <NavLink href="#features">Product</NavLink>
          <NavLink href="#how-it-works">How it Works</NavLink>
          <NavLink href="#trust">Security</NavLink>
          <NavLink href="#showcase">CA Assistance</NavLink>
          <NavLink href="#contact">Contact</NavLink>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="#contact"
            className="hidden h-10 items-center justify-center rounded-lg border border-brand-rule bg-brand-surface px-5 text-button text-brand-ink shadow-soft hover:border-brand-blue hover:text-brand-blue focus-visible:outline-brand-blue sm:inline-flex"
          >
            Login
          </a>
          <a
            href="#onboarding"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-blue px-5 text-button text-white shadow-soft hover:bg-[#0757D7] focus-visible:outline-brand-blue"
          >
            Start Filing
          </a>
        </div>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="relative py-2 hover:text-brand-blue focus-visible:outline-brand-blue"
    >
      {children}
    </a>
  );
}
