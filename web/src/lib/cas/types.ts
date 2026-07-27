/**
 * Consolidated Account Statement parsing contract.
 *
 * The heavy lifting is done by the Python `casparser` library, which reads the
 * CAMS / KFintech CAS PDF and computes FIFO capital gains with section 112A
 * grandfathering. This file describes the shape that service returns, so the
 * rest of the app never imports anything Python-adjacent.
 */

export type CasSource = 'CAMS' | 'KFINTECH' | 'CDSL' | 'NSDL' | 'MFCENTRAL' | 'UNKNOWN';

export interface CasInvestor {
  name?: string;
  email?: string;
  pan?: string;
  address?: string;
}

export interface CasTransaction {
  date: string;
  description: string;
  amount: number;
  units: number;
  nav: number;
  balance: number;
  type: string;
  dividendRate?: number;
}

export interface CasScheme {
  schemeName: string;
  isin?: string;
  amfiCode?: string;
  advisor?: string;
  rtaCode?: string;
  rta?: string;
  type?: string;
  closingBalance: number;
  closingValue?: number;
  transactions: CasTransaction[];
}

export interface CasFolio {
  folio: string;
  pan?: string;
  kyc?: string;
  panKyc?: string;
  schemes: CasScheme[];
}

/** One realised gain leg, already split short vs long term by holding period. */
export interface CasGainEntry {
  isin?: string;
  schemeName: string;
  fundHouse?: string;
  /** 'EQUITY' attracts 111A/112A; 'DEBT' is taxed at slab or 112. */
  assetClass: 'EQUITY' | 'DEBT' | 'OTHER';
  purchaseDate: string;
  saleDate: string;
  units: number;
  purchaseValue: number;
  saleValue: number;
  /** Fair market value as on 31 January 2018, for grandfathering. */
  fmv31Jan2018?: number;
  /** Cost actually used after the section 55(2)(ac) higher-of test. */
  costUsed: number;
  expenses?: number;
  stt?: number;
  gain: number;
  term: 'SHORT' | 'LONG';
  /** Financial-year quarter of the sale — drives Schedule CG table F. */
  quarter: 1 | 2 | 3 | 4 | 5;
}

export interface CasGainSummary {
  shortTerm111A: number;
  shortTermOther: number;
  longTerm112A: number;
  longTermOther: number;
  /** Scrip-wise rows ready to drop into Schedule 112A. */
  schedule112A: Array<{
    isin: string;
    scripName: string;
    acquiredBefore31Jan2018: boolean;
    units: number;
    salePricePerUnit: number;
    saleValue: number;
    costOfAcquisition: number;
    fmvPerUnit31Jan2018: number;
    totalFmv: number;
    expenses: number;
    purchaseDate?: string;
    saleDate?: string;
  }>;
  /** Quarter-wise accrual for Schedule CG table F, indices 0..4. */
  quarterly: {
    shortTerm15: [number, number, number, number, number];
    shortTerm20: [number, number, number, number, number];
    shortTermSlab: [number, number, number, number, number];
    longTerm10: [number, number, number, number, number];
    longTerm125: [number, number, number, number, number];
    longTerm20: [number, number, number, number, number];
  };
}

export interface CasParseResult {
  ok: true;
  source: CasSource;
  statementPeriod: { from: string; to: string };
  investor: CasInvestor;
  folios: CasFolio[];
  gains: CasGainEntry[];
  summary: CasGainSummary;
  /** Rows the parser could not classify; surfaced to the taxpayer for review. */
  warnings: string[];
}

export interface CasParseError {
  ok: false;
  code: 'BAD_PASSWORD' | 'UNSUPPORTED_FORMAT' | 'SERVICE_UNAVAILABLE' | 'PARSE_FAILED';
  message: string;
}

export type CasResponse = CasParseResult | CasParseError;

export interface CasClient {
  readonly available: boolean;
  parse(input: {
    file: Uint8Array;
    fileName: string;
    password?: string;
    /** Financial year to compute gains for, e.g. "2025-26". */
    financialYear: string;
  }): Promise<CasResponse>;
}
