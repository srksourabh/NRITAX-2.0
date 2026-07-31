/**
 * Soft-fail HTTP client for api.casparser.in (Pro DigiLocker / KYC / CDSL).
 */

import {
  createMockCasparserDigilockerSession,
  digilockerMockEnabled,
  mockCasparserDigilockerResult,
} from '@/lib/casparser/digilocker-mock';
import type {
  AccessTokenResult,
  CasparserClient,
  CasparserError,
  CasparserErrorCode,
  CdslFileRef,
  CdslOtpResult,
  CdslVerifyResult,
  DigilockerResultOutcome,
  DigilockerSessionResult,
  GenerateCasResult,
  InboxCasFile,
  InboxConnectResult,
  InboxDisconnectResult,
  InboxListResult,
  InboxStatusResult,
  PanKycStatusResult,
  SmartParseResult,
} from '@/lib/casparser/types';

const DEFAULT_BASE_URL = 'https://api.casparser.in';
const DEFAULT_TIMEOUT_MS = 60_000;
const CDSL_TIMEOUT_MS = 55_000;

const NO_KEY =
  'Statement import is not configured. Enter details by hand, or upload a CAS PDF.';

export interface CasparserClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
  digilockerMock?: boolean;
}

export function createCasparserClient(
  options: CasparserClientOptions = {},
): CasparserClient {
  return new HttpCasparserClient(options);
}

