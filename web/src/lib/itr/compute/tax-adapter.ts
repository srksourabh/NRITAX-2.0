/**
 * Turns a filled ReturnData into TaxInput for computeTax / compareRegimes.
 *
 * Relies on schedule calc expressions (Part B-TI, VIA, salary, CG, TDS) via
 * evaluateCalcs. Missing heads are nil — the arithmetic still runs.
 */

import { evaluateCalcs } from '@/lib/itr/compute/evaluate';
import { runSetoff, type SetoffInput } from '@/lib/itr/compute/setoff';
import {
  compareRegimes,
  computeTax,
  type RegimeAdjustments,
  type SpecialRateInput,
  type TaxInput,
  type TaxesPaidInput,
} from '@/lib/itr/compute/tax';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3';
import {
  type FormType,
  type RegimeComparison,
  type ReturnData,
  type ScheduleDef,
  type TaxComputation,
} from '@/lib/itr/types';

function schedulesFor(form: FormType): readonly ScheduleDef[] {
  return form === 'ITR3' ? ITR3_SCHEDULES : ITR2_SCHEDULES;
}

function num(values: Record<string, number>, ...keys: string[]): number {
  for (const key of keys) {
    const v = values[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return 0;
}

function fieldNum(data: ReturnData, key: string): number {
  const raw = data.fields[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw.replace(/,/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function sumTableColumn(data: ReturnData, tableKey: string, column: string): number {
  const rows = data.tables[tableKey] ?? [];
  let total = 0;
  for (const row of rows) {
    const raw = row[column];
    if (typeof raw === 'number' && Number.isFinite(raw)) total += raw;
    else if (typeof raw === 'string' && raw.trim() !== '') {
      const n = Number(raw.replace(/,/g, ''));
      if (Number.isFinite(n)) total += n;
    }
  }
  return total;
}

/** Build set-off input from schedule totals (best-effort). */
function buildSetoffInput(data: ReturnData, calcs: Record<string, number>): SetoffInput {
  const regime = data.meta.regime;
  return {
    form: data.meta.form,
    regime,
    income: {
      sal: num(calcs, 'S.salChargeable', 'salChargeable'),
      hp: num(calcs, 'HP.hpTotal', 'hpTotal', 'TI.tiHp'),
      stcg15: fieldNum(data, 'CG.a3aNet') || num(calcs, 'CG.a3aNet'),
      stcg20: 0,
      stcg30: 0,
      stcgap: 0,
      stcgdt: 0,
      ltcg10: 0,
      ltcg125: fieldNum(data, 'CG.b6Nri112a') || num(calcs, 'CG.b6Nri112a'),
      ltcg20: 0,
      ltcgdt: 0,
      bp: num(calcs, 'BP.bpTotal', 'bpTotal', 'TI.tiBp'),
      bpspec: 0,
      bpspecified: 0,
      osnorm: num(calcs, 'OS.osNet', 'osNet', 'TI.tiOs'),
      osrace: 0,
      osdtaa: 0,
    },
  };
}

function specialRatesFromReturn(data: ReturnData, calcs: Record<string, number>): SpecialRateInput[] {
  const rates: SpecialRateInput[] = [];
  const stcg111A = fieldNum(data, 'CG.a3aNet') || num(calcs, 'CG.a3aNet');
  if (stcg111A > 0) {
    rates.push({
      key: 'stcg111A',
      label: 'STCG u/s 111A',
      rate: 0.2,
      amount: stcg111A,
      surchargeCapped: true,
    });
  }
  const ltcg112A =
    fieldNum(data, 'CG.b6Nri112a') ||
    fieldNum(data, 'CG.b5Net') ||
    num(calcs, 'CG.b6Nri112a', 'CG.b5Net');
  if (ltcg112A > 0) {
    rates.push({
      key: 'ltcg112A',
      label: 'LTCG u/s 112A',
      rate: 0.125,
      amount: ltcg112A,
      exempt112A: true,
      surchargeCapped: true,
    });
  }
  return rates;
}

function taxesPaidFromReturn(data: ReturnData, calcs: Record<string, number>): TaxesPaidInput {
  const tds =
    num(calcs, 'TDS.tdsTotal', 'tdsTotal') ||
    sumTableColumn(data, 'tds1', 't1Tds') +
      sumTableColumn(data, 'tds2', 't2Tds') +
      sumTableColumn(data, 'tds3', 't3Tds');
  const advanceTax = sumTableColumn(data, 'it', 'itAmt') || fieldNum(data, 'IT.itAdv');
  const selfAssessment = fieldNum(data, 'IT.itSelf');
  const tcs = sumTableColumn(data, 'tcs', 'tcClaim');
  return {
    tds,
    tcs,
    advanceTax,
    selfAssessment,
  };
}

function regimeAdjustmentsFromReturn(
  data: ReturnData,
  calcs: Record<string, number>,
): RegimeAdjustments {
  const grossSalary =
    fieldNum(data, 'S.salGross') ||
    num(calcs, 'S.salGross', 'salGross') ||
    num(calcs, 'S.salChargeable', 'salChargeable');
  const viaBarred =
    fieldNum(data, 'VIA.d80c') +
    fieldNum(data, 'VIA.d80ccc') +
    fieldNum(data, 'VIA.d80ccd1') +
    fieldNum(data, 'VIA.d80d') +
    fieldNum(data, 'VIA.d80tta') +
    fieldNum(data, 'VIA.d80ttb') +
    fieldNum(data, 'VIA.d80g');
  return {
    grossSalary,
    exemptAllowances: fieldNum(data, 'S.salExempt') || num(calcs, 'S.salExempt'),
    exemptAllowancesBarred: fieldNum(data, 'S.salExemptBarred'),
    deduction16ii: fieldNum(data, 'S.salEnt'),
    deduction16iii: fieldNum(data, 'S.salPt'),
    selfOccupiedInterest: fieldNum(data, 'HP.hpInt1'),
    chapterVIABarred: viaBarred || num(calcs, 'VIA.viaRaw', 'viaRaw'),
  };
}

/**
 * Map ReturnData → TaxInput. Runs schedule calcs first; optional set-off for
 * head income (informational — GTI still comes from Part B-TI when present).
 */
export function returnToTaxInput(data: ReturnData): {
  input: TaxInput;
  calcs: Record<string, number>;
  setoffNotes: string[];
} {
  const schedules = schedulesFor(data.meta.form);
  const calcs = evaluateCalcs(schedules, data);
  const setoff = runSetoff(buildSetoffInput(data, calcs));

  const gti =
    num(calcs, 'TI.gti', 'gti') ||
    fieldNum(data, 'TI.gti') ||
    num(calcs, 'S.salChargeable') +
      num(calcs, 'HP.hpTotal') +
      num(calcs, 'CG.cgTotal') +
      num(calcs, 'OS.osNet') +
      num(calcs, 'BP.bpTotal') ||
    fieldNum(data, 'S.salChargeable') +
      fieldNum(data, 'HP.hpTotal') +
      fieldNum(data, 'CG.cgTotal') +
      fieldNum(data, 'OS.osNet');

  const chapterVIA =
    num(calcs, 'VIA.viaAllowed', 'viaAllowed', 'VIA.viaRaw', 'viaRaw') ||
    fieldNum(data, 'VIA.viaAllowed') ||
    fieldNum(data, 'VIA.viaRaw');

  const input: TaxInput = {
    meta: data.meta,
    grossTotalIncome: Math.max(gti, 0),
    chapterVIA: Math.max(chapterVIA, 0),
    specialRates: specialRatesFromReturn(data, calcs),
    taxesPaid: taxesPaidFromReturn(data, calcs),
    regimeAdjustments: regimeAdjustmentsFromReturn(data, calcs),
    reliefs: {
      section89: fieldNum(data, 'TTI.rel89'),
      section90: fieldNum(data, 'TTI.rel90'),
      section91: fieldNum(data, 'TTI.rel91'),
    },
  };

  const setoffNotes: string[] = [];
  if (setoff.cyla.some((row) => row.hpSetoff || row.osSetoff || row.businessSetoff)) {
    setoffNotes.push('Current-year loss set-off (CYLA) was evaluated for head income.');
  }

  return { input, calcs, setoffNotes };
}

export function computeReturnTax(data: ReturnData): TaxComputation {
  const { input } = returnToTaxInput(data);
  return computeTax(input);
}

export function compareReturnRegimes(data: ReturnData): RegimeComparison {
  const { input } = returnToTaxInput(data);
  return compareRegimes(input);
}
