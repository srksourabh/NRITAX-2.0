import { describe, expect, it } from 'vitest';

import type { FieldDef, ScheduleDef, TableDef } from '@/lib/itr/types';
import { ITR3_OPTIONS, ITR3_SCHEDULES, itr3Schedule } from '@/lib/itr/itr3/schedules';
import {
  SCH_COUNTRY,
  SCH_COUNTRY_FIELDS,
  SCH_FIELDS,
  SCH_SCALAR_IN_ARRAY,
  SCH_STATE,
  SCH_STATE_FIELDS,
  SCH_TABLES,
} from '@/lib/itr/itr3/paths';

const fieldsOf = (s: ScheduleDef): FieldDef[] => s.sections.flatMap((x) => x.fields ?? []);
const tablesOf = (s: ScheduleDef): TableDef[] => s.sections.flatMap((x) => x.tables ?? []);

/** Every field addressed the way the rest of the engine addresses it. */
const qualifiedKeys = new Set(
  ITR3_SCHEDULES.flatMap((s) => fieldsOf(s).map((f) => `${s.id}.${f.key}`))
);

const tableKeys = new Set(ITR3_SCHEDULES.flatMap((s) => tablesOf(s).map((t) => t.key)));

describe('ITR3_SCHEDULES', () => {
  it('gives every schedule a unique id and marks it as an ITR-3 schedule', () => {
    const ids = ITR3_SCHEDULES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of ITR3_SCHEDULES) expect(s.forms).toContain('ITR3');
  });

  it('keeps field keys unique within a schedule', () => {
    for (const s of ITR3_SCHEDULES) {
      const keys = fieldsOf(s).map((f) => f.key);
      expect(new Set(keys).size, `duplicate field key in schedule ${s.id}`).toBe(keys.length);
    }
  });

  it('keeps column keys unique within a table', () => {
    for (const s of ITR3_SCHEDULES) {
      for (const t of tablesOf(s)) {
        const keys = t.columns.map((c) => c.key);
        expect(new Set(keys).size, `duplicate column key in table ${t.key}`).toBe(keys.length);
      }
    }
  });

  it('uses table keys that are unique across the form', () => {
    const keys = ITR3_SCHEDULES.flatMap((s) => tablesOf(s).map((t) => t.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('points every showIf at a field that exists', () => {
    const conditions = [
      ...ITR3_SCHEDULES.flatMap((s) => (s.showIf ? [s.showIf] : [])),
      ...ITR3_SCHEDULES.flatMap((s) => s.sections.flatMap((x) => (x.showIf ? [x.showIf] : []))),
      ...ITR3_SCHEDULES.flatMap((s) => fieldsOf(s).flatMap((f) => (f.showIf ? [f.showIf] : []))),
    ];
    expect(conditions.length).toBeGreaterThan(0);
    for (const c of conditions) expect(qualifiedKeys, `showIf on ${c.field}`).toContain(c.field);
  });

  it('finds a schedule by id and nothing by an unknown id', () => {
    expect(itr3Schedule('CG')?.code).toBe('ScheduleCGFor23');
    expect(itr3Schedule('GEN')?.code).toBe('PartA_GEN1');
    expect(itr3Schedule('nope')).toBeUndefined();
  });
});

describe('SCH_FIELDS', () => {
  it('resolves every key to a field that exists', () => {
    for (const key of Object.keys(SCH_FIELDS)) {
      expect(qualifiedKeys, `SCH_FIELDS key ${key}`).toContain(key);
    }
  });

  it('carries the same path the field carries', () => {
    for (const s of ITR3_SCHEDULES) {
      for (const f of fieldsOf(s)) {
        const key = `${s.id}.${f.key}`;
        if (f.path) expect(SCH_FIELDS[key], `path drift on ${key}`).toBe(f.path);
      }
    }
  });

  it('resolves every scalar-in-array and state or country key to a field', () => {
    for (const key of Object.keys(SCH_SCALAR_IN_ARRAY)) expect(qualifiedKeys).toContain(key);
    for (const key of SCH_STATE_FIELDS) expect(qualifiedKeys).toContain(key);
    for (const key of SCH_COUNTRY_FIELDS) expect(qualifiedKeys).toContain(key);
  });
});

describe('SCH_TABLES', () => {
  it('names a table that exists', () => {
    for (const key of Object.keys(SCH_TABLES)) {
      expect(tableKeys, `SCH_TABLES key ${key}`).toContain(key);
    }
  });

  it('names the schedule the table belongs to', () => {
    for (const [key, map] of Object.entries(SCH_TABLES)) {
      const owner = ITR3_SCHEDULES.find((s) => tablesOf(s).some((t) => t.key === key));
      expect(owner?.id, `sheet mismatch on ${key}`).toBe(map.sheet);
    }
  });

  it('maps only columns the table declares', () => {
    for (const [key, map] of Object.entries(SCH_TABLES)) {
      const table = ITR3_SCHEDULES.flatMap(tablesOf).find((t) => t.key === key);
      const columns = new Set(table?.columns.map((c) => c.key));
      const mapped = [
        ...map.groups.flatMap((g) => Object.keys(g.cols)),
        ...Object.keys(map.orphan),
      ];
      for (const col of mapped) expect(columns, `${key}.${col}`).toContain(col);
    }
  });

  it('gives every table a path or a route for its rows', () => {
    for (const [key, map] of Object.entries(SCH_TABLES)) {
      const table = ITR3_SCHEDULES.flatMap(tablesOf).find((t) => t.key === key);
      if (map.groups.length) expect(table?.path).toBe(map.groups[0].array);
      else expect(table?.path).toBeUndefined();
    }
  });
});

describe('ITR3_OPTIONS', () => {
  it('offers one option per published state and country code', () => {
    expect(ITR3_OPTIONS.state).toHaveLength(Object.keys(SCH_STATE).length);
    expect(ITR3_OPTIONS.country).toHaveLength(Object.keys(SCH_COUNTRY).length);
    for (const o of ITR3_OPTIONS.state) expect(SCH_STATE[o.label]).toBe(o.value);
    for (const o of ITR3_OPTIONS.country) expect(SCH_COUNTRY[o.label]).toBe(o.value);
  });
});
