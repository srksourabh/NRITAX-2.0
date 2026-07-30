/**
 * Maps casparser /v4/smart/parse JSON into CasParseResult for applyCasToReturn.
 *
 * When scheme/demat transactions exist, FIFO lots fill Schedule CG / 112A.
 * Holdings-only statements still soft-apply investor metadata with a warning.
 */

import type {
  CasFolio,
  CasParseResult,
  CasSource,
} from '@/lib/cas/types';
import { emptyGainSummary, gainsFromMappedTransactions } from '@/lib/casparser/gains-from-lots';
import { mapSmartParseTransactions } from '@/lib/casparser/map-transactions';

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

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function mapSource(raw: string): CasSource {
  const u = raw.toUpperCase();
  if (u.includes('CDSL')) return 'CDSL';
  if (u.includes('NSDL')) return 'NSDL';
  if (u.includes('CAMS') || u.includes('KFIN')) return 'KFINTECH';
  return 'UNKNOWN';
}

function mapFolios(raw: Record<string, unknown>): CasFolio[] {
  const mutualFunds = raw.mutual_funds;
  if (!Array.isArray(mutualFunds)) return [];
  const folios: CasFolio[] = [];
  for (const folioRaw of mutualFunds) {
    const folio = asRecord(folioRaw);
    if (!folio) continue;
    const schemesRaw = folio.schemes;
    const schemes = Array.isArray(schemesRaw)
      ? schemesRaw.flatMap((schemeRaw) => {
          const scheme = asRecord(schemeRaw);
          if (!scheme) return [];
          return [
            {
              schemeName: asString(scheme.name) || 'Mutual fund scheme',
              isin: asString(scheme.isin).toUpperCase() || undefined,
              type: asString(scheme.type) || undefined,
              closingBalance: asNumber(scheme.units),
              closingValue: asNumber(scheme.value) || undefined,
              transactions: [],
            },
          ];
        })
      : [];
    folios.push({
      folio: asString(folio.folio_number) || 'unknown',
      pan: asString(asRecord(folio.additional_info)?.pan) || undefined,
      schemes,
    });
  }
  return folios;
}

/**
 * Best-effort map. Returns null when the payload has no usable investor/holdings.
 */
export function mapSmartParseToCasResult(
  raw: Record<string, unknown>,
  financialYear: string,
): CasParseResult | null {
  const meta = asRecord(raw.meta);
  const investor = asRecord(raw.investor);
  const summary = asRecord(raw.summary);

  const pan = asString(investor?.pan).toUpperCase();
  const name = asString(investor?.name);
  const demat = raw.demat_accounts;
  const mutualFunds = raw.mutual_funds;
  if (!pan && !name && !summary) {
    const hasDemat = Array.isArray(demat) && demat.length > 0;
    const hasMf = Array.isArray(mutualFunds) && mutualFunds.length > 0;
    if (!hasDemat && !hasMf) return null;
  }

  const period = asRecord(meta?.statement_period);
  const casType = asString(meta?.cas_type);
  const from = asString(period?.from) || '2025-04-01';
  const to = asString(period?.to) || '2026-03-31';

  const mappedTxns = mapSmartParseTransactions(raw);
  const { gains, summary: gainSummary } = gainsFromMappedTransactions(
    mappedTxns,
    financialYear,
  );

  const warnings: string[] = [];
  if (gains.length === 0) {
    warnings.push(
      'Smart-parse applied holdings metadata. Realised capital gains may be incomplete — review Schedule CG or upload a Detailed CAS PDF for FIFO gains.',
    );
  }

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
    folios: mapFolios(raw),
    gains,
    summary: gains.length > 0 ? gainSummary : emptyGainSummary(),
    warnings,
  };
}
