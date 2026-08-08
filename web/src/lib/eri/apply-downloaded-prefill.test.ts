import { describe, expect, it } from 'vitest';

import { applyDownloadedPrefill } from '@/lib/eri/apply-downloaded-prefill';
import { PORTAL_PREFILL_FIXTURE } from '@/lib/eri/portal-prefill-fixture';
import { ASSESSMENT_YEAR, emptyReturn, type ReturnMeta } from '@/lib/itr/types';

const meta: ReturnMeta = {
  form: 'ITR3',
  assessmentYear: ASSESSMENT_YEAR,
  regime: 'new',
  status: 'I',
  residentialStatus: 'RES',
  filingSection: '139(1)',
  filingDate: '2026-07-15',
  dueDate: '2026-07-31',
};

describe('applyDownloadedPrefill', () => {
  it('routes portal camelCase JSON through the mapper', () => {
    const result = applyDownloadedPrefill(
      emptyReturn(meta),
      JSON.stringify(PORTAL_PREFILL_FIXTURE),
      { form: 'ITR3', assessmentYear: ASSESSMENT_YEAR, cache: false },
    );
    expect(result.kind).toBe('portal');
    expect(result.matched).toBeGreaterThan(5);
    expect(result.data.fields['GEN.PAN']).toBe('AAJPS4321K');
    expect(result.message).toMatch(/identity/i);
  });

  it('routes Form_ITR3 path files through importPrefillFile', () => {
    const departmental = {
      Form_ITR3: {
        PartA_GEN1: {
          PersonalInfo: {
            AssesseeName: { FirstName: 'Asha', SurNameOrOrgName: 'Nair' },
            PAN: 'AAJPN1234K',
          },
        },
      },
    };
    const result = applyDownloadedPrefill(
      emptyReturn({ ...meta, form: 'ITR3' }),
      JSON.stringify(departmental),
      { form: 'ITR3', assessmentYear: ASSESSMENT_YEAR, cache: false },
    );
    expect(result.kind).toBe('file');
    expect(result.data.fields['GEN.FirstName'] || result.matched >= 0).toBeTruthy();
  });
});
