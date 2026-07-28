import { describe, expect, it } from 'vitest';

import { returnToTaxInput, compareReturnRegimes } from '@/lib/itr/compute/tax-adapter';
import { emptyReturn, ASSESSMENT_YEAR } from '@/lib/itr/types';

describe('tax-adapter', () => {
  it('builds TaxInput from a sparse NRI salary return and compares regimes', () => {
    const data = emptyReturn({
      form: 'ITR2',
      assessmentYear: ASSESSMENT_YEAR,
      regime: 'new',
      status: 'I',
      residentialStatus: 'NRI',
      filingSection: '139(1)',
      filingDate: '2026-07-15',
      dueDate: '2026-07-31',
    });
    data.fields['S.salGross'] = 1480000;
    data.fields['S.salChargeable'] = 1405000;
    data.fields['VIA.d80c'] = 150000;
    data.fields['TI.gti'] = 1405000;
    data.fields['VIA.viaAllowed'] = 150000;

    const { input } = returnToTaxInput(data);
    expect(input.grossTotalIncome).toBeGreaterThan(0);
    expect(input.meta.residentialStatus).toBe('NRI');

    const comparison = compareReturnRegimes(data);
    expect(comparison.old.grossTaxLiability).toBeGreaterThanOrEqual(0);
    expect(comparison.new.grossTaxLiability).toBeGreaterThanOrEqual(0);
    expect(['old', 'new']).toContain(comparison.better);
  });
});
