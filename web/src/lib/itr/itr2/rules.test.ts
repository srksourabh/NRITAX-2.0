import { describe, expect, it } from 'vitest';

import {
  ASSESSMENT_YEAR,
  type AssesseeStatus,
  type FieldValue,
  type Regime,
  type ResidentialStatus,
  type ReturnData,
  type RuleContext,
  type TableRow,
} from '@/lib/itr/types';

import { ITR2_RULES, ITR2_RULE_FIELD_KEYS } from './rules';

interface Specimen {
  fields?: Record<string, FieldValue>;
  tables?: Record<string, TableRow[]>;
  calcs?: Record<string, number>;
  regime?: Regime;
  status?: AssesseeStatus;
  residentialStatus?: ResidentialStatus;
  isSenior?: boolean;
  isBelated?: boolean;
}

/** A RuleContext over a fixed set of figures, standing in for the engine. */
function context(specimen: Specimen): RuleContext {
  const fields = specimen.fields ?? {};
  const tables = specimen.tables ?? {};
  const calcs = specimen.calcs ?? {};
  const regime = specimen.regime ?? 'new';
  const status = specimen.status ?? 'I';
  const residentialStatus = specimen.residentialStatus ?? 'RES';
  const isBelated = specimen.isBelated ?? false;

  const data: ReturnData = {
    meta: {
      form: 'ITR2',
      assessmentYear: ASSESSMENT_YEAR,
      regime,
      status,
      residentialStatus,
      filingSection: isBelated ? '139(4)' : '139(1)',
      filingDate: isBelated ? '2026-10-02' : '2026-07-15',
      dueDate: '2026-07-31',
      dateOfBirth: String(fields['GEN.dob'] ?? ''),
    },
    fields,
    tables,
  };

  return {
    data,
    form: 'ITR2',
    regime,
    status,
    residentialStatus,
    N(key) {
      const value = fields[key];
      const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
      return Number.isFinite(n) ? n : 0;
    },
    V(key) {
      const value = fields[key];
      return value == null ? '' : String(value);
    },
    rows(tableKey) {
      const rows = tables[tableKey] ?? [];
      return rows.filter((r) => Object.values(r).some((v) => (v ?? '') !== ''));
    },
    C(calcKey) {
      return calcs[calcKey] ?? 0;
    },
    isHUF: status === 'H',
    isIndividual: status === 'I',
    isNRI: residentialStatus === 'NRI',
    isResident: residentialStatus === 'RES',
    isSenior: specimen.isSenior ?? false,
    isSuperSenior: false,
    isBelated,
  };
}

interface Finding {
  n: number | string;
  cat: string;
  message: string;
}

const run = (ctx: RuleContext): Finding[] =>
  ITR2_RULES.flatMap((rule) => {
    const message = rule.check(ctx);
    return message === null ? [] : [{ n: rule.n, cat: rule.cat, message }];
  });

/**
 * Resident individual on the new regime: salary of 12,00,000 with the 75,000
 * standard deduction, savings-bank interest of 14,200, one employer TDS entry.
 * Every derived figure below is what the calculation engine would produce.
 */
function cleanSpecimen(): Specimen {
  return {
    regime: 'new',
    status: 'I',
    residentialStatus: 'RES',
    fields: {
      'GEN.pan': 'ABCPB1234K',
      'GEN.dob': '1985-06-12',
      'GEN.mobile': '9876543210',
      'GEN.email': 'ravi@example.com',
      'GEN.aadhaar': '234567890123',
      'GEN.noticeUs': '11',
      'GEN.seventh': 'N',
      'GEN.portuguese': 'N',
      'GEN.unlisted': 'N',
      'GEN.director': 'N',
      'GEN.isFpi': 'N',
      'GEN.repFlag': 'N',
      'VER.vPan': 'ABCPB1234K',
      'VER.vCapacity': 'S',
      'FA.faFlag': 'N',
      'S.sal17_1': 1200000,
      'S.dedStd': 75000,
      'OS.osSb': 14200,
    },
    tables: {
      emp: [
        {
          eName: 'Meridian Systems Private Limited',
          eCat: 'Others',
          eTan: 'BLRM12345C',
          eCity: 'Bengaluru',
          ePin: '560001',
        },
      ],
      tds1: [
        {
          t1Tan: 'BLRM12345C',
          t1Name: 'Meridian Systems Private Limited',
          t1Inc: 1125000,
          t1Tds: 60000,
        },
      ],
      bank: [
        { bIfsc: 'HDFC0001234', bName: 'HDFC Bank', bAcc: '50100123456789', bType: 'SB', bRefund: 'Y' },
      ],
    },
    calcs: {
      grossSal: 1200000,
      totExempt: 0,
      netSalary: 1200000,
      salChargeable: 1125000,
      hpTotal: 0,
      osGross: 14200,
      os57Tot: 0,
      osNet: 14200,
      cgTotal: 0,
      gti: 1139200,
      totalIncome: 1139200,
      tiSal: 1125000,
      tiHp: 0,
      viaRaw: 0,
      viaTotal: 0,
      xTax: 53920,
      xReb: 53920,
      xSur: 0,
      xCess: 0,
      grossTax: 53920,
      netTax: 0,
      totRelief: 0,
      totInterest: 0,
      aggLiab: 0,
      tdsTotal: 60000,
      itTotal: 0,
      taxesPaid: 60000,
      advTax: 0,
      selfAsmt: 0,
      refund: 60000,
      balDue: 0,
    },
  };
}

describe('ITR2_RULES', () => {
  it('passes every Category A rule on a clean specimen return', () => {
    const findings = run(context(cleanSpecimen())).filter((f) => f.cat === 'A');
    expect(findings).toEqual([]);
  });

  it('trips rule 346 when 80C, 80CCC and 80CCD(1) exceed 1,50,000', () => {
    const specimen = cleanSpecimen();
    specimen.regime = 'old';
    specimen.fields = { ...specimen.fields, 'VIA.d80c': 200000, 'S.dedStd': 50000 };
    specimen.calcs = { ...specimen.calcs, viaRaw: 150000, viaTotal: 150000 };

    const finding = run(context(specimen)).find((f) => f.n === 346);
    expect(finding).toBeDefined();
    expect(finding?.cat).toBe('A');
    expect(finding?.message).toContain('₹2,00,000');
  });

  it('trips rule 342 when a new-regime return claims 80C', () => {
    const specimen = cleanSpecimen();
    specimen.fields = { ...specimen.fields, 'VIA.d80c': 120000 };

    const finding = run(context(specimen)).find((f) => f.n === 342);
    expect(finding).toBeDefined();
    expect(finding?.cat).toBe('A');
    expect(finding?.message).toContain('80C');
  });

  it('gives every rule a unique serial number and category', () => {
    const pairs = ITR2_RULES.map((r) => `${r.n}|${r.cat}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('exports fully qualified, unique field keys', () => {
    expect(new Set(ITR2_RULE_FIELD_KEYS).size).toBe(ITR2_RULE_FIELD_KEYS.length);
    for (const key of ITR2_RULE_FIELD_KEYS) {
      expect(key).toMatch(/^[A-Z]+\.[A-Za-z0-9_]+$/);
    }
  });
});
