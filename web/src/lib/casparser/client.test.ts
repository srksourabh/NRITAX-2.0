import { describe, expect, it, vi, beforeEach } from 'vitest';

import { createCasparserClient } from '@/lib/casparser/client';
import {
  clearMockCasparserDigilockerSessions,
  grantMockCasparserDigilockerConsent,
} from '@/lib/casparser/digilocker-mock';
import { mapPortfolioConnectToCasResult } from '@/lib/casparser/map-portfolio-connect';
import { mapSmartParseToCasResult } from '@/lib/casparser/map-smart-parse';
import { toDigilockerIdentity, normalizeDob } from '@/lib/casparser/map-identity';

describe('normalizeDob / toDigilockerIdentity', () => {
  it('normalises DD-MM-YYYY', () => {
    expect(normalizeDob('15-05-1990')).toBe('1990-05-15');
    expect(normalizeDob('1990-05-15')).toBe('1990-05-15');
  });

  it('maps DigiLocker result to DigilockerIdentity', () => {
    const id = toDigilockerIdentity({
      identity: {
        name: 'Aditya Kumar Sharma',
        dob: '1990-05-15',
        verified: { pan: 'AAAPA1234A', aadhaar: '123412341234' },
      },
      fetchedPan: { pan: 'AAAPA1234A', name: 'ADITYA KUMAR SHARMA', dob: '15-05-1990' },
    });
    expect(id.pan).toBe('AAAPA1234A');
    expect(id.fullName).toBe('ADITYA KUMAR SHARMA');
    expect(id.dateOfBirth).toBe('1990-05-15');
    expect(id.aadhaar).toBe('123412341234');
  });
});

describe('mapSmartParseToCasResult', () => {
  it('maps investor and warns about gains', () => {
    const result = mapSmartParseToCasResult(
      {
        meta: { cas_type: 'CDSL', statement_period: { from: '2025-04-01', to: '2026-03-31' } },
        investor: { name: 'Demo', pan: 'ABCDE1234F' },
        summary: { total_value: 100 },
        demat_accounts: [],
      },
      '2025-26',
    );
    expect(result?.investor.pan).toBe('ABCDE1234F');
    expect(result?.source).toBe('CDSL');
    expect(result?.gains).toEqual([]);
    expect(result?.warnings[0]).toMatch(/capital gains/i);
  });
});

describe('mapPortfolioConnectToCasResult', () => {
  it('maps investor_info from the widget', () => {
    const result = mapPortfolioConnectToCasResult({
      cas_type: 'CDSL',
      status: 'success',
      investor_info: { name: 'Demo', pan: 'ABCDE1234F' },
    });
    expect(result?.investor.pan).toBe('ABCDE1234F');
    expect(result?.source).toBe('CDSL');
  });
});

describe('createCasparserClient createAccessToken', () => {
  it('posts /v1/token with the API key', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: 'at_test_token',
          token_type: 'api_key',
          expires_in: 1800,
        }),
        { status: 200 },
      ),
    );
    const client = createCasparserClient({
      digilockerMock: false,
      apiKey: 'test-key',
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const token = await client.createAccessToken(30);
    expect(token.ok).toBe(true);
    if (!token.ok) return;
    expect(token.accessToken).toBe('at_test_token');
    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toContain('/v1/token');
  });
});

describe('createCasparserClient mock DigiLocker', () => {
  beforeEach(() => {
    clearMockCasparserDigilockerSessions();
  });

  it('starts mock session and returns specimen identity after consent', async () => {
    const client = createCasparserClient({
      digilockerMock: true,
      apiKey: '',
      fetch: vi.fn(),
    });
    const init = await client.digilockerStartSession({
      redirectUrl: 'http://localhost:3000/filing',
      consentPurpose: 'KYC for income tax return filing',
    });
    expect(init.ok).toBe(true);
    if (!init.ok) return;
    expect(init.mock).toBe(true);
    expect(init.sessionId.startsWith('cp_mock_')).toBe(true);

    const grant = grantMockCasparserDigilockerConsent(init.sessionId, 'succeeded');
    expect(grant.ok).toBe(true);

    const result = await client.digilockerResult({ sessionId: init.sessionId });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fetchedPan?.pan).toBe('AAAPA1234A');
  });

  it('soft-fails CDSL without API key', async () => {
    const client = createCasparserClient({ digilockerMock: true, apiKey: '', fetch: vi.fn() });
    const otp = await client.cdslFetchOtp({
      pan: 'ABCDE1234F',
      boId: '1234567890123456',
      dob: '1990-01-15',
    });
    expect(otp.ok).toBe(false);
    if (otp.ok) return;
    expect(otp.message).toMatch(/not configured|by hand|upload/i);
  });

  it('calls pan status with x-api-key when configured', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status: 'success',
          pan: 'ABCDE1234F',
          kyc_compliant: true,
          kyc_status: 'validated',
          kyc_mode: 'digilocker',
          active_kra: 'cvl',
        }),
        { status: 200 },
      ),
    );
    const client = createCasparserClient({
      digilockerMock: false,
      apiKey: 'test-key',
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const status = await client.panKycStatus('abcde1234f');
    expect(status.ok).toBe(true);
    if (!status.ok) return;
    expect(status.kycCompliant).toBe(true);
    expect(fetchImpl).toHaveBeenCalled();
    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((call[1].headers as Record<string, string>)['x-api-key']).toBe('test-key');
  });
});
