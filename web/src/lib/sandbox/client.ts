/**
 * Soft-fail client for Sandbox.co.in KYC / bank / DigiLocker enrichment.
 *
 * Auth and host come from the same ERI_* env vars used elsewhere, but this is
 * not an EriProvider — Sandbox has no consent, prefill, or ITR upload. Every
 * method returns a discriminated result. Network and API failures never throw.
 *
 * Sensitive identifiers (PAN, Aadhaar, account numbers) are never logged.
 */

import {
  createMockDigilockerSession,
  digilockerMockEnabled,
  DIGILOCKER_DISABLED_MESSAGE,
  DIGILOCKER_HTTPS_MESSAGE,
  isHttpsRedirect,
  mockDigilockerStatus,
  mockFetchDigilockerDocument,
} from '@/lib/sandbox/digilocker-mock';
import type {
  DigilockerDocumentResult,
  DigilockerFileRef,
  DigilockerIdentity,
  DigilockerInitResult,
  DigilockerStatusResult,
  IfscResult,
  PanAadhaarLinkResult,
  PanVerifyResult,
  PennyLessResult,
  SandboxClient,
  SandboxError,
  SandboxErrorCode,
} from '@/lib/sandbox/types';

const DEFAULT_BASE_URL = 'https://test-api.sandbox.co.in';
const API_VERSION = '1.0';
const DEFAULT_TIMEOUT_MS = 30_000;
/** Access tokens last ~24h; refresh a little early. */
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

const UNAVAILABLE =
  'Sandbox enrichment is unavailable. Enter the details by hand.';

export interface SandboxClientOptions {
  /** Defaults to ERI_BASE_URL, then the Sandbox test host. */
  baseUrl?: string;
  /** Defaults to ERI_API_KEY. */
  apiKey?: string;
  /** Defaults to ERI_API_SECRET. */
  apiSecret?: string;
  timeoutMs?: number;
  /** Injected in tests. Defaults to the global fetch. */
  fetch?: typeof globalThis.fetch;
  /** Injected in tests. */
  now?: () => number;
  /**
   * Local DigiLocker consent stand-in. Defaults to DIGILOCKER_MOCK=1.
   * Use when the Sandbox DigiLocker product is not enabled on the account.
   */
  digilockerMock?: boolean;
  /**
   * Send `x-accept-cache: true` on KYC / bank lookups so purchased response
   * cache is used (no wallet charge on cache hit). Defaults to
   * SANDBOX_ACCEPT_CACHE unset/true; set SANDBOX_ACCEPT_CACHE=0 to force origin.
   */
  acceptCache?: boolean;
}

export interface SandboxAuthContext {
  baseUrl: string;
  apiKey: string;
  accessToken: string;
  fetch: typeof globalThis.fetch;
  timeoutMs: number;
}

export interface SandboxServiceClient extends SandboxClient {
  /** Force a fresh authenticate; mainly for tests. */
  authenticate(): Promise<{ ok: true; accessToken: string } | SandboxError>;
  /**
   * Cached access token plus connection details for multipart / custom callers
   * (e.g. OCR). Soft-fails; never throws.
   */
  authContext(): Promise<({ ok: true } & SandboxAuthContext) | SandboxError>;
}

/* ─────────────────────────── Module-scope token cache ─────────────────────────── */

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let sharedToken: TokenCache | null = null;

/** Clears the cached access token. Exported for tests. */
export function clearSandboxTokenCache(): void {
  sharedToken = null;
}

export function createSandboxClient(options: SandboxClientOptions = {}): SandboxServiceClient {
  return new HttpSandboxClient(options);
}

