import { describe, expect, it } from 'vitest';

import {
  dtaaEvidenceRequired,
  ftcForm67Needed,
  scheduleFaRequired,
  scheduleFsiVisible,
} from '@/lib/itr/nri-workflows';

describe('dtaaEvidenceRequired', () => {
  it('requires evidence for NRI and NOR', () => {
    expect(dtaaEvidenceRequired('NRI')).toBe(true);
    expect(dtaaEvidenceRequired('NOR')).toBe(true);
  });

  it('does not require evidence for ordinary residents', () => {
    expect(dtaaEvidenceRequired('RES')).toBe(false);
  });
});

describe('scheduleFaRequired', () => {
  it('applies to RES and NOR', () => {
    expect(scheduleFaRequired('RES')).toBe(true);
    expect(scheduleFaRequired('NOR')).toBe(true);
  });

  it('does not apply to NRI', () => {
    expect(scheduleFaRequired('NRI')).toBe(false);
  });
});

describe('scheduleFsiVisible', () => {
  it('is visible for all residential statuses', () => {
    expect(scheduleFsiVisible('NRI')).toBe(true);
    expect(scheduleFsiVisible('NOR')).toBe(true);
    expect(scheduleFsiVisible('RES')).toBe(true);
  });
});

describe('ftcForm67Needed', () => {
  it('is needed when foreign tax was paid', () => {
    expect(ftcForm67Needed({ hasForeignTaxPaid: true })).toBe(true);
  });

  it('is not needed without foreign tax paid', () => {
    expect(ftcForm67Needed({ hasForeignTaxPaid: false })).toBe(false);
  });
});
