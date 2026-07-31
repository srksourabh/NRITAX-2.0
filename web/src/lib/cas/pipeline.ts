/**
 * Single CAS apply entry: any source → CasParseResult → applyCasToReturn.
 *
 * Soft-fail: callers always get a Result; never throws for expected mapping misses.
 */

import { applyCasToReturn, type CasApplication } from '@/lib/cas/apply-cas';
import type { CasParseResult } from '@/lib/cas/types';
import {
  mapPortfolioConnectToCasResult,
  type PortfolioParsedLike,
} from '@/lib/casparser/map-portfolio-connect';
import { mapSmartParseToCasResult } from '@/lib/casparser/map-smart-parse';
import type { ReturnData } from '@/lib/itr/types';

export type CasPipelineSource =
  | 'smart-parse'
  | 'portfolio-connect'
  | 'local-cas'
  | 'cdsl'
  | 'gmail-inbox'
  | 'demo';

export type ApplyCasPipelineInput = {
  data: ReturnData;
  source: CasPipelineSource;
  /** Pre-built result (local FIFO service, demo specimen). */
  casResult?: CasParseResult;
  /** Raw casparser smart-parse / CDSL JSON. */
  raw?: Record<string, unknown>;
  /** Portfolio Connect widget payload. */
  portfolio?: PortfolioParsedLike;
  financialYear?: string;
};

export type ApplyCasPipelineSuccess = CasApplication & {
  ok: true;
  cas: CasParseResult;
  source: CasPipelineSource;
  /** True when no realised CG figures / 112A rows were written. */
  emptyGains: boolean;
};

export type ApplyCasPipelineFailure = {
  ok: false;
  message: string;
  warnings: string[];
};

export type ApplyCasPipelineResult = ApplyCasPipelineSuccess | ApplyCasPipelineFailure;

function casHasGainFigures(cas: CasParseResult): boolean {
  if (cas.gains.length > 0) return true;
  const s = cas.summary;
  return (
    s.shortTerm111A !== 0 ||
    s.shortTermOther !== 0 ||
    s.longTerm112A !== 0 ||
    s.longTermOther !== 0 ||
    s.schedule112A.length > 0
  );
}

function resolveCasResult(input: ApplyCasPipelineInput): CasParseResult | null {
  const fy = input.financialYear ?? '2025-26';

  if (input.casResult?.ok) {
    return input.casResult;
  }

  if (input.portfolio) {
    return mapPortfolioConnectToCasResult(input.portfolio, fy);
  }

  if (input.raw) {
    return mapSmartParseToCasResult(input.raw, fy);
  }

  return null;
}

/**
 * Map any CAS source into Schedule CG / 112A on the return.
 */
export function applyCasPipeline(input: ApplyCasPipelineInput): ApplyCasPipelineResult {
  const cas = resolveCasResult(input);
  if (!cas) {
    return {
      ok: false,
      message:
        'Could not read capital gains from this statement. Upload a Detailed CAS PDF, or enter gains by hand.',
      warnings: [],
    };
  }

  const applied = applyCasToReturn(input.data, cas);
  const emptyGains = !casHasGainFigures(cas);
  const hasIdentity = Boolean(cas.investor.pan || cas.investor.name);
  const wroteNothing = applied.fieldsApplied === 0 && applied.rowsApplied === 0;

  if (wroteNothing && !hasIdentity) {
    return {
      ok: false,
      message:
        'Portfolio import returned no usable investor or capital-gain data. Upload a Detailed CAS PDF, or enter gains by hand.',
      warnings: [...cas.warnings, ...applied.warnings],
    };
  }

  const warnings = [...cas.warnings, ...applied.warnings];
  if (emptyGains) {
    const hard =
      'No realised capital gains were applied to Schedule CG. Upload a Detailed CAS PDF with transactions, or enter gains by hand.';
    if (!warnings.includes(hard)) warnings.push(hard);
  }

  return {
    ok: true,
    cas,
    source: input.source,
    data: applied.data,
    fieldsApplied: applied.fieldsApplied,
    rowsApplied: applied.rowsApplied,
    warnings,
    emptyGains,
  };
}
