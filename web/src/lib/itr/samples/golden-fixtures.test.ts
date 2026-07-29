import { describe, expect, it } from 'vitest';

import { goldenFixtures, pilotGateNotes, runGoldenGate } from '@/lib/itr/samples/golden-fixtures';

describe('golden fixtures pilot gate', () => {
  it('provides at least 25 fixtures', () => {
    expect(goldenFixtures().length).toBeGreaterThanOrEqual(25);
  });

  it('keeps residential status labels consistent', () => {
    for (const fx of goldenFixtures()) {
      expect(fx.data.meta.residentialStatus).toBe(fx.expectStatus);
    }
  });

  it('runs staged validation across the suite without throwing', () => {
    const gate = runGoldenGate();
    expect(gate.total).toBeGreaterThanOrEqual(25);
    expect(gate.residencyOk).toBe(gate.total);
    expect(gate.stagedRan).toBe(gate.total);
  });

  it('exposes NRI workflow pilot notes', () => {
    expect(pilotGateNotes('NRI')).toContain('dtaa');
    expect(pilotGateNotes('RES')).toContain('fa');
  });
});
