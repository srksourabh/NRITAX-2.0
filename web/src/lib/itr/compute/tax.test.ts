import { describe, expect, it } from 'vitest';

import { ASSESSMENT_YEAR, type ReturnMeta } from '@/lib/itr/types';

import { basicExemption, slabTax, surchargeRate, NEW_REGIME_BANDS, oldRegimeBands } from './slabs';
import { compareRegimes, computeTax, type TaxInput } from './tax';

/** Filed on time, so nothing under 234A or 234F disturbs the tax figures. */
const META: ReturnMeta = {
  form: 'ITR2',
  assessmentYear: ASSESSMENT_YEAR,
  regime: 'new',
  status: 'I',
  residentialStatus: 'RES',
  filingSection: '139(1)',
  filingDate: '2026-07-15',
  dueDate: '2026-07-31',
};

function input(over: Partial<TaxInput> = {}, meta: Partial<ReturnMeta> = {}): TaxInput {
  return { meta: { ...META, ...meta }, grossTotalIncome: 0, chapterVIA: 0, ...over };
}

describe('slab tables', () => {
  it('taxes each new-regime band at its own rate', () => {
    expect(slabTax(400000, NEW_REGIME_BANDS)).toBe(0);
    expect(slabTax(800000, NEW_REGIME_BANDS)).toBe(20000);
    expect(slabTax(1200000, NEW_REGIME_BANDS)).toBe(60000);
    expect(slabTax(2400000, NEW_REGIME_BANDS)).toBe(300000);
    expect(slabTax(3000000, NEW_REGIME_BANDS)).toBe(480000);
  });

  it('lets the old-regime exemption swallow the bands it covers', () => {
    expect(slabTax(600000, oldRegimeBands(250000))).toBe(32500);
    expect(slabTax(600000, oldRegimeBands(300000))).toBe(30000);
    expect(slabTax(600000, oldRegimeBands(500000))).toBe(20000);
  });

  it('grades the old-regime exemption by age at 1 April 2026', () => {
    expect(basicExemption('new', '1940-01-01')).toBe(400000);
    expect(basicExemption('old', '1990-06-15')).toBe(250000);
    expect(basicExemption('old', '1966-04-01')).toBe(300000);
    expect(basicExemption('old', '1966-04-02')).toBe(250000);
    expect(basicExemption('old', '1946-04-01')).toBe(500000);
    expect(basicExemption('old')).toBe(250000);
  });

  it('caps the new-regime surcharge at 25 per cent', () => {
    expect(surchargeRate(5000000, 'new')).toBe(0);
    expect(surchargeRate(5000001, 'new')).toBe(0.1);
    expect(surchargeRate(15000000, 'old')).toBe(0.15);
    expect(surchargeRate(60000000, 'old')).toBe(0.37);
    expect(surchargeRate(60000000, 'new')).toBe(0.25);
  });
});

describe('section 87A rebate', () => {
  it('leaves a 12,00,000 new-regime income with nothing to pay', () => {
    const t = computeTax(input({ grossTotalIncome: 1200000 }));
    expect(t.totalIncome).toBe(1200000);
    expect(t.taxOnNormal).toBe(60000);
    expect(t.rebate87A).toBe(60000);
    expect(t.cess).toBe(0);
    expect(t.grossTaxLiability).toBe(0);
  });

  it('limits tax on 12,10,000 to the excess above 12,00,000', () => {
    const t = computeTax(input({ grossTotalIncome: 1210000 }));
    expect(t.taxOnNormal).toBe(61500);
    expect(t.rebate87A).toBe(51500);
    expect(t.cess).toBe(400);
    expect(t.grossTaxLiability).toBe(10400);
    expect(t.rebateNote).toMatch(/Marginal relief/);
  });

  it('stops at 12,500 under the old regime and only up to 5,00,000', () => {
    const under = computeTax(input({ grossTotalIncome: 500000 }, { regime: 'old' }));
    expect(under.taxOnNormal).toBe(12500);
    expect(under.rebate87A).toBe(12500);
    expect(under.grossTaxLiability).toBe(0);

    const over = computeTax(input({ grossTotalIncome: 500100 }, { regime: 'old' }));
    expect(over.rebate87A).toBe(0);
  });

  it('is not available to a non-resident', () => {
    const t = computeTax(input({ grossTotalIncome: 1200000 }, { residentialStatus: 'NRI' }));
    expect(t.rebate87A).toBe(0);
    expect(t.grossTaxLiability).toBe(62400);
  });

  it('is not available to a Hindu undivided family', () => {
    const t = computeTax(input({ grossTotalIncome: 1200000 }, { status: 'H' }));
    expect(t.rebate87A).toBe(0);
  });

  it('does not reach tax on special-rate income', () => {
    const t = computeTax(
      input({
        grossTotalIncome: 1000000,
        specialRates: [
          { key: 'ltcg125', label: 'Long term capital gain at 12.5%', rate: 0.125, amount: 400000 },
        ],
      }),
    );
    expect(t.normalRateIncome).toBe(600000);
    expect(t.taxOnNormal).toBe(10000);
    expect(t.taxOnSpecial).toBe(50000);
    // The rebate takes the 10,000 of slab tax and leaves the 50,000 alone.
    expect(t.rebate87A).toBe(10000);
    expect(t.grossTaxLiability).toBe(52000);
  });
});

