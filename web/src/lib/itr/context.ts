/**
 * NRITAX — the rule context.
 *
 * A CBDT validation rule reads the return through RuleContext and through
 * nothing else. This file is the single place that decides how a stored field,
 * a table row and a computed figure become the values a rule sees, which is
 * what keeps the rule sets free of the schema and of the calculation engine.
 */

import type {
  FieldValue,
  ReturnData,
  RuleContext,
  ScheduleDef,
  TableRow,
} from '@/lib/itr/types';

/**
 * Age is taken on the first day of the assessment year. Someone born on
 * 1 April 1966 is sixty on that date and gets the senior-citizen slab; someone
 * born a day later is not.
 */
const AGE_ON = '2026-04-01';

const SENIOR_AGE = 60;
const SUPER_SENIOR_AGE = 80;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Number of a stored value. Blank, absent and non-numeric are all nil. */
function num(value: FieldValue | undefined): number {
  if (value === null || value === undefined) return 0;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '') return 0;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : 0;
}

/** Text of a stored value. Null and absent are the empty string. */
function text(value: FieldValue | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

/** True when a cell holds something rather than nothing. Zero is something. */
function present(value: FieldValue): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

/** Completed years between an ISO date of birth and an ISO date; -1 when unusable. */
function completedYears(dateOfBirth: string | undefined, on: string): number {
  if (!dateOfBirth || !ISO_DATE.test(dateOfBirth)) return -1;
  const years = Number(on.slice(0, 4)) - Number(dateOfBirth.slice(0, 4));
  // Both slices are "mm-dd", so a string comparison orders them correctly.
  return on.slice(5) < dateOfBirth.slice(5) ? years - 1 : years;
}

/** Fully qualified keys the schema derives rather than stores. */
function derivedKeys(schedules: readonly ScheduleDef[]): Set<string> {
  const keys = new Set<string>();
  for (const schedule of schedules) {
    for (const section of schedule.sections) {
      for (const calc of section.calcs ?? []) keys.add(`${schedule.id}.${calc.key}`);
    }
  }
  return keys;
}

/**
 * The context the rule sets run against. `calcs` is what evaluateCalcs
 * returned for the same schedules and the same data, keyed both fully and by
 * bare calc key.
 */
export function buildContext(
  data: ReturnData,
  schedules: readonly ScheduleDef[],
  calcs: Readonly<Record<string, number>>,
): RuleContext {
  const derived = derivedKeys(schedules);
  const { meta } = data;
  const age = completedYears(meta.dateOfBirth, AGE_ON);
  const filedLate = Boolean(meta.filingDate) && Boolean(meta.dueDate) && meta.filingDate > meta.dueDate;

  const C = (key: string): number => {
    const value = calcs[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  };

  return {
    data,
    form: meta.form,
    regime: meta.regime,
    status: meta.status,
    residentialStatus: meta.residentialStatus,
    // A figure the schema derives wins over a stored copy of itself, the same
    // way it does inside a calc expression.
    N: (key) => (derived.has(key) ? C(key) : num(data.fields[key])),
    V: (key) => text(data.fields[key]),
    rows: (tableKey): TableRow[] =>
      (data.tables[tableKey] ?? []).filter((row) => Object.values(row).some(present)),
    C,
    isHUF: meta.status === 'H',
    isIndividual: meta.status === 'I',
    isNRI: meta.residentialStatus === 'NRI',
    isResident: meta.residentialStatus === 'RES',
    isSenior: age >= SENIOR_AGE,
    isSuperSenior: age >= SUPER_SENIOR_AGE,
    isBelated: meta.filingSection === '139(4)' || filedLate,
  };
}
