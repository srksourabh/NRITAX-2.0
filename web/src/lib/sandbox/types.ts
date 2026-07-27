/**
 * Soft-fail contract for Sandbox.co.in enrichment (KYC / bank / DigiLocker).
 *
 * This is not an ERI provider. Every call returns `{ ok: true, … }` or
 * `{ ok: false, code, message }` so the filing wizard can fall back to manual
 * entry. Nothing here throws for network or API failures.
 */

export type SandboxErrorCode =
  | 'UNAVAILABLE'
  | 'AUTH_FAILED'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'UPSTREAM';

export interface SandboxError {
  ok: false;
  code: SandboxErrorCode;
  message: string;
}

export interface PanVerifySuccess {
  ok: true;
  pan: string;
  status?: string;
  category?: string;
  nameMatch?: boolean;
  dobMatch?: boolean;
  aadhaarSeedingStatus?: string;
  remarks?: string;
}

export type PanVerifyResult = PanVerifySuccess | SandboxError;

export interface PanAadhaarLinkSuccess {
  ok: true;
  pan: string;
  linked: boolean;
  aadhaarSeedingStatus?: string;
  message?: string;
}

export type PanAadhaarLinkResult = PanAadhaarLinkSuccess | SandboxError;

export interface IfscSuccess {
  ok: true;
  ifsc: string;
  bank?: string;
  branch?: string;
  address?: string;
  city?: string;
  state?: string;
  micr?: string;
  neft?: boolean;
  rtgs?: boolean;
  imps?: boolean;
  upi?: boolean;
}

export type IfscResult = IfscSuccess | SandboxError;

export interface PennyLessSuccess {
  ok: true;
  ifsc: string;
  accountExists?: boolean;
  nameMatch?: boolean;
  message?: string;
}

export type PennyLessResult = PennyLessSuccess | SandboxError;

export interface DigilockerInitSuccess {
  ok: true;
  sessionId: string;
  authorizationUrl: string;
}

export type DigilockerInitResult = DigilockerInitSuccess | SandboxError;

export interface DigilockerStatusSuccess {
  ok: true;
  sessionId: string;
  status: string;
}

export type DigilockerStatusResult = DigilockerStatusSuccess | SandboxError;

export interface DigilockerFileRef {
  url?: string;
  size?: number;
  contentType?: string;
  description?: string;
  issuer?: string;
}

export interface DigilockerDocumentSuccess {
  ok: true;
  docType: string;
  files: DigilockerFileRef[];
  /** Structured fields when Sandbox (or an in-memory XML parse) yields them. */
  identity?: DigilockerIdentity;
}

export type DigilockerDocumentResult = DigilockerDocumentSuccess | SandboxError;

/**
 * Fields DigiLocker PAN / Aadhaar documents (or the session profile) can fill
 * on Part A General. Dates are ISO `YYYY-MM-DD` when known.
 */
export interface DigilockerIdentity {
  pan?: string;
  aadhaar?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  /** When the document only has a single name string. */
  fullName?: string;
  dateOfBirth?: string;
}

export interface SandboxClient {
  readonly available: boolean;
  verifyPan(input: {
    pan: string;
    name: string;
    dateOfBirth: string;
  }): Promise<PanVerifyResult>;
  panAadhaarLink(input: { pan: string; aadhaar?: string }): Promise<PanAadhaarLinkResult>;
  lookupIfsc(ifsc: string): Promise<IfscResult>;
  pennyLessVerify(input: { ifsc: string; account: string }): Promise<PennyLessResult>;
  initDigilocker(input: {
    redirectUrl: string;
    docTypes?: string[];
  }): Promise<DigilockerInitResult>;
  digilockerStatus(sessionId: string): Promise<DigilockerStatusResult>;
  fetchDigilockerDocument(input: {
    sessionId: string;
    docType: string;
  }): Promise<DigilockerDocumentResult>;
}
