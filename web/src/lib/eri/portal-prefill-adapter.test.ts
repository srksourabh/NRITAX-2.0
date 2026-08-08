import { describe, expect, it } from 'vitest';

import { applyPrefill } from '@/lib/eri/prefill-mapper';
import {
  describePortalPrefillInventory,
  inventoryPortalPrefill,
  isPortalPrefillShape,
  normalizeTdsSection,
  portalPrefillToPayload,
} from '@/lib/eri/portal-prefill-adapter';
import { PORTAL_PREFILL_FIXTURE } from '@/lib/eri/portal-prefill-fixture';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';
import type { ReturnMeta } from '@/lib/itr/types';

const meta: ReturnMeta = {
  form: 'ITR3',
  assessmentYear: ASSESSMENT_YEAR,
  regime: 'new',
  status: 'I',
  residentialStatus: 'RES',
  filingSection: '139(1)',
  filingDate: '2026-07-15',
  dueDate: '2026-07-31',
};

describe('portal-prefill-adapter', () => {
  it('detects portal camelCase shape and rejects Form_ITR envelopes', () => {
    expect(isPortalPrefillShape(PORTAL_PREFILL_FIXTURE)).toBe(true);
    expect(isPortalPrefillShape({ Form_ITR3: { PartA_GEN1: {} } })).toBe(false);
    expect(isPortalPrefillShape({ ITR: { ITR3: {} } })).toBe(false);
  });

  it('normalizes shortened TDS section codes', () => {
    expect(normalizeTdsSection('94A')).toBe('194A');
    expect(normalizeTdsSection('194A')).toBe('194A');
  });

  it('maps fixture into PrefillPayload with identity, salary, TDS, banks', () => {
    const payload = portalPrefillToPayload(PORTAL_PREFILL_FIXTURE, {
      assessmentYear: ASSESSMENT_YEAR,
    });
    expect(payload.pan).toBe('AAJPS4321K');
    expect(payload.personal.firstName).toBe('TEST');
    expect(payload.personal.surname).toBe('TAXPAYER');
    expect(payload.personal.email).toBe('test.taxpayer@example.com');
    expect(payload.salaries[0]?.employerName).toBe('TEST EMPLOYER LLP');
    expect(payload.salaries[0]?.salary17_1).toBe(1_200_000);
    expect(payload.tds.some((t) => t.kind === 'salary')).toBe(true);
    expect(payload.tds.some((t) => t.kind === 'other' && t.section === '194A')).toBe(true);
    expect(payload.bankAccounts[0]?.ifsc).toBe('HDFC0000123');
    expect(payload.dividend).toBe(12_000);
    expect(payload.interest.savingsBank).toBe(8_000);
    expect(payload.interest.termDeposits).toBe(45_000);
    expect(payload.challans[0]?.amount).toBe(50_000);

    const inv = inventoryPortalPrefill(payload);
    expect(inv.identity).toBe(true);
    expect(inv.salary).toBe(true);
    expect(inv.tds).toBe(true);
    expect(inv.banks).toBe(true);
    expect(describePortalPrefillInventory(inv)).toMatch(/identity/);
    expect(describePortalPrefillInventory(inv)).toMatch(/Business/);
  });

  it('applyPrefill writes ITR-3 keys from portal payload', () => {
    const payload = portalPrefillToPayload(PORTAL_PREFILL_FIXTURE, {
      assessmentYear: ASSESSMENT_YEAR,
    });
    const blank = emptyReturn(meta);
    const { data, applied } = applyPrefill(blank, payload, 'ITR3');
    expect(applied.length).toBeGreaterThan(5);
    expect(data.fields['GEN.PAN']).toBe('AAJPS4321K');
    expect(data.fields['GEN.FirstName']).toBe('TEST');
    expect(data.fields['S.EmployerName']).toBe('TEST EMPLOYER LLP');
    expect(data.fields['S.Sal17_1']).toBe(1_200_000);
    expect((data.tables.BankRows ?? []).length).toBeGreaterThan(0);
  });
});
