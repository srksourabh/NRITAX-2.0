/**
 * NRITAX — the validation runner.
 *
 * Two passes over a return. The first is driven by the schema: mandatory
 * particulars, formats, lengths, bounds, and dates that have to fall inside the
 * previous year. The second runs the CBDT rule set published for the form. Both
 * produce Finding, so the report is one list the taxpayer can work down, with
 * everything that would stop the upload at the top.
 */

import { evaluateCalcs, type CalcExternals } from '@/lib/itr/compute/evaluate';
import { buildContext } from '@/lib/itr/context';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2';
import { ITR2_RULES } from '@/lib/itr/itr2/rules';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3';
import { ITR3_RULES } from '@/lib/itr/itr3/rules';
import {
  FIELD_PATTERN,
  PREVIOUS_YEAR_END,
  PREVIOUS_YEAR_START,
  inr,
  type FieldCondition,
  type FieldDef,
  type FieldType,
  type FieldValue,
  type Finding,
  type ReturnData,
  type RuleCategory,
  type RuleDef,
  type ScheduleDef,
  type TableRow,
  type ValidationReport,
} from '@/lib/itr/types';

/** The identifier in .env.example. Category-A blacklisting attaches to it. */
export const PLACEHOLDER_SOFTWARE_ID = 'SW00000000';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Category A first, then B, then D. */
const CATEGORY_ORDER: Record<RuleCategory, number> = { A: 0, B: 1, D: 2 };

/** How each checked format is named when it is reported. */
const TYPE_NAME: Partial<Record<FieldType, string>> = {
  pan: 'Permanent Account Number',
  tan: 'Tax Deduction Account Number',
  aadhaar: 'Aadhaar number',
  mobile: 'mobile number',
  ifsc: 'Indian Financial System Code',
  pin: 'PIN code',
  email: 'email address',
  gstin: 'GST identification number',
  isin: 'International Securities Identification Number',
  bsr: 'BSR code',
};

/**
 * Date labels whose value has to fall inside the previous year. A transfer, a
 * sale or a contribution is an event of the year being returned. A purchase, an
 * acquisition, a deposit of self-assessment tax, a filing or an audit report is
 * not, so those dates are left alone.
 */
const PREVIOUS_YEAR_LABEL = /\b(transfer|sale|sold|contribution)\b/i;

/* ─────────────────────────── Field checks ─────────────────────────── */

function matches(value: string, expected: string | string[]): boolean {
  return Array.isArray(expected) ? expected.includes(value) : expected === value;
}

/** Whether a schedule, section, table, field or column is on screen at all. */
export function isVisible(condition: FieldCondition | undefined, data: ReturnData): boolean {
  if (!condition) return true;
  if (condition.regime && condition.regime !== data.meta.regime) return false;
  if (condition.form && condition.form !== data.meta.form) return false;
  const raw = data.fields[condition.field];
  const value = raw === null || raw === undefined ? '' : String(raw);
  if (condition.equals !== undefined && !matches(value, condition.equals)) return false;
  if (condition.notEquals !== undefined && matches(value, condition.notEquals)) return false;
  return true;
}

/** A row the taxpayer has started. An untouched row is not checked at all. */
function started(row: TableRow): boolean {
  return Object.values(row).some((v) => v !== null && v !== undefined && String(v).trim() !== '');
}

/** The one thing wrong with a value, or null when there is nothing wrong. */
function checkValue(field: FieldDef, raw: FieldValue | undefined): string | null {
  const value = raw === null || raw === undefined ? '' : String(raw).trim();

  if (value === '') {
    return field.required ? 'This particular is mandatory and has not been furnished.' : null;
  }

  const pattern = FIELD_PATTERN[field.type];
  if (pattern && !pattern.test(value)) {
    return `"${value}" is not a valid ${TYPE_NAME[field.type] ?? field.type}.`;
  }

  if (field.maxLen !== undefined && value.length > field.maxLen) {
    return `The form allows ${field.maxLen} characters; this is ${value.length}.`;
  }

  if (field.type === 'num' || field.type === 'dec') {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'This has to be a number.';
    if (field.type === 'num' && !Number.isInteger(n)) return 'Whole rupees only.';
    if (field.min !== undefined && n < field.min) return `This cannot be below ${inr(field.min)}.`;
    if (field.max !== undefined && n > field.max) return `This cannot exceed ${inr(field.max)}.`;
  }

  if (field.type === 'date') {
    if (!ISO_DATE.test(value)) return 'A date is written as yyyy-mm-dd.';
    if (
      PREVIOUS_YEAR_LABEL.test(field.label) &&
      (value < PREVIOUS_YEAR_START || value > PREVIOUS_YEAR_END)
    ) {
      return `This date has to fall within the previous year, ${PREVIOUS_YEAR_START} to ${PREVIOUS_YEAR_END}.`;
    }
  }

  return null;
}

/**
 * Mandatory particulars and formats, read straight off the schema. A field the
 * schema hides is never demanded, and an untouched table row is never checked;
 * every finding carries the key of the input that has to be corrected.
 */
