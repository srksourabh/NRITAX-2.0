import { describe, expect, it } from 'vitest';

import {
  isValidPan,
  taxpayerIdentityFromReturn,
} from '@/lib/filing/drafts';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';

function blank(form: 'ITR2' | 'ITR3' = 'ITR2') {
  return emptyReturn({
    form,
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: 'NRI',
    filingSection: '139(1)',
    filingDate: '2026-07-15',
    dueDate: '2026-07-31',
  });
}

describe('taxpayerIdentityFromReturn', () => {
  it('returns empty identity from a blank ITR2 return', () => {
    const id = taxpayerIdentityFromReturn(blank('ITR2'));
    expect(id.pan).toBe('');
    expect(id.name).toBe('');
    expect(id.dateOfBirth).toBe('');
    expect(id.residentialStatus).toBe('NRI');
    expect(isValidPan(id.pan)).toBe(false);
  });

  it('returns empty identity from a blank ITR3 return', () => {
    const id = taxpayerIdentityFromReturn(blank('ITR3'));
    expect(id.pan).toBe('');
    expect(id.name).toBe('');
    expect(id.dateOfBirth).toBe('');
    expect(id.residentialStatus).toBe('NRI');
  });

  it('reads ITR2 key style (GEN.pan, first/middle/surname, dob)', () => {
    const data = blank('ITR2');
    data.fields['GEN.pan'] = 'abcde1234f';
    data.fields['GEN.firstName'] = 'Ada';
    data.fields['GEN.middleName'] = 'A';
    data.fields['GEN.surname'] = 'Lovelace';
    data.fields['GEN.dob'] = '1815-12-10';
    data.meta.residentialStatus = 'RES';

    const id = taxpayerIdentityFromReturn(data);
    expect(id.pan).toBe('ABCDE1234F');
    expect(id.name).toBe('Ada A Lovelace');
    expect(id.dateOfBirth).toBe('1815-12-10');
    expect(id.residentialStatus).toBe('RES');
    expect(isValidPan(id.pan)).toBe(true);
  });

  it('reads ITR3 key style (GEN.PAN, FirstName/SurNameOrOrgName, DOB)', () => {
    const data = blank('ITR3');
    data.fields['GEN.PAN'] = 'AAAPB1234C';
    data.fields['GEN.FirstName'] = 'Sourabh';
    data.fields['GEN.MiddleName'] = '';
    data.fields['GEN.SurNameOrOrgName'] = 'Bhaumik';
    data.fields['GEN.DOB'] = '1980-05-14';
    data.meta.residentialStatus = 'NOR';

    const id = taxpayerIdentityFromReturn(data);
    expect(id.pan).toBe('AAAPB1234C');
    expect(id.name).toBe('Sourabh Bhaumik');
    expect(id.dateOfBirth).toBe('1980-05-14');
    expect(id.residentialStatus).toBe('NOR');
    expect(isValidPan(id.pan)).toBe(true);
  });

  it('rejects malformed PANs', () => {
    const data = blank('ITR2');
    data.fields['GEN.pan'] = 'ABC123';
    const id = taxpayerIdentityFromReturn(data);
    expect(id.pan).toBe('ABC123');
    expect(isValidPan(id.pan)).toBe(false);
  });

  it('prefers ITR2 keys when both styles are present', () => {
    const data = blank('ITR2');
    data.fields['GEN.pan'] = 'ABCDE1234F';
    data.fields['GEN.PAN'] = 'ZZZZZ9999Z';
    data.fields['GEN.firstName'] = 'From';
    data.fields['GEN.surname'] = 'Itr2';
    data.fields['GEN.FirstName'] = 'From';
    data.fields['GEN.SurNameOrOrgName'] = 'Itr3';
    data.fields['GEN.dob'] = '1990-01-01';
    data.fields['GEN.DOB'] = '2000-01-01';

    const id = taxpayerIdentityFromReturn(data);
    expect(id.pan).toBe('ABCDE1234F');
    expect(id.name).toBe('From Itr2');
    expect(id.dateOfBirth).toBe('1990-01-01');
  });
});
