/**
 * A live ERI provider spoken over plain REST.
 *
 * No vendor contract is settled yet, so nothing about the wire format is spread
 * through the file: every endpoint sits in SANDBOX_ROUTES at the top, and every
 * response is read defensively into the shapes in types.ts. Pointing this at a
 * different vendor should be an edit to SANDBOX_ROUTES and nothing else.
 *
 * The base URL, key and secret come from EriConfig, which index.ts reads from
 * the environment. Neither the key nor the secret is ever put into a message.
 */

import { EriError } from '@/lib/eri/types';
import type {
  ConsentRequest,
  ConsentResult,
  ConsentStatus,
  EriConfig,
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

/**
 * Every endpoint the adapter calls, relative to EriConfig.baseUrl. A `:name`
 * segment is replaced with the corresponding argument, URL-encoded.
 */
export const SANDBOX_ROUTES = {
  /** POST. Opens a taxpayer e-consent. Returns a ConsentResult. */
  consentCreate: '/eri/v1/consent',
  /** GET. One consent by id. Returns a ConsentResult. */
  consentRead: '/eri/v1/consent/:consentId',
  /** POST. The departmental prefill for a PAN and assessment year, as a PrefillPayload. */
  prefill: '/eri/v1/prefill',
  /** POST. Uploads the return JSON. Returns an UploadResult with the acknowledgement number. */
  upload: '/eri/v1/return',
  /** GET. Where a filed return has got to. Returns a FilingStatus. */
  filingStatus: '/eri/v1/return/:acknowledgementNumber',
} as const;

/** The portal is slow under load; anything past this is a failure worth retrying. */
const TIMEOUT_MS = 30_000;

/* ─────────────────────────── Reading a response ─────────────────────────── */

const rec = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

const CONSENT_STATUS: readonly ConsentStatus[] = ['pending', 'granted', 'declined', 'expired'];
const UPLOAD_STATUS: readonly UploadStatus[] = [
  'accepted',
  'rejected',
  'pending_verification',
  'verified',
  'processed',
];

function consentStatus(value: unknown): ConsentStatus {
  const found = CONSENT_STATUS.find((s) => s === value);
  if (!found) throw new EriError('The provider returned an unknown consent status.', 'ERI_BAD_RESPONSE');
  return found;
}

function uploadStatus(value: unknown): UploadStatus {
  const found = UPLOAD_STATUS.find((s) => s === value);
  if (!found) throw new EriError('The provider returned an unknown filing status.', 'ERI_BAD_RESPONSE');
  return found;
}

function toConsent(body: unknown): ConsentResult {
  const r = rec(body);
  const consentId = str(r.consentId);
  if (!consentId) throw new EriError('The provider returned a consent with no id.', 'ERI_BAD_RESPONSE');
  return {
    consentId,
    status: consentStatus(r.status),
    redirectUrl: str(r.redirectUrl),
    expiresAt: str(r.expiresAt),
    message: str(r.message),
  };
}

function toPersonal(value: unknown): PrefillPersonal {
  const r = rec(value);
  const a = rec(r.address);
  return {
    firstName: str(r.firstName),
    middleName: str(r.middleName),
    surname: str(r.surname),
    pan: str(r.pan),
    dateOfBirth: str(r.dateOfBirth),
    aadhaar: str(r.aadhaar),
    status: str(r.status),
    gender: str(r.gender),
    email: str(r.email),
    mobile: str(r.mobile),
    address: {
      flatNo: str(a.flatNo),
      premises: str(a.premises),
      road: str(a.road),
      locality: str(a.locality),
      city: str(a.city),
      stateCode: str(a.stateCode),
      countryCode: str(a.countryCode),
      pinCode: str(a.pinCode),
    },
  };
}

function toBankAccounts(value: unknown): PrefillBankAccount[] {
  return arr(value).flatMap((item) => {
    const r = rec(item);
    const ifsc = str(r.ifsc);
    const bankName = str(r.bankName);
    const accountNumber = str(r.accountNumber);
    if (!ifsc || !bankName || !accountNumber) return [];
    return [{
      ifsc,
      bankName,
      accountNumber,
      accountType: str(r.accountType),
      nominatedForRefund: r.nominatedForRefund === true,
    }];
  });
}

function toSalaries(value: unknown): PrefillSalary[] {
  return arr(value).flatMap((item) => {
    const r = rec(item);
    const employerName = str(r.employerName);
    if (!employerName) return [];
    return [{
      employerName,
      employerTan: str(r.employerTan),
      employerCategory: str(r.employerCategory),
      salary17_1: num(r.salary17_1),
      perquisites17_2: num(r.perquisites17_2),
      profitInLieu17_3: num(r.profitInLieu17_3),
      exemptAllowances: num(r.exemptAllowances),
      standardDeduction: num(r.standardDeduction),
      professionalTax: num(r.professionalTax),
      taxDeducted: num(r.taxDeducted),
    }];
  });
}

const TDS_KINDS: ReadonlyArray<PrefillTdsEntry['kind']> = ['salary', 'other', 'property', 'tcs'];

function toTds(value: unknown): PrefillTdsEntry[] {
  return arr(value).flatMap((item) => {
    const r = rec(item);
    const kind = TDS_KINDS.find((k) => k === r.kind);
    if (!kind) return [];
    return [{
      kind,
      deductorTan: str(r.deductorTan),
      deductorPan: str(r.deductorPan),
      deductorName: str(r.deductorName),
      section: str(r.section),
      grossAmount: num(r.grossAmount),
      taxDeducted: num(r.taxDeducted),
      financialYear: str(r.financialYear),
    }];
  });
}

function toChallans(value: unknown): PrefillChallan[] {
  return arr(value).flatMap((item) => {
    const r = rec(item);
    const bsrCode = str(r.bsrCode);
    const depositDate = str(r.depositDate);
    const serialNumber = str(r.serialNumber);
    const amount = num(r.amount);
    if (!bsrCode || !depositDate || !serialNumber || amount === undefined) return [];
    const kind = r.kind === 'advance' || r.kind === 'self' ? r.kind : undefined;
    return [{ bsrCode, depositDate, serialNumber, amount, kind }];
  });
}

function toPrefill(body: unknown, config: EriConfig, pan: string, assessmentYear: string): PrefillPayload {
  const r = rec(body);
  const interest = rec(r.interest);
  return {
    source: config.provider,
    fetchedAt: str(r.fetchedAt) ?? new Date().toISOString(),
    assessmentYear: str(r.assessmentYear) ?? assessmentYear,
    pan: str(r.pan) ?? pan,
    personal: toPersonal(r.personal),
    bankAccounts: toBankAccounts(r.bankAccounts),
    salaries: toSalaries(r.salaries),
    tds: toTds(r.tds),
    challans: toChallans(r.challans),
    interest: {
      savingsBank: num(interest.savingsBank),
      termDeposits: num(interest.termDeposits),
      incomeTaxRefund: num(interest.incomeTaxRefund),
      others: num(interest.others),
    },
    dividend: num(r.dividend),
    raw: rec(body),
  };
}

function toUpload(body: unknown): UploadResult {
  const r = rec(body);
  const errors = arr(r.errors).flatMap((item) => {
    const e = rec(item);
    const code = str(e.code);
    const message = str(e.message);
    if (!code || !message) return [];
    return [{ code, message, path: str(e.path) }];
  });
  return {
    status: uploadStatus(r.status),
    acknowledgementNumber: str(r.acknowledgementNumber),
    filedAt: str(r.filedAt),
    errors: errors.length > 0 ? errors : undefined,
    verificationRedirectUrl: str(r.verificationRedirectUrl),
    message: str(r.message),
  };
}

function toFilingStatus(body: unknown, acknowledgementNumber: string): FilingStatus {
  const r = rec(body);
  return {
    acknowledgementNumber: str(r.acknowledgementNumber) ?? acknowledgementNumber,
    status: uploadStatus(r.status),
    verifiedAt: str(r.verifiedAt),
    processedAt: str(r.processedAt),
    refundStatus: str(r.refundStatus),
    message: str(r.message),
  };
}

/* ─────────────────────────── The call ─────────────────────────── */

function route(template: string, params: Record<string, string> = {}): string {
  return template.replace(/:([A-Za-z]+)/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) throw new EriError(`Route ${template} needs a ${name}.`, 'ERI_CONFIG');
    return encodeURIComponent(value);
  });
}

