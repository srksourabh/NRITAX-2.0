/**
 * HTTP client for services/portal-fetch.
 * Soft-fails when PORTAL_FETCH_URL is unset or the worker is down.
 */

import type {
  PortalFetchPublicJob,
  PortalFetchStartInput,
} from '@/lib/portal-fetch/types';

const DEFAULT_TIMEOUT_MS = 30_000;
const HEALTH_TIMEOUT_MS = 5_000;

export type PortalFetchClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string };

export interface PortalFetchClientOptions {
  baseUrl?: string;
  token?: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

export function createPortalFetchClient(
  options: PortalFetchClientOptions = {},
): PortalFetchClient {
  return new HttpPortalFetchClient(options);
}

export interface PortalFetchClient {
  checkHealth(): Promise<boolean>;
  start(
    input: PortalFetchStartInput & { userId: string },
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>>;
  get(jobId: string): Promise<PortalFetchClientResult<PortalFetchPublicJob>>;
  submitOtp(
    jobId: string,
    otp: string,
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>>;
  requestLiveAssist(
    jobId: string,
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>>;
  signalLiveDone(
    jobId: string,
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>>;
}

class HttpPortalFetchClient implements PortalFetchClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly doFetch: typeof globalThis.fetch;

  constructor(options: PortalFetchClientOptions) {
    this.baseUrl = (
      options.baseUrl ??
      process.env.PORTAL_FETCH_URL ??
      ''
    ).replace(/\/+$/, '');
    this.token = options.token ?? process.env.PORTAL_FETCH_SECRET ?? '';
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.doFetch = options.fetch ?? globalThis.fetch;
  }

  async checkHealth(): Promise<boolean> {
    if (!this.baseUrl) return false;
    try {
      const res = await this.doFetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async start(
    input: PortalFetchStartInput & { userId: string },
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>> {
    return this.json('POST', '/jobs', {
      pan: input.pan,
      name: input.name,
      dob: input.dob,
      password: input.password,
      mobile: input.mobile,
      assessmentYear: input.assessmentYear,
      formType: input.formType,
      politicallyExposed: input.politicallyExposed,
      filingType: input.filingType,
      consentFetch: input.consentFetch,
      consentLiability: input.consentLiability,
      userId: input.userId,
    });
  }

  async get(jobId: string): Promise<PortalFetchClientResult<PortalFetchPublicJob>> {
    return this.json('GET', `/jobs/${encodeURIComponent(jobId)}`);
  }

  async submitOtp(
    jobId: string,
    otp: string,
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>> {
    return this.json('POST', `/jobs/${encodeURIComponent(jobId)}/otp`, { otp });
  }

  async requestLiveAssist(
    jobId: string,
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>> {
    return this.json('POST', `/jobs/${encodeURIComponent(jobId)}/live`);
  }

  async signalLiveDone(
    jobId: string,
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>> {
    return this.json('POST', `/jobs/${encodeURIComponent(jobId)}/live-done`);
  }

  private async json(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<PortalFetchClientResult<PortalFetchPublicJob>> {
    if (!this.baseUrl) {
      return {
        ok: false,
        code: 'SERVICE_UNAVAILABLE',
        message:
          'Portal fetch is not configured. Download the prefill JSON from the e-Filing portal and upload it below.',
      };
    }
    if (!this.token) {
      return {
        ok: false,
        code: 'SERVICE_UNAVAILABLE',
        message:
          'Portal fetch secret is missing. Upload the prefill JSON manually.',
      };
    }

    try {
      const res = await this.doFetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Fetch-Token': this.token,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      const payload = (await res.json().catch(() => null)) as
        | (PortalFetchPublicJob & { ok?: boolean; message?: string })
        | null;

      if (!res.ok || !payload || payload.ok === false) {
        return {
          ok: false,
          code: String(res.status),
          message:
            payload?.message ||
            'Portal fetch failed. Upload the prefill JSON manually.',
        };
      }

      return { ok: true, data: payload };
    } catch {
      return {
        ok: false,
        code: 'SERVICE_UNAVAILABLE',
        message:
          'Portal fetch is unreachable. Upload the prefill JSON manually.',
      };
    }
  }
}
