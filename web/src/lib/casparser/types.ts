/**
 * Soft-fail contract for casparser.in Pro APIs (DigiLocker, PAN KYC, CDSL).
 * Network and API failures never throw — callers fall back to manual entry.
 */

export type CasparserErrorCode =
  | 'UNAVAILABLE'
  | 'AUTH_FAILED'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'UPSTREAM';

export interface CasparserError {
  ok: false;
  code: CasparserErrorCode;
  message: string;
}

export interface DigilockerSessionSuccess {
  ok: true;
  sessionId: string;
  authorizationUrl: string;
  expiresIn?: number;
  mock?: boolean;
}

export type DigilockerSessionResult = DigilockerSessionSuccess | CasparserError;

export interface DigilockerIdentityPayload {
  name?: string | null;
  dob?: string | null;
  gender?: string | null;
  email?: string | null;
  mobile?: string | null;
  verified?: {
    pan?: string | null;
    aadhaar?: string | null;
  } | null;
}

export interface DigilockerFetchedPan {
  pan?: string;
  name?: string;
  dob?: string;
}

export interface DigilockerResultSuccess {
  ok: true;
  sessionId: string;
  identity?: DigilockerIdentityPayload;
  fetchedPan?: DigilockerFetchedPan;
  mock?: boolean;
}

export type DigilockerResultOutcome = DigilockerResultSuccess | CasparserError;

export interface PanKycStatusSuccess {
  ok: true;
  pan: string;
  kycCompliant: boolean;
  kycStatus: string;
  kycMode?: string | null;
  activeKra?: string | null;
}

export type PanKycStatusResult = PanKycStatusSuccess | CasparserError;

export interface CdslOtpSuccess {
  ok: true;
  sessionId: string;
  message?: string;
}

export type CdslOtpResult = CdslOtpSuccess | CasparserError;

export interface CdslFileRef {
  filename?: string;
  url: string;
}

export interface CdslVerifySuccess {
  ok: true;
  files: CdslFileRef[];
  message?: string;
}

export type CdslVerifyResult = CdslVerifySuccess | CasparserError;

export interface SmartParseSuccess {
  ok: true;
  /** Raw casparser smart-parse JSON (mapped elsewhere to CasParseResult). */
  raw: Record<string, unknown>;
}

export type SmartParseResult = SmartParseSuccess | CasparserError;

export interface AccessTokenSuccess {
  ok: true;
  accessToken: string;
  expiresIn?: number;
  tokenType?: string;
}

export type AccessTokenResult = AccessTokenSuccess | CasparserError;

export interface CasparserClient {
  readonly available: boolean;
  createAccessToken(expiryMinutes?: number): Promise<AccessTokenResult>;
  digilockerAccountLookup(input: {
    mobile?: string;
    aadhaar?: string;
  }): Promise<{ ok: true; suggestedUserFlow?: string } | CasparserError>;
  digilockerStartSession(input: {
    redirectUrl: string;
    consentPurpose: string;
    documents?: string[];
    userFlow?: 'signin' | 'signup';
    prefillMobile?: string;
  }): Promise<DigilockerSessionResult>;
  digilockerResult(input: {
    sessionId: string;
    fetchDocuments?: string[];
  }): Promise<DigilockerResultOutcome>;
  panKycStatus(pan: string): Promise<PanKycStatusResult>;
  cdslFetchOtp(input: {
    pan: string;
    boId: string;
    dob: string;
  }): Promise<CdslOtpResult>;
  cdslVerifyOtp(input: {
    sessionId: string;
    otp: string;
    numPeriods?: number;
  }): Promise<CdslVerifyResult>;
  smartParsePdfUrl(input: {
    pdfUrl: string;
    password?: string;
  }): Promise<SmartParseResult>;
}
