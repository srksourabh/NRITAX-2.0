/**
 * Reads the pre-filled JSON a taxpayer downloads from the Income Tax portal.
 *
 * There is deliberately no mapping table in this file. Every field in the ITR-2
 * and ITR-3 schemas already carries the departmental path it came from, ported
 * from the offline utility, and the pre-fill file uses those same node names. So
 * the importer indexes the schema by path and matches whatever the file happens
 * to contain. When the department adds a node, the field that reads it is the
 * only thing that has to change.
 *
 * This is the route that works with no e-Return Intermediary licence: the
 * taxpayer downloads one file and uploads it. The ERI provider, when we have
 * one, returns the same structure and lands in the same place.
 */

import type {
  ColumnDef,
  FieldDef,
  FieldValue,
  FormType,
  ReturnData,
  ScheduleDef,
  TableRow,
} from '@/lib/itr/types';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3';
import { ASSESSMENT_YEAR } from '@/lib/itr/types';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

export interface PrefillFileResult {
  form: FormType;
  /** PAN as stated in the file, so the caller can refuse a file for another person. */
  pan: string | null;
  assessmentYear: string | null;
  /** Keyed `${scheduleId}.${fieldKey}`, ready to merge into ReturnData.fields. */
  fields: Record<string, FieldValue>;
  /** Keyed by TableDef.key, ready to merge into ReturnData.tables. */
  tables: Record<string, TableRow[]>;
  /** How many values were understood. Zero means the file is not what we think. */
  matched: number;
  /** Paths present in the file that no field claims. Diagnostic, not an error. */
  unmatched: string[];
  warnings: string[];
}

export class PrefillFileError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_JSON' | 'NOT_A_PREFILL' | 'WRONG_FORM' | 'WRONG_PAN',
  ) {
    super(message);
    this.name = 'PrefillFileError';
  }
}

/** Capped so a wildly unexpected file cannot fill memory with path strings. */
const MAX_UNMATCHED = 200;

const PAN_PATHS = [
  'PartA_GEN1/PersonalInfo/PAN',
  'PersonalInfo/PAN',
  'PAN',
] as const;

// ── schema index ─────────────────────────────────────────────────────────────

interface ScalarEntry {
  key: string;
  def: FieldDef;
}

interface TableEntry {
  key: string;
  columns: ReadonlyMap<string, ColumnDef>;
}

interface SchemaIndex {
  scalars: ReadonlyMap<string, ScalarEntry>;
  tables: ReadonlyMap<string, TableEntry>;
}

function buildIndex(schedules: readonly ScheduleDef[]): SchemaIndex {
  const scalars = new Map<string, ScalarEntry>();
  const tables = new Map<string, TableEntry>();

  for (const schedule of schedules) {
    for (const section of schedule.sections) {
      for (const field of section.fields ?? []) {
        if (field.path && !scalars.has(field.path)) {
          scalars.set(field.path, { key: `${schedule.id}.${field.key}`, def: field });
        }
      }
      for (const table of section.tables ?? []) {
        if (!table.path || tables.has(table.path)) continue;
        const columns = new Map<string, ColumnDef>();
        for (const column of table.columns) {
          if (column.path) columns.set(column.path, column);
        }
        if (columns.size) tables.set(table.path, { key: table.key, columns });
      }
    }
  }

  return { scalars, tables };
}

let itr2Index: SchemaIndex | null = null;
let itr3Index: SchemaIndex | null = null;

function indexFor(form: FormType): SchemaIndex {
  if (form === 'ITR2') {
    itr2Index ??= buildIndex(ITR2_SCHEDULES);
    return itr2Index;
  }
  itr3Index ??= buildIndex(ITR3_SCHEDULES);
  return itr3Index;
}

// ── value handling ───────────────────────────────────────────────────────────

function asObject(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

/** The department writes dates several ways. Everything becomes ISO or nothing. */
function toIso(value: string): string | null {
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const dmy = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const iso = text.match(/^(\d{4}-\d{2}-\d{2})T/);
  return iso ? iso[1] : null;
}

function coerce(raw: Json, def: FieldDef | ColumnDef): FieldValue | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'boolean') return raw ? 'Y' : 'N';

  if (def.type === 'num' || def.type === 'dec') {
    const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[,\s₹]/g, ''));
    if (!Number.isFinite(n)) return null;
    return def.type === 'num' ? Math.round(n) : n;
  }

  const text = String(raw).trim();
  if (!text) return null;

  if (def.type === 'date') return toIso(text);

  if (def.type === 'sel' && def.options?.length) {
    const exact = def.options.find((o) => o.value === text);
    if (exact) return exact.value;
    const loose = def.options.find(
      (o) => o.value.toUpperCase() === text.toUpperCase(),
    );
    return loose ? loose.value : text;
  }

  return text;
}

