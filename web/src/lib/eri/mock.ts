/**
 * The offline ERI provider.
 *
 * Every figure is derived from the PAN, so one taxpayer always sees one set of
 * numbers however often the page is reloaded, and a test can assert on an exact
 * amount. Nothing here touches the network, and no credential is read.
 *
 * The specimen taxpayer is a non-resident individual: salary from an Indian
 * employer with tax deducted, bank and dividend income reported through 26AS,
 * rent collected by a tenant who deducted under section 194-IB, and two advance
 * tax instalments.
 */

import { EriError } from '@/lib/eri/types';
import type {
  ConsentRequest,
  ConsentResult,
  EriProvider,
  FilingStatus,
  PrefillBankAccount,
  PrefillChallan,
  PrefillPayload,
  PrefillPersonal,
  PrefillSalary,
  PrefillTdsEntry,
  UploadRequest,
  UploadResult,
  UploadStatus,
} from '@/lib/eri/types';
import type { FormType } from '@/lib/itr/types';
import { r0, r10 } from '@/lib/itr/types';

/* ─────────────────────────── Deterministic figures ─────────────────────────── */

/** FNV-1a, 32 bit. Cheap, stable across runtimes, good enough to spread values. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** A whole number in [min, max] on the given step, fixed by the PAN and `salt`. */
function pick(pan: string, salt: string, min: number, max: number, step = 1): number {
  const span = Math.floor((max - min) / step) + 1;
  return min + (hash(`${salt}|${pan}`) % span) * step;
}

/** One entry of `list`, fixed by the PAN and `salt`. */
function pickOne<T>(pan: string, salt: string, list: readonly T[]): T {
  return list[hash(`${salt}|${pan}`) % list.length];
}

/** `n` digits fixed by the PAN and `salt`. The first digit is never zero. */
function digits(pan: string, salt: string, n: number): string {
  let out = '';
  let h = hash(`${salt}|${pan}`);
  while (out.length < n) {
    out += (h % 10).toString();
    h = hash(`${out}|${h}`);
  }
  return (out[0] === '0' ? '7' : out[0]) + out.slice(1, n);
}

/* ─────────────────────────── Specimen reference data ─────────────────────────── */

const FIRST_NAMES = ['Aditya', 'Divya', 'Karan', 'Meera', 'Nikhil', 'Priya', 'Rohit', 'Sanjana'];
const MIDDLE_NAMES = ['Kumar', 'Devi', 'Raj', 'Anand', 'Prakash', 'Lakshmi'];

/** The fifth letter of an individual's PAN is the first letter of the surname. */
const SURNAMES = [
  'Agarwal', 'Bhat', 'Chandra', 'Desai', 'Iyer', 'Joshi', 'Kapoor', 'Menon',
  'Nair', 'Pillai', 'Rao', 'Sharma', 'Varma',
];

const CITIES = [
  { city: 'Bengaluru', stateCode: '15', pinCode: '560034', locality: 'Koramangala', road: '80 Feet Road' },
  { city: 'Mumbai', stateCode: '19', pinCode: '400050', locality: 'Bandra West', road: 'Turner Road' },
  { city: 'Chennai', stateCode: '29', pinCode: '600020', locality: 'Adyar', road: 'Sardar Patel Road' },
  { city: 'Gurugram', stateCode: '12', pinCode: '122002', locality: 'Sector 42', road: 'Golf Course Road' },
];

const EMPLOYERS = [
  { name: 'Infosys Limited', tan: 'BLRI04321F' },
  { name: 'Tata Consultancy Services Limited', tan: 'MUMT12345B' },
  { name: 'Wipro Limited', tan: 'BLRW07654C' },
];

const BANKS = [
  { bankName: 'HDFC Bank', ifsc: 'HDFC0000123', tan: 'MUMH03216D' },
  { bankName: 'ICICI Bank', ifsc: 'ICIC0001234', tan: 'MUMI05678E' },
  { bankName: 'State Bank of India', ifsc: 'SBIN0004321', tan: 'MUMS09876G' },
];

const DIVIDEND_PAYERS = [
  { name: 'Reliance Industries Limited', tan: 'MUMR01234H' },
  { name: 'ITC Limited', tan: 'CALI05432J' },
];

const BSR_CODES = ['0510308', '6390340', '0004329'];

/* ─────────────────────────── Provider state ─────────────────────────── */

const consents = new Map<string, ConsentResult>();

interface Filing {
  pan: string;
  form: FormType;
  filedAt: string;
  /** How many times the status has been asked for. Drives the walk below. */
  step: number;
}

const filings = new Map<string, Filing>();

/** The mock moves one step along this walk on every status enquiry. */
const STATUS_WALK: readonly UploadStatus[] = ['accepted', 'pending_verification', 'verified'];

/** Forgets every consent and filing. Tests call this; the app never does. */
export function resetMockState(): void {
  consents.clear();
  filings.clear();
}

/* ─────────────────────────── Payload builders ─────────────────────────── */

