import { describe, expect, it } from 'vitest';

import { applyCasPipeline } from '@/lib/cas/pipeline';
import { mapPortfolioConnectToCasResult } from '@/lib/casparser/map-portfolio-connect';
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

describe('mapPortfolioConnectToCasResult', () => {
  it('soft-succeeds on investor-only with empty gains and a hard warning', () => {
    const cas = mapPortfolioConnectToCasResult({
      status: 'success',
      cas_type: 'CDSL',
      investor_info: { name: 'Priya Nair', pan: 'ABCDE1234F' },
    });
    expect(cas).not.toBeNull();
    expect(cas!.gains).toHaveLength(0);
    expect(cas!.investor.pan).toBe('ABCDE1234F');
    expect(cas!.warnings.some((w) => /no realised capital gains/i.test(w))).toBe(true);
  });

  it('maps top-level smart-parse shaped payloads when raw_response is missing', () => {
    const cas = mapPortfolioConnectToCasResult(
      {
        status: 'success',
        investor_info: { name: 'Demo', pan: 'ABCDE1234F' },
        mutual_funds: [
          {
            folio_number: '12345678/90',
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
      },
      '2025-26',
    );
    expect(cas).not.toBeNull();
    expect(cas!.gains.length).toBeGreaterThan(0);
    expect(cas!.summary.longTerm112A).toBeGreaterThan(0);
  });
});

describe('applyCasPipeline portfolio-connect', () => {
  it('marks emptyGains and applies PAN for investor-only Portfolio Connect', () => {
    const result = applyCasPipeline({
      data: baseReturn(),
      source: 'portfolio-connect',
      portfolio: {
        status: 'success',
        investor_info: { name: 'Priya Nair', pan: 'ABCDE1234F' },
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.emptyGains).toBe(true);
    expect(result.data.fields['GEN.pan']).toBe('ABCDE1234F');
    expect(result.rowsApplied).toBe(0);
    expect(result.warnings.some((w) => /No realised capital gains were applied/i.test(w))).toBe(
      true,
    );
  });

  it('fills Schedule CG from Portfolio Connect smart-parse shaped payload', () => {
    const result = applyCasPipeline({
      data: baseReturn(),
      source: 'portfolio-connect',
      portfolio: {
        status: 'success',
        investor_info: { name: 'Demo', pan: 'ABCDE1234F' },
        mutual_funds: [
          {
            folio_number: '12345678/90',
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
      },
      financialYear: '2025-26',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.emptyGains).toBe(false);
    expect(result.cas.summary.longTerm112A).toBe(30000);
    expect(result.data.fields['GEN.pan']).toBe('ABCDE1234F');
  });
});
