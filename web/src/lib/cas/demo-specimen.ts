/**
 * Specimen CAS used by the PAN + DOB demo fetch.
 * Live CDSL OTP fetch needs a casparser.in key, BO ID and SMS OTP — this
 * specimen keeps the product demoable offline.
 */

import type { CasParseResult } from '@/lib/cas/types';

export function demoCasSpecimen(input: {
  pan: string;
  dateOfBirth: string;
  fullName?: string;
}): CasParseResult {
  const pan = input.pan.trim().toUpperCase();
  return {
    ok: true,
    source: 'CAMS',
    statementPeriod: { from: '2015-04-01', to: '2026-03-31' },
    investor: {
      name: input.fullName?.trim() || 'Demo Investor',
      pan,
    },
    folios: [
      {
        folio: '12345678/90',
        pan,
        schemes: [
          {
            schemeName: 'Specimen Equity Fund - Growth',
            isin: 'INF090I01239',
            type: 'EQUITY',
            closingBalance: 0,
            transactions: [],
          },
          {
            schemeName: 'Specimen Debt Fund',
            isin: 'INF204K01XF0',
            type: 'DEBT',
            closingBalance: 0,
            transactions: [],
          },
        ],
      },
    ],
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
    warnings: [
      `Demo CAS for PAN ${pan} (DOB ${input.dateOfBirth}). Not a live CAMS/CDSL pull.`,
      'Specimen Equity Fund - Growth: 31 Jan 2018 NAV was supplied for the demo.',
    ],
  };
}
