/**
 * Puts a CAS parse result into Schedule CG / Schedule 112A on a return.
 *
 * Pure: returns a new ReturnData. The taxpayer's existing non-CG figures are
 * left alone. CG fields and the 112A table that this mapper owns are replaced
 * on each apply, because a fresh statement is a fresh computation — not a
 * merge with a previous upload.
 *
 * ITR-2 gets the detailed A3/A6/B3/B4 + table F layout. ITR-3 gets the
 * condensed Schedule CG keys (STCG_A3_111A, LTCG_B4_112A, Sch112A, F_Q*).
 */

import type { CasGainEntry, CasGainSummary, CasParseResult } from '@/lib/cas/types';
import { r0, type FieldValue, type ReturnData, type TableRow } from '@/lib/itr/types';

export interface CasApplication {
  data: ReturnData;
  /** How many scalar fields were written. */
  fieldsApplied: number;
  /** How many Schedule 112A rows were written. */
  rowsApplied: number;
  /** Warnings from the parser, plus any mapper notes. */
  warnings: string[];
}

const Q_NODES = [
  'Upto15Of6',
  'Up16Of6To15Of9',
  'Up16Of9To15Of12',
  'Up16Of12To15Of3',
  'Up16Of3To31Of3',
] as const;

/** CG field / table keys this mapper may rewrite on apply. */
const ITR2_OWNED_FIELDS = [
  'CG.a3bFvc',
  'CG.a3bCost',
  'CG.a3bImp',
  'CG.a3bExp',
  'CG.a3bL94',
  'CG.a3bDed',
  'CG.a6Fvc',
  'CG.a6Cost',
  'CG.a6Imp',
  'CG.a6Exp',
  'CG.a6L94',
  'CG.a6Ded',
  'CG.b3Ltcg',
  'CG.b4Fvc',
  'CG.b4Cost',
  'CG.b4Imp',
  'CG.b4Exp',
  'CG.b6Nri112a',
] as const;

const ITR3_OWNED_FIELDS = [
  'CG.STCG_A3_111A',
  'CG.STCG_A6_Other',
  'CG.LTCG_B4_112A',
  'CG.LTCG_B6_Other',
  'CG.F_Q1',
  'CG.F_Q2',
  'CG.F_Q3',
  'CG.F_Q4',
  'CG.F_Q5',
] as const;

function sumLegs(
  gains: readonly CasGainEntry[],
  pred: (g: CasGainEntry) => boolean,
): { sale: number; cost: number; gain: number } {
  return gains.reduce(
    (acc, g) => {
      if (!pred(g)) return acc;
      return {
        sale: acc.sale + r0(g.saleValue),
        cost: acc.cost + r0(g.costUsed),
        gain: acc.gain + r0(g.gain),
      };
    },
    { sale: 0, cost: 0, gain: 0 },
  );
}

function write(
  fields: Record<string, FieldValue>,
  key: string,
  value: number,
  applied: string[],
): void {
  const n = r0(value);
  if (n === 0) return;
  fields[key] = n;
  applied.push(key);
}

function clearOwned(
  fields: Record<string, FieldValue>,
  keys: readonly string[],
): Record<string, FieldValue> {
  const next = { ...fields };
  for (const key of keys) delete next[key];
  // Drop ITR-2 quarterly keys this mapper owns.
  for (const prefix of ['CG.q20_', 'CG.qapp_', 'CG.ql125_', 'CG.ql20_', 'CG.q15_', 'CG.ql10_']) {
    for (const key of Object.keys(next)) {
      if (key.startsWith(prefix)) delete next[key];
    }
  }
  return next;
}

function map112AItr2(summary: CasGainSummary): TableRow[] {
  return summary.schedule112A.map((row) => {
    const units = row.units;
    const out: TableRow = {
      isin: row.isin.toUpperCase(),
      scrip: row.scripName,
      acq: row.acquiredBefore31Jan2018 ? 'B' : 'A',
      qty: units,
      sprice: row.salePricePerUnit,
      sale: r0(row.saleValue),
      cost: r0(row.costOfAcquisition),
      fmvu: row.fmvPerUnit31Jan2018,
      fmv: r0(row.totalFmv),
      exp: r0(row.expenses),
    };
    if (row.purchaseDate) out.dbuy = row.purchaseDate;
    if (row.saleDate) out.dsale = row.saleDate;
    return out;
  });
}

function map112AItr3(summary: CasGainSummary): TableRow[] {
  return summary.schedule112A.map((row) => {
    const balance = r0(row.saleValue) - r0(row.costOfAcquisition) - r0(row.expenses);
    // Prefer grandfathered economics when FMV is present: min(sale, max(cost, fmv)).
    const costOrFmv =
      row.totalFmv > 0
        ? Math.min(r0(row.saleValue), Math.max(r0(row.costOfAcquisition), r0(row.totalFmv)))
        : r0(row.costOfAcquisition);
    const grandBalance = r0(row.saleValue) - costOrFmv - r0(row.expenses);
    return {
      ISIN: row.isin.toUpperCase(),
      ShareName: row.scripName,
      Qty: row.units,
      SalePrice: row.salePricePerUnit,
      SaleValue: r0(row.saleValue),
      CostNoIndex: r0(row.costOfAcquisition),
      FMV31Jan18: r0(row.totalFmv),
      Expense: r0(row.expenses),
      Balance: row.totalFmv > 0 ? grandBalance : balance,
    };
  });
}

