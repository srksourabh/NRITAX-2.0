'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { applyCasToReturn } from '@/lib/cas/apply-cas';
import type { CasParseResult } from '@/lib/cas/types';
import { money, ASSESSMENT_YEAR, emptyReturn, type ReturnData } from '@/lib/itr/types';

type SoftJson = {
  ok: boolean;
  message?: string;
  demo?: boolean;
  result?: CasParseResult;
};

export function CasFetchDemo() {
  const [pan, setPan] = useState('ABCDE1234F');
  const [dob, setDob] = useState('1990-05-12');
  const [fullName, setFullName] = useState('Demo Investor');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<CasParseResult | null>(null);
  const [applied, setApplied] = useState<ReturnData | null>(null);

  const preview = useMemo(() => {
    if (!applied) return null;
    return {
      pan: String(applied.fields['GEN.pan'] ?? ''),
      ltcg: Number(applied.fields['CG.b3Ltcg'] ?? applied.fields['CG.b6Nri112a'] ?? 0),
      stcgSale: Number(applied.fields['CG.a6Fvc'] ?? 0),
      rows: applied.tables.s112a?.length ?? 0,
    };
  }, [applied]);

  async function fetchDemo() {
    setBusy(true);
    setNotice(null);
    setResult(null);
    setApplied(null);
    try {
      const res = await fetch('/api/cas/fetch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan, dateOfBirth: dob, fullName }),
      });
      const json = (await res.json()) as SoftJson;
      if (!json.ok || !json.result) {
        setNotice(json.message ?? 'Could not fetch the demo CAS. Sign in and try again.');
        return;
      }
      setResult(json.result);
      setNotice(json.message ?? 'Demo CAS ready.');
    } catch {
      setNotice('CAS demo unavailable. Sign in and try again.');
    } finally {
      setBusy(false);
    }
  }

  function applyToPreview() {
    if (!result) return;
    const base = emptyReturn({
      form: 'ITR2',
      assessmentYear: ASSESSMENT_YEAR,
      regime: 'new',
      status: 'I',
      residentialStatus: 'RES',
      filingSection: '139(1)',
      filingDate: '2026-07-15',
      dueDate: '2026-07-31',
    });
    const next = applyCasToReturn(base, result);
    setApplied(next.data);
    try {
      sessionStorage.setItem(
        'nritax.demoCas',
        JSON.stringify({ result, appliedAt: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
    setNotice(
      `Applied to a sample ITR-2 · ${next.fieldsApplied} fields · ${next.rowsApplied} Schedule 112A rows. Open filing to continue with a real return.`,
    );
  }

  return (
    <div className="ntx-landing">
      <header className="ntx-shell-header">
        <Link href="/" className="ntx-brand">
          NRITAX<span className="ntx-brand-version"> 2.0</span>
        </Link>
        <div className="flex gap-2">
          <Link href="/filing" className="ntx-btn ntx-btn-primary ntx-btn-compact">
            Open filing
          </Link>
        </div>
      </header>

      <main className="ntx-page">
        <p className="ntx-landing-kicker">Demo · CAS by PAN &amp; DOB</p>
        <h1 className="ntx-display-lg mt-3 text-[var(--ink)]">
          Enter PAN and date of birth. We fetch a CAS into Schedule CG.
        </h1>
        <p className="ntx-landing-section-lede">
          Specimen CAS by PAN and DOB for the offline demo. For live DigiLocker + optional
          CDSL OTP (BO ID), use Auto-fill in the{' '}
          <Link href="/filing" className="underline underline-offset-2">
            filing wizard
          </Link>{' '}
          with <span className="ntx-figure">CASPARSER_API_KEY</span> set.
        </p>

        <div className="ntx-panel mt-8 p-6">
          <div className="ntx-field-grid">
            <div className="ntx-field" style={{ gridColumn: 'span 4' }}>
              <label className="ntx-label" htmlFor="demo-pan">
                PAN
              </label>
              <input
                id="demo-pan"
                className="ntx-input ntx-figure"
                maxLength={10}
                value={pan}
                onChange={(e) =>
                  setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
                }
              />
            </div>
            <div className="ntx-field" style={{ gridColumn: 'span 4' }}>
              <label className="ntx-label" htmlFor="demo-dob">
                Date of birth
              </label>
              <input
                id="demo-dob"
                className="ntx-input"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="ntx-field" style={{ gridColumn: 'span 4' }}>
              <label className="ntx-label" htmlFor="demo-name">
                Full name (optional)
              </label>
              <input
                id="demo-name"
                className="ntx-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="ntx-btn ntx-btn-primary mt-6"
            disabled={busy}
            onClick={() => void fetchDemo()}
          >
            {busy ? 'Fetching CAS…' : 'Fetch CAS'}
          </button>
        </div>

        {notice ? (
          <p className="mt-4 text-[var(--body-sm)] text-[var(--text-secondary)]" role="status">
            {notice}
          </p>
        ) : null}

        {result ? (
          <div className="ntx-panel mt-6 p-6">
            <h2 className="text-[var(--h3)] font-semibold text-[var(--ink)]">Fetched statement</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[var(--caption)] text-[var(--text-muted)]">Investor</dt>
                <dd className="text-[var(--body)]">
                  {result.investor.name} · {result.investor.pan}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--caption)] text-[var(--text-muted)]">Period</dt>
                <dd className="ntx-figure text-[var(--body)]">
                  {result.statementPeriod.from} → {result.statementPeriod.to}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--caption)] text-[var(--text-muted)]">Long-term 112A</dt>
                <dd className="ntx-figure text-[var(--h3)]">{money(result.summary.longTerm112A)}</dd>
              </div>
              <div>
                <dt className="text-[var(--caption)] text-[var(--text-muted)]">Other short-term</dt>
                <dd className="ntx-figure text-[var(--h3)]">
                  {money(result.summary.shortTermOther)}
                </dd>
              </div>
            </dl>

            <h3 className="mt-6 text-[var(--label)] font-semibold text-[var(--ink)]">
              Gain legs
            </h3>
            <div className="ntx-table-scroll mt-2">
              <table className="w-full text-left text-[var(--body-sm)]">
                <thead>
                  <tr className="border-b border-[var(--rule)] text-[var(--text-muted)]">
                    <th className="py-2 pr-3 font-medium">Scheme</th>
                    <th className="py-2 pr-3 font-medium">Term</th>
                    <th className="py-2 pr-3 font-medium">Sale</th>
                    <th className="py-2 font-medium">Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {result.gains.map((g) => (
                    <tr key={`${g.isin}-${g.saleDate}`} className="border-b border-[var(--rule)]">
                      <td className="py-2 pr-3">{g.schemeName}</td>
                      <td className="py-2 pr-3">{g.term}</td>
                      <td className="ntx-figure py-2 pr-3">{money(g.saleValue)}</td>
                      <td className="ntx-figure py-2">{money(g.gain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="ntx-btn ntx-btn-credit mt-6"
              onClick={applyToPreview}
            >
              Apply into sample Schedule CG
            </button>
          </div>
        ) : null}

        {preview ? (
          <div className="ntx-panel mt-6 p-6">
            <h2 className="text-[var(--h3)] font-semibold text-[var(--ink)]">
              Written onto the sample return
            </h2>
            <ul className="mt-4 space-y-2 text-[var(--body-sm)] text-[var(--text-secondary)]">
              <li>
                PAN · <span className="ntx-figure text-[var(--ink)]">{preview.pan}</span>
              </li>
              <li>
                LTCG (112A / NRI row) ·{' '}
                <span className="ntx-figure text-[var(--ink)]">{money(preview.ltcg)}</span>
              </li>
              <li>
                Other STCG sale value ·{' '}
                <span className="ntx-figure text-[var(--ink)]">{money(preview.stcgSale)}</span>
              </li>
              <li>
                Schedule 112A rows ·{' '}
                <span className="ntx-figure text-[var(--ink)]">{preview.rows}</span>
              </li>
            </ul>
            <hr className="ntx-double-rule mt-6 max-w-xs" />
            <Link href="/filing" className="ntx-btn ntx-btn-primary mt-6 inline-flex">
              Continue in the filing wizard
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
