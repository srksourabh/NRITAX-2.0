import { describe, expect, it } from 'vitest';

import { applyForm16ToReturn, applyForm26AsToReturn, sumForm16Tds } from '@/lib/sandbox/apply-ocr';
import type { Form16Data, Form26AsData } from '@/lib/sandbox/ocr-types';
import { ASSESSMENT_YEAR, emptyReturn } from '@/lib/itr/types';

function blank(form: 'ITR2' | 'ITR3' = 'ITR2') {
  return emptyReturn({
    form,
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: 'NRI',
    filingSection: '139(1)',
    filingDate: '2026-07-15',
    dueDate: '2026-07-31',
  });
}

function specimenForm16(): Form16Data {
  return {
    'Part A': {
      assessment_year: '2025-26',
      employer: {
        name: 'UNIMED HEALTH CARE PRIVATE LIMITED',
        tan: 'HYDU00904B',
        pan: 'AAACU8638B',
      },
      employee: {
        first_name: 'SRI',
        middle_name: 'SAI',
        last_name: 'GUTHIKONDA',
        pan: 'DCDPG7297B',
      },
      tds: [
        ['quarter', 'receipt_number', 'credit_amount', 'tax_deducted', 'tax_deposited'],
        ['Q4', 'QVQYSSEF', 360030, 28428, 28428],
        ['Q3', 'QVOLJKOE', 240000, 9704, 9704],
        ['Q2', 'QVMVLPLC', 250000, 9704, 9704],
        ['Q1', 'QVKCNDHC', 230000, 19249, 19249],
        ['Total', null, 1080030, 67085, 67085],
      ],
    },
    'Part B': {
      assessment_year: '2025-26',
      employer: {
        name: 'UNIMED HEALTH CARE PRIVATE LIMITED',
        tan: 'HYDU00904B',
        pan: 'AAACU8638B',
      },
      employee: {
        first_name: 'SRI',
        middle_name: 'SAI',
        last_name: 'GUTHIKONDA',
        pan: 'DCDPG7297B',
      },
      details_of_salary_paid: {
        gross_salary: {
          salary_as_per_provisions_contained_in_section_17_1: 1_080_030,
          value_of_perquisites_us_17_2: 12_000,
          profits_in_lieu_of_salary_us_17_3: 0,
        },
        deduction_us_16: {
          standard_deduction_us_16_ia: 75_000,
          tax_on_employment_us_16_iii: 2_400,
        },
        income_chargeable_under_the_head_salaries: 1_014_630,
      },
    },
  };
}

function specimenForm26As(): Form26AsData {
  return {
    pan: 'ABVPT1571F',
    name: 'HEENA TRIVEDI',
    financial_year: '2025-26',
    assessment_year: '2026-27',
    'Part I': [
      {
        tan_of_deductor: 'AHMG01790F',
        name_of_deductor: 'GUJARAT STATE WOMEN SEWA CO-OP FEDERATION LTD',
        total_amount_paid_credited: '40500.00',
        total_tax_deducted: '810.00',
        total_tds_deposited: '810.00',
        deduction_wise: [
          ['sr_no', 'section', 'transaction_date', 'amount_paid_credited', 'tax_deducted'],
          ['1', '194JA', '30-Jun-2025', '13000.00', '260.00'],
        ],
      },
      {
        tan_of_deductor: 'BLRI04321F',
        name_of_deductor: 'INFOSYS LIMITED',
        total_amount_paid_credited: '1800000',
        total_tax_deducted: '210000',
        total_tds_deposited: '210000',
        deduction_wise: [
          ['sr_no', 'section', 'transaction_date', 'amount_paid_credited', 'tax_deducted'],
          ['1', '192', '31-Mar-2026', '1800000', '210000'],
        ],
      },
    ],
    'Part IV': [
      {
        bsr_code: '0510308',
        date_of_deposit: '2025-09-15',
        challan_serial_number: '10021',
        amount: 40_000,
      },
      {
        tan_of_collector: 'MUMT05432P',
        name_of_collector: 'Thomas Cook (India) Limited',
        tcs_collected: 45_000,
      },
    ],
  };
}

describe('sumForm16Tds', () => {
  it('prefers the Total row tax deducted', () => {
    expect(sumForm16Tds(specimenForm16()['Part A']!.tds)).toBe(67_085);
  });
});

