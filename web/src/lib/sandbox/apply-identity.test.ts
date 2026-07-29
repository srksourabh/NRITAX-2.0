import { describe, expect, it } from 'vitest';

import { applyIdentityToReturn, splitFullName } from './apply-identity';
import { applyIfscToReturn } from './apply-ifsc';
import { ASSESSMENT_YEAR, emptyReturn, type ReturnData, type ReturnMeta } from '@/lib/itr/types';

function blankReturn(form: 'ITR2' | 'ITR3' = 'ITR2'): ReturnData {
  const meta: ReturnMeta = {
    form,
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: 'NRI',
    filingSection: '139(1)',
    filingDate: '2026-07-15',
    dueDate: '2026-07-31',
  };
  return emptyReturn(meta);
}

describe('applyIdentityToReturn', () => {
  it('splits a full name and writes blank GEN fields', () => {
    const applied = applyIdentityToReturn(
      blankReturn('ITR2'),
      {
        pan: 'ABCDE1234F',
        fullName: 'Priya Anand Sharma',
        dateOfBirth: '1990-05-12',
      },
      'ITR2',
      { overwrite: true },
    );
    expect(applied.data.fields['GEN.pan']).toBe('ABCDE1234F');
    expect(applied.data.fields['GEN.firstName']).toBe('Priya');
    expect(applied.data.fields['GEN.middleName']).toBe('Anand');
    expect(applied.data.fields['GEN.surname']).toBe('Sharma');
    expect(applied.data.fields['GEN.dob']).toBe('1990-05-12');
    expect(applied.fieldsApplied).toContain('GEN.pan');
  });

  it('skips filled fields unless overwrite is set', () => {
    const base = blankReturn('ITR2');
    base.fields['GEN.pan'] = 'EXISTING1A';
    const applied = applyIdentityToReturn(
      base,
      { pan: 'ABCDE1234F', fullName: 'A B' },
      'ITR2',
    );
    expect(applied.data.fields['GEN.pan']).toBe('EXISTING1A');
    expect(applied.skipped).toContain('GEN.pan');
  });
});

describe('splitFullName', () => {
  it('handles one-, two- and three-part names', () => {
    expect(splitFullName('Ada')).toEqual({ firstName: 'Ada' });
    expect(splitFullName('Ada Lovelace')).toEqual({
      firstName: 'Ada',
      surname: 'Lovelace',
    });
  });
});

describe('applyIfscToReturn', () => {
  it('creates an ITR-2 bank row with IFSC and bank name', () => {
    const applied = applyIfscToReturn(
      blankReturn('ITR2'),
      {
        ok: true,
        ifsc: 'HDFC0001234',
        bank: 'HDFC Bank',
        branch: 'Park Street',
      },
      'ITR2',
      { overwrite: true },
    );
    expect(applied.data.tables.bank?.[0]?.bIfsc).toBe('HDFC0001234');
    expect(applied.data.tables.bank?.[0]?.bName).toBe('HDFC Bank · Park Street');
  });

  it('writes ITR-3 BankRows keys', () => {
    const applied = applyIfscToReturn(
      blankReturn('ITR3'),
      { ok: true, ifsc: 'SBIN0001234', bank: 'SBI' },
      'ITR3',
      { overwrite: true },
    );
    expect(applied.data.tables.BankRows?.[0]?.IFSC).toBe('SBIN0001234');
    expect(applied.data.tables.BankRows?.[0]?.BankName).toBe('SBI');
  });
});