function deepGet(node: JsonObject, path: string): Json | undefined {
  let current: Json | undefined = node;
  for (const segment of path.split('/')) {
    const object = asObject(current);
    if (!object) return undefined;
    current = object[segment];
  }
  return current;
}

// ── walking the file ─────────────────────────────────────────────────────────

interface Accumulator {
  fields: Record<string, FieldValue>;
  tables: Record<string, TableRow[]>;
  unmatched: string[];
  matched: number;
}

function collectRows(rows: readonly Json[], table: TableEntry, out: Accumulator): void {
  const collected: TableRow[] = [];

  for (const element of rows) {
    const object = asObject(element);
    if (!object) continue;

    const row: TableRow = {};
    for (const [relative, column] of table.columns) {
      const raw = deepGet(object, relative);
      if (raw === undefined) continue;
      const value = coerce(raw, column);
      if (value !== null) row[column.key] = value;
    }
    if (Object.keys(row).length) collected.push(row);
  }

  if (collected.length) {
    out.tables[table.key] = collected;
    out.matched += collected.length;
  }
}

function walk(node: Json, path: string, index: SchemaIndex, out: Accumulator): void {
  if (node === null || node === undefined) return;

  if (Array.isArray(node)) {
    const table = index.tables.get(path);
    if (table) {
      collectRows(node, table, out);
      return;
    }
    // The schema models some repeating blocks as single fields — Schedule S
    // salary is one. Descend the first element under the same path so those
    // still land, and say so rather than silently dropping the rest.
    if (node.length) {
      walk(node[0], path, index, out);
      if (node.length > 1 && index.scalars.has(path)) {
        out.unmatched.push(`${path}[${node.length - 1} further entries not read]`);
      }
    }
    return;
  }

  const object = asObject(node);
  if (object) {
    for (const [key, value] of Object.entries(object)) {
      walk(value, path ? `${path}/${key}` : key, index, out);
    }
    return;
  }

  const scalar = index.scalars.get(path);
  if (!scalar) {
    if (out.unmatched.length < MAX_UNMATCHED) out.unmatched.push(path);
    return;
  }

  const value = coerce(node, scalar.def);
  if (value !== null) {
    out.fields[scalar.key] = value;
    out.matched += 1;
  }
}

// ── entry points ─────────────────────────────────────────────────────────────

/** Which form the file is for, or null when the file does not say. */
export function detectPrefillForm(raw: unknown): FormType | null {
  const root = asObject(raw);
  if (!root) return null;

  const itr = asObject(root.ITR);
  if (itr) {
    if ('ITR2' in itr) return 'ITR2';
    if ('ITR3' in itr) return 'ITR3';
  }
  if ('Form_ITR2' in root) return 'ITR2';
  if ('Form_ITR3' in root) return 'ITR3';
  return null;
}

function unwrap(raw: unknown, form: FormType): JsonObject | null {
  const root = asObject(raw);
  if (!root) return null;

  const itr = asObject(root.ITR);
  if (itr) {
    const named = asObject(itr[form]);
    if (named) return peelFormEnvelope(named, form);
    const first = Object.values(itr).map(asObject).find(Boolean);
    if (first) return peelFormEnvelope(first, form);
  }

  return peelFormEnvelope(root, form);
}

/** True when the object looks like return schedules, not only Form_ITR* metadata. */
function hasScheduleBody(obj: JsonObject): boolean {
  return Object.keys(obj).some(
    (key) =>
      key.startsWith('PartA_') ||
      key.startsWith('PartB_') ||
      key.startsWith('Schedule') ||
      key === 'ITRSchedule' ||
      key === 'Verification' ||
      key === 'TaxComputation',
  );
}

/**
 * Portal / specimen files often nest schedules under Form_ITR2 / Form_ITR3.
 * Schema paths start at PartA_GEN1 / Schedule*, so peel that wrapper when needed.
 */
