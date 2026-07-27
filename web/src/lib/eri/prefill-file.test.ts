import { describe, expect, it } from 'vitest';
import {
  detectPrefillForm,
  importPrefillFile,
  PrefillFileError,
} from '@/lib/eri/prefill-file';

/**
 * A cut-down pre-fill file in the shape the portal hands out: the departmental
 * node names, nested exactly as the offline utility writes them.
 */
const itr2File = {
  ITR: {
    ITR2: {
      Form_ITR2: { FormName: 'ITR-2', AssessmentYear: '2026', SchemaVer: 'Ver1.0' },
      PartA_GEN1: {
        PersonalInfo: {
          AssesseeName: { FirstName: 'ANANYA', SurNameOrOrgName: 'BHATTACHARYA' },
          PAN: 'ABCPB1234K',
          DOB: '04/11/1986',
          Status: 'I',
          Address: {
            CityOrTownOrDistrict: 'Kolkata',
            PinCode: '700029',
            EmailAddress: 'ananya.b@example.com',
            MobileNo: '9830012345',
          },
        },
        FilingStatus: {
          ResidentialStatus: 'NRI',
          JurisdictionResPrevYr: {
            JurisdictionResPrevYrDtls: [
              { JurisdictionResidence: '2', TIN: '123-45-6789' },
              { JurisdictionResidence: '784', TIN: 'AE998877' },
            ],
          },
        },
      },
    },
  },
};

describe('detectPrefillForm', () => {
  it('names the form from the envelope', () => {
    expect(detectPrefillForm(itr2File)).toBe('ITR2');
    expect(detectPrefillForm({ ITR: { ITR3: {} } })).toBe('ITR3');
  });

  it('falls back to the form node when there is no envelope', () => {
    expect(detectPrefillForm({ Form_ITR3: { FormName: 'ITR-3' } })).toBe('ITR3');
  });

  it('returns null when the file says nothing', () => {
    expect(detectPrefillForm({ something: 1 })).toBeNull();
    expect(detectPrefillForm(null)).toBeNull();
  });
});

describe('importPrefillFile', () => {
  it('fills fields from departmental paths without a mapping table', () => {
    const result = importPrefillFile(itr2File);

    expect(result.form).toBe('ITR2');
    expect(result.pan).toBe('ABCPB1234K');
    expect(result.assessmentYear).toBe('2026');
    expect(result.fields['GEN.firstName']).toBe('ANANYA');
    expect(result.fields['GEN.surname']).toBe('BHATTACHARYA');
    expect(result.fields['GEN.pan']).toBe('ABCPB1234K');
    expect(result.fields['GEN.city']).toBe('Kolkata');
    expect(result.fields['GEN.email']).toBe('ananya.b@example.com');
    expect(result.matched).toBeGreaterThan(5);
  });

  it('normalises a dd/mm/yyyy date to ISO', () => {
    const result = importPrefillFile(itr2File);
    expect(result.fields['GEN.dob']).toBe('1986-11-04');
  });

  it('reads a repeating block into table rows', () => {
    const result = importPrefillFile(itr2File);
    expect(result.tables.juris).toEqual([
      { jCountry: '2', jTin: '123-45-6789' },
      { jCountry: '784', jTin: 'AE998877' },
    ]);
  });

  it('records paths it does not recognise instead of failing', () => {
    const result = importPrefillFile({
      ITR: { ITR2: { PartA_GEN1: { PersonalInfo: { PAN: 'ABCPB1234K' } }, Nonsense: { Node: 'x' } } },
    });
    expect(result.unmatched).toContain('Nonsense/Node');
    expect(result.fields['GEN.pan']).toBe('ABCPB1234K');
  });

  it('rounds a whole-rupee figure and strips separators', () => {
    const result = importPrefillFile({
      ITR: { ITR2: { ScheduleS: { TotalGrossSalary: { Salary: '18,40,000.4' } } } },
    });
    expect(result.fields['S.sal17_1']).toBe(1840000);
  });

  it('refuses a file belonging to another PAN', () => {
    expect(() => importPrefillFile(itr2File, { expectPan: 'ZZZPZ9999Z' })).toThrow(
      PrefillFileError,
    );
  });

  it('refuses an ITR-3 file when an ITR-2 return is being prepared', () => {
    expect(() =>
      importPrefillFile({ ITR: { ITR3: {} } }, { form: 'ITR2' }),
    ).toThrow(/ITR-3 pre-fill file/);
  });

  it('rejects something that is not JSON at all', () => {
    expect(() => importPrefillFile('not json')).toThrow(PrefillFileError);
  });

  it('warns rather than throws when nothing matches', () => {
    const result = importPrefillFile({ ITR: { ITR2: { Unknown: { Leaf: 1 } } } });
    expect(result.matched).toBe(0);
    expect(result.warnings.join(' ')).toMatch(/Nothing in that file matched/);
  });
});
