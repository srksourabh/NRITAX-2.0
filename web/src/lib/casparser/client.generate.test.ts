import { describe, expect, it, vi } from 'vitest';

import { createCasparserClient } from '@/lib/casparser/client';
import {
  DEFAULT_CAS_FY,
  isIsoDate,
  resolveCasGenerateWindow,
} from '@/lib/casparser/generate-cas';

describe('resolveCasGenerateWindow', () => {
  it('defaults to FY 2025-26 for AY 2026-27', () => {
    expect(resolveCasGenerateWindow()).toEqual({
      fromDate: DEFAULT_CAS_FY.fromDate,
      toDate: DEFAULT_CAS_FY.toDate,
    });
  });

  it('accepts valid ISO overrides', () => {
    expect(
      resolveCasGenerateWindow({ fromDate: '2024-04-01', toDate: '2025-03-31' }),
    ).toEqual({ fromDate: '2024-04-01', toDate: '2025-03-31' });
  });

  it('rejects invalid dates', () => {
    expect(isIsoDate('2025-13-01')).toBe(false);
    expect(resolveCasGenerateWindow({ fromDate: 'not-a-date' }).fromDate).toBe(
      DEFAULT_CAS_FY.fromDate,
    );
  });
});

describe('createCasparserClient generateMutualFundCas', () => {
  it('returns UNAVAILABLE without API key', async () => {
    const client = createCasparserClient({
      digilockerMock: false,
      apiKey: '',
      fetch: vi.fn(),
    });
    const result = await client.generateMutualFundCas({
      email: 'investor@example.com',
      fromDate: DEFAULT_CAS_FY.fromDate,
      toDate: DEFAULT_CAS_FY.toDate,
      password: 'ABCDE1234F',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('UNAVAILABLE');
  });

  it('posts /v4/generate with FY window and PAN password', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ msg: 'CAS generation initiated' }), { status: 200 }),
    );
    const client = createCasparserClient({
      digilockerMock: false,
      apiKey: 'test-key',
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const result = await client.generateMutualFundCas({
      email: 'Investor@Example.com',
      fromDate: DEFAULT_CAS_FY.fromDate,
      toDate: DEFAULT_CAS_FY.toDate,
      password: 'ABCDE1234F',
      pan: 'abcde1234f',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message).toMatch(/CAS/i);

    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toContain('/v4/generate');
    const body = JSON.parse(String(call[1].body)) as Record<string, string>;
    expect(body.email).toBe('investor@example.com');
    expect(body.from_date).toBe('2025-04-01');
    expect(body.to_date).toBe('2026-03-31');
    expect(body.password).toBe('ABCDE1234F');
    expect(body.pan_no).toBe('ABCDE1234F');
  });

  it('rejects a missing email', async () => {
    const client = createCasparserClient({
      digilockerMock: false,
      apiKey: 'test-key',
      fetch: vi.fn(),
    });
    const result = await client.generateMutualFundCas({
      email: 'not-an-email',
      fromDate: DEFAULT_CAS_FY.fromDate,
      toDate: DEFAULT_CAS_FY.toDate,
      password: 'ABCDE1234F',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('BAD_REQUEST');
  });
});
