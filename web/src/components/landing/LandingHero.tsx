'use client';

import Link from 'next/link';

const ACTIONS = [
  ['Import', 'Portal prefill JSON'],
  ['Validate', 'Schedules and totals'],
  ['Export', 'Departmental JSON'],
] as const;

export function LandingHero({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <section id="top" className="ntx-section ntx-landing-hero">
      <div className="ntx-shell ntx-landing-hero-grid">
        <div className="ntx-landing-hero-copy ntx-landing-rise">
          <p className="ntx-landing-kicker">Filing sheet · Assessment Year 2026-27</p>
          <h1 className="ntx-display-xl text-[var(--ink)]">
            Import prefill. Complete the schedules. Export the return JSON.
          </h1>
          <p className="ntx-landing-lede">
            The same workflow as a departmental filing sheet: import the portal file,
            fill what is missing, validate, then create the JSON the e-Filing portal
            accepts — built for NRIs filing ITR-2 or ITR-3.
          </p>
          <div className="ntx-landing-cta-row">
            <Link href={primaryHref} className="ntx-btn ntx-btn-primary">
              {primaryLabel}
            </Link>
            <a href="#how-it-works" className="ntx-btn ntx-btn-secondary">
              See how it works
            </a>
          </div>
          <p className="ntx-landing-meta">
            Due date for non-audit returns: 31 July 2026. Portal password is used only
            in an ephemeral fetch job when you choose that path — never stored.
          </p>
          <dl className="ntx-landing-stats">
            {ACTIONS.map(([title, detail]) => (
              <div key={title} className="ntx-landing-stat">
                <dt>{title}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="ntx-landing-sheet ntx-landing-rise"
          style={{ animationDelay: '120ms' }}
        >
          <div className="ntx-landing-sheet-panel">
            <header>
              <span className="ntx-landing-sheet-idx">01</span>
              <div>
                <h2>Return preparation</h2>
                <p>Import · validate · export</p>
              </div>
            </header>
            <ul>
              <li>
                <span>Import file</span>
                <span className="ntx-figure">Prefill / draft JSON</span>
              </li>
              <li>
                <span>Import statement</span>
                <span className="ntx-figure">CAS / Form 16 / AIS</span>
              </li>
              <li>
                <span>Validate</span>
                <span className="ntx-figure">Mandatory fields + totals</span>
              </li>
              <li>
                <span>Create JSON</span>
                <span className="ntx-figure">ITR-2 / ITR-3 upload file</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