class HttpSandboxClient implements SandboxServiceClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly timeoutMs: number;
  private readonly doFetch: typeof globalThis.fetch;
  private readonly now: () => number;
  private readonly digilockerMock: boolean;
  private readonly acceptCache: boolean;

  constructor(options: SandboxClientOptions) {
    const rawBase =
      options.baseUrl ?? process.env.ERI_BASE_URL ?? DEFAULT_BASE_URL;
    this.baseUrl = rawBase.replace(/\/+$/, '');
    this.apiKey = options.apiKey ?? process.env.ERI_API_KEY ?? '';
    this.apiSecret = options.apiSecret ?? process.env.ERI_API_SECRET ?? '';
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.doFetch = options.fetch ?? globalThis.fetch;
    this.now = options.now ?? Date.now;
    this.digilockerMock = options.digilockerMock ?? digilockerMockEnabled();
    this.acceptCache = options.acceptCache ?? sandboxAcceptCacheEnabled();
  }

  get available(): boolean {
    return Boolean(this.baseUrl && this.apiKey && this.apiSecret);
  }

  async authenticate(): Promise<{ ok: true; accessToken: string } | SandboxError> {
    if (!this.available) {
      return fail('UNAVAILABLE', UNAVAILABLE);
    }

    let response: Response;
    try {
      response = await this.doFetch(`${this.baseUrl}/authenticate`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'x-api-secret': this.apiSecret,
          'x-api-version': API_VERSION,
          accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (cause) {
      return fail('UNAVAILABLE', unreachable(cause, this.timeoutMs));
    }

    const body = await readJson(response);
    const token = pickAccessToken(body);
    if (!response.ok || !token) {
      return fail(
        'AUTH_FAILED',
        'Sandbox authentication failed. Check ERI_API_KEY and ERI_API_SECRET, or enter details by hand.',
      );
    }

    sharedToken = { accessToken: token, expiresAt: this.now() + TOKEN_TTL_MS };
    return { ok: true, accessToken: token };
  }

  async authContext(): Promise<({ ok: true } & SandboxAuthContext) | SandboxError> {
    const token = await this.ensureToken();
    if (!token.ok) return token;
    return {
      ok: true,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      accessToken: token.accessToken,
      fetch: this.doFetch,
      timeoutMs: this.timeoutMs,
    };
  }

  async verifyPan(input: {
    pan: string;
    name: string;
    dateOfBirth: string;
  }): Promise<PanVerifyResult> {
    const pan = input.pan.trim().toUpperCase();
    const name = input.name.trim();
    const dob = formatDobForSandbox(input.dateOfBirth);

    const body = await this.request('POST', '/kyc/pan/verify', {
      '@entity': 'in.co.sandbox.kyc.pan_verification.request',
      pan,
      name_as_per_pan: name,
      date_of_birth: dob,
      consent: 'Y',
      reason: 'ITR filing verification',
    });

    if (!body.ok) return body.error;
    if (isEmptyKycBody(body.payload, body.status)) {
      return fail(
        'UNAVAILABLE',
        'PAN verification returned an empty response. The KYC product may not be enabled on this Sandbox account. Enter PAN details by hand.',
      );
    }

    const data = payloadData(body.payload);
    if (!data) {
      return fail(
        'UPSTREAM',
        'PAN verification returned a body we do not recognise. Enter PAN details by hand.',
      );
    }

    return {
      ok: true,
      pan: str(data.pan) ?? pan,
      status: str(data.status),
      category: str(data.category),
      nameMatch: bool(data.name_as_per_pan_match ?? data.nameAsPerPanMatch),
      dobMatch: bool(data.date_of_birth_match ?? data.dateOfBirthMatch),
      aadhaarSeedingStatus: str(
        data.aadhaar_seeding_status ?? data.aadhaarSeedingStatus,
      ),
      remarks: str(data.remarks),
    };
  }

  async panAadhaarLink(input: {
    pan: string;
    aadhaar?: string;
  }): Promise<PanAadhaarLinkResult> {
    const pan = input.pan.trim().toUpperCase();
    const payload: Record<string, unknown> = {
      '@entity': 'in.co.sandbox.kyc.pan_aadhaar.status',
      pan,
      consent: 'Y',
      reason: 'ITR filing verification',
    };
    if (input.aadhaar?.trim()) {
      payload.aadhaar_number = input.aadhaar.trim();
    }

    const body = await this.request('POST', '/kyc/pan-aadhaar/status', payload);
    if (!body.ok) return body.error;
    if (isEmptyKycBody(body.payload, body.status)) {
      return fail(
        'UNAVAILABLE',
        'PAN–Aadhaar link check returned an empty response. The KYC product may not be enabled on this Sandbox account. Enter details by hand.',
      );
    }

    const data = payloadData(body.payload);
    if (!data) {
      return fail(
        'UPSTREAM',
        'PAN–Aadhaar link check returned a body we do not recognise. Enter details by hand.',
      );
    }

    const seeding = str(data.aadhaar_seeding_status ?? data.aadhaarSeedingStatus);
    const message = str(data.message);
    const linked =
      seeding !== undefined
        ? /^y/i.test(seeding)
        : Boolean(message && /linked/i.test(message) && !/not\s+linked/i.test(message));

    return {
      ok: true,
      pan,
      linked,
      aadhaarSeedingStatus: seeding,
      message,
    };
  }

  async lookupIfsc(ifsc: string): Promise<IfscResult> {
    const code = ifsc.trim().toUpperCase();
    if (!code) {
      return fail('BAD_REQUEST', 'Enter an IFSC code, or look the bank details up by hand.');
    }

    const body = await this.request('GET', `/bank/${encodeURIComponent(code)}`);
    if (!body.ok) return body.error;

    const data = payloadData(body.payload);
    if (!data) {
      return fail('UPSTREAM', 'IFSC lookup returned a body we do not recognise. Enter bank details by hand.');
    }

    const resolved = str(data.IFSC ?? data.ifsc) ?? code;
    const bank = str(data.BANK ?? data.bank);
    if (!bank && !str(data.BRANCH ?? data.branch)) {
      return fail('NOT_FOUND', 'No bank branch found for that IFSC. Check the code or enter details by hand.');
    }

    return {
      ok: true,
      ifsc: resolved,
      bank,
      branch: str(data.BRANCH ?? data.branch),
      address: str(data.ADDRESS ?? data.address),
      city: str(data.CITY ?? data.city),
      state: str(data.STATE ?? data.state),
      micr: str(data.MICR ?? data.micr),
      neft: bool(data.NEFT ?? data.neft),
      rtgs: bool(data.RTGS ?? data.rtgs),
      imps: bool(data.IMPS ?? data.imps),
      upi: bool(data.UPI ?? data.upi),
    };
  }

  async pennyLessVerify(input: {
    ifsc: string;
    account: string;
  }): Promise<PennyLessResult> {
    const ifsc = input.ifsc.trim().toUpperCase();
    const account = input.account.trim();
    if (!ifsc || !account) {
      return fail('BAD_REQUEST', 'Enter IFSC and account number, or verify the refund account by hand.');
    }

    const path = `/bank/${encodeURIComponent(ifsc)}/accounts/${encodeURIComponent(account)}/penniless-verify`;
    const body = await this.request('GET', path);
    if (!body.ok) return body.error;

    const data = payloadData(body.payload);
    if (!data) {
      return fail(
        'UPSTREAM',
        'Account verification returned a body we do not recognise. Confirm the refund account by hand.',
      );
    }

    return {
      ok: true,
      ifsc,
      accountExists: bool(
        data.account_exists ?? data.accountExists ?? data.exists ?? data.valid,
      ),
      nameMatch: bool(data.name_match ?? data.nameMatch ?? data.name_at_bank_match),
      message: str(data.message),
    };
  }

  async initDigilocker(input: {
    redirectUrl: string;
    docTypes?: string[];
  }): Promise<DigilockerInitResult> {
    const redirectUrl = input.redirectUrl.trim();
    if (!redirectUrl) {
      return fail('BAD_REQUEST', 'A DigiLocker redirect URL is required.');
    }

    if (this.digilockerMock || redirectUrl.startsWith('mock:')) {
      const target =
        redirectUrl.startsWith('mock:')
          ? redirectUrl.slice('mock:'.length) || 'http://localhost:3000/filing'
          : redirectUrl;
      return createMockDigilockerSession(target);
    }

    if (!isHttpsRedirect(redirectUrl)) {
      return fail('BAD_REQUEST', DIGILOCKER_HTTPS_MESSAGE);
    }

    const body = await this.request('POST', '/kyc/digilocker/sessions/init', {
      '@entity': 'in.co.sandbox.kyc.digilocker.session.request',
      flow: 'signin',
      doc_types: input.docTypes ?? ['aadhaar', 'pan'],
      redirect_url: redirectUrl,
      options: { pinless: true },
    });
    if (!body.ok) return body.error;
    if (isEmptyKycBody(body.payload, body.status)) {
      return fail('UNAVAILABLE', DIGILOCKER_DISABLED_MESSAGE);
    }

    const data = payloadData(body.payload);
    const sessionId = str(data?.session_id ?? data?.sessionId);
    const authorizationUrl = str(data?.authorization_url ?? data?.authorizationUrl);
    if (!sessionId || !authorizationUrl) {
      // Same symptom as empty KYC bodies when DigiLocker is not provisioned.
      return fail('UNAVAILABLE', DIGILOCKER_DISABLED_MESSAGE);
    }

    return { ok: true, sessionId, authorizationUrl };
  }

  async digilockerStatus(sessionId: string): Promise<DigilockerStatusResult> {
    const id = sessionId.trim();
    if (!id) {
      return fail('BAD_REQUEST', 'A DigiLocker session id is required.');
    }

    if (this.digilockerMock || id.startsWith('mock_')) {
      return mockDigilockerStatus(id);
    }

    const body = await this.request(
      'GET',
      `/kyc/digilocker/sessions/${encodeURIComponent(id)}/status`,
    );
    if (!body.ok) return body.error;
    if (isEmptyKycBody(body.payload, body.status)) {
      return fail('UNAVAILABLE', DIGILOCKER_DISABLED_MESSAGE);
    }

    const data = payloadData(body.payload);
    const status = str(data?.status);
    if (!status) {
      return fail(
        'UPSTREAM',
        'DigiLocker status returned a body we do not recognise. Continue without DigiLocker.',
      );
    }

    return {
      ok: true,
      sessionId: str(data?.id) ?? id,
      status,
    };
  }

  async fetchDigilockerDocument(input: {
    sessionId: string;
    docType: string;
  }): Promise<DigilockerDocumentResult> {
    const sessionId = input.sessionId.trim();
    const docType = input.docType.trim().toLowerCase();
    if (!sessionId || !docType) {
      return fail('BAD_REQUEST', 'DigiLocker session id and document type are required.');
    }

    if (this.digilockerMock || sessionId.startsWith('mock_')) {
      return mockFetchDigilockerDocument({ sessionId, docType });
    }

    const body = await this.request(
      'GET',
      `/kyc/digilocker/sessions/${encodeURIComponent(sessionId)}/documents/${encodeURIComponent(docType)}`,
    );
    if (!body.ok) return body.error;
    if (isEmptyKycBody(body.payload, body.status)) {
      return fail('UNAVAILABLE', DIGILOCKER_DISABLED_MESSAGE);
    }

    const data = payloadData(body.payload);
    if (!data) {
      return fail(
        'UPSTREAM',
        'DigiLocker document fetch returned a body we do not recognise. Enter details by hand.',
      );
    }

    const files = parseFileRefs(data.files);
    const identity = {
      ...identityFromRecord(data),
      ...(await identityFromXmlFiles(files, this.doFetch, this.timeoutMs, docType)),
    };

    return {
      ok: true,
      docType,
      files,
      identity: hasIdentity(identity) ? identity : undefined,
    };
  }

  /* ─────────────────────────── HTTP helpers ─────────────────────────── */

  private async ensureToken(): Promise<{ ok: true; accessToken: string } | SandboxError> {
    if (!this.available) {
      return fail('UNAVAILABLE', UNAVAILABLE);
    }
    if (sharedToken && sharedToken.expiresAt > this.now()) {
      return { ok: true, accessToken: sharedToken.accessToken };
    }
    return this.authenticate();
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    jsonBody?: Record<string, unknown>,
    retried = false,
  ): Promise<
    | { ok: true; status: number; payload: unknown }
    | { ok: false; error: SandboxError }
  > {
    const auth = await this.ensureToken();
    if (!auth.ok) return { ok: false, error: auth };

    let response: Response;
    try {
      response = await this.doFetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: auth.accessToken,
          'x-api-key': this.apiKey,
          'x-api-version': API_VERSION,
          accept: 'application/json',
          ...(this.acceptCache && cacheablePath(path)
            ? { 'x-accept-cache': 'true' }
            : {}),
          ...(jsonBody ? { 'content-type': 'application/json' } : {}),
        },
        body: jsonBody ? JSON.stringify(jsonBody) : undefined,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (cause) {
      return { ok: false, error: fail('UNAVAILABLE', unreachable(cause, this.timeoutMs)) };
    }

    if (response.status === 401 && !retried) {
      sharedToken = null;
      return this.request(method, path, jsonBody, true);
    }

    const payload = await readJson(response);

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        error: fail(
          'AUTH_FAILED',
          'Sandbox rejected the access token. Check ERI_API_KEY / ERI_API_SECRET, or enter details by hand.',
        ),
      };
    }

    if (response.status === 404) {
      // Test environment often returns 404 "does not match any saved example"
      // for well-formed calls — treat as soft upstream, not a crash.
      const message =
        pickMessage(payload) ||
        'Sandbox has no match for that request. Enter the details by hand.';
      return { ok: false, error: fail('NOT_FOUND', message) };
    }

    if (!response.ok) {
      const message =
        pickMessage(payload) ||
        `Sandbox answered ${response.status}. Enter the details by hand.`;
      return {
        ok: false,
        error: fail(response.status >= 500 ? 'UNAVAILABLE' : 'UPSTREAM', message),
      };
    }

    return { ok: true, status: response.status, payload };
  }
}

