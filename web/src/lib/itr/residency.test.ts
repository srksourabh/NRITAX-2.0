import { describe, expect, it } from 'vitest';

import { determineResidency, isBasicResident, isOrdinarilyResident } from '@/lib/itr/residency';

describe('isBasicResident', () => {
  it('treats 182+ days as resident', () => {
    expect(isBasicResident({ daysInPreviousYear: 182, daysInPrecedingFourYears: 0 })).toBe(true);
  });

  it('uses 60 + 365 alternate condition', () => {
    expect(isBasicResident({ daysInPreviousYear: 60, daysInPrecedingFourYears: 365 })).toBe(true);
    expect(isBasicResident({ daysInPreviousYear: 59, daysInPrecedingFourYears: 400 })).toBe(false);
  });

  it('raises the alternate threshold to 182 for employment abroad / crew', () => {
    expect(
      isBasicResident({
        daysInPreviousYear: 100,
        daysInPrecedingFourYears: 400,
        employmentAbroadOrCrew: true,
      }),
    ).toBe(false);
    expect(
      isBasicResident({
        daysInPreviousYear: 182,
        daysInPrecedingFourYears: 0,
        employmentAbroadOrCrew: true,
      }),
    ).toBe(true);
  });
});

describe('isOrdinarilyResident', () => {
  it('is RNOR when non-resident in 9 of 10 years', () => {
    expect(
      isOrdinarilyResident({
        daysInPreviousYear: 200,
        daysInPrecedingFourYears: 400,
        nonResidentYearsOfLast10: 9,
        daysInPrecedingSevenYears: 2000,
      }),
    ).toBe(false);
  });

  it('is RNOR when ≤729 days in preceding seven years', () => {
    expect(
      isOrdinarilyResident({
        daysInPreviousYear: 200,
        daysInPrecedingFourYears: 400,
        nonResidentYearsOfLast10: 2,
        daysInPrecedingSevenYears: 729,
      }),
    ).toBe(false);
  });

  it('is ordinarily resident otherwise', () => {
    expect(
      isOrdinarilyResident({
        daysInPreviousYear: 200,
        daysInPrecedingFourYears: 400,
        nonResidentYearsOfLast10: 2,
        daysInPrecedingSevenYears: 800,
      }),
    ).toBe(true);
  });
});

describe('determineResidency', () => {
  it('returns NRI when basic conditions fail', () => {
    const r = determineResidency({ daysInPreviousYear: 40, daysInPrecedingFourYears: 100 });
    expect(r.status).toBe('NRI');
    expect(r.basicResident).toBe(false);
  });

  it('returns NOR for a returning NRI with long foreign stay', () => {
    const r = determineResidency({
      daysInPreviousYear: 200,
      daysInPrecedingFourYears: 400,
      nonResidentYearsOfLast10: 9,
      daysInPrecedingSevenYears: 200,
    });
    expect(r.status).toBe('NOR');
  });

  it('returns RES for an ordinarily resident individual', () => {
    const r = determineResidency({
      daysInPreviousYear: 300,
      daysInPrecedingFourYears: 1000,
      nonResidentYearsOfLast10: 1,
      daysInPrecedingSevenYears: 1500,
    });
    expect(r.status).toBe('RES');
    expect(r.ordinarilyResident).toBe(true);
  });
});
