/**
 * Deterministic residential-status engine (sections 6(1) and 6(6)).
 *
 * Pure: questionnaire facts in → RES / NOR / NRI out. UI and persistence stay
 * outside this module so the same logic can run in tests and the wizard.
 */

import type { ResidentialStatus } from '@/lib/itr/types';

export interface ResidencyFacts {
  /** Days physically present in India during the previous year. */
  daysInPreviousYear: number;
  /**
   * Days in India across the four years immediately preceding the previous year.
   * Used with the 60-day alternate basic condition.
   */
  daysInPrecedingFourYears: number;
  /**
   * True when the taxpayer is an Indian citizen / person of Indian origin who
   * left India for employment abroad, or is a crew member of an Indian ship —
   * the 60-day alternate condition becomes 182 days for them.
   */
  employmentAbroadOrCrew?: boolean;
  /** Number of years (of the preceding 10) in which the taxpayer was non-resident. */
  nonResidentYearsOfLast10?: number;
  /** Days in India during the seven years preceding the previous year. */
  daysInPrecedingSevenYears?: number;
}

export interface ResidencyResult {
  status: ResidentialStatus;
  basicResident: boolean;
  ordinarilyResident: boolean;
  reasons: string[];
}

function clampDays(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(366, Math.round(n)));
}

/**
 * Section 6(1) basic conditions for residence in India.
 * Returns true when either primary day-count condition is met.
 */
export function isBasicResident(facts: ResidencyFacts): boolean {
  const py = clampDays(facts.daysInPreviousYear);
  const four = Math.max(0, Math.round(facts.daysInPrecedingFourYears || 0));
  const alternateThreshold = facts.employmentAbroadOrCrew ? 182 : 60;

  if (py >= 182) return true;
  if (py >= alternateThreshold && four >= 365) return true;
  return false;
}

/**
 * Section 6(6): a resident individual is "not ordinarily resident" when either
 * they were non-resident in 9 of the 10 preceding years, or they were in India
 * for 729 days or fewer in the seven preceding years.
 */
export function isOrdinarilyResident(facts: ResidencyFacts): boolean {
  const nrYears = Math.max(0, Math.min(10, Math.round(facts.nonResidentYearsOfLast10 ?? 0)));
  const seven = Math.max(0, Math.round(facts.daysInPrecedingSevenYears ?? 0));
  if (nrYears >= 9) return false;
  if (seven <= 729) return false;
  return true;
}

/** Compute RES / NOR / NRI from questionnaire facts. */
export function determineResidency(facts: ResidencyFacts): ResidencyResult {
  const reasons: string[] = [];
  const py = clampDays(facts.daysInPreviousYear);
  const four = Math.max(0, Math.round(facts.daysInPrecedingFourYears || 0));
  const basic = isBasicResident(facts);

  if (py >= 182) {
    reasons.push(`Present in India for ${py} days in the previous year (≥ 182).`);
  } else if (basic) {
    const threshold = facts.employmentAbroadOrCrew ? 182 : 60;
    reasons.push(
      `Present for ${py} days (≥ ${threshold}) and ${four} days in the preceding four years (≥ 365).`,
    );
  } else {
    reasons.push(
      `Present for ${py} days in the previous year and ${four} days in the preceding four years — basic residence conditions not met.`,
    );
  }

  if (!basic) {
    return { status: 'NRI', basicResident: false, ordinarilyResident: false, reasons };
  }

  const ordinarily = isOrdinarilyResident(facts);
  if (!ordinarily) {
    const nrYears = Math.round(facts.nonResidentYearsOfLast10 ?? 0);
    const seven = Math.round(facts.daysInPrecedingSevenYears ?? 0);
    if (nrYears >= 9) {
      reasons.push(`Non-resident in ${nrYears} of the preceding 10 years (≥ 9) → RNOR.`);
    } else {
      reasons.push(`Present for ${seven} days in the preceding seven years (≤ 729) → RNOR.`);
    }
    return { status: 'NOR', basicResident: true, ordinarilyResident: false, reasons };
  }

  reasons.push('Ordinary residence conditions under section 6(6) are met.');
  return { status: 'RES', basicResident: true, ordinarilyResident: true, reasons };
}

/** Human label for UI. */
export function residencyLabel(status: ResidentialStatus): string {
  if (status === 'RES') return 'Resident and ordinarily resident';
  if (status === 'NOR') return 'Resident but not ordinarily resident (RNOR)';
  return 'Non-resident (NRI)';
}