/* ─────────────────────────── parsing helpers ─────────────────────────── */

const fail = (code: SandboxErrorCode, message: string): SandboxError => ({
  ok: false,
  code,
  message,
});

/** Default on: purchased response cache. Set SANDBOX_ACCEPT_CACHE=0 to bypass. */
export function sandboxAcceptCacheEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env.SANDBOX_ACCEPT_CACHE?.trim().toLowerCase();
  if (!raw) return true;
  return raw !== '0' && raw !== 'false' && raw !== 'no' && raw !== 'off';
}

/** KYC / bank endpoints that document x-accept-cache support. */
function cacheablePath(path: string): boolean {
  return (
    path.startsWith('/kyc/pan') ||
    path.startsWith('/bank/') ||
    path.startsWith('/gst/compliance/public/')
  );
}

function unreachable(cause: unknown, timeoutMs: number): string {
  const name = cause instanceof Error ? cause.name : '';
  if (name === 'TimeoutError' || name === 'AbortError') {
    return `Sandbox did not answer within ${Math.round(timeoutMs / 1000)} seconds. Enter details by hand.`;
  }
  return 'Sandbox could not be reached. Enter details by hand.';
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  isRecord(value) ? value : null;

/** Prefer `payload.data` when present; otherwise the payload itself. */
function payloadData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  return asRecord(root.data) ?? root;
}

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