describe('applyForm16ToReturn', () => {
  it('writes ITR-2 Schedule S, employer table and TDS1 from Form 16', () => {
    const result = applyForm16ToReturn(blank('ITR2'), specimenForm16());

    expect(result.data.fields['S.sal17_1']).toBe(1_080_030);
    expect(result.data.fields['S.sal17_2']).toBe(12_000);
    expect(result.data.fields['S.dedStd']).toBe(75_000);
    expect(result.data.fields['S.dedProf']).toBe(2_400);
    expect(result.data.fields['GEN.pan']).toBe('DCDPG7297B');
    expect(result.data.tables.emp?.[0]).toMatchObject({
      eName: 'UNIMED HEALTH CARE PRIVATE LIMITED',
      eTan: 'HYDU00904B',
    });
    expect(result.data.tables.tds1?.[0]).toMatchObject({
      t1Tan: 'HYDU00904B',
      t1Inc: 1_014_630,
      t1Tds: 67_085,
    });
    expect(result.applied.some((a) => a.source === 'form16')).toBe(true);
  });

  it('skips already-filled scalar fields and non-empty tables', () => {
    const start = blank('ITR2');
    start.fields['S.sal17_1'] = 999;
    start.tables.tds1 = [{ t1Tan: 'EXISTING01A', t1Tds: 1 }];

    const result = applyForm16ToReturn(start, specimenForm16());

    expect(result.data.fields['S.sal17_1']).toBe(999);
    expect(result.skipped).toContain('S.sal17_1');
    expect(result.skipped).toContain('tds1');
    expect(result.data.tables.tds1?.[0]?.t1Tan).toBe('EXISTING01A');
    expect(result.data.fields['S.dedStd']).toBe(75_000);
  });

  it('maps ITR-3 Schedule S employer and salary keys', () => {
    const result = applyForm16ToReturn(blank('ITR3'), specimenForm16());

    expect(result.data.fields['S.EmployerName']).toBe('UNIMED HEALTH CARE PRIVATE LIMITED');
    expect(result.data.fields['S.EmployerTAN']).toBe('HYDU00904B');
    expect(result.data.fields['S.Sal17_1']).toBe(1_080_030);
    expect(result.data.fields['S.StdDeduction']).toBe(75_000);
    expect(result.data.tables.TDS1Rows?.[0]).toMatchObject({
      TAN: 'HYDU00904B',
      TaxDeducted: 67_085,
    });
  });

  it('does not mutate the input return', () => {
    const data = blank('ITR2');
    const before = JSON.stringify(data);
    applyForm16ToReturn(data, specimenForm16());
    expect(JSON.stringify(data)).toBe(before);
  });
});

describe('applyForm26AsToReturn', () => {
  it('routes section 192 to TDS1 and other sections to TDS2 on ITR-2', () => {
    const result = applyForm26AsToReturn(blank('ITR2'), specimenForm26As());

    expect(result.data.fields['GEN.pan']).toBe('ABVPT1571F');
    expect(result.data.tables.tds1?.[0]).toMatchObject({
      t1Tan: 'BLRI04321F',
      t1Tds: 210_000,
    });
    expect(result.data.tables.tds2?.[0]).toMatchObject({
      t2Tan: 'AHMG01790F',
      t2Gross: 40_500,
      t2Tds: 810,
    });
    // 194JA has no mapped head code — leave blank rather than invent one.
    expect(result.data.tables.tds2?.[0]?.t2Head).toBeUndefined();
    expect(result.data.tables.chal?.[0]).toMatchObject({
      bsr: '0510308',
      chAmt: 40_000,
    });
    expect(result.data.tables.tcs?.[0]).toMatchObject({
      tcTan: 'MUMT05432P',
      tcAmt: 45_000,
    });
    expect(result.applied.some((a) => a.source === 'form26as')).toBe(true);
  });

  it('skips non-empty TDS2 when already filled', () => {
    const start = blank('ITR2');
    start.tables.tds2 = [{ t2Tan: 'KEEPME000A', t2Tds: 5 }];

    const result = applyForm26AsToReturn(start, specimenForm26As());

    expect(result.skipped).toContain('tds2');
    expect(result.data.tables.tds2?.[0]?.t2Tan).toBe('KEEPME000A');
    expect(result.data.tables.tds1?.[0]?.t1Tan).toBe('BLRI04321F');
  });

  it('maps ITR-3 TDS2 / TCS / challan tables', () => {
    const result = applyForm26AsToReturn(blank('ITR3'), specimenForm26As());

    expect(result.data.tables.TDS1Rows?.[0]).toMatchObject({ TAN: 'BLRI04321F' });
    expect(result.data.tables.TDS2Rows?.[0]).toMatchObject({ TAN2: 'AHMG01790F' });
    expect(result.data.tables.TCSRows?.[0]).toMatchObject({ CollectorTAN: 'MUMT05432P' });
    expect(result.data.tables.ITRows?.[0]).toMatchObject({ BSRCode: '0510308', TaxAmt: 40_000 });
  });
});
