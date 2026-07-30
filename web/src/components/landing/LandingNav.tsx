'use client';

import Link from 'next/link';

import { NritaxSeal } from '@/components/brand/NritaxSeal';

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#prefill', label: 'Import prefill' },
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
      <div className="ntx-landing-header-inner">
        <a href="#top" className="ntx-landing-brand" aria-label="NRITAX 2.0 home">
          <NritaxSeal size={44} className="ntx-landing-seal" />
          <span className="ntx-landing-mark">
            <b>NRITAX 2.0 · AY 2026-27</b>
            <span>NRI ITR-2 / ITR-3 · prefill in, departmental JSON out</span>
          </span>
        </a>
        <nav className="ntx-landing-nav" aria-label="Landing">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="ntx-landing-nav-link">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ntx-landing-acts">
          <a href="#prefill" className="ntx-btn-mast">
            Import prefill
          </a>
          <a href="#how-it-works" className="ntx-btn-mast ntx-btn-mast-ghost">
            Validate path
          </a>
          <Link href={primaryHref} className="ntx-btn-mast ntx-btn-mast-pri">
            {primaryLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
