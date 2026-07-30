/**
 * Convert FIFO lot results into CasGainEntry[] + CasGainSummary.
 */

import type { CasGainEntry, CasGainSummary } from '@/lib/cas/types';
import {
  computeFifoLots,
  type ComputedLot,
  type LotTxn,
} from '@/lib/itr/capital-gains/lot-engine';
import type { AssetClass, MappedLotTxn, TxnMeta } from '@/lib/casparser/map-transactions';

function emptyQuarterly(): CasGainSummary['quarterly'] {
  const z = [0, 0, 0, 0, 0] as [number, number, number, number, number];
  return {
    shortTerm15: [...z],
    shortTerm20: [...z],
    shortTermSlab: [...z],
    longTerm10: [...z],
    longTerm125: [...z],
    longTerm20: [...z],
  };
}

export function emptyGainSummary(): CasGainSummary {
  return {
    shortTerm111A: 0,
    shortTermOther: 0,
    longTerm112A: 0,
    longTermOther: 0,
    schedule112A: [],
    quarterly: emptyQuarterly(),
  };
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function financialYearBounds(financialYear: string): { start: string; end: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(financialYear.trim());
  if (!m) return null;
  const startYear = Number(m[1]);
  const endYY = Number(m[2]);
  if (endYY !== (startYear + 1) % 100) return null;
  return {
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
  };
}

/** Schedule CG table F quarter (1..5) for an Indian FY sale date. */
export function quarterOfSale(saleDate: string, fyStartYear: number): 1 | 2 | 3 | 4 | 5 {
  if (saleDate <= `${fyStartYear}-06-15`) return 1;
  if (saleDate <= `${fyStartYear}-09-15`) return 2;
  if (saleDate <= `${fyStartYear}-12-15`) return 3;
  if (saleDate <= `${fyStartYear + 1}-03-15`) return 4;
  return 5;
}

function metaKey(txn: Pick<LotTxn, 'isin' | 'symbol'>): string {
  return (txn.isin ?? txn.symbol ?? 'unknown').toUpperCase();
}

function buildMetaIndex(txns: MappedLotTxn[]): Map<string, TxnMeta> {
  const map = new Map<string, TxnMeta>();
  for (const txn of txns) {
    const key = metaKey(txn);
    if (!map.has(key)) {
      map.set(key, {
        schemeName: txn.schemeName,
        assetClass: txn.assetClass,
        fundHouse: txn.fundHouse,
      });
    }
  }
  return map;
}

function lotToEntry(
  lot: ComputedLot,
  meta: TxnMeta,
  fyStartYear: number,
): CasGainEntry {
  const assetClass: AssetClass = meta.assetClass;
  const term: 'SHORT' | 'LONG' = lot.holdingKind === 'LTCG' ? 'LONG' : 'SHORT';
  return {
    isin: lot.isin,
    schemeName: meta.schemeName,
    fundHouse: meta.fundHouse,
    assetClass,
    purchaseDate: lot.buyDate,
    saleDate: lot.sellDate,
    units: lot.quantity,
    purchaseValue: lot.buyValue,
    saleValue: lot.sellValue,
    costUsed: lot.buyValue,
    expenses: 0,
    gain: lot.gainAmount,
    term,
    quarter: quarterOfSale(lot.sellDate, fyStartYear),
  };
}

function summarise(gains: CasGainEntry[]): CasGainSummary {
  const summary = emptyGainSummary();
  const q = summary.quarterly;

  for (const g of gains) {
    const qi = g.quarter - 1;
    if (g.term === 'SHORT' && g.assetClass === 'EQUITY') {
      summary.shortTerm111A = roundMoney(summary.shortTerm111A + g.gain);
      q.shortTerm20[qi] = roundMoney((q.shortTerm20[qi] ?? 0) + g.gain);
    } else if (g.term === 'SHORT') {
      summary.shortTermOther = roundMoney(summary.shortTermOther + g.gain);
      q.shortTermSlab[qi] = roundMoney((q.shortTermSlab[qi] ?? 0) + g.gain);
    } else if (g.assetClass === 'EQUITY') {
      summary.longTerm112A = roundMoney(summary.longTerm112A + g.gain);
      q.longTerm125[qi] = roundMoney((q.longTerm125[qi] ?? 0) + g.gain);
      if (g.isin) {
        summary.schedule112A.push({
          isin: g.isin,
          scripName: g.schemeName,
          acquiredBefore31Jan2018: g.purchaseDate <= '2018-01-31',
          units: g.units,
          salePricePerUnit: g.units > 0 ? roundMoney(g.saleValue / g.units) : 0,
          saleValue: g.saleValue,
          costOfAcquisition: g.purchaseValue,
          fmvPerUnit31Jan2018: 0,
          totalFmv: 0,
          expenses: 0,
          purchaseDate: g.purchaseDate,
          saleDate: g.saleDate,
        });
      }
    } else {
      summary.longTermOther = roundMoney(summary.longTermOther + g.gain);
      q.longTerm125[qi] = roundMoney((q.longTerm125[qi] ?? 0) + g.gain);
    }
  }

  return summary;
}

/**
 * Run FIFO on mapped transactions and keep legs whose sale falls in the FY.
 */
export function gainsFromMappedTransactions(
  txns: MappedLotTxn[],
  financialYear: string,
): { gains: CasGainEntry[]; summary: CasGainSummary } {
  if (txns.length === 0) {
    return { gains: [], summary: emptyGainSummary() };
  }

  const bounds = financialYearBounds(financialYear);
  if (!bounds) {
    return { gains: [], summary: emptyGainSummary() };
  }
  const fyStartYear = Number(bounds.start.slice(0, 4));
  const meta = buildMetaIndex(txns);
  const lotTxns: LotTxn[] = txns.map(({ isin, symbol, date, side, quantity, price }) => ({
    isin,
    symbol,
    date,
    side,
    quantity,
    price,
  }));

  const { lots } = computeFifoLots(lotTxns);
  const gains: CasGainEntry[] = [];
  for (const lot of lots) {
    if (lot.sellDate < bounds.start || lot.sellDate > bounds.end) continue;
    const key = metaKey(lot);
    const info = meta.get(key) ?? {
      schemeName: lot.symbol ?? lot.isin ?? 'Security',
      assetClass: 'OTHER' as AssetClass,
    };
    gains.push(lotToEntry(lot, info, fyStartYear));
  }

  return { gains, summary: summarise(gains) };
}
