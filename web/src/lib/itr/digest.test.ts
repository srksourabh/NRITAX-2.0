import { describe, expect, it } from 'vitest';

import { buildReturnJson } from '@/lib/itr/build-json';
import { digestReturnJson, isPlaceholderSoftwareId, resolveSoftwareId } from '@/lib/itr/digest';
import { sampleNriPriyaItr2 } from '@/lib/itr/samples/nri-priya-itr2';
import { PLACEHOLDER_SOFTWARE_ID } from '@/lib/itr/validate';

describe('digest helpers', () => {
  it('detects placeholder software ids', () => {
    expect(isPlaceholderSoftwareId(PLACEHOLDER_SOFTWARE_ID)).toBe(true);
    expect(isPlaceholderSoftwareId('SW20000')).toBe(false);
  });

  it('resolves explicit software ids first', () => {
    expect(resolveSoftwareId('SW20000')).toBe('SW20000');
  });

  it('hashes stably regardless of key insertion order', () => {
    const a = digestReturnJson({ b: 1, a: 2 });
    const b = digestReturnJson({ a: 2, b: 1 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('buildReturnJson digest', () => {
  it('writes a Digest into CreationInfo and returns it on the result', () => {
    const built = buildReturnJson(sampleNriPriyaItr2(), {
      softwareId: 'SW20000',
      createdOn: '2026-07-29',
    });
    expect(built.softwareId).toBe('SW20000');
    expect(built.digest).toMatch(/^[a-f0-9]{64}$/);
    const itr2 = (built.json as { ITR: { ITR2: { CreationInfo: { Digest: string } } } }).ITR.ITR2;
    expect(itr2.CreationInfo.Digest).toBe(built.digest);
  });
});
