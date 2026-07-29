'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { money } from '@/lib/itr/types';

import { previewSalaryRegimes } from './regime-preview';

function formatInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-IN');
}

export function LandingHero({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  const [salaryRaw, setSalaryRaw] = useState('1480000');
  const [selected, setSelected] = useState<'new' | 'old'>('new');

  const preview = useMemo(
    () => previewSalaryRegimes(Number(salaryRaw || 0)),
    [salaryRaw],
  );

  const summary =
    preview.better === null
      ? 'Both regimes cost about the same on this salary.'
      : preview.better === 'new'
        ? `New regime is lower by ${money(Math.abs(preview.delta))} on this estimate.`
        : `Old regime is lower by ${money(Math.abs(preview.delta))} on this estimate.`;

  return (
    <section id="top" className="ntx-section ntx-landing-hero">
      <div className="ntx-shell ntx-grid-hero">
        <div className="ntx-landing-hero-copy">
          <p className="ntx-landing-kicker">AY 2026-27 · ITR-2 &amp; ITR-3 · NRI-ready</p>
          <h1 className="ntx-display-xl text-[var(--ink)]">
            File your Indian tax return from anywhere
          </h1>
          <p className="ntx-landing-lede">
            Built for non-resident Indians. Prefill, CAS and Sandbox helpers are optional.
            Enter figures by hand, compare both regimes, validate against CBDT rules, and
            download the departmental JSON.
          </p>
          <div className="ntx-landing-cta-row">
            <Link href={primaryHref} className="ntx-btn ntx-btn-primary">
              {primaryLabel}
            </Link>
            <a href="#compare" className="ntx-btn ntx-btn-secondary">
              Try the regime preview
            </a>
            <Link href="/demo/cas" className="ntx-btn ntx-btn-secondary">
              CAS fetch demo
            </Link>
          </div>
          <p className="ntx-landing-meta">
            Filing for AY 2026-27 is open. Due date 31 July 2026. We never ask for your Income
            Tax portal password.
          </p>
          <dl className="ntx-landing-stats">
            {[
              ['ITR-2 & ITR-3', 'Separate tracks, one wizard'],
              ['No portal password', 'Download JSON for the department'],
              ['CA path ready', 'Review when the return is complex'],
            ].map(([title, detail]) => (
              <div key={title} className="ntx-landing-stat">
                <dt>{title}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div id="compare" className="ntx-panel ntx-landing-calc">
          <div className="ntx-landing-calc-head">
            <h2 className="text-[var(--h3)] font-semibold text-[var(--ink)]">
              See your two regimes
            </h2>
            <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
              Enter one salary figure. Nothing is stored until you sign in.
            </p>
          </div>

          <label className="ntx-label" htmlFor="landing-salary">
            Gross salary for FY 2025-26
          </label>
          <div className="ntx-money-field">
            <span aria-hidden="true">₹</span>
            <input
              id="landing-salary"
              className="ntx-input ntx-money-input"
              inputMode="numeric"
              value={formatInput(salaryRaw)}
              onChange={(e) => setSalaryRaw(e.target.value.replace(/\D/g, ''))}
              aria-describedby="landing-regime-summary"
            />
          </div>

          <div className="ntx-landing-regime-grid" aria-live="polite">
            {(
              [
                {
                  key: 'new' as const,
                  title: 'New regime',
                  tax: preview.taxNew,
                  rows: [
                    ['Total income', 's.288A', preview.tiNew],
                    ['Tax before cess', '', preview.taxBeforeCessNew],
                  ] as const,
                },
                {
                  key: 'old' as const,
                  title: 'Old regime',
                  tax: preview.taxOld,
                  rows: [
                    ['Total income', 's.288A', preview.tiOld],
                    ['Tax before cess', '', preview.taxBeforeCessOld],
                  ] as const,
                },
              ] as const
            ).map((col) => {
              const isWinner = preview.better === col.key;
              const isSelected = selected === col.key;
              return (
                <div
                  key={col.key}
                  className={
                    isWinner ? 'ntx-landing-regime-card is-winner' : 'ntx-landing-regime-card'
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[var(--h3)] font-semibold text-[var(--ink)]">
                      {col.title}
                    </h3>
                    {isWinner ? (
                      <span className="ntx-badge ntx-badge-credit">Lower tax</span>
                    ) : null}
                  </div>
                  <ul className="ntx-landing-ledger-mini">
                    {col.rows.map(([label, statute, amount]) => (
                      <li key={label}>
                        <span>
                          {label}
                          {statute ? (
                            <span className="ntx-landing-statute"> {statute}</span>
                          ) : null}
                        </span>
                        <span className="ntx-figure">{money(amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="ntx-landing-regime-total">
                    <span>Tax with cess</span>
                    <span className="ntx-figure">{money(col.tax)}</span>
                  </div>
                  <button
                    type="button"
                    className={
                      isSelected
                        ? 'ntx-btn ntx-btn-primary w-full'
                        : 'ntx-btn ntx-btn-secondary w-full'
                    }
                    onClick={() => setSelected(col.key)}
                  >
                    {isSelected ? 'Previewing this regime' : 'Preview this regime'}
                  </button>
                </div>
              );
            })}
          </div>

          <p id="landing-regime-summary" className="text-[var(--body)] text-[var(--ink)]">
            {summary}
          </p>
          <p className="text-[var(--body-sm)] text-[var(--text-muted)]">
            Old regime assumes ₹1,62,000 of Chapter VI-A deductions. Your real figures replace
            this once Form 16 is on the return. Illustrative only, not tax advice.
          </p>
        </div>
      </div>
    </section>
  );
}
