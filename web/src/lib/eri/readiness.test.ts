import { describe, expect, it } from 'vitest';

import { describeEriReadiness } from '@/lib/eri/readiness';
import { sandboxEriReady } from '@/lib/eri/sandbox-compliance';

describe('ERI readiness', () => {
  it('describes mock by default', () => {
    const r = describeEriReadiness({ provider: 'mock' });
    expect(r.mode).toBe('mock');
    expect(r.live).toBe(true);
  });

  it('flags missing Quicko affiliate', () => {
    const r = describeEriReadiness({ provider: 'quicko' });
    expect(r.live).toBe(false);
    expect(r.missing).toContain('QUICKO_AFFILIATE_ID');
  });

  it('lists Sandbox ERI gaps', () => {
    expect(
      sandboxEriReady({
        provider: 'sandbox',
        baseUrl: 'https://api.sandbox.co.in',
        apiKey: 'k',
        apiSecret: 's',
      }),
    ).toBe(false);
    const r = describeEriReadiness({
      provider: 'sandbox',
      baseUrl: 'https://api.sandbox.co.in',
      apiKey: 'k',
      apiSecret: 's',
      softwareId: 'SW00000000',
    });
    expect(r.live).toBe(false);
    expect(r.missing.some((m) => m.includes('ERI_USER_ID'))).toBe(true);
  });
});