async function call(
  config: EriConfig,
  path: string,
  init: { method: 'GET' | 'POST'; body?: Record<string, unknown> },
): Promise<unknown> {
  if (!config.baseUrl) throw new EriError('ERI_BASE_URL is not set.', 'ERI_CONFIG');
  if (!config.apiKey) throw new EriError('ERI_API_KEY is not set.', 'ERI_CONFIG');

  const headers: Record<string, string> = {
    accept: 'application/json',
    authorization: `Bearer ${config.apiKey}`,
  };
  if (config.apiSecret) headers['x-api-secret'] = config.apiSecret;
  if (config.eriUserId) headers['x-eri-user-id'] = config.eriUserId;
  if (init.body !== undefined) headers['content-type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new EriError(
      `The ERI service could not be reached within ${TIMEOUT_MS / 1000} seconds.`,
      'ERI_UNREACHABLE',
      true,
    );
  }

  const text = await response.text().catch(() => '');

  if (!response.ok) {
    const body = rec(parseJson(text));
    // 429 is a rate limit and 5xx is the provider's own trouble; both come good
    // on a later attempt. A 4xx is our request and will fail the same way twice.
    throw new EriError(
      str(body.message) ?? str(response.statusText) ?? 'The ERI service refused the request.',
      str(body.code) ?? `HTTP_${response.status}`,
      response.status === 429 || response.status >= 500,
    );
  }

  if (text === '') return {};
  const body = parseJson(text);
  if (body === undefined) {
    throw new EriError('The ERI service returned a body that is not JSON.', 'ERI_BAD_RESPONSE');
  }
  return body;
}