const bool = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

function pickAccessToken(body: unknown): string | undefined {
  const root = asRecord(body);
  const data = asRecord(root?.data);
  return str(data?.access_token ?? data?.accessToken ?? root?.access_token);
}

function pickMessage(body: unknown): string | undefined {
  const root = asRecord(body);
  if (!root) return undefined;
  return str(root.message) ?? str(asRecord(root.data)?.message);
}

/**
 * Empty body, or the odd `code: ,` style response seen when a KYC product is
 * not enabled on the Sandbox account. Broken bodies often fail JSON.parse and
 * arrive here as null; sometimes they parse with a blank/comma code and only a
 * transaction_id.
 */
function isEmptyKycBody(payload: unknown, httpStatus: number): boolean {
  if (payload === null || payload === undefined) return true;
  if (typeof payload === 'string' && !payload.trim()) return true;
  const root = asRecord(payload);
  if (!root) return false;
  const code = root.code;
  if (code === '' || code === ',' || code === null || code === undefined) {
    // A successful KYC/DigiLocker call always carries a numeric code and data.
    if (!asRecord(root.data)) return true;
  }
  if (httpStatus === 200 && Object.keys(root).length === 0) return true;
  return false;
}

/** Accept ISO `YYYY-MM-DD` or already-formatted `DD/MM/YYYY`. */
function formatDobForSandbox(value: string): string {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return trimmed;
}

