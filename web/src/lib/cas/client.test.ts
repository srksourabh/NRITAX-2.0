import { describe, expect, it, vi } from 'vitest';

import { createCasClient, type CasClientOptions } from './client';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

const input = {
  file: PDF,
  fileName: 'cas.pdf',
  password: 'ABCDE1234F',
  financialYear: '2025-26',
};

function client(fetchImpl: typeof globalThis.fetch, options: CasClientOptions = {}) {
  return createCasClient({
    baseUrl: 'http://cas.test',
    token: 'dev-cas-token',
    fetch: fetchImpl,
    ...options,
  });
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** A minimal service answer, in the snake_case the service actually returns. */
const serviceResult = {
  ok: true,
  source: 'CAMS',
  statement_period: { from: '2015-04-01', to: '2026-03-31' },
  investor: { name: 'A Taxpayer', pan: 'ABCDE1234F' },
  folios: [{ folio: '12345678/90', pan_kyc: 'OK', schemes: [] }],
  gains: [
    {
      isin: 'INF090I01239',
      scheme_name: 'Specimen Equity Fund - Growth',
      asset_class: 'EQUITY',
      purchase_date: '2016-07-01',
      sale_date: '2025-08-20',
      units: 100,
      purchase_value: 10000,
      sale_value: 40000,
      fmv_31_jan_2018: 25000,
      cost_used: 25000,
      expenses: 0,
      stt: 8,
      gain: 15000,
      term: 'LONG',
      quarter: 2,
    },
  ],
  summary: {
    short_term_111A: 0,
    short_term_other: 0,
    long_term_112A: 15000,
    long_term_other: 0,
    schedule_112A: [
      {
        isin: 'INF090I01239',
        scrip_name: 'Specimen Equity Fund - Growth',
        acquired_before_31_jan_2018: true,
        units: 100,
        sale_price_per_unit: 400,
        sale_value: 40000,
        cost_of_acquisition: 10000,
        fmv_per_unit_31_jan_2018: 250,
        total_fmv: 25000,
        expenses: 0,
      },
    ],
    quarterly: {
      short_term_15: [0, 0, 0, 0, 0],
      short_term_20: [0, 0, 0, 0, 0],
      short_term_slab: [0, 0, 0, 0, 0],
      long_term_10: [0, 0, 0, 0, 0],
      long_term_125: [0, 15000, 0, 0, 0],
      long_term_20: [0, 0, 0, 0, 0],
    },
  },
  warnings: [],
};

describe('CasClient', () => {
  it('reports a service that is down rather than throwing', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).parse(input);

    expect(response.ok).toBe(false);
    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('SERVICE_UNAVAILABLE');
    expect(response.message).toContain('could not be reached');
  });

  it('reports a timeout as unavailable', async () => {
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const fetchImpl = vi.fn(async () => {
      throw timeout;
    });

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).parse(input);

    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('SERVICE_UNAVAILABLE');
    expect(response.message).toContain('60 seconds');
  });

  it('does not call the service when CAS_SERVICE_URL is unset', async () => {
    const fetchImpl = vi.fn();

    const cas = createCasClient({ baseUrl: '', token: '', fetch: fetchImpl as unknown as typeof globalThis.fetch });
    const response = await cas.parse(input);

    expect(fetchImpl).not.toHaveBeenCalled();
    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('SERVICE_UNAVAILABLE');
    expect(cas.available).toBe(false);
  });

  it('converts the service answer to camelCase', async () => {
    const fetchImpl = vi.fn(async () => json(serviceResult));

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).parse(input);

    if (!response.ok) throw new Error(response.message);
    expect(response.statementPeriod.from).toBe('2015-04-01');
    expect(response.folios[0].panKyc).toBe('OK');
    expect(response.gains[0].fmv31Jan2018).toBe(25000);
    expect(response.gains[0].assetClass).toBe('EQUITY');
    expect(response.summary.longTerm112A).toBe(15000);
    expect(response.summary.shortTerm111A).toBe(0);
    expect(response.summary.schedule112A[0].fmvPerUnit31Jan2018).toBe(250);
    expect(response.summary.quarterly.longTerm125[1]).toBe(15000);
  });

  it('sends the statement as multipart with the service token', async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const body = init.body as FormData;
      expect(body.get('financial_year')).toBe('2025-26');
      expect(body.get('password')).toBe('ABCDE1234F');
      expect(body.get('file')).toBeInstanceOf(Blob);
      expect((init.headers as Record<string, string>)['X-CAS-Token']).toBe('dev-cas-token');
      return json(serviceResult);
    });

    await client(fetchImpl as unknown as typeof globalThis.fetch).parse(input);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('passes a wrong password through as BAD_PASSWORD', async () => {
    const fetchImpl = vi.fn(async () =>
      json({ ok: false, code: 'BAD_PASSWORD', message: 'The statement did not open.' }, 400),
    );

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).parse(input);

    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('BAD_PASSWORD');
  });

  it('treats a rejected token as unavailable, not as a bad statement', async () => {
    const fetchImpl = vi.fn(async () =>
      json({ ok: false, code: 'SERVICE_UNAVAILABLE', message: 'no' }, 401),
    );

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).parse(input);

    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('SERVICE_UNAVAILABLE');
    expect(response.message).toContain('CAS_SERVICE_TOKEN');
  });

  it('rejects a body that does not have the shape we rely on', async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true, source: 'CAMS' }));

    const response = await client(fetchImpl as unknown as typeof globalThis.fetch).parse(input);

    if (response.ok) throw new Error('expected a failure');
    expect(response.code).toBe('PARSE_FAILED');
  });

  it('caches the health probe and re-probes once it goes stale', async () => {
    let clock = 1_000;
    const fetchImpl = vi.fn(async () => json({ status: 'ok', casparser_version: '1.3.0' }));

    const cas = client(fetchImpl as unknown as typeof globalThis.fetch, { now: () => clock });

    expect(await cas.checkHealth()).toBe(true);
    expect(cas.available).toBe(true);

    clock += 10_000;
    expect(await cas.checkHealth()).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    clock += 30_000;
    expect(await cas.checkHealth()).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('marks the service unavailable when the health probe fails', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });

    const cas = client(fetchImpl as unknown as typeof globalThis.fetch);

    expect(await cas.checkHealth()).toBe(false);
    expect(cas.available).toBe(false);
  });
});
