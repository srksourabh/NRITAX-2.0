import { describe, expect, it } from 'vitest';

import { mapSmartParseToCasResult } from '@/lib/casparser/map-smart-parse';

/** Minimal smart-parse JSON with MF buy + sell spanning the LTCG boundary. */
function smartParseWithTransactions(): Record<string, unknown> {
  return {
    meta: {
      cas_type: 'CAMS_KFINTECH',
      statement_period: { from: '2025-04-01', to: '2026-03-31' },
    },
    investor: { name: 'Demo Investor', pan: 'ABCDE1234F' },
    summary: { total_value: 50000 },
    demat_accounts: [],
    mutual_funds: [
      {
        folio_number: '12345678/90',
        amc: 'Specimen AMC',
        registrar: 'CAMS',
        value: 40000,
        schemes: [
          {
            isin: 'INF090I01239',
            name: 'Specimen Equity Fund - Growth',
            type: 'Equity',
            units: 0,
            nav: 400,
            value: 0,
            cost: 0,
            transactions: [
              {
                date: '2023-01-10',
                description: 'Purchase',
                type: 'PURCHASE',
                amount: 10000,
                units: 100,
                nav: 100,
                balance: 100,
              },
              {
                date: '2025-08-20',
                description: 'Redemption',
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

describe('mapSmartParseToCasResult with transactions', () => {
  it('produces CG gains from buy/sell transactions', () => {
    const result = mapSmartParseToCasResult(smartParseWithTransactions(), '2025-26');

    expect(result).not.toBeNull();
    expect(result!.gains.length).toBeGreaterThan(0);
    expect(
      result!.summary.longTerm112A > 0 || result!.summary.shortTerm111A > 0,
    ).toBe(true);
  });
});
