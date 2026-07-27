import { afterEach, describe, expect, it } from 'vitest';

import {
  clearMockDigilockerSessions,
  createMockDigilockerSession,
  digilockerMockEnabled,
  grantMockDigilockerConsent,
  isHttpsRedirect,
  mockFetchDigilockerDocument,
  mockDigilockerStatus,
} from './digilocker-mock';

afterEach(() => {
  clearMockDigilockerSessions();
});

describe('digilocker-mock', () => {
  it('detects DIGILOCKER_MOCK env flags', () => {
    expect(digilockerMockEnabled({ DIGILOCKER_MOCK: '1' })).toBe(true);
    expect(digilockerMockEnabled({ DIGILOCKER_MOCK: 'true' })).toBe(true);
    expect(digilockerMockEnabled({ DIGILOCKER_MOCK: '' })).toBe(false);
    expect(digilockerMockEnabled({})).toBe(false);
  });

  it('requires https for live DigiLocker redirects', () => {
    expect(isHttpsRedirect('https://app.example.com/filing')).toBe(true);
    expect(isHttpsRedirect('http://localhost:3000/filing')).toBe(false);
  });

  it('grants consent then yields mock PAN / Aadhaar identity', () => {
    const init = createMockDigilockerSession('http://localhost:3000/filing');
    expect(init.ok).toBe(true);
    if (!init.ok) return;

    expect(mockDigilockerStatus(init.sessionId)).toMatchObject({
      ok: true,
      status: 'created',
    });

    expect(grantMockDigilockerConsent(init.sessionId, 'succeeded')).toMatchObject({
      ok: true,
      status: 'succeeded',
    });

    const pan = mockFetchDigilockerDocument({
      sessionId: init.sessionId,
      docType: 'pan',
    });
    expect(pan.ok).toBe(true);
    if (!pan.ok) return;
    expect(pan.identity?.pan).toMatch(/^[A-Z]{5}\d{4}[A-Z]$/);

    const aadhaar = mockFetchDigilockerDocument({
      sessionId: init.sessionId,
      docType: 'aadhaar',
    });
    expect(aadhaar.ok).toBe(true);
    if (!aadhaar.ok) return;
    expect(aadhaar.identity?.aadhaar).toMatch(/^\d{12}$/);
  });
});