function parseFileRefs(value: unknown): DigilockerFileRef[] {
  if (!Array.isArray(value)) return [];
  const out: DigilockerFileRef[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) continue;
    const meta = asRecord(row.metadata) ?? {};
    out.push({
      url: str(row.url),
      size: typeof row.size === 'number' ? row.size : undefined,
      contentType: str(meta.ContentType ?? meta.contentType ?? row.content_type),
      description: str(meta.description),
      issuer: str(meta.issuer),
    });
  }
  return out;
}

function identityFromRecord(data: Record<string, unknown>): DigilockerIdentity {
  const pan = str(data.pan ?? data.pan_number ?? data.panNumber);
  const aadhaar = str(
    data.aadhaar ?? data.aadhaar_number ?? data.aadhaarNumber ?? data.uid,
  );
  const fullName = str(data.name ?? data.full_name ?? data.fullName ?? data.name_as_per_pan);
  const dateOfBirth = normalizeDob(
    data.date_of_birth ?? data.dateOfBirth ?? data.dob ?? data.DateOfBirth,
  );
  const firstName = str(data.first_name ?? data.firstName);
  const middleName = str(data.middle_name ?? data.middleName);
  const surname = str(data.surname ?? data.last_name ?? data.lastName);

  return {
    pan,
    aadhaar,
    fullName,
    firstName,
    middleName,
    surname,
    dateOfBirth,
  };
}

