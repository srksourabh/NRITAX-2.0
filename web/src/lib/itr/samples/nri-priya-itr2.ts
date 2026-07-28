/**
 * Complete sample ITR-2 for Priya Sharma (UAE NRI).
 *
 * Assumptions (best effort for demo / flow tests):
 * - AY 2026-27, new regime, section 139(1)
 * - Indian salary + savings interest + NRI LTCG u/s 112A
 * - No house property income (Schedule HP filled as self-occupied with nil ALV
 *   so schema-mandated HP particulars clear without inventing rent)
 * - No Schedule AL assets (flag N; income ≪ ₹1 crore)
 * - Dubai residential address with State = Foreign
 */

import {
  ASSESSMENT_YEAR,
  emptyReturn,
  type ReturnData,
} from '@/lib/itr/types';

export const SAMPLE_NRI_USER = {
  name: 'Priya Sharma',
  firstName: 'Priya',
  surname: 'Sharma',
  fatherName: 'Ramesh Sharma',
  email: 'priya.sharma.dxb@example.com',
  country: 'United Arab Emirates',
  pan: 'ABCPS1234K',
  aadhaar: '234567890123',
  dob: '1988-03-14',
  mobile: '9876543210',
  mobStd: '91',
} as const;

/** Registered-style id for offline validation / JSON builds (not the placeholder). */
export const SAMPLE_SOFTWARE_ID = 'SW20000';

const SALARY = 1_480_000;
const STD_DED = 75_000;
const CHARGEABLE = SALARY - STD_DED;
const SB_INTEREST = 8_400;
const LTCG_112A = 214_300;
const TDS = 112_000;

/**
 * Portal-grade sample return: Category A + mandatory schema fields filled.
 * Pass `{ softwareId: SAMPLE_SOFTWARE_ID }` to `validateReturn` / `buildReturnJson`
 * when `ERI_SOFTWARE_ID` is unset.
 */
export function sampleNriPriyaItr2(): ReturnData {
  const data = emptyReturn({
    form: 'ITR2',
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
    // Part A-GEN — identity
    'GEN.pan': SAMPLE_NRI_USER.pan,
    'GEN.dob': SAMPLE_NRI_USER.dob,
    'GEN.firstName': SAMPLE_NRI_USER.firstName,
    'GEN.surname': SAMPLE_NRI_USER.surname,
    'GEN.status': 'I',
    'GEN.aadhaar': SAMPLE_NRI_USER.aadhaar,
    // Dubai address (State Foreign + UAE country; PIN placeholder used by portal for foreign)
    'GEN.flatNo': 'Apartment 2408',
    'GEN.premises': 'Marina Gate Tower 1',
    'GEN.road': 'Al Marsa Street',
    'GEN.locality': 'Dubai Marina',
    'GEN.city': 'Dubai',
    'GEN.state': '99',
    'GEN.country': '971',
    'GEN.pin': '999999',
    'GEN.email': SAMPLE_NRI_USER.email,
    'GEN.mobStd': SAMPLE_NRI_USER.mobStd,
    'GEN.mobile': SAMPLE_NRI_USER.mobile,
    // Filing status
    'GEN.filedUs': '11',
    'GEN.noticeUs': '11',
    'GEN.resStatus': 'NRI',
    'GEN.optOut115': 'N',
    'GEN.regimeOpt': 'Not opting',
    'GEN.regime': 'N',
    'GEN.seventh': 'N',
    'GEN.portuguese': 'N',
    'GEN.unlisted': 'N',
    'GEN.director': 'N',
    'GEN.isFpi': 'N',
    'GEN.repFlag': 'N',
    'GEN.partnerFirm': 'N',
    // Salary
    'S.salGross': SALARY,
    'S.sal17_1': SALARY,
    'S.dedStd': STD_DED,
    'S.salChargeable': CHARGEABLE,
    // House property — nil income (schema still demands property 1 particulars)
    'HP.hpAddr1': 'Nil — no house property in India',
    'HP.hpCity1': 'Bengaluru',
    'HP.hpState1': '15',
    'HP.hpPin1': '560001',
    'HP.hpOwner1': 'Self',
    'HP.hpCo1': 'N',
    'HP.hpShare1': 100,
    'HP.hpType1': 'S',
    'HP.hpAlv1': 0,
    'HP.hpUnreal1': 0,
    'HP.hpTax1': 0,
    'HP.hpInt1': 0,
    'HP.hpArrear1': 0,
    // Other sources + CG (NRI 112A line)
    'OS.osSb': SB_INTEREST,
    'OS.osNet': SB_INTEREST,
    'CG.b6Nri112a': LTCG_112A,
    // Chapter VI-A (new regime — no 80C)
    'VIA.viaAllowed': 0,
    'VIA.d80c': 0,
    // Assets & liabilities applicability
    'AL.alFlag': 'N',
    'AL.alFirmFlag': 'N',
    // Bank account count for TTI refund block
    'TTI.nAccounts': 1,
    // Verification
    'VER.vName': SAMPLE_NRI_USER.name,
    'VER.vFather': SAMPLE_NRI_USER.fatherName,
    'VER.vPan': SAMPLE_NRI_USER.pan,
    'VER.vCapacity': 'S',
    'VER.vPlace': 'Dubai',
    'VER.vDate': '2026-07-15',
    // Foreign assets — none
    'FA.faFlag': 'N',
  };

  data.tables = {
    emp: [
      {
        eName: 'Infosys Limited',
        eCat: 'Others',
        eTan: 'BLRI04321F',
        eAddr: 'Electronics City, Hosur Road',
        eCity: 'Bengaluru',
        eState: '15',
        ePin: '560100',
      },
    ],
    tds1: [
      {
        t1Tan: 'BLRI04321F',
        t1Name: 'Infosys Limited',
        t1Inc: CHARGEABLE,
        t1Tds: TDS,
      },
    ],
    bank: [
      {
        bIfsc: 'HDFC0001234',
        bName: 'HDFC Bank',
        bAcc: '50100987654321',
        bType: 'SB',
        bRefund: 'Y',
      },
    ],
  };

  return data;
}

/** Same return with business income on ITR-2 — for WRONG_FORM review tests. */
export function sampleNriPriyaWrongForm(): ReturnData {
  const data = sampleNriPriyaItr2();
  data.fields['BP.bpTotal'] = 450_000;
  return data;
}
