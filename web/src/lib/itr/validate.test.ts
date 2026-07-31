import { describe, expect, it } from 'vitest';

import { buildContext } from '@/lib/itr/context';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2';
import {
  ASSESSMENT_YEAR,
  emptyReturn,
  type FilingSection,
  type ReturnData,
  type RuleDef,
  type ScheduleDef,
} from '@/lib/itr/types';
import { PLACEHOLDER_SOFTWARE_ID, validateFields, validateReturn } from '@/lib/itr/validate';

/** A registered identifier, so the placeholder check keeps out of the way. */
const REGISTERED = 'SW20000';

function blank(overrides: Partial<ReturnData['meta']> = {}): ReturnData {
  return emptyReturn({
    form: 'ITR2',
    assessmentYear: ASSESSMENT_YEAR,
    regime: 'new',
    status: 'I',
    residentialStatus: 'NRI',
    filingSection: '139(1)',
    filingDate: '2026-07-15',
    dueDate: '2026-07-31',
    ...overrides,
  });
}

describe('validateFields', () => {
  it('reports every mandatory particular of a blank return and nothing else', () => {
    const findings = validateFields(blank(), ITR2_SCHEDULES);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.cat === 'A')).toBe(true);
    expect(findings.every((f) => Boolean(f.field))).toBe(true);
    expect(
      findings.every((f) => f.message === 'This particular is mandatory and has not been furnished.'),
    ).toBe(true);
    expect(findings.some((f) => f.field === 'GEN.pan')).toBe(true);
  });

  it('reports a malformed PAN against the field the taxpayer has to fix', () => {
    const data = blank();
    data.fields['GEN.pan'] = 'ABC123';

    const finding = validateFields(data, ITR2_SCHEDULES).find((f) => f.field === 'GEN.pan');

    expect(finding?.message).toBe('"ABC123" is not a valid Permanent Account Number.');
  });

  it('does not demand a field the schema is hiding', () => {
    const hidden = validateFields(blank(), ITR2_SCHEDULES);
    expect(hidden.some((f) => f.field === 'GEN.sebiReg')).toBe(false);

    const data = blank();
    data.fields['GEN.isFpi'] = 'Y';
    const shown = validateFields(data, ITR2_SCHEDULES);
    expect(shown.some((f) => f.field === 'GEN.sebiReg')).toBe(true);
  });

  it('checks a started table row and leaves an untouched one alone', () => {
    const schedules: ScheduleDef[] = [
      {
        id: 'X',
        code: 'ScheduleX',
        no: 'X',
        name: 'Schedule X',
        part: 'Part B',
        forms: ['ITR2'],
        sections: [
          {
            key: 'sales',
            title: 'Sales',
            tables: [
              {
                key: 'sales',
                title: 'Sales',
                columns: [
                  { key: 'scrip', label: 'Scrip', type: 'text', required: true },
                  { key: 'dsale', label: 'Date of sale', type: 'date' },
                ],
              },
            ],
          },
        ],
      },
    ];

    const data = blank();
    data.tables.sales = [{}, { dsale: '2024-06-01' }];
    const findings = validateFields(data, schedules);

    expect(findings.map((f) => f.field)).toEqual(['sales[1].scrip', 'sales[1].dsale']);
    expect(findings[1].message).toContain('previous year, 2025-04-01 to 2026-03-31');
  });
});

