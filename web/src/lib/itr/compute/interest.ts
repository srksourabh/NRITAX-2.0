/**
 * Interest under sections 234A, 234B and 234C, and the section 234F fee, for
 * assessment year 2026-27.
 *
 * All three interest charges run at one per cent for every month or part of a
 * month. Rule 119A rounds the amount interest is charged on down to a multiple
 * of one hundred rupees, which is why the shortfalls go through `r100`.
 */

import { money, r0 } from '@/lib/itr/types';

const RATE_PER_MONTH = 0.01;

/** Section 234B runs from the first day of the assessment year. */
const ASSESSMENT_YEAR_START = '2026-04-01';

/** Section 234B is only charged where advance tax falls below this share. */
const ADVANCE_TAX_FLOOR = 0.9;

/**
 * Section 234C instalments. `due` is the share of the advance tax obligation
 * payable by that date; `safeHarbour` is the lower share the first and second
 * provisos to section 234C(1) accept without charge.
 */
const INSTALMENTS = [
  { label: '15 June 2025', due: 0.15, safeHarbour: 0.12, months: 3 },
  { label: '15 September 2025', due: 0.45, safeHarbour: 0.36, months: 3 },
  { label: '15 December 2025', due: 0.75, safeHarbour: 0.75, months: 3 },
  { label: '15 March 2026', due: 1, safeHarbour: 1, months: 1 },
] as const;

export interface InterestInput {
  /** Tax, surcharge and cess on the returned income, after relief under sections 89, 90 and 91. */
  netTaxLiability: number;
  /** Tax deducted and collected at source. Assessed tax is net of this. */
  taxDeducted: number;
  /** Advance tax paid during the previous year. */
  advanceTax: number;
  /** Cumulative advance tax paid by 15 June, 15 September, 15 December and 15 March. */
  instalments: readonly [number, number, number, number];
  /** Drives the section 234F band. */
  totalIncome: number;
  dueDate: string;
  filingDate: string;
}

export interface InterestCharges {
  section234A: number;
  section234B: number;
  section234C: number;
  fee234F: number;
  total: number;
  notes: string[];
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Rule 119A — ignore anything below a hundred rupees. */
const r100 = (n: number): number => Math.floor(Math.max(n, 0) / 100) * 100;

/**
 * Months from one ISO date to another, counting part of a month as a whole
 * month. Zero when `to` is not after `from`, or when either date is unusable.
 */
function monthsBetween(from: string, to: string): number {
  const start = ISO_DATE.exec(from);
  const end = ISO_DATE.exec(to);
  if (!start || !end || to <= from) return 0;
  const whole = (Number(end[1]) - Number(start[1])) * 12 + (Number(end[2]) - Number(start[2]));
  return Math.max(Number(end[3]) > Number(start[3]) ? whole + 1 : whole, 1);
}

/**
 * Interest and the late-filing fee. Every figure is whole rupees; a charge
 * that does not apply comes back as zero rather than being omitted.
 */
export function computeInterest(input: InterestInput): InterestCharges {
  const notes: string[] = [];
  const assessedTax = Math.max(r0(input.netTaxLiability) - r0(input.taxDeducted), 0);
  const advanceTax = Math.max(r0(input.advanceTax), 0);
  const late = input.filingDate > input.dueDate;

  /* 234A — from the due date to the date the return is actually filed. */
  let section234A = 0;
  if (late) {
    const months = monthsBetween(input.dueDate, input.filingDate);
    const shortfall = r100(assessedTax - advanceTax);
    section234A = r0(shortfall * RATE_PER_MONTH * months);
    if (section234A > 0) {
      notes.push(
        `Interest under section 234A for ${months} month${months === 1 ? '' : 's'} ` +
          `on ${money(shortfall)}, the return being filed after ${input.dueDate}.`,
      );
    }
  }

  /* 234B — where advance tax paid falls short of ninety per cent of assessed tax. */
  let section234B = 0;
  if (assessedTax > 0 && advanceTax < ADVANCE_TAX_FLOOR * assessedTax) {
    const months = monthsBetween(ASSESSMENT_YEAR_START, input.filingDate) || 1;
    const shortfall = r100(assessedTax - advanceTax);
    section234B = r0(shortfall * RATE_PER_MONTH * months);
    if (section234B > 0) {
      notes.push(
        `Interest under section 234B for ${months} month${months === 1 ? '' : 's'} from ` +
          `1 April 2026 on ${money(shortfall)}, advance tax being under ninety per cent of the assessed tax.`,
      );
    }
  }

  /* 234C — instalment by instalment, on the shortfall from the due share. */
  let section234C = 0;
  INSTALMENTS.forEach((instalment, i) => {
    const paid = Math.max(r0(input.instalments[i] ?? 0), 0);
    if (paid >= instalment.safeHarbour * assessedTax) return;
    const shortfall = r100(instalment.due * assessedTax - paid);
    section234C += r0(shortfall * RATE_PER_MONTH * instalment.months);
  });
  if (section234C > 0) {
    notes.push(`Interest under section 234C of ${money(section234C)} on the advance tax instalments.`);
  }

  /* 234F — a flat fee, in two bands. */
  let fee234F = 0;
  if (late) {
    fee234F = input.totalIncome <= 500000 ? 1000 : 5000;
    notes.push(`Fee under section 234F of ${money(fee234F)} for filing after the due date.`);
  }

  return {
    section234A,
    section234B,
    section234C,
    fee234F,
    total: section234A + section234B + section234C + fee234F,
    notes,
  };
}