class HttpCasparserClient implements CasparserClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly doFetch: typeof globalThis.fetch;
  private readonly digilockerMock: boolean;

  constructor(options: CasparserClientOptions) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.CASPARSER_BASE_URL ??
      DEFAULT_BASE_URL
    ).replace(/\/+$/, '');
    this.apiKey = (options.apiKey ?? process.env.CASPARSER_API_KEY ?? '').trim();
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.doFetch = options.fetch ?? globalThis.fetch;
    this.digilockerMock = options.digilockerMock ?? digilockerMockEnabled();
  }

  get available(): boolean {
    return Boolean(this.apiKey) || this.digilockerMock;
  }

  async createAccessToken(expiryMinutes = 30): Promise<AccessTokenResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const minutes = Math.min(60, Math.max(1, Math.round(expiryMinutes)));
    const res = await this.request('POST', '/v1/token', { expiry_minutes: minutes });
    if (!res.ok) return res.error;
    const accessToken = asString(res.payload.access_token);
    if (!accessToken) {
      return fail(
        'UPSTREAM',
        'CAS Parser did not return an access token. Try again later, or enter details by hand.',
      );
    }
    return {
      ok: true,
      accessToken,
      expiresIn:
        typeof res.payload.expires_in === 'number' ? res.payload.expires_in : undefined,
      tokenType: asString(res.payload.token_type) || undefined,
    };
  }

  async digilockerAccountLookup(input: {
    mobile?: string;
    aadhaar?: string;
  }): Promise<{ ok: true; suggestedUserFlow?: string } | CasparserError> {
    if (this.digilockerMock) {
      return { ok: true, suggestedUserFlow: 'signin' };
    }
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);

    const body: Record<string, string> = {};
    if (input.mobile?.trim()) body.mobile = input.mobile.trim();
    else if (input.aadhaar?.trim()) body.aadhaar_number = input.aadhaar.trim();
    else {
      return fail('BAD_REQUEST', 'Enter a mobile number or Aadhaar for DigiLocker lookup.');
    }

    const res = await this.request('POST', '/v1/kyc/digilocker/account-lookup', body);
    if (!res.ok) return res.error;
    const flow = asString(res.payload.suggested_user_flow);
    return { ok: true, suggestedUserFlow: flow };
  }

  async digilockerStartSession(input: {
    redirectUrl: string;
    consentPurpose: string;
    documents?: string[];
    userFlow?: 'signin' | 'signup';
    prefillMobile?: string;
  }): Promise<DigilockerSessionResult> {
    if (this.digilockerMock) {
      return createMockCasparserDigilockerSession(input.redirectUrl);
    }
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);

    const body: Record<string, unknown> = {
      consent: true,
      consent_purpose: input.consentPurpose,
      redirect_url: input.redirectUrl,
      documents: input.documents ?? ['aadhaar', 'pan'],
    };
    if (input.userFlow) body.user_flow = input.userFlow;
    if (input.prefillMobile) body.prefill_mobile = input.prefillMobile;

    const res = await this.request('POST', '/v1/kyc/digilocker/session', body);
    if (!res.ok) return res.error;

    const sessionId = asString(res.payload.session_id);
    const authorizationUrl = asString(res.payload.authorization_url);
    if (!sessionId || !authorizationUrl) {
      return fail('UPSTREAM', 'DigiLocker session response was incomplete. Try again, or enter identity by hand.');
    }
    return {
      ok: true,
      sessionId,
      authorizationUrl,
      expiresIn:
        typeof res.payload.expires_in === 'number' ? res.payload.expires_in : undefined,
    };
  }

  async digilockerResult(input: {
    sessionId: string;
    fetchDocuments?: string[];
  }): Promise<DigilockerResultOutcome> {
    if (input.sessionId.startsWith('cp_mock_') || this.digilockerMock) {
      return mockCasparserDigilockerResult(input.sessionId);
    }
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);

    const res = await this.request(
      'POST',
      `/v1/kyc/digilocker/result/${encodeURIComponent(input.sessionId)}`,
      {
        fetch_documents: input.fetchDocuments ?? ['pan', 'aadhaar'],
        include_documents: true,
      },
    );
    if (!res.ok) return res.error;

    const identityRaw = asRecord(res.payload.identity);
    const fetched = asRecord(res.payload.fetched);
    const panRaw = asRecord(fetched?.pan);

    return {
      ok: true,
      sessionId: input.sessionId,
      identity: identityRaw
        ? {
            name: asString(identityRaw.name) || null,
            dob: asString(identityRaw.dob) || null,
            gender: asString(identityRaw.gender) || null,
            email: asString(identityRaw.email) || null,
            mobile: asString(identityRaw.mobile) || null,
            verified: asRecord(identityRaw.verified)
              ? {
                  pan: asString(asRecord(identityRaw.verified)!.pan) || null,
                  aadhaar: asString(asRecord(identityRaw.verified)!.aadhaar) || null,
                }
              : null,
          }
        : undefined,
      fetchedPan: panRaw
        ? {
            pan: asString(panRaw.pan),
            name: asString(panRaw.name),
            dob: asString(panRaw.dob),
          }
        : undefined,
    };
  }

  async panKycStatus(pan: string): Promise<PanKycStatusResult> {
    const panNo = pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNo)) {
      return fail('BAD_REQUEST', 'Enter a valid 10-character PAN for KYC status.');
    }
    if (!this.apiKey) {
      if (this.digilockerMock) {
        return {
          ok: true,
          pan: panNo,
          kycCompliant: true,
          kycStatus: 'validated',
          kycMode: 'digilocker',
          activeKra: 'cvl',
        };
      }
      return fail('UNAVAILABLE', NO_KEY);
    }

    const res = await this.request('POST', '/v1/kyc/pan/status', { pan_no: panNo }, 65_000);
    if (!res.ok) return res.error;

    return {
      ok: true,
      pan: asString(res.payload.pan) || panNo,
      kycCompliant: Boolean(res.payload.kyc_compliant),
      kycStatus: asString(res.payload.kyc_status) || 'unknown',
      kycMode: asString(res.payload.kyc_mode) || null,
      activeKra: asString(res.payload.active_kra) || null,
    };
  }

  async cdslFetchOtp(input: {
    pan: string;
    boId: string;
    dob: string;
  }): Promise<CdslOtpResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const pan = input.pan.trim().toUpperCase();
    const boId = input.boId.replace(/\D/g, '');
    const dob = input.dob.trim();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      return fail('BAD_REQUEST', 'Enter a valid PAN for CDSL fetch.');
    }
    if (boId.length !== 16) {
      return fail('BAD_REQUEST', 'Enter the 16-digit CDSL BO ID from your broker.');
    }
    if (!dob) {
      return fail('BAD_REQUEST', 'Date of birth is required for CDSL fetch.');
    }

    const res = await this.request(
      'POST',
      '/v4/cdsl/fetch',
      { pan, bo_id: boId, dob },
      CDSL_TIMEOUT_MS,
    );
    if (!res.ok) return res.error;
    const sessionId = asString(res.payload.session_id);
    if (!sessionId) {
      return fail('UPSTREAM', 'CDSL OTP session was incomplete. Try again, or upload a CAS PDF.');
    }
    return {
      ok: true,
      sessionId,
      message: asString(res.payload.msg) || 'OTP sent to the demat-registered mobile.',
    };
  }

  async cdslVerifyOtp(input: {
    sessionId: string;
    otp: string;
    numPeriods?: number;
  }): Promise<CdslVerifyResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const otp = input.otp.trim();
    if (!otp) return fail('BAD_REQUEST', 'Enter the SMS OTP from CDSL.');

    const res = await this.request(
      'POST',
      `/v4/cdsl/fetch/${encodeURIComponent(input.sessionId)}/verify`,
      { otp, num_periods: input.numPeriods ?? 6 },
      CDSL_TIMEOUT_MS,
    );
    if (!res.ok) return res.error;

    const filesRaw = Array.isArray(res.payload.files) ? res.payload.files : [];
    const files: CdslFileRef[] = [];
    for (const f of filesRaw) {
      const row = asRecord(f);
      const url = row ? asString(row.url) : '';
      if (!url) continue;
      files.push({ url, filename: asString(row?.filename) || undefined });
    }

    if (files.length === 0) {
      return fail('UPSTREAM', 'CDSL returned no CAS files. Try again, or upload a PDF.');
    }
    return {
      ok: true,
      files,
      message: asString(res.payload.msg) || `Fetched ${files.length} CAS file(s).`,
    };
  }

  async smartParsePdfUrl(input: {
    pdfUrl: string;
    password?: string;
  }): Promise<SmartParseResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const body: Record<string, string> = { pdf_url: input.pdfUrl };
    if (input.password) body.password = input.password;

    const res = await this.request('POST', '/v4/smart/parse', body);
    if (!res.ok) return res.error;
    return { ok: true, raw: res.payload };
  }

  async generateMutualFundCas(input: {
    email: string;
    fromDate: string;
    toDate: string;
    password: string;
    pan?: string;
  }): Promise<GenerateCasResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();
    const fromDate = input.fromDate.trim();
    const toDate = input.toDate.trim();
    if (!email || !email.includes('@')) {
      return fail('BAD_REQUEST', 'Enter the email registered with CAMS / KFintech.');
    }
    if (!password) {
      return fail('BAD_REQUEST', 'Enter a PDF password (usually your PAN).');
    }
    if (!fromDate || !toDate) {
      return fail('BAD_REQUEST', 'Statement from and to dates are required.');
    }

    const body: Record<string, string> = {
      email,
      from_date: fromDate,
      to_date: toDate,
      password,
    };
    const pan = input.pan?.trim().toUpperCase();
    if (pan) body.pan_no = pan;

    const res = await this.request('POST', '/v4/generate', body);
    if (!res.ok) return res.error;
    return {
      ok: true,
      message:
        asString(res.payload.msg) ||
        asString(res.payload.message) ||
        'Detailed CAS requested. Check the RTA email in a few minutes, then upload the PDF.',
    };
  }

  async inboxConnect(input: {
    redirectUri: string;
    state?: string;
  }): Promise<InboxConnectResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const redirectUri = input.redirectUri.trim();
    if (!redirectUri || !/^https?:\/\//i.test(redirectUri)) {
      return fail('BAD_REQUEST', 'A valid http(s) redirect URI is required for Gmail connect.');
    }
    const body: Record<string, string> = { redirect_uri: redirectUri };
    if (input.state?.trim()) body.state = input.state.trim();
    const res = await this.request('POST', '/v4/inbox/connect', body);
    if (!res.ok) return res.error;
    const oauthUrl = asString(res.payload.oauth_url);
    if (!oauthUrl) {
      return fail('UPSTREAM', 'CAS Parser did not return an OAuth URL for Gmail connect.');
    }
    return {
      ok: true,
      oauthUrl,
      expiresIn:
        typeof res.payload.expires_in === 'number' ? res.payload.expires_in : undefined,
    };
  }

  async inboxListCas(input: {
    inboxToken: string;
    startDate?: string;
    endDate?: string;
  }): Promise<InboxListResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const inboxToken = input.inboxToken.trim();
    if (!inboxToken) return fail('BAD_REQUEST', 'Gmail inbox is not connected.');
    const body: Record<string, string> = {};
    if (input.startDate?.trim()) body.start_date = input.startDate.trim();
    if (input.endDate?.trim()) body.end_date = input.endDate.trim();
    const res = await this.request('POST', '/v4/inbox/cas', body, this.timeoutMs, {
      'x-inbox-token': inboxToken,
    });
    if (!res.ok) return res.error;
    const filesRaw = Array.isArray(res.payload.files) ? res.payload.files : [];
    const files: InboxCasFile[] = [];
    for (const item of filesRaw) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const url = asString(row.url);
      if (!url) continue;
      files.push({
        messageId: asString(row.message_id) || url,
        filename: asString(row.filename) || 'cas.pdf',
        originalFilename: asString(row.original_filename) || undefined,
        messageDate: asString(row.message_date) || undefined,
        casType: asString(row.cas_type) || undefined,
        senderEmail: asString(row.sender_email) || undefined,
        size: typeof row.size === 'number' ? row.size : undefined,
        url,
        expiresIn: typeof row.expires_in === 'number' ? row.expires_in : undefined,
      });
    }
    return {
      ok: true,
      files,
      message:
        asString(res.payload.msg) ||
        asString(res.payload.message) ||
        (files.length
          ? `Found ${files.length} CAS file(s) in Gmail.`
          : 'No CAS files found in Gmail for the selected dates.'),
    };
  }

  async inboxStatus(inboxToken: string): Promise<InboxStatusResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const token = inboxToken.trim();
    if (!token) {
      return { ok: true, connected: false, message: 'Gmail inbox is not connected.' };
    }
    const res = await this.request('POST', '/v4/inbox/status', {}, this.timeoutMs, {
      'x-inbox-token': token,
    });
    if (!res.ok) {
      if (res.error.code === 'AUTH_FAILED') {
        return {
          ok: true,
          connected: false,
          message: 'Gmail access expired. Connect again to import CAS from inbox.',
        };
      }
      return res.error;
    }
    const connected =
      res.payload.connected === true ||
      asString(res.payload.status).toLowerCase() === 'connected' ||
      asString(res.payload.status).toLowerCase() === 'active';
    return {
      ok: true,
      connected,
      email: asString(res.payload.email) || undefined,
      message:
        asString(res.payload.msg) ||
        asString(res.payload.message) ||
        (connected ? 'Gmail inbox connected.' : 'Gmail inbox is not connected.'),
    };
  }

  async inboxDisconnect(inboxToken: string): Promise<InboxDisconnectResult> {
    if (!this.apiKey) return fail('UNAVAILABLE', NO_KEY);
    const token = inboxToken.trim();
    if (!token) return fail('BAD_REQUEST', 'Gmail inbox is not connected.');
    const res = await this.request('POST', '/v4/inbox/disconnect', {}, this.timeoutMs, {
      'x-inbox-token': token,
    });
    if (!res.ok) return res.error;
    return {
      ok: true,
      message:
        asString(res.payload.msg) ||
        asString(res.payload.message) ||
        'Gmail inbox disconnected.',
    };
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    timeoutMs = this.timeoutMs,
    extraHeaders?: Record<string, string>,
  ): Promise<
    | { ok: true; payload: Record<string, unknown>; status: number }
    | { ok: false; error: CasparserError }
  > {
    let response: Response;
    try {
      response = await this.doFetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'x-api-key': this.apiKey,
          accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(extraHeaders ?? {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      return {
        ok: false,
        error: failErr(
          'UNAVAILABLE',
          unreachable(cause, timeoutMs),
        ),
      };
    }

    const payload = await readJson(response);
    if (response.status === 401) {
      return {
        ok: false,
        error: failErr(
          'AUTH_FAILED',
          'CAS Parser authentication failed. Try again later, or enter details by hand.',
        ),
      };
    }
    if (!response.ok) {
      const msg =
        asString(payload.msg) ||
        asString(payload.message) ||
        `CAS Parser request failed (${response.status}). Try again, or enter details by hand.`;
      const code: CasparserErrorCode =
        response.status === 400 || response.status === 422
          ? 'BAD_REQUEST'
          : response.status === 404
            ? 'NOT_FOUND'
            : 'UPSTREAM';
      return { ok: false, error: failErr(code, msg) };
    }
    if (asString(payload.status) === 'failed') {
      return {
        ok: false,
        error: failErr(
          'UPSTREAM',
          asString(payload.msg) || asString(payload.message) || 'CAS Parser reported failure.',
        ),
      };
    }
    return { ok: true, payload, status: response.status };
  }
}

function fail(code: CasparserErrorCode, message: string): CasparserError {
  return { ok: false, code, message };
}

function failErr(code: CasparserErrorCode, message: string): CasparserError {
  return fail(code, message);
}

function unreachable(cause: unknown, timeoutMs: number): string {
  if (cause instanceof Error && /timeout|aborted/i.test(cause.message)) {
    return `CAS Parser timed out after ${Math.round(timeoutMs / 1000)}s. Try again, or enter details by hand.`;
  }
  return 'CAS Parser is unreachable. Check your network, or enter details by hand.';
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const data = await response.json();
    return asRecord(data) ?? {};
  } catch {
    return {};
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}
