'use client';

import { useMemo, useState } from 'react';

import {
  determineResidency,
  residencyLabel,
  type ResidencyFacts,
} from '@/lib/itr/residency';
import type { ResidentialStatus } from '@/lib/itr/types';

type Phase = 'basics' | 'ordinary' | 'result';

export function ResidencyStep({
  busy,
  onConfirm,
  onBack,
}: {
  busy?: boolean;
  onConfirm: (status: ResidentialStatus, facts: ResidencyFacts) => void;
  onBack?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('basics');
  const [daysPy, setDaysPy] = useState('60');
  const [daysFour, setDaysFour] = useState('0');
  const [employmentAbroad, setEmploymentAbroad] = useState(false);
  const [nrYears, setNrYears] = useState('9');
  const [daysSeven, setDaysSeven] = useState('400');

  const basicFacts: ResidencyFacts = useMemo(
    () => ({
      daysInPreviousYear: Number(daysPy) || 0,
      daysInPrecedingFourYears: Number(daysFour) || 0,
      employmentAbroadOrCrew: employmentAbroad,
    }),
    [daysPy, daysFour, employmentAbroad],
  );

  const fullFacts: ResidencyFacts = useMemo(
    () => ({
      ...basicFacts,
      nonResidentYearsOfLast10: Number(nrYears) || 0,
      daysInPrecedingSevenYears: Number(daysSeven) || 0,
    }),
    [basicFacts, nrYears, daysSeven],
  );

  const preview = useMemo(() => determineResidency(fullFacts), [fullFacts]);

  function continueFromBasics() {
    if (busy) return;
    const basic = determineResidency(basicFacts);
    if (!basic.basicResident) {
      onConfirm('NRI', basicFacts);
      return;
    }
    setPhase('ordinary');
  }

  function showResult() {
    if (busy) return;
    setPhase('result');
  }

  function confirm() {
    if (busy) return;
    onConfirm(preview.status, fullFacts);
  }

  return (
    <main className="ntx-page">
      <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
        Residential status
      </p>
      <h1 className="ntx-display-lg mt-3 text-[var(--ink)]">How long were you in India?</h1>
      <p className="mt-3 max-w-xl text-[var(--text-muted)]">
        We apply sections 6(1) and 6(6) to decide whether you are an NRI, RNOR, or resident. This
        drives Schedule FA / FSI visibility and rebate rules — you can still override later in
        Personal Info if needed.
      </p>

      {phase === 'basics' ? (
        <div className="ntx-panel mt-8 max-w-xl space-y-4 p-5">
          <label className="block">
            <span className="text-[var(--body-sm)] font-medium">Days in India in the previous year</span>
            <input
              className="ntx-input mt-1 w-full"
              type="number"
              min={0}
              max={366}
              value={daysPy}
              onChange={(e) => setDaysPy(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[var(--body-sm)] font-medium">
              Days in India in the four years before that
            </span>
            <input
              className="ntx-input mt-1 w-full"
              type="number"
              min={0}
              max={1464}
              value={daysFour}
              onChange={(e) => setDaysFour(e.target.value)}
            />
          </label>
          <label className="flex items-start gap-3 text-[var(--body-sm)]">
            <input
              type="checkbox"
              className="mt-1"
              checked={employmentAbroad}
              onChange={(e) => setEmploymentAbroad(e.target.checked)}
            />
            <span>
              I am an Indian citizen / PIO who left for employment abroad, or a crew member of an
              Indian ship (the 60-day alternate condition becomes 182 days).
            </span>
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="ntx-btn ntx-btn-primary" disabled={busy} onClick={continueFromBasics}>
              Continue
            </button>
            {onBack ? (
              <button type="button" className="ntx-btn ntx-btn-secondary" disabled={busy} onClick={onBack}>
                Back
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === 'ordinary' ? (
        <div className="ntx-panel mt-8 max-w-xl space-y-4 p-5">
          <p className="text-[var(--body-sm)] text-[var(--text-secondary)]">
            You meet the basic residence test. Answer these to decide ordinary residence (RNOR vs
            resident).
          </p>
          <label className="block">
            <span className="text-[var(--body-sm)] font-medium">
              Years (of the last 10) in which you were non-resident
            </span>
            <input
              className="ntx-input mt-1 w-full"
              type="number"
              min={0}
              max={10}
              value={nrYears}
              onChange={(e) => setNrYears(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[var(--body-sm)] font-medium">
              Days in India in the seven years preceding the previous year
            </span>
            <input
              className="ntx-input mt-1 w-full"
              type="number"
              min={0}
              max={2555}
              value={daysSeven}
              onChange={(e) => setDaysSeven(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="ntx-btn ntx-btn-primary" disabled={busy} onClick={showResult}>
              See result
            </button>
            <button type="button" className="ntx-btn ntx-btn-secondary" disabled={busy} onClick={() => setPhase('basics')}>
              Back
            </button>
          </div>
        </div>
      ) : null}

      {phase === 'result' ? (
        <div className="ntx-panel mt-8 max-w-xl space-y-4 p-5">
          <p className="text-[var(--caption)] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Determined status
          </p>
          <h2 className="text-[var(--h2)] font-semibold text-[var(--ink)]">
            {residencyLabel(preview.status)}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-[var(--body-sm)] text-[var(--text-secondary)]">
            {preview.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="ntx-btn ntx-btn-credit" disabled={busy} onClick={confirm}>
              Use this status
            </button>
            <button type="button" className="ntx-btn ntx-btn-secondary" disabled={busy} onClick={() => setPhase('ordinary')}>
              Back
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
