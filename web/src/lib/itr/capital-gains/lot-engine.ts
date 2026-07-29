/**
 * FIFO lot matching for capital-gains transactions.
 */

export type LotTxn = {
  isin?: string;
  symbol?: string;
  date: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
};

export type LotHoldingKind = 'STCG' | 'LTCG';

export type ComputedLot = {
  isin?: string;
  symbol?: string;
  buyDate: string;
  sellDate: string;
  quantity: number;
  buyValue: number;
  sellValue: number;
  gainAmount: number;
  holdingKind: LotHoldingKind;
};

export type FifoLotResult = {
  lots: ComputedLot[];
  totalGain: number;
};

type OpenLot = {
  isin?: string;
  symbol?: string;
  buyDate: string;
  quantity: number;
  buyPrice: number;
};

function lotKey(txn: Pick<LotTxn, 'isin' | 'symbol'>): string {
  return (txn.isin ?? txn.symbol ?? 'unknown').toUpperCase();
}

function daysBetween(buyDate: string, sellDate: string): number {
  const buy = new Date(buyDate);
  const sell = new Date(sellDate);
  const ms = sell.getTime() - buy.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function holdingKind(buyDate: string, sellDate: string): LotHoldingKind {
  return daysBetween(buyDate, sellDate) >= 365 ? 'LTCG' : 'STCG';
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Match sell transactions against buy lots using FIFO per ISIN/symbol. */
export function computeFifoLots(txns: LotTxn[]): FifoLotResult {
  const sorted = [...txns].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    if (a.side === b.side) return 0;
    return a.side === 'buy' ? -1 : 1;
  });

  const openByKey = new Map<string, OpenLot[]>();
  const lots: ComputedLot[] = [];

  for (const txn of sorted) {
    if (txn.quantity <= 0 || txn.price < 0) continue;
    const key = lotKey(txn);

    if (txn.side === 'buy') {
      const queue = openByKey.get(key) ?? [];
      queue.push({
        isin: txn.isin,
        symbol: txn.symbol,
        buyDate: txn.date,
        quantity: txn.quantity,
        buyPrice: txn.price,
      });
      openByKey.set(key, queue);
      continue;
    }

    let remaining = txn.quantity;
    const queue = openByKey.get(key) ?? [];

    while (remaining > 0 && queue.length > 0) {
      const buy = queue[0]!;
      const matchedQty = Math.min(remaining, buy.quantity);
      const buyValue = roundMoney(matchedQty * buy.buyPrice);
      const sellValue = roundMoney(matchedQty * txn.price);
      const gainAmount = roundMoney(sellValue - buyValue);

      lots.push({
        isin: txn.isin ?? buy.isin,
        symbol: txn.symbol ?? buy.symbol,
        buyDate: buy.buyDate,
        sellDate: txn.date,
        quantity: matchedQty,
        buyValue,
        sellValue,
        gainAmount,
        holdingKind: holdingKind(buy.buyDate, txn.date),
      });

      buy.quantity -= matchedQty;
      remaining -= matchedQty;
      if (buy.quantity <= 0) queue.shift();
    }

    openByKey.set(key, queue);
  }

  const totalGain = roundMoney(lots.reduce((sum, lot) => sum + lot.gainAmount, 0));
  return { lots, totalGain };
}
