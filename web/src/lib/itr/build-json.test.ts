import { describe, expect, it } from 'vitest';

import { buildReturnJson, setPath } from '@/lib/itr/build-json';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';
import { PLACEHOLDER_SOFTWARE_ID } from '@/lib/itr/validate';

describe('setPath', () => {
  it('nests slash-delimited segments', () => {
    const root: Parameters<typeof setPath>[0] = {};
    setPath(root, 'PartA_GEN1/PersonalInfo/PAN', 'ABCDE1234F');
    expect(root).toEqual({
      PartA_GEN1: { PersonalInfo: { PAN: 'ABCDE1234F' } },
    });
  });
});

describe('buildReturnJson', () => {
  it('wraps ITR-2 fields under CreationInfo and Form_ITR2', () => {
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
    data.fields['GEN.pan'] = 'abcde1234f';
    data.fields['GEN.firstName'] = 'Ada';
    data.fields['GEN.surname'] = 'Lovelace';

    const built = buildReturnJson(data, {
      softwareId: PLACEHOLDER_SOFTWARE_ID,
      createdOn: '2026-07-27',
    });

    expect(built.fileName).toBe('ITR2_ABCDE1234F_AY2026-27.json');
    expect(built.json).toMatchObject({
      ITR: {
        ITR2: {
          CreationInfo: {
            SWCreatedBy: PLACEHOLDER_SOFTWARE_ID,
            JSONCreationDate: '2026-07-27',
          },
          Form_ITR2: { FormName: 'ITR-2', AssessmentYear: '2026' },
          PartA_GEN1: {
            PersonalInfo: {
              PAN: 'ABCDE1234F',
              AssesseeName: { FirstName: 'Ada', SurNameOrOrgName: 'Lovelace' },
            },
          },
        },
      },
    });
  });

  it('writes non-empty table rows at the table path', () => {
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
    data.fields['GEN.status'] = 'I';
    data.tables.emp = [
      {
        eName: 'Acme Pvt Ltd',
        eCat: 'CGOV',
        eTan: 'abcd12345e',
        eAddr: '1 MG Road',
        eCity: 'Bengaluru',
        eState: '15',
        ePin: '560001',
      },
    ];

    const built = buildReturnJson(data, { softwareId: 'SW20000', createdOn: '2026-07-27' });
    const itr2 = (built.json as { ITR: { ITR2: Record<string, unknown> } }).ITR.ITR2;
    expect(itr2.ScheduleS).toMatchObject({
      Salaries: [
        {
          NameOfEmployer: 'Acme Pvt Ltd',
          NatureOfEmployment: 'CGOV',
          TANofEmployer: 'ABCD12345E',
          AddressDetail: {
            AddrDetail: '1 MG Road',
            CityOrTownOrDistrict: 'Bengaluru',
            StateCode: '15',
            PinCode: '560001',
          },
        },
      ],
    });
  });
});
