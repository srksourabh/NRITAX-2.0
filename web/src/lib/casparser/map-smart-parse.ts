/**
 * Maps casparser /v4/smart/parse JSON into CasParseResult for applyCasToReturn.
 *
 * Smart-parse returns holdings-centric data; capital-gain legs may be empty.
 * We still surface investor PAN and a zeroed gain summary so Part A / CG can
 * receive what is available, with a warning when gains are missing.
 */

import type {
  CasGainSummary,
  CasParseResult,
  CasSource,
} from '@/lib/cas/types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function emptySummary(): CasGainSummary {
  const z = [0, 0, 0, 0, 0] as [number, number, number, number, number];
  return {
    shortTerm111A: 0,
    shortTermOther: 0,
    longTerm112A: 0,
    longTermOther: 0,
    schedule112A: [],
    quarterly: {
      shortTerm15: [...z],
      shortTerm20: [...z],
      shortTermSlab: [...z],
      longTerm10: [...z],
      longTerm125: [...z],
      longTerm20: [...z],
    },
  };
}

function mapSource(raw: string): CasSource {
  const u = raw.toUpperCase();
  if (u.includes('CDSL')) return 'CDSL';
  if (u.includes('NSDL')) return 'NSDL';
  if (u.includes('CAMS') || u.includes('KFIN')) return 'KFINTECH';
  return 'UNKNOWN';
}

/**
 * Best-effort map. Returns null when the payload has no usable investor/holdings.
 */
export function mapSmartParseToCasResult(
  raw: Record<string, unknown>,
  _financialYear: string,
): CasParseResult | null {
  const meta = asRecord(raw.meta);
  const investor = asRecord(raw.investor);
  const summary = asRecord(raw.summary);

  const pan = asString(investor?.pan).toUpperCase();
  const name = asString(investor?.name);
  const demat = raw.demat_accounts;
  if (!pan && !name && !summary) {
    if (!Array.isArray(demat) || demat.length === 0) return null;
  }

  const warnings: string[] = [
    'Smart-parse applied holdings metadata. Realised capital gains may be incomplete — review Schedule CG or upload a Detailed CAS PDF for FIFO gains.',
  ];

  const period = asRecord(meta?.statement_period);
  const casType = asString(meta?.cas_type);
  const from = asString(period?.from) || '2025-04-01';
  const to = asString(period?.to) || '2026-03-31';

  return {
    ok: true,
    source: mapSource(casType),
    statementPeriod: { from, to },
    investor: {
      name: name || undefined,
      pan: pan || undefined,
      email: asString(investor?.email) || undefined,
      address: asString(investor?.address) || undefined,
    },
    folios: [],
    gains: [],
    summary: emptySummary(),
    warnings,
  };
}
