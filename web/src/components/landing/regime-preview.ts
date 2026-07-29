/**
 * Illustrative salary-only regime preview for the marketing landing page.
 * Not a filing computation. Figures are replaced once Form 16 is on the return.
 */

import { NEW_REGIME_BANDS, oldRegimeBands, slabTax } from '@/lib/itr/compute/slabs';

const CESS = 0.04;
/** Assumed Chapter VI-A deductions under the old regime for the demo only. */
const DEMO_OLD_DEDUCTIONS = 162_000;
const STD_NEW = 75_000;
const STD_OLD = 50_000;

function round10(n: number): number {
  return Math.round(n / 10) * 10;
}

function taxWithCess(totalIncome: number, bands: ReturnType<typeof oldRegimeBands>): number {
  return Math.round(slabTax(totalIncome, bands) * (1 + CESS));
}

export function previewSalaryRegimes(grossSalary: number) {
  const gross = Math.max(0, Math.round(Number(grossSalary) || 0));
  const tiNew = Math.max(0, round10(gross - STD_NEW));
  const tiOld = Math.max(0, round10(gross - STD_OLD - DEMO_OLD_DEDUCTIONS));
  const taxNew = taxWithCess(tiNew, NEW_REGIME_BANDS);
  const taxOld = taxWithCess(tiOld, oldRegimeBands(250_000));
  const delta = taxOld - taxNew;
  return {
    gross,
    tiNew,
    tiOld,
    taxNew,
    taxOld,
    taxBeforeCessNew: Math.round(taxNew / (1 + CESS)),
    taxBeforeCessOld: Math.round(taxOld / (1 + CESS)),
    delta,
    better: Math.abs(delta) < 500 ? null : delta > 0 ? ('new' as const) : ('old' as const),
  };
}
