'use client';

import Image from 'next/image';
import Link from 'next/link';

import { BRAND_PHOTOS } from '@/lib/brand-imagery';

const ACTIONS = [
  ['Sign in', 'PAN + portal password'],
  ['Prefill', 'Browser automation'],
  ['File', 'Validate and upload'],
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
            Portal login in. Prefill in. JSON filed.
          </h1>
          <p className="ntx-landing-lede">
            Enter your PAN and e-Filing password once for this session. Browser automation
            fetches prefill, Jukti Yukti guides the schedules, then we push the return JSON
            back to the Income Tax Department — with manual upload as fallback.
          </p>
          <div className="ntx-landing-cta-row">
            <Link href="#start" className="ntx-btn ntx-btn-primary">
              {primaryLabel}
            </Link>
            <a href="#how-it-works" className="ntx-btn ntx-btn-secondary">
              See how it works
            </a>
          </div>
          <p className="ntx-landing-meta">
            We do not keep your Income Tax data. Password stays in this browser tab for the
            session only. Due date for non-audit returns: 31 July 2026.
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
          <div className="ntx-landing-sheet-photo">
            <Image
              src={BRAND_PHOTOS.paperwork.src}
              alt={BRAND_PHOTOS.paperwork.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 32rem"
              priority
            />
          </div>
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
