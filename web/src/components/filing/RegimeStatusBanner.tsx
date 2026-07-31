'use client';

import { useMemo } from 'react';

import { compareReturnRegimes } from '@/lib/itr/compute/tax-adapter';
import { money, type ReturnData } from '@/lib/itr/types';

export function RegimeStatusBanner({
  data,
  onReview,
}: {
  data: ReturnData;
  onReview: () => void;
}) {
  const comparison = useMemo(() => {
    try {
      return compareReturnRegimes(data);
    } catch {
      return null;
    }
  }, [data]);

  const chosen = data.meta.regime;
  const chosenLabel = chosen === 'new' ? 'New regime (115BAC)' : 'Old regime';

  let detail = 'Compare old and new regime on your current figures.';
  if (comparison) {
    const { better, saving } = comparison;
    if (saving >= 500) {
      detail = `${better === 'new' ? 'New' : 'Old'} regime is lower by ${money(saving)} on these figures.`;
    } else {
      detail = 'Both regimes cost about the same on these figures.';
    }
  }

  return (
    <div className="ntx-panel mt-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0">
        <p className="text-[var(--caption)] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
          Tax regime
        </p>
        <p className="mt-1 text-[var(--body-sm)] text-[var(--ink)]">
          Filing under <span className="font-semibold">{chosenLabel}</span>. {detail}
        </p>
      </div>
      <button type="button" className="ntx-btn ntx-btn-secondary ntx-btn-compact shrink-0" onClick={onReview}>
        Review regime choice
      </button>
    </div>
  );
}