describe('special-rate buckets', () => {
  it('taxes a 2,00,000 section 112A gain on 75,000 after the exemption', () => {
    const t = computeTax(
      input({
        grossTotalIncome: 200000,
        specialRates: [
          {
            key: 'ltcg125',
            label: 'Long term capital gain under section 112A',
            rate: 0.125,
            amount: 200000,
            exempt112A: true,
            surchargeCapped: true,
          },
        ],
      }),
    );
    expect(t.buckets[0].exempt).toBe(125000);
    expect(t.buckets[0].taxable).toBe(75000);
    expect(t.buckets[0].tax).toBe(9375);
    expect(t.taxOnNormal).toBe(0);
    expect(t.taxOnSpecial).toBe(9375);
    expect(t.cess).toBe(375);
    expect(t.grossTaxLiability).toBe(9750);
  });

  it('spreads the 1,25,000 exemption across the long-term equity buckets in order', () => {
    const t = computeTax(
      input({
        grossTotalIncome: 300000,
        specialRates: [
          { key: 'ltcg10', label: 'Long term at 10%', rate: 0.1, amount: 80000, exempt112A: true },
          { key: 'ltcg125', label: 'Long term at 12.5%', rate: 0.125, amount: 120000, exempt112A: true },
          { key: 'stcg20', label: 'Short term under section 111A', rate: 0.2, amount: 100000 },
        ],
      }),
    );
    expect(t.buckets.map((b) => b.exempt)).toEqual([80000, 45000, 0]);
    expect(t.buckets.map((b) => b.taxable)).toEqual([0, 75000, 100000]);
    expect(t.taxOnSpecial).toBe(9375 + 20000);
  });

  it('floors normal-rate income at zero when Chapter VI-A exceeds the slab-rate balance', () => {
    const t = computeTax(
      input({
        grossTotalIncome: 900000,
        chapterVIA: 150000,
        specialRates: [
          { key: 'stcg20', label: 'Short term under section 111A', rate: 0.2, amount: 800000 },
        ],
      }),
    );
    expect(t.totalIncome).toBe(750000);
    expect(t.normalRateIncome).toBe(0);
    expect(t.notes.some((n) => n.includes('floored at zero'))).toBe(true);
  });
});

describe('agricultural aggregation', () => {
  it('aggregates net agricultural income for rate and then rebates it', () => {
    const t = computeTax(input({ grossTotalIncome: 1500000, netAgriculturalIncome: 200000 }));
    // Tax on 17,00,000 less tax on 2,00,000 + the 4,00,000 exemption.
    expect(t.taxOnNormal).toBe(130000);
    expect(t.grossTaxLiability).toBe(135200);
    expect(t.notes.some((n) => n.includes('aggregated for rate purposes'))).toBe(true);
  });

  it('ignores agricultural income of 5,000 or less', () => {
    const t = computeTax(input({ grossTotalIncome: 1500000, netAgriculturalIncome: 5000 }));
    expect(t.taxOnNormal).toBe(105000);
  });

  it('leaves income below the basic exemption alone', () => {
    const t = computeTax(input({ grossTotalIncome: 350000, netAgriculturalIncome: 200000 }));
    expect(t.taxOnNormal).toBe(0);
  });
});

