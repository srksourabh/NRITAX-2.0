import { describe, expect, it } from 'vitest';

import { createQuickoReferProvider, quickoReferUrl } from '@/lib/eri/quicko-refer';
import { ASSESSMENT_YEAR } from '@/lib/itr/types';

describe('quicko refer provider', () => {
  it('builds the Clique refer URL', () => {
    expect(quickoReferUrl('abc123')).toBe('https://it.quicko.com?affiliate_id=abc123');
  });

  it('requires affiliate id', async () => {
    const provider = createQuickoReferProvider({ provider: 'quicko' });
    await expect(
      provider.requestConsent({
        pan: 'ABCDE1234F',
        assessmentYear: ASSESSMENT_YEAR,
        name: 'Test',
        dateOfBirth: '1990-01-01',
        email: 'a@b.co',
      }),
    ).rejects.toMatchObject({ code: 'ERI_CONFIG' });
  });

  it('returns a Quicko redirect on consent and upload', async () => {
    const provider = createQuickoReferProvider({
      provider: 'quicko',
      quickoAffiliateId: 'partner-1',
    });
    expect(provider.live).toBe(true);
    const consent = await provider.requestConsent({
      pan: 'ABCDE1234F',
      assessmentYear: ASSESSMENT_YEAR,
      name: 'Test',
      dateOfBirth: '1990-01-01',
      email: 'a@b.co',
    });
    expect(consent.status).toBe('granted');
    expect(consent.redirectUrl).toContain('affiliate_id=partner-1');

    const upload = await provider.uploadReturn({
      pan: 'ABCDE1234F',
      assessmentYear: ASSESSMENT_YEAR,
      form: 'ITR2',
      consentId: consent.consentId,
      json: { ITR: {} },
    });
    expect(upload.status).toBe('pending_verification');
    expect(upload.verificationRedirectUrl).toContain('it.quicko.com');
  });
});
