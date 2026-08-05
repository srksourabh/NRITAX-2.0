import { describe, expect, it } from 'vitest';

import { buildJuktiSnapshot } from '@/lib/jukti/guidance';
import { emptyReturn } from '@/lib/itr/types';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3';

describe('buildJuktiSnapshot', () => {
  it('returns tips for the active schedule', () => {
    const data = emptyReturn({
      form: 'ITR3',
      assessmentYear: '2026-27',
      regime: 'new',
      status: 'I',
      residentialStatus: 'NRI',
      filingSection: '139(1)',
      filingDate: '2026-07-01',
      dueDate: '2026-07-31',
    });
    data.fields['GEN.ResidentialStatus'] = 'NRI';
    const cg = ITR3_SCHEDULES.find((s) => s.id === 'CG');
    const snap = buildJuktiSnapshot({ form: 'ITR3', data, schedule: cg });
    expect(snap.tips.length).toBeGreaterThan(0);
    expect(snap.tips.some((t) => t.id === 'cg')).toBe(true);
  });
});
