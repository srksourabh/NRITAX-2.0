/**
 * Tax computation for assessment year 2026-27.
 *
 * `computeTax` produces the full working rather than a single number, so every
 * figure on the screen can be traced back to a step. `compareRegimes` runs the
 * same engine twice, restating the income for each regime's own rules first.
 *
 * This module never reads ReturnData. A sibling adapter turns the return into
 * a `TaxInput`, which keeps the arithmetic testable on plain numbers.
 */

import { computeInterest } from '@/lib/itr/compute/interest';
import {
  SURCHARGE_THRESHOLDS,
  basicExemption,
  regimeBands,
  slabTax,
  surchargeRate,
} from '@/lib/itr/compute/slabs';
import { D, max0 } from '@/lib/itr/compute/decimal';
import {
  money,
  r0,
  r10,
  type Regime,
  type RegimeComparison,
  type ReturnMeta,
  type SpecialRateBucket,
  type TaxComputation,
} from '@/lib/itr/types';

/* ─────────────────────────── Input ─────────────────────────── */

/** One head of income taxed at its own rate, taken after loss set-off. */
export interface SpecialRateInput {
  key: string;
  label: string;
  /** Rate as a fraction, e.g. 0.125 for section 112A. */
  rate: number;
  amount: number;
  /** Long-term equity under section 112A — shares the ₹1,25,000 exemption. */
  exempt112A?: boolean;
  /** Capital gain or dividend income, on which surcharge is capped at 15 per cent. */
  surchargeCapped?: boolean;
}

export interface TaxReliefs {
  section89?: number;
  section90?: number;
  section91?: number;
}

export interface TaxesPaidInput {
  advanceTax?: number;
  tds?: number;
  tcs?: number;
  selfAssessment?: number;
  /**
   * Cumulative advance tax paid by 15 June, 15 September, 15 December and
   * 15 March. Omitted, the whole advance tax is treated as paid by 15 March,
   * which is the position section 234C charges for.
   */
  instalments?: readonly [number, number, number, number];
}

/**
 * The items section 115BAC treats differently, so either regime's column can
 * be restated from the other. All figures are as claimed on old-regime rules.
 */
export interface RegimeAdjustments {
  /** Salary under section 17, before any exemption or deduction. */
  grossSalary: number;
  /** Allowances claimed exempt under section 10. */
  exemptAllowances: number;
  /** Of those, the ones section 115BAC bars — 10(5), 10(13A), 10(14)(i), 10(14)(ii) and 10(17). */
  exemptAllowancesBarred: number;
  /** Entertainment allowance under section 16(ii). */
  deduction16ii: number;
  /** Professional tax under section 16(iii). */
  deduction16iii: number;
  /** Interest on borrowed capital actually set off for a self-occupied property, section 24(b). */
  selfOccupiedInterest: number;
  /** The part of the Chapter VI-A total that section 115BAC bars. */
  chapterVIABarred: number;
}

export interface TaxInput {
  meta: ReturnMeta;
  /**
   * Gross total income on old-regime rules — every deduction and exemption
   * allowed, including a 16(ia) standard deduction of 50,000 capped at net
   * salary. The new-regime column is restated from `regimeAdjustments`.
   */
  grossTotalIncome: number;
  /** Chapter VI-A total on old-regime rules. */
  chapterVIA: number;
  specialRates?: readonly SpecialRateInput[];
  /** Net agricultural income, aggregated for rate purposes above 5,000. */
  netAgriculturalIncome?: number;
  reliefs?: TaxReliefs;
  taxesPaid?: TaxesPaidInput;
  /** Absent, both regimes are computed on the same income. */
  regimeAdjustments?: RegimeAdjustments;
}

/* ─────────────────────────── Constants ─────────────────────────── */

