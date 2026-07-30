import { describe, expect, it } from 'vitest';

import { applyCasPipeline } from '@/lib/cas/pipeline';
import type { CasParseResult } from '@/lib/cas/types';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';

function baseReturn() {
  return emptyReturn({
    form: 'ITR2',
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: 'NRI',
    filingSection: '139(1)',
    filingDate: '2026-07-31',
    dueDate: '2026-07-31',
  });
}

function localCasSpecimen(): CasParseResult {
  return {
    ok: true,
    source: 'CAMS',
    statementPeriod: { from: '2025-04-01', to: '2026-03-31' },
    investor: { name: 'Demo', pan: 'ABCDE1234F' },
    folios: [],
    gains: [
      {
        isin: 'INF090I01239',
        schemeName: 'Specimen Equity Fund - Growth',
        assetClass: 'EQUITY',
        purchaseDate: '2023-01-10',
        saleDate: '2025-08-20',
        units: 100,
        purchaseValue: 10000,
        saleValue: 40000,
        costUsed: 10000,
        expenses: 0,
        gain: 30000,
        term: 'LONG',
        quarter: 2,
      },
    ],
    summary: {
      shortTerm111A: 0,
      shortTermOther: 0,
      longTerm112A: 30000,
      longTermOther: 0,
      schedule112A: [
        {
          isin: 'INF090I01239',
          scripName: 'Specimen Equity Fund - Growth',
          acquiredBefore31Jan2018: false,
          units: 100,
          salePricePerUnit: 400,
          saleValue: 40000,
          costOfAcquisition: 10000,
          fmvPerUnit31Jan2018: 0,
          totalFmv: 0,
          expenses: 0,
          purchaseDate: '2023-01-10',
          saleDate: '2025-08-20',
        },
      ],
      quarterly: {
        shortTerm15: [0, 0, 0, 0, 0],
        shortTerm20: [0, 0, 0, 0, 0],
        shortTermSlab: [0, 0, 0, 0, 0],
        longTerm10: [0, 0, 0, 0, 0],
        longTerm125: [0, 30000, 0, 0, 0],
        longTerm20: [0, 0, 0, 0, 0],
      },
    },
    warnings: [],
  };
}

function smartParseRawMatchingSpecimen(): Record<string, unknown> {
  return {
    meta: {
      cas_type: 'CAMS_KFINTECH',
      statement_period: { from: '2025-04-01', to: '2026-03-31' },
    },
    investor: { name: 'Demo', pan: 'ABCDE1234F' },
    summary: { total_value: 0 },
    demat_accounts: [],
    mutual_funds: [
      {
        folio_number: '12345678/90',
        amc: 'Specimen AMC',
        schemes: [
          {
            isin: 'INF090I01239',
            name: 'Specimen Equity Fund - Growth',
            type: 'Equity',
            units: 0,
            transactions: [
              {
                date: '2023-01-10',
                type: 'PURCHASE',
                amount: 10000,
                units: 100,
                nav: 100,
                balance: 100,
              },
              {
                date: '2025-08-20',
                type: 'REDEMPTION',
                amount: 40000,
                units: 100,
                nav: 400,
                balance: 0,
              },
            ],
          },
        ],
      },
    ],
  };
}

function ownedCgKeys(fields: Record<string, unknown>): string[] {
  return Object.keys(fields)
    .filter((k) => k.startsWith('CG.') || k === 'GEN.pan')
    .sort();
}

describe('applyCasPipeline', () => {
  it('applies the same owned CG keys from local-cas and smart-parse entry points', () => {
    const fromLocal = applyCasPipeline({
      data: baseReturn(),
      source: 'local-cas',
      casResult: localCasSpecimen(),
    });
    const fromSmart = applyCasPipeline({
      data: baseReturn(),
      source: 'smart-parse',
      raw: smartParseRawMatchingSpecimen(),
      financialYear: '2025-26',
    });

    expect(fromLocal.ok).toBe(true);
    expect(fromSmart.ok).toBe(true);
    if (!fromLocal.ok || !fromSmart.ok) return;

    expect(fromLocal.cas.summary.longTerm112A).toBe(30000);
    expect(fromSmart.cas.summary.longTerm112A).toBe(30000);
    expect(ownedCgKeys(fromLocal.data.fields)).toEqual(ownedCgKeys(fromSmart.data.fields));
    expect(fromLocal.data.fields['GEN.pan']).toBe('ABCDE1234F');
    expect(fromSmart.data.fields['GEN.pan']).toBe('ABCDE1234F');
  });

  it('soft-fails when nothing is mappable', () => {
    const result = applyCasPipeline({
      data: baseReturn(),
      source: 'smart-parse',
      raw: { meta: {} },
    });
    expect(result.ok).toBe(false);
  });
});
