/**
 * Client for the CAS parsing service in services/cas.
 *
 * The service is optional. Every failure — unreachable, timed out, refusing our
 * token, returning something we do not recognise — comes back as a CasParseError
 * so the uploader can fall back to manual capital-gain entry. Nothing here
 * throws.
 *
 * The service answers in snake_case. Keys are converted here by upper-casing the
 * character after each underscore, which is why the service spells its fields
 * `short_term_111A` and `schedule_112A`: they have to land on `shortTerm111A`
 * and `schedule112A`.
 */

import type {
  CasClient,
  CasParseError,
  CasParseResult,
  CasResponse,
} from '@/lib/cas/types';

const DEFAULT_TIMEOUT_MS = 60_000;
const HEALTH_TIMEOUT_MS = 5_000;
/** How long a /health answer is trusted before the next call re-probes. */
const HEALTH_TTL_MS = 30_000;

export interface CasClientOptions {
  /** Defaults to CAS_SERVICE_URL. An empty value means "not configured". */
  baseUrl?: string;
  /** Defaults to CAS_SERVICE_TOKEN. Sent as the X-CAS-Token header. */
  token?: string;
  timeoutMs?: number;
  /** Injected in tests. Defaults to the global fetch. */
  fetch?: typeof globalThis.fetch;
  /** Injected in tests, to age the cached health probe. */
  now?: () => number;
}

export interface CasServiceClient extends CasClient {
  /** Re-probe /health unless the last answer is still fresh. */
  checkHealth(): Promise<boolean>;
}

/** A CasClient over the parsing service, reading CAS_SERVICE_URL and CAS_SERVICE_TOKEN. */
export function createCasClient(options: CasClientOptions = {}): CasServiceClient {
  return new HttpCasClient(options);
}

class HttpCasClient implements CasServiceClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly doFetch: typeof globalThis.fetch;
  private readonly now: () => number;

  private healthy = false;
  private probedAt: number | null = null;

  constructor(options: CasClientOptions) {
    this.baseUrl = (options.baseUrl ?? process.env.CAS_SERVICE_URL ?? '').replace(/\/+$/, '');
    this.token = options.token ?? process.env.CAS_SERVICE_TOKEN ?? '';
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.doFetch = options.fetch ?? globalThis.fetch;
    this.now = options.now ?? Date.now;
  }

  /** The last known state of the service. False until a probe or a parse says otherwise. */
  get available(): boolean {
    return this.healthy;
  }

  async checkHealth(): Promise<boolean> {
    if (!this.baseUrl) return this.setHealth(false);
    if (this.probedAt !== null && this.now() - this.probedAt < HEALTH_TTL_MS) {
      return this.healthy;
    }
    try {
      const response = await this.doFetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });
      return this.setHealth(response.ok);
    } catch {
      return this.setHealth(false);
    }
  }

  async parse(input: {
    file: Uint8Array;
    fileName: string;
    password?: string;
    financialYear: string;
  }): Promise<CasResponse> {
    if (!this.baseUrl) {
      this.setHealth(false);
      return error(
        'SERVICE_UNAVAILABLE',
        'CAS_SERVICE_URL is not set, so statements cannot be read. Enter the capital gains by hand.',
      );
    }

    // Re-wrapped because a Blob part has to be backed by an ArrayBuffer, and a
    // Uint8Array may be backed by a SharedArrayBuffer as far as the types know.
    const bytes = new Uint8Array(input.file);
    const body = new FormData();
    body.append('file', new Blob([bytes], { type: 'application/pdf' }), input.fileName);
    body.append('financial_year', input.financialYear);
    if (input.password) body.append('password', input.password);

    let response: Response;
    try {
      response = await this.doFetch(`${this.baseUrl}/parse`, {
        method: 'POST',
        headers: { 'X-CAS-Token': this.token },
        body,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (cause) {
      this.setHealth(false);
      return error('SERVICE_UNAVAILABLE', unreachable(cause, this.timeoutMs));
    }

    if (response.status === 401 || response.status === 403) {
      // Reachable but useless to us, which is the same thing to the uploader.
      this.setHealth(false);
      return error(
        'SERVICE_UNAVAILABLE',
        'The statement service rejected our token. Check CAS_SERVICE_TOKEN on both sides.',
      );
    }

    this.setHealth(response.status < 500);
    const payload = camelize(await readJson(response));

    const failure = asParseError(payload);
    if (failure) return failure;

    if (!response.ok) {
      return error(
        response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'PARSE_FAILED',
        `The statement service answered ${response.status}.`,
      );
    }

    const result = asParseResult(payload);
    if (result) return result;

    return error('PARSE_FAILED', 'The statement service returned a body we do not recognise.');
  }

  private setHealth(state: boolean): boolean {
    this.healthy = state;
    this.probedAt = this.now();
    return state;
  }
}

/* ─────────────────────────── helpers ─────────────────────────── */

const error = (code: CasParseError['code'], message: string): CasParseError => ({
  ok: false,
  code,
  message,
});

function unreachable(cause: unknown, timeoutMs: number): string {
  const name = cause instanceof Error ? cause.name : '';
  if (name === 'TimeoutError' || name === 'AbortError') {
    return `The statement service did not answer within ${Math.round(timeoutMs / 1000)} seconds.`;
  }
  return 'The statement service could not be reached. Enter the capital gains by hand.';
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toCamel = (key: string): string => key.replace(/_(.)/g, (_, c: string) => c.toUpperCase());

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize);
  if (!isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) out[toCamel(key)] = camelize(inner);
  return out;
}

const ERROR_CODES: ReadonlyArray<CasParseError['code']> = [
  'BAD_PASSWORD',
  'UNSUPPORTED_FORMAT',
  'SERVICE_UNAVAILABLE',
  'PARSE_FAILED',
];

function asParseError(value: unknown): CasParseError | null {
  if (!isRecord(value) || value.ok !== false) return null;
  const code = ERROR_CODES.find((candidate) => candidate === value.code);
  if (!code) return null;
  return error(code, typeof value.message === 'string' ? value.message : 'The statement could not be read.');
}

/**
 * The service owns the shape; this checks the parts the app dereferences before
 * trusting the rest of it.
 */
function asParseResult(value: unknown): CasParseResult | null {
  if (!isRecord(value) || value.ok !== true) return null;
  if (!isRecord(value.statementPeriod) || !isRecord(value.investor)) return null;
  if (!isRecord(value.summary) || !isRecord(value.summary.quarterly)) return null;
  if (!Array.isArray(value.folios) || !Array.isArray(value.gains)) return null;
  if (!Array.isArray(value.warnings)) return null;
  return value as unknown as CasParseResult;
}
