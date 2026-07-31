import { describe, expect, it } from 'vitest';

import {
  deriveFilingJourneyIndex,
  FILING_JOURNEY_STEPS,
  journeyTargetSchedule,
} from '@/components/filing/FilingJourneyMap';

describe('deriveFilingJourneyIndex', () => {
  it('pins choose and residency to Your details', () => {
    expect(
      deriveFilingJourneyIndex({
        step: 'choose',
        activeScheduleId: 'CG',
        hasValidationReport: false,
        canUpload: false,
        jsonDownloaded: false,
      }),
    ).toBe(0);
    expect(
      deriveFilingJourneyIndex({
        step: 'residency',
        activeScheduleId: 'GEN',
        hasValidationReport: false,
        canUpload: false,
        jsonDownloaded: false,
      }),
    ).toBe(0);
  });

  it('maps schedule groups while filing', () => {
    const base = {
      step: 'file' as const,
      hasValidationReport: false,
      canUpload: false,
      jsonDownloaded: false,
    };
    expect(deriveFilingJourneyIndex({ ...base, activeScheduleId: 'GEN' })).toBe(0);
    expect(deriveFilingJourneyIndex({ ...base, activeScheduleId: 'CG' })).toBe(1);
    expect(deriveFilingJourneyIndex({ ...base, activeScheduleId: 'VIA' })).toBe(2);
    expect(deriveFilingJourneyIndex({ ...base, activeScheduleId: 'TDS' })).toBe(3);
  });

  it('prioritises review / pay / file over schedule', () => {
    expect(
      deriveFilingJourneyIndex({
        step: 'file',
        activeScheduleId: 'CG',
        hasValidationReport: true,
        canUpload: false,
        jsonDownloaded: false,
      }),
    ).toBe(4);
    expect(
      deriveFilingJourneyIndex({
        step: 'file',
        activeScheduleId: 'CG',
        hasValidationReport: true,
        canUpload: true,
        jsonDownloaded: false,
      }),
    ).toBe(5);
    expect(
      deriveFilingJourneyIndex({
        step: 'file',
        activeScheduleId: 'CG',
        hasValidationReport: true,
        canUpload: true,
        jsonDownloaded: true,
      }),
    ).toBe(6);
  });

  it('keeps seven DS-aligned steps', () => {
    expect(FILING_JOURNEY_STEPS).toHaveLength(7);
    expect(journeyTargetSchedule(1)).toBe('CG');
    expect(journeyTargetSchedule(4)).toBeNull();
  });
});
