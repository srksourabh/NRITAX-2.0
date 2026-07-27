/**
 * Slab tables, basic exemption and surcharge rates for assessment year 2026-27.
 *
 * Rates are fractions; every amount is whole rupees. Nothing here reads the
 * return — callers pass the figures in, so the same table serves the live
 * computation and the regime comparison.
 */

import type { Regime } from '@/lib/itr/types';

export interface SlabBand {
  /** Top of the band, inclusive. `Infinity` on the last band. */
  readonly upTo: number;
  /** Rate as a fraction, e.g. 0.05 for five per cent. */
  readonly rate: number;
}

/** Section 115BAC slabs. The first band is the basic exemption. */
export const NEW_REGIME_BANDS: readonly SlabBand[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

/** The exemption is uniform under section 115BAC, whatever the taxpayer's age. */
export const NEW_REGIME_EXEMPTION = 400000;

/** Total income at which each surcharge band begins. */
export const SURCHARGE_THRESHOLDS: readonly number[] = [5000000, 10000000, 20000000, 50000000];

/**
 * Old-regime slabs. The nil band is the taxpayer's own basic exemption, so a
 * super senior citizen's 5,00,000 exemption simply swallows the five per cent
 * band.
 */
export function oldRegimeBands(exemption: number): readonly SlabBand[] {
  return [
    { upTo: exemption, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ];
}

/** The slab table a regime uses, with the old-regime nil band already set. */
export function regimeBands(regime: Regime, exemption: number): readonly SlabBand[] {
  return regime === 'new' ? NEW_REGIME_BANDS : oldRegimeBands(exemption);
}

/** Tax on an amount under a slab table. Unrounded — the caller decides. */
export function slabTax(income: number, bands: readonly SlabBand[]): number {
  let tax = 0;
  let floor = 0;
  for (const band of bands) {
    if (income <= floor) break;
    tax += Math.max(Math.min(income, band.upTo) - floor, 0) * band.rate;
    floor = Math.max(band.upTo, floor);
  }
  return tax;
}

/** First day of the assessment year — the date the age slabs are read on. */
const AGE_REFERENCE = '2026-04-01';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Completed years between two ISO dates, or null if the birth date is unusable. */
function completedYears(dateOfBirth: string, on: string): number | null {
  const birth = ISO_DATE.exec(dateOfBirth);
  const reference = ISO_DATE.exec(on);
  if (!birth || !reference) return null;
  const years = Number(reference[1]) - Number(birth[1]);
  const month = Number(reference[2]) - Number(birth[2]);
  const day = Number(reference[3]) - Number(birth[3]);
  return month < 0 || (month === 0 && day < 0) ? years - 1 : years;
}

/**
 * Basic exemption. Uniform under section 115BAC; under the old regime it is
 * 3,00,000 for a senior citizen aged 60 or more and 5,00,000 for a super
 * senior aged 80 or more, taken as at 1 April 2026.
 */
export function basicExemption(regime: Regime, dateOfBirth?: string): number {
  if (regime === 'new') return NEW_REGIME_EXEMPTION;
  const age = dateOfBirth ? completedYears(dateOfBirth, AGE_REFERENCE) : null;
  if (age === null) return 250000;
  if (age >= 80) return 500000;
  if (age >= 60) return 300000;
  return 250000;
}

/**
 * Surcharge rate on total income. The 37 per cent band is not available under
 * section 115BAC, where the top rate is capped at 25 per cent.
 */
export function surchargeRate(totalIncome: number, regime: Regime): number {
  if (totalIncome > 50000000) return regime === 'new' ? 0.25 : 0.37;
  if (totalIncome > 20000000) return 0.25;
  if (totalIncome > 10000000) return 0.15;
  if (totalIncome > 5000000) return 0.1;
  return 0;
}