const EXEMPTION_112A = 125000;
const REBATE_NEW = 60000;
const REBATE_NEW_CEILING = 1200000;
const REBATE_OLD = 12500;
const REBATE_OLD_CEILING = 500000;
const AGRICULTURAL_FLOOR = 5000;
const SURCHARGE_CAP_ON_GAINS = 0.15;
const CESS_RATE = 0.04;
const STANDARD_DEDUCTION_OLD = 50000;
const STANDARD_DEDUCTION_NEW = 75000;

/* ─────────────────────────── Restatement ─────────────────────────── */

interface Restated {
  grossTotalIncome: number;
  chapterVIA: number;
  standardDeduction: number;
}

/**
 * The income a regime actually taxes. The old regime is the input as given;
 * the new regime adds back the allowances and deductions section 115BAC bars
 * and swaps the standard deduction for the larger one.
 */
function restate(input: TaxInput, regime: Regime): Restated {
  const a = input.regimeAdjustments;
  const grossSalary = Math.max(a?.grossSalary ?? 0, 0);
  const exemptAllowances = Math.max(a?.exemptAllowances ?? 0, 0);
  const barred = Math.min(Math.max(a?.exemptAllowancesBarred ?? 0, 0), exemptAllowances);
  const oldStandard = Math.min(STANDARD_DEDUCTION_OLD, Math.max(grossSalary - exemptAllowances, 0));

  if (regime === 'old') {
    return {
      grossTotalIncome: r0(input.grossTotalIncome),
      chapterVIA: Math.max(r0(input.chapterVIA), 0),
      standardDeduction: oldStandard,
    };
  }

  const newStandard = Math.min(
    STANDARD_DEDUCTION_NEW,
    Math.max(grossSalary - (exemptAllowances - barred), 0),
  );
  const addBack =
    barred + (a?.deduction16ii ?? 0) + (a?.deduction16iii ?? 0) + (a?.selfOccupiedInterest ?? 0);

  return {
    grossTotalIncome: Math.max(
      r0(input.grossTotalIncome + addBack + oldStandard - newStandard),
      0,
    ),
    chapterVIA: Math.max(r0(input.chapterVIA) - Math.max(a?.chapterVIABarred ?? 0, 0), 0),
    standardDeduction: newStandard,
  };
}

/* ─────────────────────────── Engine ─────────────────────────── */

