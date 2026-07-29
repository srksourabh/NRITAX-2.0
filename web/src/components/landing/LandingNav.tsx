'use client';

import Link from 'next/link';

const NAV = [
  { href: '#compare', label: 'Compare regimes' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#trust', label: 'Trust' },
  { href: '#start', label: 'Start' },
] as const;

export function LandingNav({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <header className="ntx-shell-header sticky top-0 z-40">
      <a href="#top" className="ntx-brand">
        NRITAX<span className="ntx-brand-version"> 2.0</span>
      </a>
      <nav className="ntx-landing-nav" aria-label="Landing">
        {NAV.map((item) => (
          <a key={item.href} href={item.href} className="ntx-landing-nav-link">
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link href={primaryHref} className="ntx-btn ntx-btn-primary ntx-btn-compact">
          {primaryLabel}
        </Link>
      </div>
    </header>
  );
}