describe('surcharge', () => {
  it('gives marginal relief just above the 50,00,000 threshold', () => {
    const t = computeTax(input({ grossTotalIncome: 5050000 }));
    expect(t.surchargeRate).toBe(0.1);
    expect(t.taxOnNormal).toBe(1095000);
    expect(t.marginalRelief).toBe(74500);
    expect(t.surcharge).toBe(35000);
    // Tax plus surcharge is held to the tax at 50,00,000 plus the 50,000 excess.
    expect(t.taxOnNormal + t.surcharge).toBe(1080000 + 50000);
    expect(t.grossTaxLiability).toBe(1175200);
  });

  it('withdraws the relief once the income has outgrown it', () => {
    const t = computeTax(input({ grossTotalIncome: 5500000 }));
    expect(t.taxOnNormal).toBe(1230000);
    expect(t.marginalRelief).toBe(0);
    expect(t.surcharge).toBe(123000);
    expect(t.grossTaxLiability).toBe(1407120);
  });

  it('caps surcharge on capital gain income at 15 per cent', () => {
    const t = computeTax(
      input({
        grossTotalIncome: 30000000,
        specialRates: [
          {
            key: 'ltcg125',
            label: 'Long term capital gain under section 112A',
            rate: 0.125,
            amount: 10000000,
            exempt112A: true,
            surchargeCapped: true,
          },
        ],
      }),
    );
    expect(t.surchargeRate).toBe(0.25);
    const gainTax = t.buckets[0].tax;
    const otherTax = t.taxOnNormal - t.rebate87A;
    expect(t.surcharge).toBe(Math.round(gainTax * 0.15 + otherTax * 0.25));
    expect(t.notes.some((n) => n.includes('capped at 15 per cent'))).toBe(true);
  });
});

describe('regime comparison', () => {
  const salaried = input(
    {
      grossTotalIncome: 1250000, // 15,00,000 salary less 2,00,000 exempt less 50,000 standard
      chapterVIA: 150000,
      regimeAdjustments: {
        grossSalary: 1500000,
        exemptAllowances: 200000,
        exemptAllowancesBarred: 200000,
        deduction16ii: 0,
        deduction16iii: 0,
        selfOccupiedInterest: 0,
        chapterVIABarred: 150000,
      },
    },
    { regime: 'old' },
  );

  it('restates each column on its own rules', () => {
    const c = compareRegimes(salaried);
    expect(c.detail.old).toEqual({
      standardDeduction: 50000,
      chapterVIA: 150000,
      totalIncome: 1100000,
    });
    expect(c.detail.new).toEqual({
      standardDeduction: 75000,
      chapterVIA: 0,
      totalIncome: 1425000,
    });
    expect(c.old.grossTaxLiability).toBe(148200);
    expect(c.new.grossTaxLiability).toBe(97500);
    expect(c.better).toBe('new');
    expect(c.saving).toBe(50700);
  });

  it('drops the 16(ii), 16(iii) and self-occupied interest claims on the new side', () => {
    const c = compareRegimes(
      input(
        {
          grossTotalIncome: 900000,
          regimeAdjustments: {
            grossSalary: 1200000,
            exemptAllowances: 0,
            exemptAllowancesBarred: 0,
            deduction16ii: 5000,
            deduction16iii: 2500,
            selfOccupiedInterest: 200000,
            chapterVIABarred: 0,
          },
        },
        { regime: 'old' },
      ),
    );
    // 9,00,000 + 5,000 + 2,500 + 2,00,000, less the extra 25,000 of standard deduction.
    expect(c.new.totalIncome).toBe(1082500);
    expect(c.old.totalIncome).toBe(900000);
  });

  it('caps the new-regime standard deduction at net salary', () => {
    const c = compareRegimes(
      input(
        {
          grossTotalIncome: 10000,
          regimeAdjustments: {
            grossSalary: 40000,
            exemptAllowances: 0,
            exemptAllowancesBarred: 0,
            deduction16ii: 0,
            deduction16iii: 0,
            selfOccupiedInterest: 0,
            chapterVIABarred: 0,
          },
        },
        { regime: 'old' },
      ),
    );
    expect(c.detail.old.standardDeduction).toBe(40000);
    expect(c.detail.new.standardDeduction).toBe(40000);
    expect(c.new.grossTotalIncome).toBe(10000);
  });

  it('leaves both columns on the same income when nothing regime-sensitive was supplied', () => {
    const c = compareRegimes(input({ grossTotalIncome: 2000000 }));
    expect(c.old.totalIncome).toBe(2000000);
    expect(c.new.totalIncome).toBe(2000000);
    expect(c.better).toBe('new');
  });
});

describe('the balance to pay', () => {
  it('nets relief, interest and credits off the gross liability', () => {
    const t = computeTax(
      input({
        grossTotalIncome: 2000000,
        reliefs: { section90: 20000 },
        taxesPaid: { tds: 200000, advanceTax: 100000, instalments: [15000, 45000, 75000, 100000] },
      }),
    );
    expect(t.grossTaxLiability).toBe(208000);
    expect(t.reliefs).toBe(20000);
    expect(t.netTaxLiability).toBe(188000);
    expect(t.taxesPaid).toBe(300000);
    // Tax deducted already covers the net liability, so no interest arises.
    expect(t.interest234B).toBe(0);
    expect(t.interest234C).toBe(0);
    expect(t.aggregateLiability).toBe(188000);
    expect(t.balancePayable).toBe(0);
    expect(t.refundDue).toBe(112000);
  });
});
