import { describe, expect, it } from 'vitest';

import { ITR3_RULE_FIELD_KEYS, ITR3_RULES, ITR3_UNCHECKABLE } from '@/lib/itr/itr3/rules';
import { ASSESSMENT_YEAR } from '@/lib/itr/types';
import type { Finding, ReturnData, RuleContext, TableRow } from '@/lib/itr/types';

/** A RuleContext over plain data, so the rules can be exercised without the runner. */
function context(data: ReturnData): RuleContext {
  const raw = (key: string) => data.fields[key];
  return {
    data,
    form: data.meta.form,
    regime: data.meta.regime,
    status: data.meta.status,
    residentialStatus: data.meta.residentialStatus,
    N: (key) => Number(raw(key) ?? 0) || 0,
    V: (key) => String(raw(key) ?? ''),
    rows: (table) =>
      (data.tables[table] ?? []).filter((r) =>
        Object.values(r).some((v) => v !== null && v !== '' && v !== undefined),
      ),
    C: () => 0,
    isHUF: data.meta.status === 'H',
    isIndividual: data.meta.status === 'I',
    isNRI: data.meta.residentialStatus === 'NRI',
    isResident: data.meta.residentialStatus === 'RES',
    isSenior: false,
    isSuperSenior: false,
    isBelated: data.meta.filingSection === '139(4)',
  };
}

function run(data: ReturnData): Finding[] {
  const ctx = context(data);
  const out: Finding[] = [];
  for (const r of ITR3_RULES) {
    const message = r.check(ctx);
    if (message) out.push({ n: r.n, cat: r.cat, schedule: r.schedule, text: r.text, message });
  }
  return out;
}

const categoryA = (data: ReturnData): Finding[] => run(data).filter((f) => f.cat === 'A');
const numbers = (findings: Finding[]) => findings.map((f) => f.n);

/**
 * The specimen return from the prototype's fillSample(): a resident individual
 * declaring presumptive business income under section 44AD, with savings and
 * deposit interest and a single self-assessment challan.
 *
 * Two particulars the prototype leaves blank are supplied here, because the
 * published rules require them: the due date for a non-audit presumptive
 * individual is 31 July, not 31 October (rule 26), and a presumptive return
 * must carry the no-accounts particulars (rule 283).
 */
function specimen(): ReturnData {
  return {
    meta: {
      form: 'ITR3',
      assessmentYear: ASSESSMENT_YEAR,
      regime: 'new',
      status: 'I',
      residentialStatus: 'RES',
      filingSection: '139(1)',
      filingDate: '2026-07-15',
      dueDate: '2026-07-31',
      dateOfBirth: '1980-05-14',
    },
    fields: {
      'GEN.FirstName': 'Sourabh',
      'GEN.SurNameOrOrgName': 'Bhaumik',
      'GEN.PAN': 'AAAPB1234C',
      'GEN.DOB': '1980-05-14',
      'GEN.Status': 'I — Individual',
      'GEN.AadhaarCardNo': '234567890123',
      'GEN.FlatDoorNo': '12A',
      'GEN.Locality': 'Shibpur',
      'GEN.City': 'Howrah',
      'GEN.State': 'West Bengal',
      'GEN.Country': 'India',
      'GEN.PinCode': '711102',
      'GEN.SecAddSame': 'Yes',
      'GEN.EmailAddress': 'specimen@example.com',
      'GEN.MobileNo': '9800000000',
      'GEN.ResidentialStatus': 'RES — Resident',
      'GEN.ReturnFileSec': '139(1) — on or before the due date',
      'GEN.DueDate': '31st July',
      'GEN.OptOutNewTaxRegime': 'No — new tax regime applies',
      'GEN.BusIncomeFlag': 'Yes',
      'GEN.SeventhProviso139': 'No',
      'GEN.LiableAudit44AB': 'No',
      'GEN.Liable92E': 'No',
      'GEN.PresumptiveOnly': 'Yes',
      'GEN.PortugueseCC': 'No',
      'GEN.RepAssesseeFlag': 'No',
      'GEN.TurnoverRange': 'Up to ₹1 crore',
      'BS.NoAccCashBal': 480000,
      'PL.GT44ADBank': 9500000,
      'PL.GT44ADCash': 300000,
      'PL.PI44ADBank': 570000,
      'PL.PI44ADCash': 24000,
      'BP.A35i_44AD': 594000,
      'BP.A36_NetPGBP': 594000,
      'BP.A37': 594000,
      'BP.D_TotalPGBP': 594000,
      'OS.IntSavings': 18500,
      'OS.IntDeposits': 142000,
      'OS.Interest1b': 160500,
      'OS.Dividend1a': 36500,
      'OS.Gross1': 197000,
      'OS.Net6': 197000,
      'OS.Total7': 197000,
      'OS.Total9': 197000,
      'BTI.TI_PGBP': 594000,
      'BTI.TI_OS': 197000,
      'BTI.TI_Total6': 791000,
      'BTI.TI_GTI': 791000,
      'BTI.TI_TotalIncome': 791000,
      'BTTI.TTI_TaxNormal': 0,
      'BTTI.TTI_AggLiab': 0,
      'BTTI.TTI_TotalPaid': 21000,
      'BTTI.TTI_Refund': 21000,
      'BTTI.TTI_FAFlag': 'No',
      'VER.VerName': 'Sourabh Bhaumik',
      'VER.VerPAN': 'AAAPB1234C',
      'VER.VerCapacity': 'Self',
      'VER.VerPlace': 'Howrah',
      'VER.VerDate': '2026-07-15',
    },
    tables: {
      NOBRows: [
        {
          Code: '14005',
          TradeName: 'Ultimate Digital Solutions',
          Description: 'Information technology infrastructure and support services',
        },
      ],
      BankRows: [
        {
          IFSC: 'SBIN0001234',
          BankName: 'State Bank of India',
          AccountNo: '32100456789',
          Nominate: 'Yes',
        },
      ],
      ITRows: [
        { BSRCode: '0002233', DepDate: '2026-03-14', ChallanNo: '01477', TaxAmt: 21000 },
      ],
    },
  };
}

