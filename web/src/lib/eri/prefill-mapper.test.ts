import { describe, expect, it } from 'vitest';

import { applyPrefill, splitChallans } from '@/lib/eri/prefill-mapper';
import type { PrefillPayload } from '@/lib/eri/types';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';
import type { FormType, ReturnData, ReturnMeta } from '@/lib/itr/types';

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

function payload(overrides: Partial<PrefillPayload> = {}): PrefillPayload {
  return {
    source: 'mock',
    fetchedAt: '2026-06-01T00:00:00.000Z',
    assessmentYear: ASSESSMENT_YEAR,
    pan: 'AAJPS4321K',
    personal: {
      firstName: 'Meera',
      middleName: 'Devi',
      surname: 'Sharma',
      pan: 'AAJPS4321K',
      dateOfBirth: '1982-03-04',
      aadhaar: '412345678901',
      status: 'I',
      gender: 'F',
      email: 'meera.sharma@example.com',
      mobile: '9812345678',
      address: {
        flatNo: 'Flat 402',
        premises: 'Brigade Residency',
        road: '80 Feet Road',
        locality: 'Koramangala',
        city: 'Bengaluru',
        stateCode: '15',
        countryCode: '91',
        pinCode: '560034',
      },
    },
    bankAccounts: [
      {
        ifsc: 'HDFC0000123',
        bankName: 'HDFC Bank',
        accountNumber: '501234567890',
        accountType: 'NRO',
        nominatedForRefund: true,
      },
      {
        ifsc: 'ICIC0001234',
        bankName: 'ICICI Bank',
        accountNumber: '602345678901',
        accountType: 'NRE',
        nominatedForRefund: false,
      },
    ],
    salaries: [
      {
        employerName: 'Infosys Limited',
        employerTan: 'BLRI04321F',
        employerCategory: 'OTH',
        salary17_1: 1_800_000,
        perquisites17_2: 50_000,
        profitInLieu17_3: 0,
        exemptAllowances: 100_000,
        standardDeduction: 75_000,
        professionalTax: 2_400,
        taxDeducted: 210_000,
      },
    ],
    tds: [
      {
        kind: 'other',
        deductorTan: 'MUMH03216D',
        deductorName: 'HDFC Bank',
        section: '194A',
        grossAmount: 120_000,
        taxDeducted: 12_000,
        financialYear: '2025-26',
      },
      {
        kind: 'property',
        deductorPan: 'AAJPS9876Q',
        deductorName: 'Anil Verma',
        section: '194IB',
        grossAmount: 360_000,
        taxDeducted: 18_000,
        financialYear: '2025-26',
      },
      {
        kind: 'tcs',
        deductorTan: 'MUMT05432P',
        deductorName: 'Thomas Cook (India) Limited',
        section: '206C',
        grossAmount: 900_000,
        taxDeducted: 45_000,
        financialYear: '2025-26',
      },
    ],
    challans: [
      { bsrCode: '0510308', depositDate: '2026-07-10', serialNumber: '10022', amount: 15_000 },
      { bsrCode: '0510308', depositDate: '2025-09-15', serialNumber: '10021', amount: 40_000 },
    ],
    interest: { savingsBank: 24_000, termDeposits: 120_000 },
    dividend: 60_000,
    ...overrides,
  };
}

const start = (form: FormType = 'ITR2'): ReturnData => emptyReturn({ ...meta, form });

