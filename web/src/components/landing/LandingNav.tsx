'use client';

import Link from 'next/link';

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#trust', label: 'Trust' },
  { href: '#start', label: 'Onboarding' },
] as const;

export function LandingNav({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <header className="ntx-landing-header">
      <nav className="ntx-landing-header-inner" aria-label="Landing">
        <a href="#top" className="ntx-landing-brand" aria-label="NRITAX 2.0 home">
          <span className="ntx-landing-badge">N2</span>
          <span className="ntx-landing-brand-name">NRITAX 2.0</span>
        </a>
        <div className="ntx-landing-nav">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="ntx-landing-nav-link">
              {item.label}
            </a>
          ))}
        </div>
        <Link href={primaryHref} className="ntx-landing-nav-cta">
          {primaryLabel}
        </Link>
      </nav>
    </header>
  );
}
