import { describe, expect, it } from 'vitest';

import {
  SAMPLE_SOFTWARE_ID,
  sampleNriPriyaItr2,
} from '@/lib/itr/samples/nri-priya-itr2';
import { computeReturnTax } from '@/lib/itr/compute/tax-adapter';
import { validateReturn } from '@/lib/itr/validate';

describe('sampleNriPriyaItr2', () => {
  it('clears Category A with a registered software id', () => {
    const report = validateReturn(sampleNriPriyaItr2(), {
      softwareId: SAMPLE_SOFTWARE_ID,
    });
    expect(report.fieldErrors).toEqual([]);
    expect(report.blocking).toEqual([]);
    expect(report.canUpload).toBe(true);
  });

  it('computes positive GTI for the NRI salary + LTCG story', () => {
    const tax = computeReturnTax(sampleNriPriyaItr2());
    expect(tax.grossTotalIncome).toBe(1_602_700);
    expect(tax.refundDue).toBeGreaterThan(0);
  });
});