describe('applyPrefill', () => {
  it('leaves the return it was given untouched', () => {
    const data = start();
    const before = structuredClone(data);

    const result = applyPrefill(data, payload(), 'ITR2');

    expect(data).toEqual(before);
    expect(result.data).not.toBe(data);
    expect(result.data.fields).not.toBe(data.fields);
    expect(result.data.tables).not.toBe(data.tables);
    expect(Object.keys(result.data.fields).length).toBeGreaterThan(0);
  });

  it('fills the ITR-2 keys the schema declares', () => {
    const { data, applied } = applyPrefill(start(), payload(), 'ITR2');

    expect(data.fields['GEN.firstName']).toBe('Meera');
    expect(data.fields['GEN.surname']).toBe('Sharma');
    expect(data.fields['GEN.pan']).toBe('AAJPS4321K');
    expect(data.fields['GEN.status']).toBe('I');
    expect(data.fields['GEN.gender']).toBe('F');
    expect(data.fields['GEN.state']).toBe('15');
    expect(data.fields['GEN.pin']).toBe('560034');
    expect(data.fields['S.sal17_1']).toBe(1_800_000);
    expect(data.fields['S.sal17_2']).toBe(50_000);
    expect(data.fields['S.dedStd']).toBe(75_000);
    expect(data.fields['S.dedProf']).toBe(2_400);
    expect(data.fields['OS.osSb']).toBe(24_000);
    expect(data.fields['OS.osFd']).toBe(120_000);
    expect(data.fields['OS.osDiv']).toBe(60_000);
    expect(data.fields['TTI.nAccounts']).toBe(2);

    // Provenance follows what the schedule claims for the field.
    expect(applied.find((a) => a.field === 'GEN.firstName')?.source).toBe('eri');
    expect(applied.find((a) => a.field === 'S.sal17_1')?.source).toBe('form16');
  });

  it('splits the tax credits across TDS-1, TDS-2, TDS-3 and TCS', () => {
    const { data } = applyPrefill(start(), payload(), 'ITR2');

    expect(data.tables.tds1).toEqual([
      { t1Tan: 'BLRI04321F', t1Name: 'Infosys Limited', t1Inc: 1_672_600, t1Tds: 210_000 },
    ]);
    expect(data.tables.tds2).toEqual([
      {
        t2Tan: 'MUMH03216D',
        t2Name: 'HDFC Bank',
        t2Gross: 120_000,
        t2Head: 'OS',
        t2Year: '2025-26',
        t2Tds: 12_000,
      },
    ]);
    expect(data.tables.tds3).toEqual([
      {
        t3Pan: 'AAJPS9876Q',
        t3Name: 'Anil Verma',
        t3Gross: 360_000,
        t3Head: 'HP',
        t3Tds: 18_000,
      },
    ]);
    expect(data.tables.tcs).toEqual([
      { tcTan: 'MUMT05432P', tcName: 'Thomas Cook (India) Limited', tcAmt: 45_000, tcClaim: 45_000 },
    ]);
    expect(data.tables.emp).toEqual([
      { eName: 'Infosys Limited', eCat: 'OTHERS', eTan: 'BLRI04321F' },
    ]);
    expect(data.tables.bank).toEqual([
      { bIfsc: 'HDFC0000123', bName: 'HDFC Bank', bAcc: '501234567890', bType: 'NRO', bRefund: 'Y' },
      { bIfsc: 'ICIC0001234', bName: 'ICICI Bank', bAcc: '602345678901', bType: 'SB', bRefund: 'N' },
    ]);
  });

  it('uses the ITR-3 keys when the form is ITR-3', () => {
    const { data } = applyPrefill(start('ITR3'), payload(), 'ITR3');

    expect(data.fields['GEN.FirstName']).toBe('Meera');
    expect(data.fields['GEN.SurNameOrOrgName']).toBe('Sharma');
    expect(data.fields['S.EmployerName']).toBe('Infosys Limited');
    expect(data.fields['S.EmployerCategory']).toBe('OTH');
    expect(data.fields['S.Sal17_1']).toBe(1_800_000);
    expect(data.fields['S.ExemptAllow']).toBe(100_000);
    expect(data.fields['OS.Interest1b']).toBe(144_000);
    expect(data.tables.TDS1Rows).toHaveLength(1);
    expect(data.tables.ITRows).toHaveLength(2);
    expect(data.tables.BankRows[0]).toEqual({
      IFSC: 'HDFC0000123',
      BankName: 'HDFC Bank',
      AccountNo: '501234567890',
      Nominate: 'Y',
    });

    // ITR-3 has no gender field and no ITR-2 keys leak into it.
    expect(data.fields['GEN.gender']).toBeUndefined();
    expect(data.fields['GEN.firstName']).toBeUndefined();
  });

  it('never overwrites a figure the taxpayer has already entered', () => {
    const data = start();
    const edited: ReturnData = {
      ...data,
      fields: { ...data.fields, 'GEN.firstName': 'Preeti', 'OS.osSb': 31_000 },
      tables: { ...data.tables, tds1: [{ t1Tan: 'PNEX09876Z', t1Tds: 5_000 }] },
    };

    const result = applyPrefill(edited, payload(), 'ITR2');

    expect(result.data.fields['GEN.firstName']).toBe('Preeti');
    expect(result.data.fields['OS.osSb']).toBe(31_000);
    expect(result.data.tables.tds1).toEqual([{ t1Tan: 'PNEX09876Z', t1Tds: 5_000 }]);
    expect(result.skipped).toContain('GEN.firstName');
    expect(result.skipped).toContain('OS.osSb');
    expect(result.skipped).toContain('tds1');
    expect(result.applied.map((a) => a.field)).not.toContain('GEN.firstName');

    // Everything else still lands.
    expect(result.data.fields['GEN.surname']).toBe('Sharma');
  });

  it('treats an empty table as unfilled', () => {
    const data = start();
    const withBlankRows: ReturnData = {
      ...data,
      tables: { ...data.tables, tds1: [{ t1Tan: '', t1Tds: null }] },
    };

    const result = applyPrefill(withBlankRows, payload(), 'ITR2');

    expect(result.skipped).not.toContain('tds1');
    expect(result.data.tables.tds1[0].t1Tan).toBe('BLRI04321F');
  });
});

describe('splitChallans', () => {
  it('splits on the last day of the previous year', () => {
    const { advance, self } = splitChallans([
      { bsrCode: '0510308', depositDate: '2025-06-15', serialNumber: '1', amount: 10_000 },
      { bsrCode: '0510308', depositDate: '2026-03-31', serialNumber: '2', amount: 20_000 },
      { bsrCode: '0510308', depositDate: '2026-04-01', serialNumber: '3', amount: 30_000 },
      { bsrCode: '0510308', depositDate: '2026-07-10', serialNumber: '4', amount: 40_000 },
    ]);

    expect(advance.map((c) => c.serialNumber)).toEqual(['1', '2']);
    expect(self.map((c) => c.serialNumber)).toEqual(['3', '4']);
  });

  it('keeps a label the provider has already given', () => {
    const { advance, self } = splitChallans([
      { bsrCode: '0510308', depositDate: '2025-06-15', serialNumber: '1', amount: 10_000, kind: 'self' },
      { bsrCode: '0510308', depositDate: '2026-07-10', serialNumber: '2', amount: 20_000, kind: 'advance' },
    ]);

    expect(advance.map((c) => c.serialNumber)).toEqual(['2']);
    expect(self.map((c) => c.serialNumber)).toEqual(['1']);
  });

  it('writes advance tax into Schedule IT ahead of self-assessment tax', () => {
    const { data } = applyPrefill(start(), payload(), 'ITR2');

    expect(data.tables.chal).toEqual([
      { bsr: '0510308', depDate: '2025-09-15', srl: '10021', chAmt: 40_000 },
      { bsr: '0510308', depDate: '2026-07-10', srl: '10022', chAmt: 15_000 },
    ]);
  });
});
