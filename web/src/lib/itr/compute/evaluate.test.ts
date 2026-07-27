import { describe, expect, it } from 'vitest';

import {
  ASSESSMENT_YEAR,
  type CalcDef,
  type FieldValue,
  type ReturnData,
  type ScheduleDef,
  type TableRow,
} from '@/lib/itr/types';

import { evaluateCalcs, runCalcs, type CalcExternals } from './evaluate';

function schedule(id: string, calcs: CalcDef[]): ScheduleDef {
  return {
    id,
    code: `Schedule${id}`,
    no: id,
    name: `Schedule ${id}`,
    part: 'Part B — Heads of Income',
    forms: ['ITR2'],
    sections: [{ key: 'main', title: 'Main', calcs }],
  };
}

function calc(key: string, expr: string): CalcDef {
  return { key, label: key, expr };
}

function returnData(
  fields: Record<string, FieldValue> = {},
  tables: Record<string, TableRow[]> = {},
): ReturnData {
  return {
    meta: {
      form: 'ITR2',
      assessmentYear: ASSESSMENT_YEAR,
      regime: 'new',
      status: 'I',
      residentialStatus: 'NRI',
      filingSection: '139(1)',
      filingDate: '2026-07-15',
      dueDate: '2026-07-31',
    },
    fields,
    tables,
  };
}

/** Evaluate one expression against a set of figures. */
function one(
  expr: string,
  fields: Record<string, FieldValue> = {},
  tables: Record<string, TableRow[]> = {},
  externals: CalcExternals = {},
): number {
  return evaluateCalcs([schedule('X', [calc('out', expr)])], returnData(fields, tables), externals)[
    'X.out'
  ];
}

describe('expression grammar', () => {
  it('evaluates a nested expression', () => {
    const value = one('R10(MAX(MIN(X.a,X.b)*2-1234,0))', { 'X.a': 50000, 'X.b': 70000 });
    expect(value).toBe(98770);
  });

  it('honours precedence, parentheses and unary minus', () => {
    expect(one('2+3*4')).toBe(14);
    expect(one('(2+3)*4')).toBe(20);
    expect(one('-5+10')).toBe(5);
    expect(one('100/4-5')).toBe(20);
  });

  it('supports ABS, SUM and ROUND', () => {
    expect(one('ABS(0-7)+SUM(1,2,3)+ROUND(X.a)', { 'X.a': 2.6 })).toBe(16);
  });

  it('totals a table column with T(), ignoring blank rows', () => {
    const rows: TableRow[] = [{ hpLoss: 1000 }, { hpLoss: '2500' }, { hpLoss: '' }];
    expect(one('T(cfl.hpLoss)', {}, { cfl: rows })).toBe(3500);
  });

  it('totals a quarterly grid with Q(), whether it is fields or a table', () => {
    const flattened = { 'CG.q15_Upto15Of6': 10, 'CG.q15_Up16Of6To15Of9': 20, 'CG.q20_Upto15Of6': 5 };
    expect(one('Q(q15)', flattened)).toBe(30);
    expect(one('Q(acc)', {}, { acc: [{ q1: 100, q2: '250' }, { q1: 50 }] })).toBe(400);
  });

  it('resolves an unknown identifier to nil rather than failing', () => {
    const run = runCalcs([schedule('X', [calc('out', 'X.missing+5')])], returnData());
    expect(run.values['X.out']).toBe(5);
    expect(run.problems).toEqual([]);
  });

  it('takes what the schedules do not define from the externals', () => {
    expect(one('xTax-B(total)', {}, {}, { xTax: 1000, 'B(total)': 250 })).toBe(750);
  });

  it('rounds every calc to whole rupees', () => {
    expect(one('X.a/3', { 'X.a': 100 })).toBe(33);
  });
});

describe('resolution across schedules', () => {
  it('resolves calcs in dependency order, whichever order they are declared in', () => {
    const values = evaluateCalcs(
      [
        schedule('A', [calc('total', 'B.sub+10')]),
        schedule('B', [calc('sub', 'B.x*2')]),
      ],
      returnData({ 'B.x': 250 }),
    );

    expect(values['A.total']).toBe(510);
    expect(values['B.sub']).toBe(500);
  });

  it('keys each calc by its qualified key and by the bare key where unambiguous', () => {
    const values = evaluateCalcs(
      [
        schedule('A', [calc('unique', 'A.x'), calc('shared', 'A.x')]),
        schedule('B', [calc('shared', 'A.x')]),
      ],
      returnData({ 'A.x': 7 }),
    );

    expect(values['A.unique']).toBe(7);
    expect(values['unique']).toBe(7);
    expect(values['shared']).toBeUndefined();
  });

  it('prefers a calc over a field of the same name', () => {
    const values = evaluateCalcs(
      [schedule('A', [calc('total', 'A.x+1'), calc('out', 'A.total')])],
      returnData({ 'A.x': 5, 'A.total': 999 }),
    );

    expect(values['A.out']).toBe(6);
  });
});

describe('failures are reported, not thrown', () => {
  it('detects a cycle between two calcs', () => {
    const run = runCalcs(
      [schedule('A', [calc('loop', 'B.loop')]), schedule('B', [calc('loop', 'A.loop')])],
      returnData(),
    );

    expect(run.problems).toHaveLength(1);
    expect(run.problems[0].message).toContain('A.loop → B.loop → A.loop is a circular reference');
    expect(run.values['A.loop']).toBe(0);
    expect(run.values['B.loop']).toBe(0);
  });

  it('detects a calc that refers to itself', () => {
    const run = runCalcs([schedule('A', [calc('self', 'A.self+1')])], returnData());

    expect(run.problems).toHaveLength(1);
    expect(run.problems[0].key).toBe('A.self');
    expect(run.values['A.self']).toBe(0);
  });

  it('reports an unknown function and a malformed expression', () => {
    const run = runCalcs(
      [schedule('A', [calc('bad', 'FOO(1+2)'), calc('worse', '3+*4')])],
      returnData(),
    );

    expect(run.problems.map((p) => p.key)).toEqual(['A.bad', 'A.worse']);
    expect(run.problems[0].message).toContain('unknown function FOO()');
    expect(run.values['A.bad']).toBe(0);
    expect(run.values['A.worse']).toBe(0);
  });

  it('reports a division by zero', () => {
    const run = runCalcs([schedule('A', [calc('out', '100/A.x')])], returnData({ 'A.x': 0 }));

    expect(run.problems[0].message).toContain('division by zero');
    expect(run.values['A.out']).toBe(0);
  });

  it('refuses anything that is not arithmetic', () => {
    const run = runCalcs(
      [schedule('A', [calc('out', '1);process.exit(0);(')])],
      returnData(),
    );

    expect(run.problems).toHaveLength(1);
    expect(run.values['A.out']).toBe(0);
  });
});
