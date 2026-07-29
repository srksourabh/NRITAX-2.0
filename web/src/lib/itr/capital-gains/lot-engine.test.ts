import { describe, expect, it } from 'vitest';

import { computeFifoLots, type LotTxn } from '@/lib/itr/capital-gains/lot-engine';

describe('computeFifoLots', () => {
  it('matches a single buy and sell as STCG within one year', () => {
    const txns: LotTxn[] = [
      { symbol: 'INFY', date: '2024-01-01', side: 'buy', quantity: 10, price: 100 },
      { symbol: 'INFY', date: '2024-06-01', side: 'sell', quantity: 10, price: 120 },
    ];

    const result = computeFifoLots(txns);
    expect(result.lots).toHaveLength(1);
    expect(result.lots[0]).toMatchObject({
      symbol: 'INFY',
      buyDate: '2024-01-01',
      sellDate: '2024-06-01',
      quantity: 10,
      buyValue: 1000,
      sellValue: 1200,
      gainAmount: 200,
      holdingKind: 'STCG',
    });
    expect(result.totalGain).toBe(200);
  });

  it('classifies LTCG when holding period is at least 365 days', () => {
    const txns: LotTxn[] = [
      { isin: 'INE009A01021', date: '2022-01-01', side: 'buy', quantity: 5, price: 200 },
      { isin: 'INE009A01021', date: '2023-01-02', side: 'sell', quantity: 5, price: 250 },
    ];

    const result = computeFifoLots(txns);
    expect(result.lots[0]?.holdingKind).toBe('LTCG');
    expect(result.totalGain).toBe(250);
  });

  it('uses FIFO when multiple buys exist', () => {
    const txns: LotTxn[] = [
      { symbol: 'TCS', date: '2024-01-01', side: 'buy', quantity: 5, price: 100 },
      { symbol: 'TCS', date: '2024-03-01', side: 'buy', quantity: 5, price: 110 },
      { symbol: 'TCS', date: '2024-06-01', side: 'sell', quantity: 7, price: 130 },
    ];

    const result = computeFifoLots(txns);
    expect(result.lots).toHaveLength(2);
    expect(result.lots[0]).toMatchObject({ buyDate: '2024-01-01', quantity: 5, gainAmount: 150 });
    expect(result.lots[1]).toMatchObject({ buyDate: '2024-03-01', quantity: 2, gainAmount: 40 });
    expect(result.totalGain).toBe(190);
  });

  it('keeps separate queues per ISIN/symbol', () => {
    const txns: LotTxn[] = [
      { symbol: 'AAA', date: '2024-01-01', side: 'buy', quantity: 1, price: 10 },
      { symbol: 'BBB', date: '2024-01-01', side: 'buy', quantity: 1, price: 20 },
      { symbol: 'AAA', date: '2024-02-01', side: 'sell', quantity: 1, price: 15 },
      { symbol: 'BBB', date: '2024-02-01', side: 'sell', quantity: 1, price: 25 },
    ];

    const result = computeFifoLots(txns);
    expect(result.lots).toHaveLength(2);
    expect(result.totalGain).toBe(10);
  });

  it('ignores invalid quantities and prices', () => {
    const txns: LotTxn[] = [
      { symbol: 'X', date: '2024-01-01', side: 'buy', quantity: 0, price: 100 },
      { symbol: 'X', date: '2024-02-01', side: 'sell', quantity: 1, price: -1 },
    ];

    const result = computeFifoLots(txns);
    expect(result.lots).toHaveLength(0);
    expect(result.totalGain).toBe(0);
  });
});