function writeQuarterlyItr2(
  fields: Record<string, FieldValue>,
  summary: CasGainSummary,
  applied: string[],
): void {
  const pairs: Array<[string, readonly [number, number, number, number, number]]> = [
    ['q15', summary.quarterly.shortTerm15],
    ['q20', summary.quarterly.shortTerm20],
    ['qapp', summary.quarterly.shortTermSlab],
    ['ql10', summary.quarterly.longTerm10],
    ['ql125', summary.quarterly.longTerm125],
    ['ql20', summary.quarterly.longTerm20],
  ];
  for (const [rowKey, values] of pairs) {
    for (let i = 0; i < Q_NODES.length; i += 1) {
      write(fields, `CG.${rowKey}_${Q_NODES[i]}`, values[i] ?? 0, applied);
    }
  }
}

function writeQuarterlyItr3(
  fields: Record<string, FieldValue>,
  summary: CasGainSummary,
  applied: string[],
): void {
  // ITR-3's condensed table F currently exposes one ST-at-20% row (post-July
  // equity STCG). Fill those five windows from shortTerm20.
  const values = summary.quarterly.shortTerm20;
  const keys = ['CG.F_Q1', 'CG.F_Q2', 'CG.F_Q3', 'CG.F_Q4', 'CG.F_Q5'] as const;
  for (let i = 0; i < keys.length; i += 1) {
    write(fields, keys[i]!, values[i] ?? 0, applied);
  }
}

/**
 * Apply a successful CAS parse onto a return. Empty statements still clear
 * previously mapped CG figures so a re-upload cannot leave stale legs behind.
 */
export function applyCasToReturn(data: ReturnData, cas: CasParseResult): CasApplication {
  const form = data.meta.form;
  const warnings = [...cas.warnings];
  const appliedKeys: string[] = [];

  const owned = form === 'ITR3' ? ITR3_OWNED_FIELDS : ITR2_OWNED_FIELDS;
  let fields = clearOwned(data.fields, owned);
  const tables = { ...data.tables };

  const equityShort = sumLegs(
    cas.gains,
    (g) => g.term === 'SHORT' && g.assetClass === 'EQUITY',
  );
  const otherShort = sumLegs(
    cas.gains,
    (g) => g.term === 'SHORT' && g.assetClass !== 'EQUITY',
  );
  const otherLong = sumLegs(
    cas.gains,
    (g) => g.term === 'LONG' && g.assetClass !== 'EQUITY',
  );

  // Prefer the summary totals the service already reconciled.
  const st111A = r0(cas.summary.shortTerm111A) || equityShort.gain;
  const stOther = r0(cas.summary.shortTermOther) || otherShort.gain;
  const lt112A = r0(cas.summary.longTerm112A);
  const ltOther = r0(cas.summary.longTermOther) || otherLong.gain;

  if (form === 'ITR2') {
    // A3(ii) — equity STT, transfer on/after 23 July 2024: fill consideration
    // and cost so the schedule calc produces the net.
    if (st111A !== 0 || equityShort.sale !== 0) {
      write(fields, 'CG.a3bFvc', equityShort.sale || st111A + equityShort.cost, appliedKeys);
      write(fields, 'CG.a3bCost', equityShort.cost || Math.max(0, (equityShort.sale || st111A) - st111A), appliedKeys);
    }
    if (stOther !== 0 || otherShort.sale !== 0) {
      write(fields, 'CG.a6Fvc', otherShort.sale || stOther + otherShort.cost, appliedKeys);
      write(fields, 'CG.a6Cost', otherShort.cost || Math.max(0, (otherShort.sale || stOther) - stOther), appliedKeys);
    }
    if (ltOther !== 0 || otherLong.sale !== 0) {
      write(fields, 'CG.b4Fvc', otherLong.sale || ltOther + otherLong.cost, appliedKeys);
      write(fields, 'CG.b4Cost', otherLong.cost || Math.max(0, (otherLong.sale || ltOther) - ltOther), appliedKeys);
    }

    if (lt112A !== 0) {
      if (data.meta.residentialStatus === 'NRI') {
        write(fields, 'CG.b6Nri112a', lt112A, appliedKeys);
      } else {
        write(fields, 'CG.b3Ltcg', lt112A, appliedKeys);
      }
    }

    writeQuarterlyItr2(fields, cas.summary, appliedKeys);
    tables.s112a = map112AItr2(cas.summary);
  } else {
    write(fields, 'CG.STCG_A3_111A', st111A, appliedKeys);
    write(fields, 'CG.STCG_A6_Other', stOther, appliedKeys);
    write(fields, 'CG.LTCG_B4_112A', lt112A, appliedKeys);
    write(fields, 'CG.LTCG_B6_Other', ltOther, appliedKeys);
    writeQuarterlyItr3(fields, cas.summary, appliedKeys);
    tables.Sch112A = map112AItr3(cas.summary);
  }

  if (cas.investor.pan && !fields['GEN.pan']) {
    fields = { ...fields, 'GEN.pan': cas.investor.pan.toUpperCase() };
    appliedKeys.push('GEN.pan');
  }

  const rowsApplied =
    form === 'ITR2' ? (tables.s112a?.length ?? 0) : (tables.Sch112A?.length ?? 0);

  if (rowsApplied === 0 && lt112A === 0 && st111A === 0 && stOther === 0 && ltOther === 0) {
    warnings.push('The statement produced no capital-gain figures for this financial year.');
  }

  return {
    data: { ...data, fields, tables },
    fieldsApplied: appliedKeys.length,
    rowsApplied,
    warnings,
  };
}
