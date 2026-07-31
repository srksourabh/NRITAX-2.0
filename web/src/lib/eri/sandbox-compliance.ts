/**
 * Sandbox.co.in Income Tax Compliance ERI adapter.
 *
 * Sandbox proxies ITD ERI APIs under /it/compliance/eri/*. You still need:
 *   - Sandbox API key + secret (already used for KYC)
 *   - Your own ITD ERI user id + password (ERI_USER_ID / ERI_PASSWORD)
 *   - A real Software ID (ERI_SOFTWARE_ID, not SW00000000)
 *   - Income Tax Compliance product enabled on the Sandbox account
 *
 * Without those, this provider stays non-live and returns clear config errors.
 * Add-client OTP UI is not wired yet; consent assumes the PAN is already an
 * ERI client (or you add them in the ERI portal) before upload.
 */

import { createSandboxClient } from '@/lib/sandbox/client';
import { EriError } from '@/lib/eri/types';
import { PLACEHOLDER_SOFTWARE_ID } from '@/lib/itr/validate';
import type {
  ConsentRequest,
  ConsentResult,
  EriConfig,
  EriProvider,
  FilingStatus,
  PrefillPayload,
  UploadRequest,
  UploadResult,
} from '@/lib/eri/types';

const API_VERSION = '1.0';
const TIMEOUT_MS = 45_000;

const CONFIG_HINT =
  'Sandbox ERI filing needs ERI_USER_ID + ERI_PASSWORD (ITD e-Return Intermediary login), ' +
  'a real ERI_SOFTWARE_ID, and Income Tax Compliance enabled on your Sandbox account. ' +
  'A Sandbox API key alone cannot file ITRs. Register at incometax.gov.in (ERI), then ask Sandbox support to enable Compliance APIs.';

export function sandboxEriReady(config: EriConfig): boolean {
  const softwareId = config.softwareId?.trim() ?? '';
  return Boolean(
    config.baseUrl?.trim() &&
      config.apiKey?.trim() &&
      config.apiSecret?.trim() &&
      config.eriUserId?.trim() &&
      config.eriPassword?.trim() &&
      softwareId &&
      softwareId !== PLACEHOLDER_SOFTWARE_ID,
  );
}

interface EriTokenCache {
  key: string;
  accessToken: string;
  expiresAt: number;
}

let eriToken: EriTokenCache | null = null;

/** Test helper. */
export function clearSandboxEriTokenCache(): void {
  eriToken = null;
}

function rec(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

async function sandboxAccessToken(config: EriConfig): Promise<string> {
  const client = createSandboxClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
  });
  const ctx = await client.authContext();
  if (!ctx.ok) {
    throw new EriError(ctx.message || CONFIG_HINT, ctx.code || 'ERI_AUTH', true);
  }
  return ctx.accessToken;
}

