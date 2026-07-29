import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearSandboxTokenCache,
  createSandboxClient,
  type SandboxClientOptions,
} from './client';

afterEach(() => {
  clearSandboxTokenCache();
});

function client(fetchImpl: typeof globalThis.fetch, options: SandboxClientOptions = {}) {
  return createSandboxClient({
    baseUrl: 'https://sandbox.test',
    apiKey: 'key_test',
    apiSecret: 'secret_test',
    fetch: fetchImpl,
    ...options,
  });
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('SandboxClient', () => {
  it('does not call Sandbox when credentials are missing', async () => {
    const fetchImpl = vi.fn();

    const sandbox = createSandboxClient({
      baseUrl: '',
      apiKey: '',
      apiSecret: '',
      fetch: fetchImpl as unknown as typeof globalThis.fetch,
    });
    const response = await sandbox.lookupIfsc('HDFC0001234');

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sandbox.available).toBe(false);
    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('UNAVAILABLE');
    expect(response.message).toMatch(/unavailable/i);
    expect(response.message).toMatch(/by hand/i);
  });

  it('authenticates then looks up IFSC, sending the raw access token', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith('/authenticate')) {
        expect((init?.headers as Record<string, string>)['x-api-key']).toBe('key_test');
        expect((init?.headers as Record<string, string>)['x-api-secret']).toBe('secret_test');
        expect((init?.headers as Record<string, string>)['x-api-version']).toBe('1.0');
        return json({
          code: 200,
          data: { access_token: 'tok_live_abc' },
        });
      }

      expect(String(url)).toContain('/bank/HDFC0001234');
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe('tok_live_abc');
      expect(headers.Authorization).not.toMatch(/^Bearer/i);
      expect(headers['x-api-key']).toBe('key_test');
      expect(headers['x-api-version']).toBe('1.0');
      expect(headers['x-accept-cache']).toBe('true');

      return json({
        BANK: 'HDFC Bank',
        BRANCH: 'PARK STREET',
        CITY: 'JAIPUR',
        STATE: 'RAJASTHAN',
        IFSC: 'HDFC0001234',
        NEFT: true,
        RTGS: true,
      });
    });

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch, {
      acceptCache: true,
    }).lookupIfsc(
      'hdfc0001234',
    );

    if (!response.ok) throw new Error(response.message);
    expect(response.bank).toBe('HDFC Bank');
    expect(response.branch).toBe('PARK STREET');
    expect(response.ifsc).toBe('HDFC0001234');
    expect(response.neft).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns a soft AUTH_FAILED when authenticate fails', async () => {
    const fetchImpl = vi.fn(async () =>
      json({ code: 401, message: 'Invalid API Key' }, 401),
    );

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).lookupIfsc(
      'HDFC0001234',
    );

    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('AUTH_FAILED');
    expect(response.message).toMatch(/authentication failed|ERI_API/i);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('re-authenticates once after a 401 on a later call', async () => {
    let authCalls = 0;
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).endsWith('/authenticate')) {
        authCalls += 1;
        return json({ data: { access_token: `tok_${authCalls}` } });
      }
      if (authCalls === 1) {
        return json({ message: 'expired' }, 401);
      }
      return json({
        BANK: 'HDFC Bank',
        BRANCH: 'PARK STREET',
        IFSC: 'HDFC0001234',
      });
    });

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).lookupIfsc(
      'HDFC0001234',
    );

    if (!response.ok) throw new Error(response.message);
    expect(response.bank).toBe('HDFC Bank');
    expect(authCalls).toBe(2);
  });

  it('soft-fails PAN verify when the KYC body is empty', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).endsWith('/authenticate')) {
        return json({ data: { access_token: 'tok' } });
      }
      return json({ code: ',' });
    });

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).verifyPan({
      pan: 'ABCDE1234F',
      name: 'Ada Lovelace',
      dateOfBirth: '1982-03-04',
    });

    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('UNAVAILABLE');
    expect(response.message).toMatch(/KYC product may not be enabled/i);
  });

  it('soft-fails DigiLocker init when the KYC body is empty', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).endsWith('/authenticate')) {
        return json({ data: { access_token: 'tok' } });
      }
      return new Response('{ "code": , "timestamp": 1, "transaction_id": "t" }', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch, {
      digilockerMock: false,
    }).initDigilocker({
      redirectUrl: 'https://example.com/filing',
    });

    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('UNAVAILABLE');
    expect(response.message).toMatch(/not enabled|DIGILOCKER_MOCK|by hand/i);
  });

  it('rejects non-HTTPS DigiLocker redirects when mock is off', async () => {
    const fetchImpl = vi.fn();
    const response = await client(fetchImpl as unknown as typeof globalThis.fetch, {
      digilockerMock: false,
    }).initDigilocker({
      redirectUrl: 'http://localhost:3000/filing',
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('BAD_REQUEST');
    expect(response.message).toMatch(/HTTPS/i);
  });

  it('runs DigiLocker mock consent without calling Sandbox', async () => {
    const fetchImpl = vi.fn();
    const sandbox = client(fetchImpl as unknown as typeof globalThis.fetch, {
      digilockerMock: true,
    });

    const init = await sandbox.initDigilocker({
      redirectUrl: 'http://localhost:3000/filing',
    });
    if (!init.ok) throw new Error(init.message);
    expect(init.sessionId).toMatch(/^mock_/);
    expect(init.authorizationUrl).toMatch(/digilocker_mock=consent/);
    expect(fetchImpl).not.toHaveBeenCalled();

    const pending = await sandbox.digilockerStatus(init.sessionId);
    if (!pending.ok) throw new Error(pending.message);
    expect(pending.status).toBe('created');
  });
});
