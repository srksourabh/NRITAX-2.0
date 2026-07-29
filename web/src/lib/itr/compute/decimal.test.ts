import { describe, expect, it } from 'vitest';

import { D, floorHundred, roundRupee, roundTen, sumD } from '@/lib/itr/compute/decimal';
import { r0, r10 } from '@/lib/itr/types';
import { evaluateCalcs } from '@/lib/itr/compute/evaluate';
import type { ReturnData, ScheduleDef } from '@/lib/itr/types';

describe('decimal helpers', () => {
  it('rounds half-up to the nearest rupee without float drift', () => {
    expect(roundRupee(D('0.1').plus('0.2'))).toBe(0);
    expect(roundRupee(D('1.5'))).toBe(2);
    expect(roundRupee(D('2.5'))).toBe(3);
    expect(r0(0.1 + 0.2)).toBe(0);
  });

  it('rounds section 288B to the nearest ten rupees', () => {
    expect(roundTen(124)).toBe(120);
    expect(roundTen(125)).toBe(130);
    expect(r10(124)).toBe(120);
    expect(r10(125)).toBe(130);
  });

  it('floors Rule 119A interest bases to hundreds', () => {
    expect(floorHundred(199)).toBe(100);
    expect(floorHundred(200)).toBe(200);
    expect(floorHundred(-50)).toBe(0);
  });

  it('sums exact decimals that float would drift', () => {
    expect(sumD(0.1, 0.2).toString()).toBe('0.3');
  });
});

describe('evaluateCalcs decimal safety', () => {
  it('evaluates rate multiplications without float residue', () => {
    const schedules: ScheduleDef[] = [
      {
        id: 'T',
        code: 'ScheduleT',
        no: 'T',
        name: 'Test',
        part: 'Part B',
        forms: ['ITR2'],
        sections: [
          {
            key: 's',
            title: 'S',
            calcs: [{ key: 'product', label: 'Product', expr: 'T.a * T.b' }],
          },
        ],
      },
    ];
    const data: ReturnData = {
      meta: {
        form: 'ITR2',
        assessmentYear: '2026-27',
        regime: 'new',
        residentialStatus: 'NRI',
        status: 'I',
        dateOfBirth: '1990-01-01',
        dueDate: '2026-07-31',
        filingDate: '2026-07-01',
        filingSection: '139(1)',
      },
      fields: {
        'T.a': 100000,
        'T.b': 0.125,
      },
      tables: {},
    };
    const values = evaluateCalcs(schedules, data);
    expect(values['T.product']).toBe(12500);
  });
});
