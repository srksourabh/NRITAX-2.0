import { describe, expect, it } from 'vitest';

import { computeInterest, type InterestInput } from './interest';

/** Filed on time, no credits, a round 1,00,000 of assessed tax. */
const BASE: InterestInput = {
  netTaxLiability: 100000,
  taxDeducted: 0,
  advanceTax: 0,
  instalments: [0, 0, 0, 0],
  totalIncome: 1000000,
  dueDate: '2026-07-31',
  filingDate: '2026-07-15',
};

const on = (over: Partial<InterestInput>) => computeInterest({ ...BASE, ...over });

describe('section 234A', () => {
  it('charges nothing on a return filed by the due date', () => {
    expect(on({}).section234A).toBe(0);
  });

  it('charges one per cent a month from the due date to the filing date', () => {
    // 31 July to 5 October is two whole months and part of a third.
    expect(on({ filingDate: '2026-10-05' }).section234A).toBe(3000);
  });

  it('counts part of a month as a whole month', () => {
    expect(on({ filingDate: '2026-08-01' }).section234A).toBe(1000);
    expect(on({ filingDate: '2026-08-31' }).section234A).toBe(1000);
    expect(on({ filingDate: '2026-09-01' }).section234A).toBe(2000);
  });

  it('charges only on the shortfall left after advance tax and deductions', () => {
    expect(on({ filingDate: '2026-10-05', advanceTax: 70000 }).section234A).toBe(900);
    expect(on({ filingDate: '2026-10-05', taxDeducted: 100000 }).section234A).toBe(0);
  });

  it('ignores anything below a hundred rupees, as rule 119A requires', () => {
    expect(on({ netTaxLiability: 10099, filingDate: '2026-08-15' }).section234A).toBe(100);
  });
});

describe('section 234B', () => {
  it('charges from 1 April 2026 where advance tax is under ninety per cent', () => {
    // 1 April to 5 October is six whole months and part of a seventh.
    expect(on({ filingDate: '2026-10-05' }).section234B).toBe(7000);
  });

  it('charges nothing once advance tax reaches ninety per cent of assessed tax', () => {
    expect(on({ advanceTax: 90000 }).section234B).toBe(0);
    expect(on({ advanceTax: 89900 }).section234B).toBeGreaterThan(0);
  });

  it('charges on the shortfall, not the whole liability', () => {
    // Four months from 1 April to 15 July, on a 40,000 shortfall.
    expect(on({ advanceTax: 60000 }).section234B).toBe(1600);
  });

  it('charges nothing where tax deducted at source covers the liability', () => {
    expect(on({ taxDeducted: 100000 }).section234B).toBe(0);
  });
});

describe('section 234C', () => {
  it('charges each instalment that was missed entirely', () => {
    // 15,000 and 45,000 and 75,000 for three months each, then 1,00,000 for one.
    expect(on({}).section234C).toBe(450 + 1350 + 2250 + 1000);
  });

  it('charges nothing where every instalment met its share', () => {
    expect(on({ instalments: [15000, 45000, 75000, 100000] }).section234C).toBe(0);
  });

  it('accepts the twelve and thirty-six per cent safe harbours on the first two dates', () => {
    expect(on({ instalments: [12000, 36000, 75000, 100000] }).section234C).toBe(0);
    // A rupee short of the safe harbour and the full fifteen per cent shortfall is charged.
    expect(on({ instalments: [11900, 36000, 75000, 100000] }).section234C).toBe(93);
  });

  it('charges only the part of each instalment left unpaid', () => {
    expect(on({ instalments: [0, 0, 0, 60000] }).section234C).toBe(450 + 1350 + 2250 + 400);
  });

  it('charges nothing where there is no assessed tax to pay', () => {
    expect(on({ netTaxLiability: 0 }).section234C).toBe(0);
  });
});

describe('section 234F', () => {
  it('charges nothing on a return filed by the due date', () => {
    expect(on({}).fee234F).toBe(0);
  });

  it('charges 1,000 where total income does not exceed 5,00,000', () => {
    expect(on({ filingDate: '2026-10-05', totalIncome: 500000 }).fee234F).toBe(1000);
  });

  it('charges 5,000 above that', () => {
    expect(on({ filingDate: '2026-10-05', totalIncome: 500001 }).fee234F).toBe(5000);
  });
});

describe('the total', () => {
  it('adds the three interest charges and the fee', () => {
    const c = on({ filingDate: '2026-10-05' });
    expect(c.total).toBe(c.section234A + c.section234B + c.section234C + c.fee234F);
    expect(c.total).toBe(3000 + 7000 + 5050 + 5000);
    expect(c.notes).toHaveLength(4);
  });

  it('says nothing where nothing is due', () => {
    const c = on({ netTaxLiability: 0 });
    expect(c.total).toBe(0);
    expect(c.notes).toEqual([]);
  });
});
