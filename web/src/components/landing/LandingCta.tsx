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
    <section className="ntx-section ntx-landing-alt" aria-labelledby="cta-heading">
      <div className="ntx-shell">
        <div className="ntx-landing-cta-band">
          <p className="ntx-landing-kicker ntx-landing-kicker-on-primary">
            AY 2026-27 · Due 31 July 2026
          </p>
          <h2 id="cta-heading" className="ntx-display-lg mt-3">
            Import prefill, complete schedules, export JSON
          </h2>
          <p>
            Sign in unlocks the filing sheet: import portal prefill, fill missing fields,
            validate, and download the departmental return JSON.
          </p>
          <div className="ntx-landing-cta-row ntx-landing-cta-row-center">
            <Link href={primaryHref} className="ntx-btn ntx-btn-primary">
              {primaryLabel}
            </Link>
            <a href="#prefill" className="ntx-btn ntx-btn-on-primary">
              Import prefill path
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="ntx-landing-footer">
      <div className="ntx-shell ntx-landing-footer-grid">
        <div>
          <p className="ntx-brand ntx-brand-on-footer">
            NRITAX<span className="ntx-brand-version"> 2.0</span>
          </p>
          <p className="mt-2 max-w-md text-[var(--body-sm)] text-[rgba(252,253,252,0.72)]">
            File an Indian income tax return from anywhere. Registration numbers stay
            placeholders until real ERI credentials ship.
          </p>
        </div>
        <div className="ntx-landing-footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#prefill">Import prefill</a>
          <a href="#trust">Trust</a>
          <a href="#start">Start</a>
          <a href={ITD_PORTAL_HOME} target="_blank" rel="noopener noreferrer">
            {ITD_PORTAL_LABEL}
          </a>
        </div>
      </div>
      <div className="ntx-shell mt-8">
        <p className="ntx-figure text-[var(--statute)] opacity-80">
          © 2026 NRITAX 2.0. Not affiliated with or endorsed by the Income Tax Department.
        </p>
      </div>
    </footer>
  );
}