async function eriLogin(config: EriConfig): Promise<string> {
  if (!sandboxEriReady(config)) {
    throw new EriError(CONFIG_HINT, 'ERI_CONFIG');
  }
  const cacheKey = `${config.baseUrl}|${config.eriUserId}`;
  const now = Date.now();
  if (eriToken && eriToken.key === cacheKey && eriToken.expiresAt > now) {
    return eriToken.accessToken;
  }

  const apiToken = await sandboxAccessToken(config);
  const base = (config.baseUrl ?? '').replace(/\/+$/, '');
  let response: Response;
  try {
    response = await fetch(`${base}/it/compliance/eri/login`, {
      method: 'POST',
      headers: {
        authorization: apiToken,
        'x-api-key': config.apiKey!,
        'x-api-version': API_VERSION,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        user_id: config.eriUserId,
        password: config.eriPassword,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new EriError(
      `Sandbox ERI login could not be reached within ${TIMEOUT_MS / 1000}s.`,
      'ERI_UNREACHABLE',
      true,
    );
  }

  const text = await response.text().catch(() => '');
  const body = rec(JSON.parse(text || '{}'));
  const data = rec(body.data);
  const accessToken = str(data.access_token);
  if (!response.ok || !accessToken) {
    throw new EriError(
      str(body.message) ||
        str(rec(body.data).message) ||
        'Sandbox ERI login failed. Check ERI_USER_ID / ERI_PASSWORD and that Compliance is enabled.',
      str(body.code) || `HTTP_${response.status}`,
      response.status >= 500,
    );
  }

  eriToken = {
    key: cacheKey,
    accessToken,
    expiresAt: now + 50 * 60 * 1000,
  };
  return accessToken;
}

async function eriJson(
  config: EriConfig,
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown },
): Promise<Record<string, unknown>> {
  const eriAccess = await eriLogin(config);
  const base = (config.baseUrl ?? '').replace(/\/+$/, '');
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: init.method,
      headers: {
        authorization: eriAccess,
        'x-api-key': config.apiKey!,
        'x-api-version': API_VERSION,
        accept: 'application/json',
        ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new EriError(
      `Sandbox ERI could not be reached within ${TIMEOUT_MS / 1000}s.`,
      'ERI_UNREACHABLE',
      true,
    );
  }

  const text = await response.text().catch(() => '');
  let parsed: unknown = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = {};
  }
  const body = rec(parsed);
  if (!response.ok) {
    throw new EriError(
      str(body.message) ||
        str(rec(body.data).message) ||
        'Sandbox ERI refused the request.',
      str(body.code) || `HTTP_${response.status}`,
      response.status === 429 || response.status >= 500,
    );
  }
  return body;
}

function consentIdFor(pan: string): string {
  return `sandbox-eri:${pan.trim().toUpperCase()}`;
}

function panFromConsent(consentId: string): string | undefined {
  const m = /^sandbox-eri:([A-Z]{5}[0-9]{4}[A-Z])$/i.exec(consentId.trim());
  return m?.[1]?.toUpperCase();
}

export function createSandboxComplianceProvider(config: EriConfig): EriProvider {
  const ready = sandboxEriReady(config);

  return {
    name: 'sandbox',
    live: ready,

    async requestConsent(input: ConsentRequest): Promise<ConsentResult> {
      if (!ready) throw new EriError(CONFIG_HINT, 'ERI_CONFIG');
      await eriLogin(config);
      return {
        consentId: consentIdFor(input.pan),
        status: 'granted',
        message:
          'ERI session ready. Ensure this PAN is added as a client on your ERI account before submit. Add-client OTP UI ships next.',
      };
    },

    async getConsent(consentId: string): Promise<ConsentResult> {
      if (!ready) throw new EriError(CONFIG_HINT, 'ERI_CONFIG');
      const pan = panFromConsent(consentId);
      if (!pan) {
        throw new EriError('Unknown Sandbox ERI consent id.', 'ERI_BAD_REQUEST');
      }
      return {
        consentId,
        status: 'granted',
        message: 'ERI session consent is active for this PAN.',
      };
    },

    async fetchPrefill(): Promise<PrefillPayload> {
      throw new EriError(
        'Sandbox ERI prefill OTP flow is not wired in NRITAX yet. Upload ITD prefill JSON instead.',
        'ERI_UNSUPPORTED',
      );
    },

    async uploadReturn(input: UploadRequest): Promise<UploadResult> {
      if (!ready) throw new EriError(CONFIG_HINT, 'ERI_CONFIG');
      const pan = panFromConsent(input.consentId) ?? input.pan.trim().toUpperCase();
      const path = `/it/compliance/eri/tax-payers/${encodeURIComponent(pan)}/itrs/submit`;
      const body = await eriJson(config, path, {
        method: 'POST',
        body: input.json,
      });
      const data = rec(body.data);
      const ack =
        str(data.ack_num) ||
        str(data.acknowledgementNumber) ||
        str(data.acknowledgmentNumber) ||
        str(data.ackNo);
      return {
        status: ack ? 'accepted' : 'pending_verification',
        acknowledgementNumber: ack,
        filedAt: new Date().toISOString(),
        message: str(data.message) || str(body.message),
      };
    },

    async getFilingStatus(input): Promise<FilingStatus> {
      if (!ready) throw new EriError(CONFIG_HINT, 'ERI_CONFIG');
      const pan = input.pan.trim().toUpperCase();
      const path =
        `/it/compliance/eri/tax-payers/${encodeURIComponent(pan)}/itrs/` +
        `${encodeURIComponent(input.acknowledgementNumber)}/acknowledgement`;
      try {
        const body = await eriJson(config, path, { method: 'GET' });
        const data = rec(body.data);
        return {
          acknowledgementNumber: input.acknowledgementNumber,
          status: 'accepted',
          message: str(data.message) || str(body.message),
        };
      } catch (error) {
        if (error instanceof EriError) throw error;
        return {
          acknowledgementNumber: input.acknowledgementNumber,
          status: 'pending_verification',
          message: 'Could not refresh acknowledgement from Sandbox ERI.',
        };
      }
    },
  };
}
