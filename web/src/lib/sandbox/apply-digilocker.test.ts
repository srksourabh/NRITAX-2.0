import { describe, expect, it } from 'vitest';

import { applyDigilockerToReturn } from '@/lib/sandbox/apply-digilocker';
import type { DigilockerIdentity } from '@/lib/sandbox/types';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';
import type { ReturnData, ReturnMeta } from '@/lib/itr/types';

const meta: ReturnMeta = {
  form: 'ITR2',
  assessmentYear: ASSESSMENT_YEAR,
  regime: 'new',
  status: 'I',
  residentialStatus: 'NRI',
  filingSection: '139(1)',
  filingDate: '2026-07-15',
  dueDate: '2026-07-31',
};

const identity = (): DigilockerIdentity => ({
  pan: 'aajps4321k',
  aadhaar: '412345678901',
  fullName: 'Meera Devi Sharma',
  dateOfBirth: '1982-03-04',
});

const start = (): ReturnData => emptyReturn(meta);

describe('applyDigilockerToReturn', () => {
  it('maps DigiLocker identity into blank ITR-2 GEN fields', () => {
    const data = start();
    const before = structuredClone(data);

    const result = applyDigilockerToReturn(data, identity(), 'ITR2');

    expect(data).toEqual(before);
    expect(result.data).not.toBe(data);
    expect(result.data.fields['GEN.pan']).toBe('AAJPS4321K');
    expect(result.data.fields['GEN.firstName']).toBe('Meera');
    expect(result.data.fields['GEN.middleName']).toBe('Devi');
    expect(result.data.fields['GEN.surname']).toBe('Sharma');
    expect(result.data.fields['GEN.aadhaar']).toBe('412345678901');
    expect(result.data.fields['GEN.dob']).toBe('1982-03-04');
    expect(result.fieldsApplied).toEqual(
      expect.arrayContaining([
        'GEN.firstName',
        'GEN.middleName',
        'GEN.surname',
        'GEN.pan',
        'GEN.dob',
        'GEN.aadhaar',
      ]),
    );
    expect(result.skipped).toEqual([]);
  });

  it('skips fields the taxpayer already filled', () => {
    const data: ReturnData = {
      ...start(),
      fields: { 'GEN.firstName': 'Preeti', 'GEN.pan': 'AAJPS9999K' },
    };

    const result = applyDigilockerToReturn(data, identity(), 'ITR2');

    expect(result.data.fields['GEN.firstName']).toBe('Preeti');
    expect(result.data.fields['GEN.pan']).toBe('AAJPS9999K');
    expect(result.data.fields['GEN.surname']).toBe('Sharma');
    expect(result.skipped).toEqual(expect.arrayContaining(['GEN.firstName', 'GEN.pan']));
    expect(result.fieldsApplied).toContain('GEN.surname');
    expect(result.fieldsApplied).not.toContain('GEN.firstName');
  });

  it('writes ITR-3 GEN keys when form is ITR3', () => {
    const data = emptyReturn({ ...meta, form: 'ITR3' });
    const result = applyDigilockerToReturn(data, identity(), 'ITR3');

    expect(result.data.fields['GEN.PAN']).toBe('AAJPS4321K');
    expect(result.data.fields['GEN.FirstName']).toBe('Meera');
    expect(result.data.fields['GEN.SurNameOrOrgName']).toBe('Sharma');
    expect(result.data.fields['GEN.AadhaarCardNo']).toBe('412345678901');
    expect(result.data.fields['GEN.DOB']).toBe('1982-03-04');
  });
});