function withFields(data: ReturnData, fields: Record<string, string | number>): ReturnData {
  return { ...data, fields: { ...data.fields, ...fields } };
}

function withTable(data: ReturnData, key: string, rows: TableRow[]): ReturnData {
  return { ...data, tables: { ...data.tables, [key]: rows } };
}

describe('ITR-3 validation rules', () => {
  it('finds nothing blocking in the specimen return', () => {
    expect(numbers(categoryA(specimen()))).toEqual([]);
  });

  it('trips rule 52 where sources and application of funds disagree', () => {
    const data = withFields(specimen(), {
      'BS.SourcesTotal': 1000000,
      'BS.ApplicationTotal': 900000,
    });
    expect(numbers(categoryA(data))).toContain(52);
  });

  it('accepts a balance sheet that balances', () => {
    const data = withFields(specimen(), {
      'BS.SourcesTotal': 1000000,
      'BS.ApplicationTotal': 1000000,
      'BS.TotPropFund': 1000000,
      'BS.PropCapital': 1000000,
      'BS.NetCurrAssets': 1000000,
      'BS.TotCurrAssets': 1000000,
    });
    expect(numbers(categoryA(data))).not.toContain(52);
  });

  it('trips rule 100 where presumptive income is below six per cent of banked turnover', () => {
    const data = withFields(specimen(), { 'PL.PI44ADBank': 500000, 'BP.A35i_44AD': 524000 });
    expect(numbers(categoryA(data))).toContain(100);
  });

  it('leaves rule 100 alone at exactly six per cent', () => {
    expect(numbers(categoryA(specimen()))).not.toContain(100);
  });

  it('names the offending row in a row-level rule', () => {
    const data = withTable(specimen(), 'HPRows', [
      { Type: 'Let out', GrossRent: 600000, AnnualValue: 600000, StdDed30: 180000 },
      { Type: 'Let out', GrossRent: 400000, AnnualValue: 400000, StdDed30: 90000 },
    ]);
    const finding = categoryA(data).find((f) => f.n === 210);
    expect(finding?.message).toBe(
      'Property 2: Standard deduction on house property must be thirty per cent of the annual value.',
    );
  });

  it('gives every rule a unique serial number, category and schedule', () => {
    const keys = ITR3_RULES.map((r) => `${r.cat}:${r.n}:${r.schedule}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps the published categories and the Category A range', () => {
    for (const r of ITR3_RULES) {
      expect(['A', 'B', 'D']).toContain(r.cat);
      expect(r.text.length).toBeGreaterThan(0);
      if (r.cat === 'A' && typeof r.n === 'number') {
        expect(r.n).toBeGreaterThanOrEqual(1);
        expect(r.n).toBeLessThanOrEqual(1029);
      }
    }
  });

  it('lists the field keys the rules read, fully qualified and without repeats', () => {
    expect(new Set(ITR3_RULE_FIELD_KEYS).size).toBe(ITR3_RULE_FIELD_KEYS.length);
    for (const key of ITR3_RULE_FIELD_KEYS) expect(key).toMatch(/^[A-Z0-9]+\.[A-Za-z0-9_]+$/);
  });

  it('records the rules that need a departmental database', () => {
    expect(ITR3_UNCHECKABLE.length).toBeGreaterThan(0);
    for (const entry of ITR3_UNCHECKABLE) {
      expect(entry.rules.length).toBeGreaterThan(0);
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it('never throws, whatever the return holds', () => {
    const empty: ReturnData = { meta: specimen().meta, fields: {}, tables: {} };
    const ctx = context(empty);
    for (const r of ITR3_RULES) expect(() => r.check(ctx)).not.toThrow();
  });
});