/* ─────────────────────────── The provider ─────────────────────────── */

/** A provider for any ERI service that speaks the REST contract above. */
export function createSandboxProvider(config: EriConfig): EriProvider {
  return {
    name: config.provider,
    live: true,

    async requestConsent(input: ConsentRequest): Promise<ConsentResult> {
      return toConsent(await call(config, SANDBOX_ROUTES.consentCreate, {
        method: 'POST',
        body: {
          pan: input.pan,
          assessmentYear: input.assessmentYear,
          name: input.name,
          dateOfBirth: input.dateOfBirth,
          email: input.email,
          mobile: input.mobile,
          returnUrl: input.returnUrl,
        },
      }));
    },

    async getConsent(consentId: string): Promise<ConsentResult> {
      return toConsent(await call(config, route(SANDBOX_ROUTES.consentRead, { consentId }), {
        method: 'GET',
      }));
    },

    async fetchPrefill(input): Promise<PrefillPayload> {
      const body = await call(config, SANDBOX_ROUTES.prefill, { method: 'POST', body: { ...input } });
      return toPrefill(body, config, input.pan, input.assessmentYear);
    },

    async uploadReturn(input: UploadRequest): Promise<UploadResult> {
      return toUpload(await call(config, SANDBOX_ROUTES.upload, {
        method: 'POST',
        body: {
          pan: input.pan,
          assessmentYear: input.assessmentYear,
          form: input.form,
          consentId: input.consentId,
          verificationMode: input.verificationMode,
          softwareId: config.softwareId,
          json: input.json,
        },
      }));
    },

    async getFilingStatus(input): Promise<FilingStatus> {
      const path = route(SANDBOX_ROUTES.filingStatus, {
        acknowledgementNumber: input.acknowledgementNumber,
      });
      const body = await call(config, `${path}?pan=${encodeURIComponent(input.pan)}`, { method: 'GET' });
      return toFilingStatus(body, input.acknowledgementNumber);
    },
  };
}
