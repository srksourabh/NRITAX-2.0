import { describe, expect, it } from 'vitest';

import { applyCasToReturn } from '@/lib/cas/apply-cas';
import type { CasParseResult } from '@/lib/cas/types';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';

function specimen(): CasParseResult {
  return {
    ok: true,
    source: 'CAMS',
    statementPeriod: { from: '2015-04-01', to: '2026-03-31' },
    investor: { name: 'A Taxpayer', pan: 'ABCDE1234F' },
    folios: [],
    gains: [
      {
        isin: 'INF090I01239',
        schemeName: 'Specimen Equity Fund - Growth',
        assetClass: 'EQUITY',
        purchaseDate: '2016-07-01',
        saleDate: '2025-08-20',
        units: 100,
        purchaseValue: 10000,
        saleValue: 40000,
        fmv31Jan2018: 25000,
        costUsed: 25000,
        expenses: 0,
        stt: 8,
        gain: 15000,
        term: 'LONG',
        quarter: 2,
      },
      {
        isin: 'INF204K01XF0',
        schemeName: 'Specimen Debt Fund',
        assetClass: 'DEBT',
        purchaseDate: '2024-01-10',
        saleDate: '2025-05-10',
        units: 50,
        purchaseValue: 50000,
        saleValue: 52000,
        costUsed: 50000,
        expenses: 0,
        stt: 0,
        gain: 2000,
        term: 'SHORT',
        quarter: 1,
      },
    ],
    summary: {
      shortTerm111A: 0,
      shortTermOther: 2000,
      longTerm112A: 15000,
      longTermOther: 0,
      schedule112A: [
        {
          isin: 'INF090I01239',
          scripName: 'Specimen Equity Fund - Growth',
          acquiredBefore31Jan2018: true,
          units: 100,
          salePricePerUnit: 400,
          saleValue: 40000,
          costOfAcquisition: 10000,
          fmvPerUnit31Jan2018: 250,
          totalFmv: 25000,
          expenses: 0,
          purchaseDate: '2016-07-01',
          saleDate: '2025-08-20',
        },
      ],
      quarterly: {
        shortTerm15: [0, 0, 0, 0, 0],
        shortTerm20: [0, 0, 0, 0, 0],
        shortTermSlab: [2000, 0, 0, 0, 0],
        longTerm10: [0, 0, 0, 0, 0],
        longTerm125: [0, 15000, 0, 0, 0],
        longTerm20: [0, 0, 0, 0, 0],
      },
    },
    warnings: ['Specimen Equity Fund - Growth: 31 Jan 2018 NAV was supplied for the test.'],
  };
}

function blank(form: 'ITR2' | 'ITR3' = 'ITR2') {
  return emptyReturn({
    form,
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: 'NRI',
    filingSection: '139(1)',
    filingDate: '2026-07-15',
    dueDate: '2026-07-31',
  });
}

describe('applyCasToReturn', () => {
  it('maps ITR-2 Schedule 112A rows, B3/B6 LTCG, other STCG and table F', () => {
    const result = applyCasToReturn(blank('ITR2'), specimen());

    expect(result.rowsApplied).toBe(1);
    expect(result.data.tables.s112a?.[0]).toMatchObject({
      isin: 'INF090I01239',
      scrip: 'Specimen Equity Fund - Growth',
      acq: 'B',
      qty: 100,
      sale: 40000,
      cost: 10000,
      fmv: 25000,
    });
    // NRI → b6Nri112a rather than b3Ltcg
    expect(result.data.fields['CG.b6Nri112a']).toBe(15000);
    expect(result.data.fields['CG.b3Ltcg']).toBeUndefined();
    expect(result.data.fields['CG.a6Fvc']).toBe(52000);
    expect(result.data.fields['CG.a6Cost']).toBe(50000);
    expect(result.data.fields['CG.ql125_Up16Of6To15Of9']).toBe(15000);
    expect(result.data.fields['CG.qapp_Upto15Of6']).toBe(2000);
    expect(result.data.fields['GEN.pan']).toBe('ABCDE1234F');
    expect(result.warnings[0]).toContain('31 Jan 2018');
  });

  it('writes resident 112A into b3Ltcg', () => {
    const data = blank('ITR2');
    data.meta.residentialStatus = 'RES';
    const result = applyCasToReturn(data, specimen());
    expect(result.data.fields['CG.b3Ltcg']).toBe(15000);
    expect(result.data.fields['CG.b6Nri112a']).toBeUndefined();
  });

  it('maps ITR-3 condensed CG keys and Sch112A', () => {
    const result = applyCasToReturn(blank('ITR3'), specimen());
    expect(result.data.fields['CG.STCG_A6_Other']).toBe(2000);
    expect(result.data.fields['CG.LTCG_B4_112A']).toBe(15000);
    expect(result.data.fields['CG.F_Q1']).toBeUndefined(); // shortTerm20 is all zero
    expect(result.data.tables.Sch112A?.[0]).toMatchObject({
      ISIN: 'INF090I01239',
      ShareName: 'Specimen Equity Fund - Growth',
      SaleValue: 40000,
      CostNoIndex: 10000,
      FMV31Jan18: 25000,
      Balance: 15000, // 40000 - max(10000,25000) = 15000
    });
  });

  it('does not wipe unrelated fields', () => {
    const data = blank('ITR2');
    data.fields['GEN.firstName'] = 'Ada';
    data.fields['S.sal17_1'] = 900000;
    const result = applyCasToReturn(data, specimen());
    expect(result.data.fields['GEN.firstName']).toBe('Ada');
    expect(result.data.fields['S.sal17_1']).toBe(900000);
  });

  it('clears a previous CAS mapping when re-applied with an empty statement', () => {
    const first = applyCasToReturn(blank('ITR2'), specimen());
    const empty: CasParseResult = {
      ...specimen(),
      gains: [],
      summary: {
        shortTerm111A: 0,
        shortTermOther: 0,
        longTerm112A: 0,
        longTermOther: 0,
        schedule112A: [],
        quarterly: {
          shortTerm15: [0, 0, 0, 0, 0],
          shortTerm20: [0, 0, 0, 0, 0],
          shortTermSlab: [0, 0, 0, 0, 0],
          longTerm10: [0, 0, 0, 0, 0],
          longTerm125: [0, 0, 0, 0, 0],
          longTerm20: [0, 0, 0, 0, 0],
        },
      },
      warnings: [],
    };
    const second = applyCasToReturn(first.data, empty);
    expect(second.data.fields['CG.b6Nri112a']).toBeUndefined();
    expect(second.data.tables.s112a).toEqual([]);
    expect(second.warnings[0]).toContain('no capital-gain');
  });
});
