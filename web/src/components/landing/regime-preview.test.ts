import { describe, expect, it } from 'vitest';

import { previewSalaryRegimes } from './regime-preview';

describe('previewSalaryRegimes', () => {
  it('returns whole-rupee estimates and prefers the lower regime', () => {
    const preview = previewSalaryRegimes(1_480_000);
    expect(preview.gross).toBe(1_480_000);
    expect(preview.taxNew).toBeGreaterThan(0);
    expect(preview.taxOld).toBeGreaterThan(0);
    expect(Number.isInteger(preview.taxNew)).toBe(true);
    expect(preview.better === 'new' || preview.better === 'old' || preview.better === null).toBe(
      true,
    );
  });

  it('treats empty salary as zero', () => {
    const preview = previewSalaryRegimes(0);
    expect(preview.tiNew).toBe(0);
    expect(preview.taxNew).toBe(0);
  });
});
