import { afterEach, describe, expect, it, vi } from 'vitest';

import { auditReturn, redact, restore } from '@/lib/ai/audit';
import type { AuditInput } from '@/lib/ai/audit';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';
import type { ReturnMeta, TaxComputation, ValidationReport } from '@/lib/itr/types';

const meta: ReturnMeta = {
  form: 'ITR2',
  assessmentYear: ASSESSMENT_YEAR,
  regime: 'new',
  status: 'I',
  residentialStatus: 'NRI',
  filingSection: '139(1)',
  filingDate: '2026-07-27',
  dueDate: '2026-07-31',
};

const tax: TaxComputation = {
  regime: 'new',
  basicExemption: 400000,
  grossTotalIncome: 0,
  chapterVIA: 0,
  totalIncome: 0,
  specialRateIncome: 0,
  normalRateIncome: 0,
  buckets: [],
  taxOnNormal: 0,
  taxOnSpecial: 0,
  rebate87A: 0,
  surchargeRate: 0,
  surcharge: 0,
  marginalRelief: 0,
  cess: 0,
  grossTaxLiability: 0,
  reliefs: 0,
  interest234A: 0,
  interest234B: 0,
  interest234C: 0,
  fee234F: 0,
  netTaxLiability: 0,
  aggregateLiability: 0,
  taxesPaid: 0,
  balancePayable: 0,
  refundDue: 0,
  notes: [],
};

const validation: ValidationReport = {
  findings: [],
  blocking: [],
  advisory: [],
  fieldErrors: [],
  rulesApplied: 0,
  canUpload: true,
};

const input: AuditInput = { data: emptyReturn(meta), tax, validation };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('auditReturn', () => {
  it('reports unavailable without throwing when no API key is configured', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');

    const report = await auditReturn(input);

    expect(report.available).toBe(false);
    expect(report.verdict).toBe('clean');
    expect(report.observations).toEqual([]);
    expect(report.summary).toBe('AI audit skipped — no API key configured.');
  });
});

describe('redact', () => {
  const raw =
    'PAN ABCDE1234F holds account 000123456789012, Aadhaar 234567890123. Cross-check ABCDE1234F.';

  it('removes PAN, Aadhaar and account numbers', () => {
    const { text } = redact(raw);

    expect(text).not.toContain('ABCDE1234F');
    expect(text).not.toContain('234567890123');
    expect(text).not.toContain('000123456789012');
    expect(text).toContain('[PAN_1]');
    expect(text).toContain('[AADHAAR_1]');
    expect(text).toContain('[ACCOUNT_1]');
  });

  it('gives one value one placeholder', () => {
    const { map } = redact(raw);

    expect(map['[PAN_1]']).toBe('ABCDE1234F');
    expect(Object.keys(map)).toHaveLength(3);
  });

  it('round-trips back to the original text', () => {
    const { text, map } = redact(raw);

    expect(restore(text, map)).toBe(raw);
  });

  it('does not confuse [PAN_1] with [PAN_10] when restoring', () => {
    const many = Array.from({ length: 11 }, (_, i) => `ABCDE${1000 + i}F`);
    const { text, map } = redact(many.join(' '));

    expect(map['[PAN_10]']).toBeDefined();
    expect(restore(text, map)).toBe(many.join(' '));
  });
});