export function validateFields(data: ReturnData, schedules: readonly ScheduleDef[]): Finding[] {
  const findings: Finding[] = [];

  const note = (schedule: string, field: string, label: string, message: string): void => {
    findings.push({ n: '—', cat: 'A', schedule, text: label, message, field });
  };

  for (const schedule of schedules) {
    if (!isVisible(schedule.showIf, data)) continue;

    for (const section of schedule.sections) {
      if (!isVisible(section.showIf, data)) continue;

      for (const field of section.fields ?? []) {
        if (!isVisible(field.showIf, data)) continue;
        const key = `${schedule.id}.${field.key}`;
        const message = checkValue(field, data.fields[key]);
        if (message) note(schedule.name, key, field.label, message);
      }

      for (const table of section.tables ?? []) {
        if (!isVisible(table.showIf, data)) continue;
        const rows = data.tables[table.key] ?? [];
        rows.forEach((row, index) => {
          if (!started(row)) return;
          for (const column of table.columns) {
            if (!isVisible(column.showIf, data)) continue;
            const message = checkValue(column, row[column.key]);
            if (message) {
              note(
                schedule.name,
                `${table.key}[${index}].${column.key}`,
                `${table.title} · row ${index + 1} · ${column.label}`,
                message,
              );
            }
          }
        });
      }
    }
  }

  return findings;
}

/* ─────────────────────────── The runner ─────────────────────────── */

export interface ValidateOptions {
  /** Overrides the schedule set the form would otherwise resolve to. */
  schedules?: readonly ScheduleDef[];
  /** Overrides the rule set the form would otherwise resolve to. */
  rules?: readonly RuleDef[];
  /** Figures the schedules name but do not define; see compute/evaluate.ts. */
  externals?: CalcExternals;
  /** Departmental software identifier. Defaults to ERI_SOFTWARE_ID. */
  softwareId?: string;
}

/** ERI_SOFTWARE_ID, or the placeholder where the environment does not set it. */
function environmentSoftwareId(): string {
  const value = typeof process === 'undefined' ? undefined : process.env.ERI_SOFTWARE_ID;
  return value?.trim() || PLACEHOLDER_SOFTWARE_ID;
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Validate a whole return: the schema checks, then every rule published for the
 * form. A rule that throws is a bug in the rule, so it is reported by number as
 * a Category B finding rather than passed over — a check that did not run is
 * not a check that passed.
 */
export function validateReturn(
  data: ReturnData,
  options: ValidateOptions = {},
): ValidationReport {
  const form = data.meta.form;
  const schedules = options.schedules ?? (form === 'ITR3' ? ITR3_SCHEDULES : ITR2_SCHEDULES);
  const rules = options.rules ?? (form === 'ITR3' ? ITR3_RULES : ITR2_RULES);

  const calcs = evaluateCalcs(schedules, data, options.externals);
  const ctx = buildContext(data, schedules, calcs);

  const fieldErrors = validateFields(data, schedules);
  const ruleFindings: Finding[] = [];
  let rulesApplied = 0;

  for (const rule of rules) {
    if (rule.forms && !rule.forms.includes(form)) continue;
    rulesApplied += 1;
    try {
      const message = rule.check(ctx);
      if (message) {
        ruleFindings.push({
          n: rule.n,
          cat: rule.cat,
          schedule: rule.schedule,
          text: rule.text,
          message,
        });
      }
    } catch (error) {
      ruleFindings.push({
        n: rule.n,
        cat: 'B',
        schedule: rule.schedule,
        text: rule.text,
        message:
          `Category ${rule.cat} rule ${rule.n} could not be applied: ${reason(error)}. ` +
          'The particular it covers has not been checked; verify it by hand.',
      });
    }
  }

  const softwareId = options.softwareId ?? environmentSoftwareId();
  if (softwareId === PLACEHOLDER_SOFTWARE_ID) {
    ruleFindings.push({
      n: '—',
      cat: 'A',
      schedule: 'CreationInfo',
      text: 'The software identifier written into CreationInfo.',
      message:
        `The software identifier is still the placeholder ${PLACEHOLDER_SOFTWARE_ID}. ` +
        'NRITAX needs a Software ID registered with the Directorate of Income Tax (Systems) ' +
        '(or your ERI / Sandbox partner) before a return is filed under that ID. Until then, ' +
        'use demo validation only — Category-A defects on a shared placeholder can blacklist ' +
        'every return filed under it.',
    });
  }

  const findings = [...fieldErrors, ...ruleFindings].sort(
    (a, b) => CATEGORY_ORDER[a.cat] - CATEGORY_ORDER[b.cat],
  );
  const blocking = findings.filter((f) => f.cat === 'A');

  return {
    findings,
    blocking,
    advisory: findings.filter((f) => f.cat !== 'A'),
    fieldErrors,
    rulesApplied,
    canUpload: blocking.length === 0 && fieldErrors.length === 0,
  };
}
