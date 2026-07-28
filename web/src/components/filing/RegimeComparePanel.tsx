'use client';

import { useMemo } from 'react';

import { compareReturnRegimes } from '@/lib/itr/compute/tax-adapter';
import { money, type Regime, type ReturnData } from '@/lib/itr/types';

export function RegimeComparePanel({
  data,
  onChooseRegime,
  onBack,
}: {
  data: ReturnData;
  onChooseRegime: (regime: Regime) => void;
  onBack: () => void;
}) {
  const comparison = useMemo(() => {
    try {
      return compareReturnRegimes(data);
    } catch {
      return null;
    }
  }, [data]);

  if (!comparison) {
    return (
      <main className="ntx-page">
        <h1 className="ntx-display-lg mt-3">Old regime vs new regime</h1>
        <p className="mt-3 text-[var(--text-muted)]">
          Could not compute tax on the current figures. Fill Part B income heads and try again.
        </p>
        <button type="button" className="ntx-btn ntx-btn-primary mt-8" onClick={onBack}>
          Return to filing
        </button>
      </main>
    );
  }

  const { old: oldSide, new: newSide, better, saving } = comparison;
  const chosen = data.meta.regime;

  return (
    <main className="ntx-page">
      <p className="text-[var(--caption)] font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
        Regime comparison
      </p>
      <h1 className="ntx-display-lg mt-3">Old regime vs new regime</h1>
      <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
        Tax with cess on your current figures. Payable stays ink — owing tax is not an error.
        {saving >= 500
          ? ` ${better === 'new' ? 'New' : 'Old'} regime is lower by ${money(saving)}.`
          : ' Both regimes cost about the same on these numbers.'}
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {(
          [
            { key: 'old' as const, title: 'Old regime', side: oldSide },
            { key: 'new' as const, title: 'New regime · 115BAC', side: newSide },
          ] as const
        ).map(({ key, title, side }) => {
          const isWinner = better === key && saving >= 500;
          const isSelected = chosen === key;
          return (
            <div
              key={key}
              className="ntx-panel p-6"
              style={isWinner ? { borderColor: 'var(--credit)', borderWidth: 2 } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-[var(--caption)] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  {title}
                </div>
                {isWinner ? <span className="ntx-badge ntx-badge-credit">Lower tax</span> : null}
              </div>
              <div className="mt-4 space-y-2 text-[var(--body-sm)]">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-muted)]">Total income</span>
                  <span style={{ fontFamily: 'var(--font-figure)' }}>{money(side.totalIncome)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-muted)]">Tax before cess</span>
                  <span style={{ fontFamily: 'var(--font-figure)' }}>
                    {money(side.taxOnNormal + side.taxOnSpecial - side.rebate87A)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--rule)] pt-2">
                  <span className="font-medium text-[var(--ink)]">Tax with cess</span>
                  <span className="ntx-figure-xl">{money(side.grossTaxLiability)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-muted)]">Balance / refund</span>
                  <span style={{ fontFamily: 'var(--font-figure)' }}>
                    {side.refundDue > 0
                      ? `Refund ${money(side.refundDue)}`
                      : money(side.balancePayable)}
                  </span>
                </div>
              </div>
              <hr className="ntx-double-rule mt-6" />
              <button
                type="button"
                className={
                  isSelected ? 'ntx-btn ntx-btn-primary mt-4 w-full' : 'ntx-btn ntx-btn-secondary mt-4 w-full'
                }
                onClick={() => onChooseRegime(key)}
              >
                {isSelected ? 'Filing under this regime' : 'File under this regime'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[var(--body-sm)] text-[var(--text-muted)]">
        Chapter VI-A and barred exemptions are restated per regime. Fill more schedules for a
        tighter estimate.
      </p>
      <button type="button" className="ntx-btn ntx-btn-primary mt-8" onClick={onBack}>
        Return to filing
      </button>
    </main>
  );
}
