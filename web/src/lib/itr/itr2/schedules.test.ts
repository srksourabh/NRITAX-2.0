import { describe, expect, it } from 'vitest';

import { ITR2_OPTIONS, ITR2_SCHEDULES, itr2Schedule } from '@/lib/itr/itr2/schedules';
import type { FieldDef, ScheduleDef } from '@/lib/itr/types';

/** Every field and column of a schedule, tables included. */
function allFields(schedule: ScheduleDef): FieldDef[] {
  return schedule.sections.flatMap((section) => [
    ...(section.fields ?? []),
    ...(section.tables ?? []).flatMap((table) => table.columns),
  ]);
}

/** Field, calculation and table keys of a schedule, in one list. */
function allKeys(schedule: ScheduleDef): string[] {
  return schedule.sections.flatMap((section) => [
    ...(section.fields ?? []).map((f) => f.key),
    ...(section.calcs ?? []).map((c) => c.key),
    ...(section.tables ?? []).map((t) => t.key),
  ]);
}

describe('ITR-2 schema', () => {
  it('has no duplicate schedule ids', () => {
    const ids = ITR2_SCHEDULES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves every schedule through itr2Schedule and nothing else', () => {
    for (const schedule of ITR2_SCHEDULES) {
      expect(itr2Schedule(schedule.id)).toBe(schedule);
    }
    expect(itr2Schedule('NOPE')).toBeUndefined();
  });

  it.each(ITR2_SCHEDULES.map((s) => [s.id, s] as const))(
    '%s keeps every field, calc and table key unique within the schedule',
    (_id, schedule) => {
      const keys = allKeys(schedule);
      const seen = new Set<string>();
      const duplicates = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
      expect(duplicates).toEqual([]);
    },
  );

  it.each(ITR2_SCHEDULES.map((s) => [s.id, s] as const))(
    '%s keeps column keys unique within each table',
    (_id, schedule) => {
      for (const section of schedule.sections) {
        for (const table of section.tables ?? []) {
          const keys = table.columns.map((c) => c.key);
          expect(new Set(keys).size, `${table.key} has a repeated column key`).toBe(keys.length);
        }
      }
    },
  );

  it('gives every declared path a non-empty slash-delimited form', () => {
    const paths: Array<{ owner: string; path: string }> = [];
    for (const schedule of ITR2_SCHEDULES) {
      for (const field of allFields(schedule)) {
        if (field.path !== undefined) paths.push({ owner: `${schedule.id}.${field.key}`, path: field.path });
      }
      for (const section of schedule.sections) {
        for (const calc of section.calcs ?? []) {
          if (calc.path !== undefined) paths.push({ owner: `${schedule.id}.${calc.key}`, path: calc.path });
        }
        for (const table of section.tables ?? []) {
          if (table.path !== undefined) paths.push({ owner: table.key, path: table.path });
        }
      }
    }

    expect(paths.length).toBeGreaterThan(0);
    for (const { owner, path } of paths) {
      expect(path, `${owner} has an empty path`).not.toBe('');
      // Dots and backslashes mean the prototype's delimiter survived the port.
      expect(path, `${owner} is not slash-delimited`).not.toMatch(/[.\\]/);
      expect(path, `${owner} has a leading or trailing slash`).not.toMatch(/^\/|\/$/);
      expect(path.split('/').every((seg) => seg.length > 0), `${owner} has an empty segment`).toBe(true);
    }
  });

  it('gives every select field at least two options', () => {
    for (const schedule of ITR2_SCHEDULES) {
      for (const field of allFields(schedule)) {
        if (field.type !== 'sel') continue;
        expect(field.options?.length ?? 0, `${schedule.id}.${field.key} has too few options`)
          .toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('names every schedule, section and table', () => {
    for (const schedule of ITR2_SCHEDULES) {
      expect(schedule.name).not.toBe('');
      expect(schedule.code).not.toBe('');
      expect(schedule.forms).toContain('ITR2');
      for (const section of schedule.sections) {
        expect(section.key, `${schedule.id} has an unkeyed section`).not.toBe('');
        expect(section.title, `${schedule.id}.${section.key} has no title`).not.toBe('');
      }
    }
  });

  it('covers the schedules ITR-2 requires', () => {
    const ids = ITR2_SCHEDULES.map((s) => s.id);
    expect(ids).toEqual([
      'GEN', 'S', 'HP', 'CG', 'OS', 'CYLA', 'CFL', 'VIA', 'S80G', 'S80D', 'EI',
      'TR', 'FSI', 'FA', 'AL', 'SI', 'S5A', 'TDS', 'IT', 'TI', 'TTI', 'VER',
    ]);
  });
});

describe('ITR-2 option lists', () => {
  it('splits a coded entry into its departmental code and wording', () => {
    expect(ITR2_OPTIONS.STATE[0]).toEqual({ value: '01', label: 'Andaman and Nicobar Islands' });
    expect(ITR2_OPTIONS.RESI[0]).toEqual({ value: 'RES', label: 'Resident' });
    expect(ITR2_OPTIONS.YN[1]).toEqual({ value: 'N', label: 'No' });
    expect(ITR2_OPTIONS.FILEDUS[0]).toEqual({ value: '11', label: '139(1) — on or before the due date' });
  });

  it('does not mistake a hyphen inside a word for a code separator', () => {
    const proviso = ITR2_OPTIONS.TDSSEC.find((o) => o.value.startsWith('First Proviso'));
    expect(proviso?.value).toBe('First Proviso to sub-section(1) of section 194R');
    expect(ITR2_OPTIONS.FY[0]).toEqual({ value: '2008-09', label: '2008-09' });
  });

  it('drops the "Sec " prefix from the section 10 allowance codes', () => {
    expect(ITR2_OPTIONS.ALLOW[0].value).toBe('10(6)');
  });

  it('carries no placeholder entry', () => {
    for (const [name, options] of Object.entries(ITR2_OPTIONS)) {
      expect(options.length, `${name} is empty`).toBeGreaterThan(0);
      for (const option of options) {
        expect(option.value, `${name} holds a placeholder`).not.toBe('(Select)');
        expect(option.value).not.toBe('');
        expect(option.label).not.toBe('');
      }
    }
  });
});
