import Link from 'next/link';

import { ITD_PORTAL_HOME, ITD_PORTAL_LABEL } from '@/lib/itd/portal';

export function LandingCta({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <section className="ntx-section" aria-labelledby="cta-heading">
      <div className="ntx-shell">
        <div className="ntx-landing-cta-band">
          <p className="ntx-landing-kicker ntx-landing-kicker-on-primary">Ready when you are</p>
          <h2 id="cta-heading" className="ntx-display-lg mt-3">
            Start with a guided profile, then open the live filing wizard
          </h2>
          <p>
            Regime preview and onboarding stay on this page. Sign-in unlocks ITR-2 / ITR-3,
            helpers, validation and JSON download on the product path that already ships.
          </p>
          <div className="ntx-landing-cta-row ntx-landing-cta-row-center">
            <Link href={primaryHref} className="ntx-btn ntx-btn-credit">
              {primaryLabel}
            </Link>
            <a href="#prefill-guide" className="ntx-btn ntx-btn-on-primary">
              How to get ITD JSON
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="ntx-section ntx-landing-footer">
      <div className="ntx-shell ntx-landing-footer-grid">
        <div>
          <p className="ntx-brand ntx-brand-on-footer">
            NRITAX<span className="ntx-brand-version"> 2.0</span>
          </p>
          <p className="mt-3 max-w-md text-[var(--body-sm)]">
            File an Indian income tax return from anywhere. Figures on this page are
            illustrative. Registration numbers stay placeholders until real ERI credentials
            ship.
          </p>
        </div>
        <div className="ntx-landing-footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#prefill-guide">Prefill JSON</a>
          <a href="#trust">Trust</a>
          <a href="#start">Start</a>
          <a href={ITD_PORTAL_HOME} target="_blank" rel="noopener noreferrer">
            {ITD_PORTAL_LABEL}
          </a>
        </div>
      </div>
      <div className="ntx-shell mt-8">
        <p className="ntx-figure text-[var(--statute)] opacity-80">
          © 2026 NRITAX. Not affiliated with or endorsed by the Income Tax Department.
        </p>
      </div>
    </footer>
  );
}