function computeForRegime(input: TaxInput, regime: Regime): TaxComputation {
  const notes: string[] = [];
  const meta = input.meta;
  const exemption = basicExemption(regime, meta.dateOfBirth);
  const bands = regimeBands(regime, exemption);
  const restated = restate(input, regime);
  const totalIncome = Math.max(restated.grossTotalIncome - restated.chapterVIA, 0);

  /* 1 and 2. Special-rate buckets, with the section 112A exemption spread
     across the long-term equity ones before they are taxed. */
  let remaining112A = EXEMPTION_112A;
  let cappedTax = 0;
  const buckets: SpecialRateBucket[] = [];
  for (const b of input.specialRates ?? []) {
    if (b.amount <= 0) continue;
    const amount = r0(b.amount);
    const exempt = b.exempt112A ? Math.min(remaining112A, amount) : 0;
    remaining112A -= exempt;
    const taxable = amount - exempt;
    const tax = r0(D(taxable).mul(b.rate).toNumber());
    if (b.surchargeCapped) cappedTax += tax;
    buckets.push({ key: b.key, label: b.label, rate: b.rate, amount, exempt, taxable, tax });
  }

  const specialRateIncome = buckets.reduce((a, b) => a + b.amount, 0);
  const taxOnSpecial = buckets.reduce((a, b) => a + b.tax, 0);

  // Chapter VI-A cannot be set against special-rate income (sections 111A(2) and 112A(6)).
  const normalRateIncome = Math.max(totalIncome - specialRateIncome, 0);
  if (totalIncome < specialRateIncome) {
    notes.push(
      'Special rate income exceeds total income after Chapter VI-A. Normal rate income has been floored at zero.',
    );
  }

  /* 3. Slab-rate balance, with net agricultural income aggregated for rate. */
  const agricultural = Math.max(r0(input.netAgriculturalIncome ?? 0), 0);
  let taxOnNormal: number;
  if (agricultural > AGRICULTURAL_FLOOR && normalRateIncome > exemption) {
    const onAggregate = slabTax(normalRateIncome + agricultural, bands);
    const onExemptSlice = slabTax(agricultural + exemption, bands);
    taxOnNormal = r0(Math.max(onAggregate - onExemptSlice, 0));
    notes.push(
      `Net agricultural income of ${money(agricultural)} has been aggregated for rate purposes and then rebated.`,
    );
  } else {
    taxOnNormal = r0(slabTax(normalRateIncome, bands));
  }

  /* 4. Rebate under section 87A, against normal-rate tax only. */
  let rebate87A = 0;
  let rebateNote = '';
  if (meta.status === 'I' && meta.residentialStatus !== 'NRI') {
    if (regime === 'new') {
      if (totalIncome <= REBATE_NEW_CEILING) {
        rebate87A = Math.min(taxOnNormal, REBATE_NEW);
        rebateNote =
          `New regime: total income is within ${money(REBATE_NEW_CEILING)}, ` +
          `so a rebate of up to ${money(REBATE_NEW)} applies.`;
      } else {
        const excess = totalIncome - REBATE_NEW_CEILING;
        if (taxOnNormal > excess) {
          rebate87A = taxOnNormal - excess;
          rebateNote =
            `Marginal relief under section 87A: total income exceeds ${money(REBATE_NEW_CEILING)} ` +
            `by ${money(excess)}, so tax on normal income is limited to that excess.`;
        }
      }
    } else if (totalIncome <= REBATE_OLD_CEILING) {
      rebate87A = Math.min(taxOnNormal, REBATE_OLD);
      rebateNote =
        `Old regime: total income is within ${money(REBATE_OLD_CEILING)}, ` +
        `so a rebate of up to ${money(REBATE_OLD)} applies.`;
    }
  }
  rebate87A = r0(Math.min(rebate87A, taxOnNormal));
  if (rebate87A === 0) rebateNote = ''; // nothing to explain when nothing was rebated
  const taxAfterRebate = taxOnNormal + taxOnSpecial - rebate87A;

  /* 5. Surcharge, capped at 15 per cent on capital gain and dividend income. */
  const rate = surchargeRate(totalIncome, regime);
  let surcharge = 0;
  let marginalRelief = 0;
  if (rate > 0) {
    const otherTax = max0(D(taxAfterRebate).minus(cappedTax));
    surcharge = D(cappedTax)
      .mul(Math.min(rate, SURCHARGE_CAP_ON_GAINS))
      .plus(otherTax.mul(rate))
      .toNumber();
    if (rate > SURCHARGE_CAP_ON_GAINS && cappedTax > 0) {
      notes.push(
        'Surcharge on capital gain and dividend income is capped at 15 per cent under the proviso to section 2 of the Finance Act.',
      );
    }

    const threshold = SURCHARGE_THRESHOLDS.filter((t) => totalIncome > t).pop();
    if (threshold !== undefined) {
      const taxAtThreshold =
        slabTax(Math.max(threshold - specialRateIncome, 0), bands) + taxOnSpecial;
      const liabilityAtThreshold = D(taxAtThreshold)
        .mul(D(1).plus(surchargeRate(threshold, regime)))
        .toNumber();
      const ceiling = liabilityAtThreshold + (totalIncome - threshold);
      if (taxAfterRebate + surcharge > ceiling) {
        marginalRelief = taxAfterRebate + surcharge - ceiling;
        surcharge = Math.max(surcharge - marginalRelief, 0);
        notes.push(
          `Marginal relief of ${money(marginalRelief)} has been allowed on surcharge at the ${money(threshold)} threshold.`,
        );
      }
    }
  }
  surcharge = r0(surcharge);

  /* 6. Cess, then rounding to the nearest ten rupees under section 288B. */
  const cess = r0(D(taxAfterRebate).plus(surcharge).mul(CESS_RATE).toNumber());
  const beforeRounding = r0(D(taxAfterRebate).plus(surcharge).plus(cess).toNumber());
  const grossTaxLiability = r10(beforeRounding);
  if (grossTaxLiability !== beforeRounding) {
    notes.push(
      `Rounded to the nearest ten rupees under section 288B, from ${money(beforeRounding)}.`,
    );
  }

  /* Relief, interest and the balance. */
  const paid = input.taxesPaid ?? {};
  const advanceTax = Math.max(r0(paid.advanceTax ?? 0), 0);
  const tds = Math.max(r0(paid.tds ?? 0), 0);
  const tcs = Math.max(r0(paid.tcs ?? 0), 0);
  const selfAssessment = Math.max(r0(paid.selfAssessment ?? 0), 0);
  const reliefs = r0(
    (input.reliefs?.section89 ?? 0) + (input.reliefs?.section90 ?? 0) + (input.reliefs?.section91 ?? 0),
  );
  const netTaxLiability = Math.max(grossTaxLiability - reliefs, 0);

  const charges = computeInterest({
    netTaxLiability,
    taxDeducted: tds + tcs,
    advanceTax,
    instalments: paid.instalments ?? [0, 0, 0, advanceTax],
    totalIncome,
    dueDate: meta.dueDate,
    filingDate: meta.filingDate,
  });
  notes.push(...charges.notes);

  const aggregateLiability = netTaxLiability + charges.total;
  const taxesPaid = advanceTax + tds + tcs + selfAssessment;

  return {
    regime,
    basicExemption: exemption,
    grossTotalIncome: restated.grossTotalIncome,
    chapterVIA: restated.chapterVIA,
    totalIncome,
    specialRateIncome,
    normalRateIncome,
    buckets,
    taxOnNormal,
    taxOnSpecial,
    rebate87A,
    rebateNote: rebateNote || undefined,
    surchargeRate: rate,
    surcharge,
    marginalRelief: r0(marginalRelief),
    cess,
    grossTaxLiability,
    reliefs,
    interest234A: charges.section234A,
    interest234B: charges.section234B,
    interest234C: charges.section234C,
    fee234F: charges.fee234F,
    netTaxLiability,
    aggregateLiability,
    taxesPaid,
    balancePayable: Math.max(aggregateLiability - taxesPaid, 0),
    refundDue: Math.max(taxesPaid - aggregateLiability, 0),
    notes,
  };
}