function peelFormEnvelope(obj: JsonObject, form: FormType): JsonObject {
  const formKey = form === 'ITR3' ? 'Form_ITR3' : 'Form_ITR2';
  const wrapped = asObject(obj[formKey]);
  if (wrapped && hasScheduleBody(wrapped)) return wrapped;
  if (hasScheduleBody(obj)) return obj;
  if (wrapped) return wrapped;
  return obj;
}

function readPan(body: JsonObject): string | null {
  for (const path of PAN_PATHS) {
    const value = deepGet(body, path);
    if (typeof value === 'string' && value.trim()) return value.trim().toUpperCase();
  }
  return null;
}

function readAssessmentYear(body: JsonObject): string | null {
  for (const key of ['Form_ITR2', 'Form_ITR3']) {
    const form = asObject(body[key]);
    const year = form?.AssessmentYear ?? form?.assessmentYear;
    if (typeof year === 'string' && year.trim()) return year.trim();
    if (typeof year === 'number') return String(year);
  }
  const top = body.AssessmentYear ?? body.assessmentYear;
  if (typeof top === 'string' && top.trim()) return top.trim();
  if (typeof top === 'number') return String(top);
  return null;
}

/**
 * Turns a downloaded pre-fill file into field and table values.
 *
 * `expectPan` guards against filing one person's figures against another's PAN,
 * which is the worst thing this importer could do. Pass it whenever the caller
 * knows whose return this is.
 */
export function importPrefillFile(
  raw: unknown,
  options: { form?: FormType; expectPan?: string } = {},
): PrefillFileResult {
  if (raw === null || typeof raw !== 'object') {
    throw new PrefillFileError('That file is not JSON we can read.', 'NOT_JSON');
  }

  const detected = detectPrefillForm(raw);
  const form = options.form ?? detected ?? 'ITR2';
  if (options.form && detected && detected !== options.form) {
    throw new PrefillFileError(
      `This is a ${detected.replace('ITR', 'ITR-')} pre-fill file, but the return being prepared is ${options.form.replace('ITR', 'ITR-')}.`,
      'WRONG_FORM',
    );
  }

  const body = unwrap(raw, form);
  if (!body) {
    throw new PrefillFileError('That file has no return data in it.', 'NOT_A_PREFILL');
  }

  const pan = readPan(body);
  if (options.expectPan && pan && pan !== options.expectPan.toUpperCase()) {
    throw new PrefillFileError(
      'That pre-fill file belongs to a different PAN.',
      'WRONG_PAN',
    );
  }

  const accumulator: Accumulator = { fields: {}, tables: {}, unmatched: [], matched: 0 };
  walk(body, '', indexFor(form), accumulator);

  const warnings: string[] = [];
  if (accumulator.matched === 0) {
    warnings.push(
      'Nothing in that file matched the return. Check it is the pre-filled JSON downloaded from the e-Filing portal and not an acknowledgement or a draft.',
    );
  }
  if (!detected) {
    warnings.push(
      `The file does not name its form, so it has been read as ${form.replace('ITR', 'ITR-')}.`,
    );
  }

  return {
    form,
    pan,
    assessmentYear: readAssessmentYear(body) ?? readAssessmentYear(asObject(raw) ?? {}),
    fields: accumulator.fields,
    tables: accumulator.tables,
    matched: accumulator.matched,
    unmatched: accumulator.unmatched,
    warnings,
  };
}

/**
 * Inserts imported prefill values into the live return the taxpayer is editing.
 * Prefill wins for every key it mapped; untouched keys keep the user's draft.
 */
export function applyPrefillToReturn(
  prev: ReturnData,
  imported: PrefillFileResult,
): ReturnData {
  const ayRaw = imported.assessmentYear?.trim() ?? '';
  const ayNormalized =
    /^\d{4}-\d{2}$/.test(ayRaw)
      ? ayRaw
      : /^\d{4}$/.test(ayRaw)
        ? `${ayRaw}-${String((Number(ayRaw) + 1) % 100).padStart(2, '0')}`
        : null;

  return {
    ...prev,
    meta: {
      ...prev.meta,
      form: imported.form,
      ...(ayNormalized === ASSESSMENT_YEAR
        ? { assessmentYear: ASSESSMENT_YEAR }
        : {}),
    },
    fields: {
      ...prev.fields,
      ...imported.fields,
    },
    tables: {
      ...prev.tables,
      ...imported.tables,
    },
  };
}
