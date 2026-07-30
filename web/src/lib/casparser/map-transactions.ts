/**
 * Extract buy/sell LotTxn rows from casparser smart-parse JSON.
 *
 * Sources: mutual_funds[].schemes[].transactions and demat equity/MF holdings.
 */

import type { LotTxn } from '@/lib/itr/capital-gains/lot-engine';
import type { CasGainEntry } from '@/lib/cas/types';

export type AssetClass = CasGainEntry['assetClass'];

export type TxnMeta = {
  schemeName: string;
  assetClass: AssetClass;
  fundHouse?: string;
};

export type MappedLotTxn = LotTxn & TxnMeta;

const BUY_TYPES = new Set([
  'PURCHASE',
  'PURCHASE_SIP',
  'SWITCH_IN',
  'SWITCH_IN_MERGER',
  'DIVIDEND_REINVEST',
  'SEGREGATION',
  'BUY',
  'GIFT_IN',
]);

const SELL_TYPES = new Set(['REDEMPTION', 'SWITCH_OUT', 'SELL']);

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

function classifySchemeType(raw: string, name: string): AssetClass {
  const t = raw.toUpperCase();
  if (t.includes('EQUITY')) return 'EQUITY';
  if (t.includes('DEBT')) return 'DEBT';
  const n = name.toLowerCase();
  if (
    n.includes('debt') ||
    n.includes('liquid') ||
    n.includes('bond') ||
    n.includes('gilt') ||
    n.includes('money market')
  ) {
    return 'DEBT';
  }
  if (n.includes('equity') || n.includes('elss') || n.includes('tax saver')) {
    return 'EQUITY';
  }
  return 'OTHER';
}

function sideFromType(type: string): 'buy' | 'sell' | null {
  const u = type.toUpperCase();
  if (BUY_TYPES.has(u)) return 'buy';
  if (SELL_TYPES.has(u)) return 'sell';
  return null;
}

function priceFromTxn(txn: Record<string, unknown>, units: number): number {
  const nav = asNumber(txn.nav);
  if (nav > 0) return nav;
  const amount = Math.abs(asNumber(txn.amount));
  if (units > 0 && amount > 0) return amount / units;
  return 0;
}

function pushTxns(
  out: MappedLotTxn[],
  transactions: unknown,
  meta: { isin?: string; symbol?: string } & TxnMeta,
): void {
  if (!Array.isArray(transactions)) return;
  for (const raw of transactions) {
    const txn = asRecord(raw);
    if (!txn) continue;
    const side = sideFromType(asString(txn.type));
    if (!side) continue;
    const units = Math.abs(asNumber(txn.units));
    const date = asString(txn.date);
    if (!date || units <= 0) continue;
    const price = priceFromTxn(txn, units);
    if (price < 0) continue;
    out.push({
      isin: meta.isin,
      symbol: meta.symbol,
      date,
      side,
      quantity: units,
      price,
      schemeName: meta.schemeName,
      assetClass: meta.assetClass,
      fundHouse: meta.fundHouse,
    });
  }
}

/**
 * Collect FIFO-ready buy/sell legs from a smart-parse payload.
 */
export function mapSmartParseTransactions(raw: Record<string, unknown>): MappedLotTxn[] {
  const out: MappedLotTxn[] = [];

  const mutualFunds = raw.mutual_funds;
  if (Array.isArray(mutualFunds)) {
    for (const folioRaw of mutualFunds) {
      const folio = asRecord(folioRaw);
      if (!folio) continue;
      const fundHouse = asString(folio.amc) || undefined;
      const schemes = folio.schemes;
      if (!Array.isArray(schemes)) continue;
      for (const schemeRaw of schemes) {
        const scheme = asRecord(schemeRaw);
        if (!scheme) continue;
        const name = asString(scheme.name) || 'Mutual fund scheme';
        const isin = asString(scheme.isin).toUpperCase() || undefined;
        pushTxns(out, scheme.transactions, {
          isin,
          symbol: name,
          schemeName: name,
          assetClass: classifySchemeType(asString(scheme.type), name),
          fundHouse,
        });
      }
    }
  }

  const dematAccounts = raw.demat_accounts;
  if (Array.isArray(dematAccounts)) {
    for (const acctRaw of dematAccounts) {
      const acct = asRecord(acctRaw);
      if (!acct) continue;
      const holdings = asRecord(acct.holdings);
      if (!holdings) continue;

      const equityBuckets: Array<{ key: string; assetClass: AssetClass }> = [
        { key: 'equities', assetClass: 'EQUITY' },
        { key: 'demat_mutual_funds', assetClass: 'EQUITY' },
        { key: 'corporate_bonds', assetClass: 'DEBT' },
        { key: 'government_securities', assetClass: 'DEBT' },
      ];

      for (const bucket of equityBuckets) {
        const rows = holdings[bucket.key];
        if (!Array.isArray(rows)) continue;
        for (const holdingRaw of rows) {
          const holding = asRecord(holdingRaw);
          if (!holding) continue;
          const name = asString(holding.name) || bucket.key;
          const isin = asString(holding.isin).toUpperCase() || undefined;
          pushTxns(out, holding.transactions, {
            isin,
            symbol: name,
            schemeName: name,
            assetClass: bucket.assetClass,
          });
        }
      }
    }
  }

  return out;
}