function buildPersonal(pan: string): PrefillPersonal {
  const initial = pan.charAt(4).toUpperCase();
  const surnames = SURNAMES.filter((s) => s.startsWith(initial));
  const surname = pickOne(pan, 'surname', surnames.length > 0 ? surnames : SURNAMES);
  const firstName = pickOne(pan, 'first', FIRST_NAMES);
  const place = pickOne(pan, 'city', CITIES);

  return {
    firstName,
    middleName: pickOne(pan, 'middle', MIDDLE_NAMES),
    surname,
    pan,
    dateOfBirth: `${pick(pan, 'dobY', 1968, 1994)}-${String(pick(pan, 'dobM', 1, 12)).padStart(2, '0')}-${String(pick(pan, 'dobD', 1, 28)).padStart(2, '0')}`,
    aadhaar: `${pick(pan, 'aadhaar', 2, 9)}${digits(pan, 'aadhaar2', 11)}`,
    status: 'I',
    gender: pick(pan, 'gender', 0, 1) === 0 ? 'M' : 'F',
    email: `${firstName}.${surname}@example.com`.toLowerCase(),
    mobile: `9${digits(pan, 'mobile', 9)}`,
    // The department holds the address recorded against the PAN, which for most
    // non-residents is still the Indian address for communication.
    address: {
      flatNo: `Flat ${pick(pan, 'flat', 101, 905)}`,
      premises: pickOne(pan, 'premises', ['Brigade Residency', 'Palm Grove Apartments', 'Sea Breeze Towers']),
      road: place.road,
      locality: place.locality,
      city: place.city,
      stateCode: place.stateCode,
      countryCode: '91',
      pinCode: place.pinCode,
    },
  };
}

function buildBankAccounts(pan: string): PrefillBankAccount[] {
  const primary = pickOne(pan, 'bank1', BANKS);
  const secondary = BANKS[(BANKS.indexOf(primary) + 1) % BANKS.length];
  return [
    {
      ifsc: primary.ifsc,
      bankName: primary.bankName,
      accountNumber: digits(pan, 'acc1', 12),
      accountType: 'NRO',
      nominatedForRefund: true,
    },
    {
      ifsc: secondary.ifsc,
      bankName: secondary.bankName,
      accountNumber: digits(pan, 'acc2', 12),
      accountType: 'NRE',
      nominatedForRefund: false,
    },
  ];
}

function buildSalary(pan: string): PrefillSalary {
  const employer = pickOne(pan, 'employer', EMPLOYERS);
  const salary17_1 = pick(pan, 'sal171', 900_000, 2_400_000, 5_000);
  const perquisites17_2 = pick(pan, 'sal172', 0, 150_000, 2_500);
  const exemptAllowances = pick(pan, 'ex10', 0, 200_000, 5_000);
  const standardDeduction = 75_000;
  const professionalTax = 2_400;
  const chargeable = Math.max(
    salary17_1 + perquisites17_2 - exemptAllowances - standardDeduction - professionalTax,
    0,
  );

  return {
    employerName: employer.name,
    employerTan: employer.tan,
    employerCategory: 'OTH',
    salary17_1,
    perquisites17_2,
    profitInLieu17_3: 0,
    exemptAllowances,
    standardDeduction,
    professionalTax,
    taxDeducted: r10((chargeable * pick(pan, 'tdsrate', 6, 18)) / 100),
  };
}

/** Savings interest, deposit interest, dividend and rent, in whole rupees. */
function buildIncome(pan: string): {
  savingsBank: number;
  termDeposits: number;
  dividend: number;
  rent: number;
} {
  return {
    savingsBank: pick(pan, 'sbint', 3_000, 45_000, 100),
    termDeposits: pick(pan, 'fdint', 20_000, 180_000, 500),
    dividend: pick(pan, 'div', 5_000, 120_000, 500),
    rent: pick(pan, 'rent', 120_000, 600_000, 6_000),
  };
}

function buildTds(pan: string): PrefillTdsEntry[] {
  const { termDeposits, dividend, rent } = buildIncome(pan);
  const bank = pickOne(pan, 'bank1', BANKS);
  const payer = pickOne(pan, 'divpayer', DIVIDEND_PAYERS);

  return [
    {
      kind: 'other',
      deductorTan: bank.tan,
      deductorName: bank.bankName,
      section: '194A',
      grossAmount: termDeposits,
      taxDeducted: r10(termDeposits * 0.1),
      financialYear: '2025-26',
    },
    {
      kind: 'other',
      deductorTan: payer.tan,
      deductorName: payer.name,
      section: '194',
      grossAmount: dividend,
      taxDeducted: r10(dividend * 0.1),
      financialYear: '2025-26',
    },
    {
      // Rent collected by a tenant who deducted under section 194-IB and filed
      // Form 26QC. The wizard asks for the property itself in Schedule HP.
      kind: 'property',
      deductorPan: `${pan.slice(0, 3)}PS${digits(pan, 'tenant', 4)}${pan.charAt(9)}`,
      deductorName: pickOne(pan, 'tenant', ['Anil Verma', 'Sunita Rane', 'Farhan Qureshi']),
      section: '194IB',
      grossAmount: rent,
      taxDeducted: r10(rent * 0.05),
      financialYear: '2025-26',
    },
  ];
}

