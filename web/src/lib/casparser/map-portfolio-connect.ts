/**
 * Maps Portfolio Connect ParsedData into CasParseResult for applyCasToReturn.
 */

import type { CasParseResult, CasSource } from '@/lib/cas/types';
import { mapSmartParseToCasResult } from '@/lib/casparser/map-smart-parse';

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

function mapSource(raw: string): CasSource {
  const u = raw.toUpperCase();
  if (u.includes('CDSL')) return 'CDSL';
  if (u.includes('NSDL')) return 'NSDL';
  if (u.includes('CAMS') || u.includes('KFIN')) return 'KFINTECH';
  return 'UNKNOWN';
}

export interface PortfolioParsedLike {
  cas_type?: string;
  status?: string;
  investor_info?: {
    name?: string;
    email?: string;
    mobile?: string;
    pan?: string;
    address?: string;
  };
  raw_response?: unknown;
}

export function mapPortfolioConnectToCasResult(
  data: PortfolioParsedLike,
  financialYear = '2025-26',
): CasParseResult | null {
  const raw = asRecord(data.raw_response);
  if (raw) {
    const fromSmart = mapSmartParseToCasResult(raw, financialYear);
    if (fromSmart) return fromSmart;
  }

  const info = data.investor_info;
  const pan = asString(info?.pan).toUpperCase();
  const name = asString(info?.name);
  if (!pan && !name && data.status !== 'success') return null;

  return {
    ok: true,
    source: mapSource(asString(data.cas_type)),
    statementPeriod: { from: '2025-04-01', to: '2026-03-31' },
    investor: {
      name: name || undefined,
      pan: pan || undefined,
      email: asString(info?.email) || undefined,
      address: asString(info?.address) || undefined,
    },
    folios: [],
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
    warnings: [
      'Portfolio Connect import applied. Realised capital gains may be incomplete — review Schedule CG or upload a Detailed CAS PDF for FIFO gains.',
    ],
  };
}
