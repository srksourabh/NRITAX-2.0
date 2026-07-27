/**
 * Builds the departmental filing JSON from a ReturnData and its form schema.
 *
 * Field and table `path` values on the schema are the source of truth — the
 * same slash-delimited paths the prefill importer reads. CreationInfo is filled
 * from options so a draft can still be downloaded before ERI_SOFTWARE_ID is
 * registered.
 */

import { evaluateCalcs } from '@/lib/itr/compute/evaluate';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3';
import {
  ASSESSMENT_YEAR,
  type FieldDef,
  type FieldValue,
  type FormType,
  type GeneratedReturn,
  type ReturnData,
  type ScheduleDef,
  type TableRow,
} from '@/lib/itr/types';
import { isVisible, PLACEHOLDER_SOFTWARE_ID } from '@/lib/itr/validate';

export interface BuildJsonOptions {
  /** Departmental software id written into CreationInfo. */
  softwareId?: string;
  /** City of the intermediary; defaults to "N/A" for self-upload. */
  intermediaryCity?: string;
  schedules?: readonly ScheduleDef[];
  /** ISO date for JSONCreationDate; defaults to today. */
  createdOn?: string;
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

/** Walk a slash-delimited path and assign `value`, creating objects as needed. */
export function setPath(root: JsonObject, path: string, value: Json): void {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return;

  let cursor: JsonObject = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i]!;
    const next = cursor[part];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as JsonObject;
  }
  cursor[parts[parts.length - 1]!] = value;
}

function coerce(field: FieldDef, raw: FieldValue): Json | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;

  switch (field.type) {
    case 'num': {
      const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
      return Number.isFinite(n) ? Math.round(n) : undefined;
    }
    case 'dec': {
      const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
      return Number.isFinite(n) ? n : undefined;
    }
    case 'pan':
    case 'tan':
    case 'ifsc':
    case 'isin':
    case 'gstin':
    case 'bsr':
      return String(raw).toUpperCase();
    default:
      return typeof raw === 'number' ? raw : String(raw);
  }
}

function rowHasValue(row: TableRow): boolean {
  return Object.values(row).some((v) => v !== null && v !== undefined && v !== '');
}

function buildRow(columns: readonly FieldDef[], row: TableRow): JsonObject | null {
  const out: JsonObject = {};
  let wrote = false;
  for (const col of columns) {
    if (!col.path) continue;
    const value = coerce(col, row[col.key] ?? null);
    if (value === undefined) continue;
    setPath(out, col.path, value);
    wrote = true;
  }
  return wrote ? out : null;
}

function formEnvelope(
  form: FormType,
  body: JsonObject,
  options: Required<Pick<BuildJsonOptions, 'softwareId' | 'intermediaryCity' | 'createdOn'>>,
): Record<string, unknown> {
  const creation = {
    SWVersionNo: '1.0',
    SWCreatedBy: options.softwareId,
    JSONCreatedBy: options.softwareId,
    JSONCreationDate: options.createdOn,
    IntermediaryCity: options.intermediaryCity,
    Digest: '-',
  };

  if (form === 'ITR2') {
    return {
      ITR: {
        ITR2: {
          CreationInfo: creation,
          Form_ITR2: {
            FormName: 'ITR-2',
            Description:
              'For Individuals and HUFs not having income from profits and gains of business or profession',
            AssessmentYear: '2026',
            SchemaVer: 'Ver1.0',
            FormVer: 'Ver1.0',
          },
          ...body,
        },
      },
    };
  }

  return {
    ITR: {
      ITR3: {
        CreationInfo: creation,
        Form_ITR3: {
          FormName: 'ITR-3',
          Description:
            'For individuals and HUFs having income from profits and gains of business or profession',
          AssessmentYear: '2026',
          SchemaVer: 'Ver1.0',
          FormVer: 'Ver1.0',
        },
        ...body,
      },
    },
  };
}

function softwareIdFromEnv(): string {
  const value = typeof process === 'undefined' ? undefined : process.env.ERI_SOFTWARE_ID;
  return value?.trim() || PLACEHOLDER_SOFTWARE_ID;
}

/**
 * Build the departmental JSON for a return. Empty or hidden fields are omitted.
 * Calculated figures with a `path` are written from the evaluation engine.
 */
export function buildReturnJson(data: ReturnData, options: BuildJsonOptions = {}): GeneratedReturn {
  const form = data.meta.form;
  const schedules = options.schedules ?? (form === 'ITR3' ? ITR3_SCHEDULES : ITR2_SCHEDULES);
  const softwareId = options.softwareId ?? softwareIdFromEnv();
  const intermediaryCity = options.intermediaryCity ?? 'N/A';
  const createdOn = options.createdOn ?? new Date().toISOString().slice(0, 10);

  const calcs = evaluateCalcs(schedules, data);
  const body: JsonObject = {};

  for (const schedule of schedules) {
    if (!isVisible(schedule.showIf, data)) continue;
    if (!schedule.forms.includes(form)) continue;

    for (const section of schedule.sections) {
      if (!isVisible(section.showIf, data)) continue;

      for (const field of section.fields ?? []) {
        if (!field.path || !isVisible(field.showIf, data)) continue;
        const fq = `${schedule.id}.${field.key}`;
        const value = coerce(field, data.fields[fq] ?? null);
        if (value === undefined) continue;
        setPath(body, field.path, value);
      }

      for (const calc of section.calcs ?? []) {
        if (!calc.path) continue;
        const fq = `${schedule.id}.${calc.key}`;
        const n = calcs[fq];
        if (n === undefined || n === 0) {
          // Still emit explicit zeros when the calc resolved — skip only missing.
          if (n === undefined) continue;
        }
        setPath(body, calc.path, Math.round(n));
      }

      for (const table of section.tables ?? []) {
        if (!table.path || !isVisible(table.showIf, data)) continue;
        const rows = (data.tables[table.key] ?? []).filter(rowHasValue);
        if (rows.length === 0) continue;
        const mapped = rows
          .map((row) => buildRow(table.columns, row))
          .filter((row): row is JsonObject => row !== null);
        if (mapped.length === 0) continue;
        setPath(body, table.path, mapped);
      }
    }
  }

  const pan = String(data.fields['GEN.pan'] ?? 'DRAFT').toUpperCase() || 'DRAFT';
  const year = data.meta.assessmentYear || ASSESSMENT_YEAR;
  const fileName = `${form}_${pan}_AY${year}.json`;

  return {
    form,
    pan,
    assessmentYear: ASSESSMENT_YEAR,
    fileName,
    json: formEnvelope(form, body, { softwareId, intermediaryCity, createdOn }),
  };
}
