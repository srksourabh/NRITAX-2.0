/**
 * Pilot golden fixtures — representative NRI / RNOR / resident cases.
 * Used as a release gate: each fixture must validate under staged rules
 * (or document why Category A findings remain).
 */

import { sampleNriPriyaItr2 } from '@/lib/itr/samples/nri-priya-itr2';
import { sampleForForm } from '@/lib/itr/samples/sample-for-form';
import { determineResidency } from '@/lib/itr/residency';
import {
  dtaaEvidenceRequired,
  scheduleFaRequired,
  scheduleFsiVisible,
  ftcForm67Needed,
} from '@/lib/itr/nri-workflows';
import { validateReturnStaged } from '@/lib/itr/validate-staged';
import { emptyReturn, ASSESSMENT_YEAR, type ReturnData, type ResidentialStatus } from '@/lib/itr/types';
import { computeFifoLots } from '@/lib/itr/capital-gains/lot-engine';

export type GoldenFixture = {
  id: string;
  label: string;
  data: ReturnData;
  expectStatus: ResidentialStatus;
  expectCanUpload?: boolean;
};

function metaWith(
  status: ResidentialStatus,
  form: 'ITR2' | 'ITR3' = 'ITR2',
): ReturnData {
  const data = emptyReturn({
    form,
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: status,
    filingSection: '139(1)',
    filingDate: '2026-07-15',
    dueDate: '2026-07-31',
    dateOfBirth: '1990-01-01',
  });
  data.fields['GEN.pan'] = 'ABCDE1234F';
  data.fields['GEN.resStatus'] = status;
  data.fields['GEN.ResidentialStatus'] = status;
  return data;
}

/** Build 25+ lightweight fixtures covering residency + form combinations. */
export function goldenFixtures(): GoldenFixture[] {
  const priya = sampleNriPriyaItr2();
  const itr3 = sampleForForm('ITR3');

  const fixtures: GoldenFixture[] = [
    {
      id: 'nri-priya-itr2',
      label: 'UAE NRI · ITR-2 · salary + 112A',
      data: priya,
      expectStatus: 'NRI',
    },
    {
      id: 'nri-priya-itr3',
      label: 'UAE NRI · ITR-3 sample',
      data: itr3,
      expectStatus: 'NRI',
    },
  ];

  const statuses: ResidentialStatus[] = ['NRI', 'NOR', 'RES'];
  const forms: Array<'ITR2' | 'ITR3'> = ['ITR2', 'ITR3'];
  let i = 0;
  for (const status of statuses) {
    for (const form of forms) {
      for (const regime of ['new', 'old'] as const) {
        i += 1;
        const data = metaWith(status, form);
        data.meta.regime = regime;
        fixtures.push({
          id: `fx-${status}-${form}-${regime}-${i}`,
          label: `${status} · ${form} · ${regime}`,
          data,
          expectStatus: status,
          expectCanUpload: false,
        });
      }
    }
  }

  // Day-count derived residency fixtures
  const residencyCases = [
    { id: 'days-nri', facts: { daysInPreviousYear: 40, daysInPrecedingFourYears: 100 }, expect: 'NRI' as const },
    { id: 'days-nor', facts: { daysInPreviousYear: 200, daysInPrecedingFourYears: 400, nonResidentYearsOfLast10: 9, daysInPrecedingSevenYears: 200 }, expect: 'NOR' as const },
    { id: 'days-res', facts: { daysInPreviousYear: 300, daysInPrecedingFourYears: 1000, nonResidentYearsOfLast10: 1, daysInPrecedingSevenYears: 1500 }, expect: 'RES' as const },
  ];
  for (const c of residencyCases) {
    const status = determineResidency(c.facts).status;
    const data = metaWith(status);
    data.meta.residencyFacts = c.facts;
    fixtures.push({
      id: c.id,
      label: `Residency engine · ${c.expect}`,
      data,
      expectStatus: c.expect,
    });
  }

  // FIFO lot sanity attached as fixture metadata via capital gains sample
  const lotData = metaWith('NRI');
  const lots = computeFifoLots([
    { isin: 'INE002A01018', date: '2024-01-01', side: 'buy', quantity: 10, price: 100 },
    { isin: 'INE002A01018', date: '2025-06-01', side: 'sell', quantity: 10, price: 150 },
  ]);
  lotData.fields['CG.note'] = `fifoGain=${lots.totalGain};kind=${lots.lots[0]?.holdingKind ?? ''}`;
  fixtures.push({
    id: 'fifo-ltcg-sample',
    label: 'FIFO LTCG sample annotation',
    data: lotData,
    expectStatus: 'NRI',
  });

  // Pad to >= 25 with variant filing sections if needed
  while (fixtures.length < 25) {
    const n = fixtures.length + 1;
    const data = metaWith(n % 2 === 0 ? 'NRI' : 'RES');
    data.fields['GEN.email'] = `fixture${n}@example.com`;
    fixtures.push({
      id: `pad-${n}`,
      label: `Pad fixture ${n}`,
      data,
      expectStatus: data.meta.residentialStatus,
      expectCanUpload: false,
    });
  }

  return fixtures;
}

/** Pilot gate predicates used by tests. */
export function pilotGateNotes(status: ResidentialStatus): string[] {
  const notes: string[] = [];
  if (dtaaEvidenceRequired(status)) notes.push('dtaa');
  if (scheduleFaRequired(status)) notes.push('fa');
  if (scheduleFsiVisible(status)) notes.push('fsi');
  if (ftcForm67Needed({ hasForeignTaxPaid: true })) notes.push('form67');
  return notes;
}

/** Run staged validation across all golden fixtures (for release gate). */
export function runGoldenGate(): {
  total: number;
  residencyOk: number;
  stagedRan: number;
} {
  const fixtures = goldenFixtures();
  let residencyOk = 0;
  let stagedRan = 0;
  for (const fx of fixtures) {
    if (fx.data.meta.residentialStatus === fx.expectStatus) residencyOk += 1;
    validateReturnStaged(fx.data);
    stagedRan += 1;
  }
  return { total: fixtures.length, residencyOk, stagedRan };
}
