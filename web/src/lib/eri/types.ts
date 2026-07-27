/**
 * ERI (e-Return Intermediary) provider contract.
 *
 * Every call to the Income Tax portal goes through this interface. The mock
 * provider implements it in full so the entire filing flow is exercisable with
 * no credentials; swapping in a live provider is a change to ERI_PROVIDER in
 * the environment and nothing else.
 *
 * The taxpayer's portal password is never a parameter here, by design. ERI
 * APIs authenticate with the intermediary's own credentials plus a taxpayer
 * e-consent token, so we have no reason to hold that password and do not.
 */

import type { FormType } from '@/lib/itr/types';

export type EriProviderName = 'mock' | 'sandbox' | 'quicko' | 'suvit';

export interface EriConfig {
  provider: EriProviderName;
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  /** Our registered ERI user id, printed into CreationInfo.SWCreatedBy. */
  eriUserId?: string;
  /** Departmental software identifier, e.g. "SW20000". */
  softwareId?: string;
}

/* ─────────────────────────── Consent ─────────────────────────── */

export type ConsentStatus = 'pending' | 'granted' | 'declined' | 'expired';

export interface ConsentRequest {
  pan: string;
  assessmentYear: string;
  /** Full name as held in the PAN database; providers cross-check it. */
  name: string;
  dateOfBirth: string;
  email: string;
  mobile?: string;
  /** Where the provider should send the taxpayer after they approve. */
  returnUrl?: string;
}

export interface ConsentResult {
  consentId: string;
  status: ConsentStatus;
  /** Present when the taxpayer must approve in a hosted flow. */
  redirectUrl?: string;
  expiresAt?: string;
  message?: string;
}

/* ─────────────────────────── Prefill ─────────────────────────── */

export interface PrefillPersonal {
  firstName?: string;
  middleName?: string;
  surname?: string;
  pan?: string;
  dateOfBirth?: string;
  aadhaar?: string;
  status?: string;
  gender?: string;
  email?: string;
  mobile?: string;
  address?: {
    flatNo?: string;
    premises?: string;
    road?: string;
    locality?: string;
    city?: string;
    stateCode?: string;
    countryCode?: string;
    pinCode?: string;
  };
}

export interface PrefillBankAccount {
  ifsc: string;
  bankName: string;
  accountNumber: string;
  accountType?: string;
  /** The taxpayer has nominated this account for the refund. */
  nominatedForRefund?: boolean;
}

export interface PrefillSalary {
  employerName: string;
  employerTan?: string;
  employerCategory?: string;
  salary17_1?: number;
  perquisites17_2?: number;
  profitInLieu17_3?: number;
  exemptAllowances?: number;
  standardDeduction?: number;
  professionalTax?: number;
  taxDeducted?: number;
}

export interface PrefillTdsEntry {
  kind: 'salary' | 'other' | 'property' | 'tcs';
  deductorTan?: string;
  deductorPan?: string;
  deductorName?: string;
  section?: string;
  grossAmount?: number;
  taxDeducted?: number;
  financialYear?: string;
}

export interface PrefillChallan {
  bsrCode: string;
  depositDate: string;
  serialNumber: string;
  amount: number;
  /** advance = paid within the previous year, self = paid after 31 March. */
  kind?: 'advance' | 'self';
}

export interface PrefillInterestIncome {
  savingsBank?: number;
  termDeposits?: number;
  incomeTaxRefund?: number;
  others?: number;
}

export interface PrefillPayload {
  source: EriProviderName;
  fetchedAt: string;
  assessmentYear: string;
  pan: string;
  personal: PrefillPersonal;
  bankAccounts: PrefillBankAccount[];
  salaries: PrefillSalary[];
  tds: PrefillTdsEntry[];
  challans: PrefillChallan[];
  interest: PrefillInterestIncome;
  dividend?: number;
  /** Untouched departmental JSON, kept so nothing is silently dropped. */
  raw?: Record<string, unknown>;
  /** Figures the provider returned that we could not map to a field. */
  unmapped?: Array<{ path: string; value: unknown }>;
}

/* ─────────────────────────── AIS / 26AS ─────────────────────────── */

export interface AisLineItem {
  category: string;
  description: string;
  amount: number;
  counterparty?: string;
  counterpartyPan?: string;
  quarter?: string;
}

export interface AisPayload {
  fetchedAt: string;
  pan: string;
  assessmentYear: string;
  items: AisLineItem[];
  totals: Record<string, number>;
}

/* ─────────────────────────── Upload ─────────────────────────── */

export interface UploadRequest {
  pan: string;
  assessmentYear: string;
  form: FormType;
  consentId: string;
  json: Record<string, unknown>;
  /** How the taxpayer wants to verify: Aadhaar OTP, net banking, DSC, ITR-V. */
  verificationMode?: 'AADHAAR_OTP' | 'NET_BANKING' | 'DSC' | 'ITRV_POST' | 'EVC';
}

export type UploadStatus =
  | 'accepted'
  | 'rejected'
  | 'pending_verification'
  | 'verified'
  | 'processed';

export interface UploadResult {
  status: UploadStatus;
  acknowledgementNumber?: string;
  filedAt?: string;
  /** Departmental validation errors, when the upload was refused. */
  errors?: Array<{ code: string; message: string; path?: string }>;
  /** Set when the taxpayer must complete an OTP step. */
  verificationRedirectUrl?: string;
  message?: string;
}

export interface FilingStatus {
  acknowledgementNumber: string;
  status: UploadStatus;
  verifiedAt?: string;
  processedAt?: string;
  refundStatus?: string;
  message?: string;
}

/* ─────────────────────────── Provider ─────────────────────────── */

export interface EriProvider {
  readonly name: EriProviderName;
  /** True when the provider can actually reach the portal. */
  readonly live: boolean;

  requestConsent(input: ConsentRequest): Promise<ConsentResult>;
  getConsent(consentId: string): Promise<ConsentResult>;

  fetchPrefill(input: {
    pan: string;
    assessmentYear: string;
    consentId: string;
  }): Promise<PrefillPayload>;

  fetchAis?(input: {
    pan: string;
    assessmentYear: string;
    consentId: string;
  }): Promise<AisPayload>;

  uploadReturn(input: UploadRequest): Promise<UploadResult>;
  getFilingStatus(input: {
    pan: string;
    acknowledgementNumber: string;
  }): Promise<FilingStatus>;
}

export class EriError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'EriError';
  }
}
