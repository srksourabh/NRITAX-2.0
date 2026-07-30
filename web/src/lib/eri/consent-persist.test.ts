import { beforeEach, describe, expect, it } from 'vitest';

import {
  createMemoryEriConsentStore,
  loadEriConsentId,
  persistEriConsentId,
  resetMemoryEriConsentStore,
} from '@/lib/eri/consent-persist';
import { createMockProvider, resetMockState } from '@/lib/eri/mock';

describe('persistEriConsentId / loadEriConsentId', () => {
  beforeEach(() => {
    resetMemoryEriConsentStore();
    resetMockState();
  });

  it('round-trips a mock provider consent id through the filing store', async () => {
    const store = createMemoryEriConsentStore();
    const provider = createMockProvider();
    const consent = await provider.requestConsent({
      pan: 'ABCDE1234F',
      assessmentYear: '2026-27',
      name: 'Demo',
      dateOfBirth: '1990-01-15',
      email: 'demo@example.com',
      mobile: '9876543210',
      returnUrl: 'http://localhost/filing',
    });

    const saved = await persistEriConsentId('filing-1', consent.consentId, store);
    expect(saved.ok).toBe(true);

    const loaded = await loadEriConsentId('filing-1', store);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.consentId).toBe(consent.consentId);

    const held = await provider.getConsent(loaded.consentId!);
    expect(held.consentId).toBe(consent.consentId);
  });

  it('soft-fails persist when the store throws', async () => {
    const store = {
      async save() {
        throw new Error('db down');
      },
      async get() {
        return null;
      },
    };
    const result = await persistEriConsentId('filing-1', 'CONSENT-1', store);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.warning).toMatch(/Could not save ERI consent/i);
  });
});