/** The full tax working for the regime the return is filed under. */
export function computeTax(input: TaxInput): TaxComputation {
  return computeForRegime(input, input.meta.regime);
}

/**
 * Both regimes side by side. Comparing slab tables on identical income would
 * flatter the new regime, so each column is recomputed on its own rules: the
 * new one drops the Chapter VI-A deductions, the section 16(ii) and 16(iii)
 * deductions, self-occupied house property interest and the exempt allowances
 * section 115BAC bars, and raises the standard deduction to 75,000.
 */
export function compareRegimes(input: TaxInput): RegimeComparison {
  const oldSide = computeForRegime(input, 'old');
  const newSide = computeForRegime(input, 'new');
  const better: Regime = oldSide.grossTaxLiability <= newSide.grossTaxLiability ? 'old' : 'new';

  return {
    old: oldSide,
    new: newSide,
    better,
    saving: Math.abs(oldSide.grossTaxLiability - newSide.grossTaxLiability),
    detail: {
      old: {
        standardDeduction: restate(input, 'old').standardDeduction,
        chapterVIA: oldSide.chapterVIA,
        totalIncome: oldSide.totalIncome,
      },
      new: {
        standardDeduction: restate(input, 'new').standardDeduction,
        chapterVIA: newSide.chapterVIA,
        totalIncome: newSide.totalIncome,
      },
    },
  };
}
