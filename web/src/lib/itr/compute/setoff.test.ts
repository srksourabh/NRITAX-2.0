import { describe, expect, it } from 'vitest';

import type { SetoffRow } from '@/lib/itr/types';

import { runSetoff, type SetoffInput } from './setoff';

function input(over: Partial<SetoffInput>): SetoffInput {
  return { form: 'ITR2', regime: 'old', income: {}, ...over };
}

function row<T extends SetoffRow>(rows: readonly T[], id: string): T {
  const found = rows.find((r) => r.id === id);
  if (!found) throw new Error(`no row ${id} in the working`);
  return found;
}

describe('Schedule CYLA — current year losses', () => {
  it('caps the house property set-off at 2,00,000 under section 71(3A)', () => {
    const result = runSetoff(input({ regime: 'old', income: { sal: 1000000, hp: -500000 } }));

    expect(row(result.cyla, 'sal').hpSetoff).toBe(200000);
    expect(row(result.cyla, 'sal').remaining).toBe(800000);
    expect(result.housePropertySpill).toBe(300000);
    expect(result.housePropertyUnused).toBe(0);
  });

  it('carries forward both the excess over the ceiling and what no head could absorb', () => {
    const result = runSetoff(input({ regime: 'old', income: { sal: 50000, hp: -500000 } }));

    expect(row(result.cyla, 'sal').hpSetoff).toBe(50000);
    expect(result.housePropertySpill).toBe(300000);
    expect(result.housePropertyUnused).toBe(150000);
  });

  it('sets off no house property loss at all under the new regime', () => {
    const result = runSetoff(input({ regime: 'new', income: { sal: 1000000, hp: -500000 } }));

    expect(row(result.cyla, 'sal').hpSetoff).toBe(0);
    expect(row(result.cyla, 'sal').remaining).toBe(1000000);
    expect(result.housePropertySpill).toBe(500000);
    expect(result.housePropertyUnused).toBe(0);
  });

  it('puts an other sources loss against race horse profit before any other head', () => {
    const result = runSetoff(input({ income: { sal: 500000, osnorm: -50000, osrace: 30000 } }));

    expect(row(result.cyla, 'osrace').osSetoff).toBe(30000);
    expect(row(result.cyla, 'osrace').remaining).toBe(0);
    expect(row(result.cyla, 'sal').osSetoff).toBe(20000);
    expect(result.otherSourcesUnused).toBe(0);
  });

  it('keeps a business loss away from salary but lets it reach capital gains', () => {
    const result = runSetoff(
      input({ form: 'ITR3', income: { sal: 500000, stcg15: 60000, bp: -100000 } }),
    );

    expect(row(result.cyla, 'sal').businessSetoff).toBe(0);
    expect(row(result.cyla, 'stcg15').businessSetoff).toBe(60000);
    expect(result.businessUnused).toBe(40000);
  });

  it('leaves speculative and specified business losses in their own heads', () => {
    const result = runSetoff(
      input({ form: 'ITR3', income: { sal: 500000, bpspec: -75000, bpspecified: -40000 } }),
    );

    expect(row(result.cyla, 'bpspec').income).toBe(0);
    expect(row(result.cyla, 'sal').remaining).toBe(500000);
    expect(result.speculativeUnused).toBe(75000);
    expect(result.specifiedUnused).toBe(40000);
  });

  it('omits the three business heads from an ITR-2 working', () => {
    const itr2 = runSetoff(input({ income: { sal: 100000 } }));
    const itr3 = runSetoff(input({ form: 'ITR3', income: { sal: 100000 } }));

    expect(itr2.cyla.map((r) => r.id)).not.toContain('bp');
    expect(itr3.cyla.map((r) => r.id)).toContain('bp');
    expect(itr3.cyla).toHaveLength(itr2.cyla.length + 3);
  });
});

describe('Schedule BFLA — brought forward losses', () => {
  it('lets a brought forward short term capital loss absorb a long term gain', () => {
    const result = runSetoff(
      input({ income: { ltcg125: 80000 }, broughtForward: { shortTerm: 100000 } }),
    );

    expect(row(result.bfla, 'ltcg125').broughtForwardSetoff).toBe(80000);
    expect(row(result.bfla, 'ltcg125').remaining).toBe(0);
    expect(result.broughtForwardRemaining.shortTerm).toBe(20000);
  });

  it('keeps a brought forward long term capital loss away from a short term gain', () => {
    const result = runSetoff(
      input({ income: { stcg15: 80000 }, broughtForward: { longTerm: 100000 } }),
    );

    expect(row(result.bfla, 'stcg15').broughtForwardSetoff).toBe(0);
    expect(result.broughtForwardRemaining.longTerm).toBe(100000);
  });

  it('confines a brought forward house property loss to house property', () => {
    const result = runSetoff(
      input({ income: { sal: 400000, hp: 90000 }, broughtForward: { houseProperty: 150000 } }),
    );

    expect(row(result.bfla, 'hp').broughtForwardSetoff).toBe(90000);
    expect(row(result.bfla, 'sal').broughtForwardSetoff).toBe(0);
    expect(result.broughtForwardRemaining.houseProperty).toBe(60000);
  });

  it('confines a brought forward race horse loss to race horses', () => {
    const result = runSetoff(
      input({ income: { osnorm: 100000, osrace: 20000 }, broughtForward: { raceHorses: 50000 } }),
    );

    expect(row(result.bfla, 'osrace').broughtForwardSetoff).toBe(20000);
    expect(row(result.bfla, 'osnorm').broughtForwardSetoff).toBe(0);
    expect(result.broughtForwardRemaining.raceHorses).toBe(30000);
  });

  it('sets unabsorbed depreciation against every head other than salary', () => {
    const result = runSetoff(
      input({
        form: 'ITR3',
        income: { sal: 300000, osnorm: 120000 },
        broughtForward: { unabsorbedDepreciation: 200000 },
      }),
    );

    expect(row(result.bfla, 'sal').broughtForwardSetoff).toBe(0);
    expect(row(result.bfla, 'osnorm').broughtForwardSetoff).toBe(120000);
    expect(result.broughtForwardRemaining.unabsorbedDepreciation).toBe(80000);
  });

  it('spends a brought forward speculative loss before a plain business loss', () => {
    const result = runSetoff(
      input({
        form: 'ITR3',
        income: { bpspec: 100000 },
        broughtForward: { speculative: 60000, business: 90000 },
      }),
    );

    expect(row(result.bfla, 'bpspec').broughtForwardSetoff).toBe(100000);
    expect(result.broughtForwardRemaining.speculative).toBe(0);
    expect(result.broughtForwardRemaining.business).toBe(50000);
  });

  it('starts BFLA from the income that survived CYLA', () => {
    const result = runSetoff(
      input({
        regime: 'old',
        income: { sal: 500000, hp: -150000 },
        broughtForward: { unabsorbedDepreciation: 0 },
      }),
    );

    expect(row(result.bfla, 'sal').income).toBe(350000);
  });
});