/** Two instalments paid inside the previous year, so both are advance tax. */
function buildChallans(pan: string): PrefillChallan[] {
  const bsr = pickOne(pan, 'bsr', BSR_CODES);
  return [
    {
      bsrCode: bsr,
      depositDate: '2025-09-15',
      serialNumber: digits(pan, 'srl1', 5),
      amount: pick(pan, 'chal1', 10_000, 90_000, 1_000),
      kind: 'advance',
    },
    {
      bsrCode: bsr,
      depositDate: '2025-12-15',
      serialNumber: digits(pan, 'srl2', 5),
      amount: pick(pan, 'chal2', 10_000, 90_000, 1_000),
      kind: 'advance',
    },
  ];
}

/* ─────────────────────────── Upload validation ─────────────────────────── */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The three checks the portal makes before it looks at anything else: an ITR
 * root, the form node the upload claims, and a verification block.
 */
function refuse(json: Record<string, unknown>, form: FormType): UploadResult['errors'] {
  const root = json.ITR;
  if (!isRecord(root)) {
    return [{ code: 'MOCK_NO_ITR_ROOT', message: 'The return JSON has no "ITR" root node.', path: 'ITR' }];
  }

  const node = root[form];
  if (!isRecord(node)) {
    return [{
      code: 'MOCK_FORM_MISMATCH',
      message: `The return JSON has no "${form}" node under "ITR".`,
      path: `ITR/${form}`,
    }];
  }

  const verification = node.Verification;
  if (!isRecord(verification) || Object.keys(verification).length === 0) {
    return [{
      code: 'MOCK_NO_VERIFICATION',
      message: 'The Verification block is missing or empty.',
      path: `ITR/${form}/Verification`,
    }];
  }

  return undefined;
}

/* ─────────────────────────── The provider ─────────────────────────── */

/** The offline provider. Safe to construct as often as you like; state is shared. */
export function createMockProvider(): EriProvider {
  return {
    name: 'mock',
    live: false,

    async requestConsent(input: ConsentRequest): Promise<ConsentResult> {
      const consentId = `MOCK-CONSENT-${hash(input.pan).toString(36).toUpperCase()}`;
      const result: ConsentResult = {
        consentId,
        status: 'granted',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'Consent granted by the offline provider. No taxpayer approval was sought.',
      };
      consents.set(consentId, result);
      return result;
    },

    async getConsent(consentId: string): Promise<ConsentResult> {
      const held = consents.get(consentId);
      if (!held) throw new EriError('No such consent.', 'CONSENT_NOT_FOUND');
      return held;
    },

    async fetchPrefill(input): Promise<PrefillPayload> {
      if (!consents.has(input.consentId)) {
        throw new EriError('Prefill needs a granted consent.', 'CONSENT_REQUIRED');
      }

      const pan = input.pan.toUpperCase();
      const { savingsBank, termDeposits, dividend } = buildIncome(pan);

      return {
        source: 'mock',
        fetchedAt: new Date().toISOString(),
        assessmentYear: input.assessmentYear,
        pan,
        personal: buildPersonal(pan),
        bankAccounts: buildBankAccounts(pan),
        salaries: [buildSalary(pan)],
        tds: buildTds(pan),
        challans: buildChallans(pan),
        interest: { savingsBank: r0(savingsBank), termDeposits: r0(termDeposits) },
        dividend: r0(dividend),
      };
    },

    async uploadReturn(input: UploadRequest): Promise<UploadResult> {
      const errors = refuse(input.json, input.form);
      if (errors) {
        return {
          status: 'rejected',
          errors,
          message: 'The offline provider refused the return. Fix the errors and upload again.',
        };
      }

      const pan = input.pan.toUpperCase();
      const acknowledgementNumber = `MOCK${digits(`${pan}|${input.form}`, 'ack', 11)}`;
      const filedAt = new Date().toISOString();
      filings.set(acknowledgementNumber, { pan, form: input.form, filedAt, step: 0 });

      return {
        status: 'accepted',
        acknowledgementNumber,
        filedAt,
        message: 'Accepted by the offline provider. Ask for the status to walk it through verification.',
      };
    },

    async getFilingStatus(input): Promise<FilingStatus> {
      const filing = filings.get(input.acknowledgementNumber);
      if (!filing || filing.pan !== input.pan.toUpperCase()) {
        throw new EriError('No filing under that acknowledgement number.', 'FILING_NOT_FOUND');
      }

      const status = STATUS_WALK[Math.min(filing.step, STATUS_WALK.length - 1)];
      filings.set(input.acknowledgementNumber, { ...filing, step: filing.step + 1 });

      return {
        acknowledgementNumber: input.acknowledgementNumber,
        status,
        verifiedAt: status === 'verified' ? new Date().toISOString() : undefined,
        message: `Offline provider, enquiry ${filing.step + 1}.`,
      };
    },
  };
}
