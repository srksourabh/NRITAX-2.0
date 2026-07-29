/**
 * Sample ITR-3 for Priya Sharma — same identity as ITR-2, with PGBP nil /
 * salary-style figures mapped onto ITR-3 Part A keys so Validate + JSON work
 * for demos. Not a full business return.
 */

import {
  SAMPLE_NRI_USER,
  sampleNriPriyaItr2,
} from '@/lib/itr/samples/nri-priya-itr2';
import { ASSESSMENT_YEAR, emptyReturn, type ReturnData } from '@/lib/itr/types';

export function sampleNriPriyaItr3(): ReturnData {
  const itr2 = sampleNriPriyaItr2();
  const data = emptyReturn({
    form: 'ITR3',
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: 'NRI',
    filingSection: '139(1)',
    filingDate: '2026-07-15',
    dueDate: '2026-07-31',
    dateOfBirth: SAMPLE_NRI_USER.dob,
  });

  data.fields = {
    ...data.fields,
    'GEN.PAN': SAMPLE_NRI_USER.pan,
    'GEN.DOB': SAMPLE_NRI_USER.dob,
    'GEN.FirstName': SAMPLE_NRI_USER.firstName,
    'GEN.SurNameOrOrgName': SAMPLE_NRI_USER.surname,
    'GEN.Status': 'I',
    'GEN.AadhaarCardNo': SAMPLE_NRI_USER.aadhaar,
    'GEN.ResidenceNo': 'Apartment 2408',
    'GEN.ResidenceName': 'Marina Gate Tower 1',
    'GEN.RoadOrStreet': 'Al Marsa Street',
    'GEN.LocalityOrArea': 'Dubai Marina',
    'GEN.CityOrTownOrDistrict': 'Dubai',
    'GEN.StateCode': '99',
    'GEN.CountryCode': '971',
    'GEN.PinCode': '999999',
    'GEN.EmailAddress': SAMPLE_NRI_USER.email,
    'GEN.CountryCodeMobile': SAMPLE_NRI_USER.mobStd,
    'GEN.MobileNo': SAMPLE_NRI_USER.mobile,
    'GEN.FilingStatus': '11',
    'GEN.ResidentialStatus': 'NRI',
    'GEN.OptOut115BAC': 'N',
    'GEN.SeventhProviso139': 'N',
    // Carry over numeric heads from ITR-2 sample where key names align
    'S.GrossSalary': Number(itr2.fields['S.salGross'] ?? 0),
    'S.Salary': Number(itr2.fields['S.sal17_1'] ?? 0),
    'S.DeductionUs16ia': Number(itr2.fields['S.dedStd'] ?? 0),
    'S.IncomeFromSal': Number(itr2.fields['S.salChargeable'] ?? 0),
  };

  data.tables = {
    ...data.tables,
    BankDetails: [
      {
        IFSCCode: 'HDFC0000123',
        BankName: 'HDFC Bank',
        BankAccountNo: '50100234567890',
        AccountType: 'SB',
        UseForRefund: 'true',
      },
    ],
  };

  return data;
}

/** Load the sample that matches the open form. */
export function sampleForForm(form: 'ITR2' | 'ITR3'): ReturnData {
  return form === 'ITR3' ? sampleNriPriyaItr3() : sampleNriPriyaItr2();
}