describe('validateReturn', () => {
  it('runs the rule set for the form without a rule crashing the pass', () => {
    const report = validateReturn(blank(), { softwareId: REGISTERED });

    expect(report.rulesApplied).toBeGreaterThan(0);
    expect(report.findings.filter((f) => f.message.includes('could not be applied'))).toEqual([]);
    expect(report.fieldErrors.length).toBeGreaterThan(0);
    expect(report.canUpload).toBe(false);
  });

  it('sorts Category A findings ahead of the rest', () => {
    const rules: RuleDef[] = [
      { n: 1, cat: 'D', schedule: 'Sch VIA', text: 'Advisory.', check: () => 'advisory' },
      { n: 2, cat: 'A', schedule: 'Sch CG', text: 'Blocking.', check: () => 'blocking' },
    ];
    const report = validateReturn(blank(), { schedules: [], rules, softwareId: REGISTERED });

    expect(report.findings.map((f) => f.cat)).toEqual(['A', 'D']);
    expect(report.blocking).toHaveLength(1);
    expect(report.advisory).toHaveLength(1);
  });

  it('reports a rule that throws as a Category B finding naming the rule', () => {
    const rules: RuleDef[] = [
      {
        n: 999,
        cat: 'A',
        schedule: 'Sch CG',
        text: 'A rule that cannot be applied.',
        check: () => {
          throw new Error('cost of acquisition is undefined');
        },
      },
    ];
    const report = validateReturn(blank(), { schedules: [], rules, softwareId: REGISTERED });

    expect(report.rulesApplied).toBe(1);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].n).toBe(999);
    expect(report.findings[0].cat).toBe('B');
    expect(report.findings[0].message).toContain('Category A rule 999 could not be applied');
    expect(report.findings[0].message).toContain('cost of acquisition is undefined');
  });

  it('refuses to upload while the software identifier is the placeholder', () => {
    const placeholder = validateReturn(blank(), {
      schedules: [],
      rules: [],
      softwareId: PLACEHOLDER_SOFTWARE_ID,
    });

    expect(placeholder.canUpload).toBe(false);
    expect(placeholder.blocking).toHaveLength(1);
    expect(placeholder.blocking[0].schedule).toBe('CreationInfo');
    expect(placeholder.blocking[0].message).toContain('Software ID registered');

    const registered = validateReturn(blank(), {
      schedules: [],
      rules: [],
      softwareId: REGISTERED,
    });

    expect(registered.canUpload).toBe(true);
  });
});

describe('buildContext', () => {
  const scheduleWithCalc: ScheduleDef[] = [
    {
      id: 'X',
      code: 'ScheduleX',
      no: 'X',
      name: 'Schedule X',
      part: 'Part B',
      forms: ['ITR2'],
      sections: [
        { key: 's', title: 'S', calcs: [{ key: 'total', label: 'Total', expr: 'X.a+X.b' }] },
      ],
    },
  ];

  it('coerces values and skips empty rows', () => {
    const data = blank();
    data.fields['X.a'] = '1200';
    data.fields['X.b'] = 'not a number';
    data.fields['X.c'] = null;
    data.tables.rows = [{ amt: 5 }, { amt: null, name: '' }, {}];

    const ctx = buildContext(data, [], {});

    expect(ctx.N('X.a')).toBe(1200);
    expect(ctx.N('X.b')).toBe(0);
    expect(ctx.N('X.missing')).toBe(0);
    expect(ctx.V('X.c')).toBe('');
    expect(ctx.rows('rows')).toEqual([{ amt: 5 }]);
    expect(ctx.rows('absent')).toEqual([]);
  });

  it('lets a derived figure win over a stored copy of itself', () => {
    const data = blank();
    data.fields['X.total'] = 5;

    const ctx = buildContext(data, scheduleWithCalc, { 'X.total': 30, total: 30 });

    expect(ctx.N('X.total')).toBe(30);
    expect(ctx.C('total')).toBe(30);
    expect(ctx.C('unknown')).toBe(0);
  });

  it('takes age on 1 April 2026', () => {
    const senior = buildContext(blank({ dateOfBirth: '1966-04-01' }), [], {});
    const notYet = buildContext(blank({ dateOfBirth: '1966-04-02' }), [], {});
    const superSenior = buildContext(blank({ dateOfBirth: '1946-01-01' }), [], {});

    expect(senior.isSenior).toBe(true);
    expect(senior.isSuperSenior).toBe(false);
    expect(notYet.isSenior).toBe(false);
    expect(superSenior.isSuperSenior).toBe(true);
    expect(buildContext(blank(), [], {}).isSenior).toBe(false);
  });

  it('treats a return as belated by its section or by its filing date', () => {
    const onTime = buildContext(blank(), [], {});
    const bySection = buildContext(blank({ filingSection: '139(4)' as FilingSection }), [], {});
    const byDate = buildContext(blank({ filingDate: '2026-10-02' }), [], {});

    expect(onTime.isBelated).toBe(false);
    expect(bySection.isBelated).toBe(true);
    expect(byDate.isBelated).toBe(true);
  });
});