function hasIdentity(identity: DigilockerIdentity): boolean {
  return Boolean(
    identity.pan ||
      identity.aadhaar ||
      identity.fullName ||
      identity.firstName ||
      identity.surname ||
      identity.dateOfBirth,
  );
}

function normalizeDob(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Sandbox profile sometimes returns epoch milliseconds.
    const d = new Date(value > 1e12 ? value : value * 1000);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) return trimmed;
  const dmy = /^(\d{2})[/.-](\d{2})[/.-](\d{4})$/.exec(trimmed);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return undefined;
}

/**
 * DigiLocker document endpoints often return only a short-lived S3 URL to an
 * XML file. Fetch it in memory, pull the fields we need, and discard the bytes.
 * Never write PDF/XML to disk.
 */
async function identityFromXmlFiles(
  files: DigilockerFileRef[],
  doFetch: typeof globalThis.fetch,
  timeoutMs: number,
  docType: string,
): Promise<DigilockerIdentity> {
  const identity: DigilockerIdentity = {};
  for (const file of files) {
    if (!file.url) continue;
    const looksXml =
      (file.contentType ?? '').includes('xml') ||
      /\.xml(\?|$)/i.test(file.url) ||
      /aadhaar|adhar|pan/i.test(file.description ?? '');
    if (!looksXml && docType !== 'aadhaar' && docType !== 'pan') continue;

    let text: string;
    try {
      const response = await doFetch(file.url, {
        method: 'GET',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) continue;
      text = await response.text();
    } catch {
      continue;
    }

    // Skip obvious binary/PDF payloads.
    if (!text.includes('<') || text.startsWith('%PDF')) continue;

    Object.assign(identity, extractIdentityFromXml(text, docType));
  }
  return identity;
}

function extractIdentityFromXml(xml: string, docType: string): DigilockerIdentity {
  const attr = (name: string): string | undefined => {
    const re = new RegExp(`\\b${name}\\s*=\\s*"([^"]+)"`, 'i');
    const m = re.exec(xml);
    return m?.[1]?.trim() || undefined;
  };
  const tag = (name: string): string | undefined => {
    const re = new RegExp(`<${name}[^>]*>([^<]+)</${name}>`, 'i');
    const m = re.exec(xml);
    return m?.[1]?.trim() || undefined;
  };

  const fullName = attr('name') ?? tag('name') ?? tag('Name');
  const dob = normalizeDob(attr('dob') ?? tag('dob') ?? tag('DateOfBirth') ?? tag('DOB'));
  const uid = attr('uid') ?? tag('uid') ?? tag('Uid');
  const pan =
    attr('pan') ??
    tag('pan') ??
    tag('PAN') ??
    tag('PermanentAccountNumber') ??
    (/[A-Z]{5}\d{4}[A-Z]/i.exec(xml)?.[0]?.toUpperCase());

  const out: DigilockerIdentity = {
    fullName,
    dateOfBirth: dob,
  };
  if (docType === 'aadhaar' || uid) out.aadhaar = uid;
  if (docType === 'pan' || pan) out.pan = pan;
  return out;
}
