/**
 * Puts Sandbox OCR Form 16 / Form 26AS payloads into a return.
 *
 * Pure: returns a new ReturnData. Already-filled scalar fields and non-empty
 * tables are left alone (same rules as applyPrefill). Never invents nature /
 * section codes the OCR did not carry. Source tags are form16 / form26as.
 */

import type { Form16Data, Form16Result, Form26AsData, Form26AsResult } from '@/lib/sandbox/ocr-types';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2/schedules';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3/schedules';
import { r0 } from '@/lib/itr/types';
import type {
  FieldDef,
  FieldValue,
  FormType,
  ReturnData,
  ScheduleDef,
  SourceKey,
  TableDef,
  TableRow,
} from '@/lib/itr/types';

export interface AppliedOcrField {
  field: string;
  value: FieldValue;
  source: SourceKey;
}

export interface OcrApplication {
  data: ReturnData;
  applied: AppliedOcrField[];
  skipped: string[];
  warnings: string[];
}

/* ─────────────────────────── Key maps (ITR2 / ITR3) ─────────────────────────── */

interface SalaryKeys {
  employerName?: string;
  employerTan?: string;
  sal17_1?: string;
  perq17_2?: string;
  profit17_3?: string;
  standardDeduction?: string;
  professionalTax?: string;
}

interface FormKeys {
  pan?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  salary: SalaryKeys;
  employers?: { table: string; name: string; tan: string };
  tds1: { table: string; tan: string; name: string; income: string; claimed: string };
  tds2: {
    table: string;
    tan: string;
    name: string;
    gross: string;
    head?: string;
    year?: string;
    deducted?: string;
    claimed: string;
  };
  tcs: { table: string; tan: string; name: string; collected: string; claimed: string };
  challan: { table: string; bsr: string; date: string; serial: string; amount: string };
}

const ITR2_KEYS: FormKeys = {
  pan: 'GEN.pan',
  firstName: 'GEN.firstName',
  middleName: 'GEN.middleName',
  surname: 'GEN.surname',
  salary: {
    sal17_1: 'S.sal17_1',
    perq17_2: 'S.sal17_2',
    profit17_3: 'S.sal17_3',
    standardDeduction: 'S.dedStd',
    professionalTax: 'S.dedProf',
  },
  employers: { table: 'emp', name: 'eName', tan: 'eTan' },
  tds1: { table: 'tds1', tan: 't1Tan', name: 't1Name', income: 't1Inc', claimed: 't1Tds' },
  tds2: {
    table: 'tds2',
    tan: 't2Tan',
    name: 't2Name',
    gross: 't2Gross',
    head: 't2Head',
    year: 't2Year',
    claimed: 't2Tds',
  },
  tcs: { table: 'tcs', tan: 'tcTan', name: 'tcName', collected: 'tcAmt', claimed: 'tcClaim' },
  challan: { table: 'chal', bsr: 'bsr', date: 'depDate', serial: 'srl', amount: 'chAmt' },
};

const ITR3_KEYS: FormKeys = {
  pan: 'GEN.PAN',
  firstName: 'GEN.FirstName',
  middleName: 'GEN.MiddleName',
  surname: 'GEN.SurNameOrOrgName',
  salary: {
    employerName: 'S.EmployerName',
    employerTan: 'S.EmployerTAN',
    sal17_1: 'S.Sal17_1',
    perq17_2: 'S.Perq17_2',
    profit17_3: 'S.Profit17_3',
    standardDeduction: 'S.StdDeduction',
    professionalTax: 'S.ProfTax',
  },
  tds1: { table: 'TDS1Rows', tan: 'TAN', name: 'EmpName', income: 'IncomeSal', claimed: 'TaxDeducted' },
  tds2: {
    table: 'TDS2Rows',
    tan: 'TAN2',
    name: 'DeductorName',
    gross: 'GrossAmt',
    head: 'HeadIncome',
    deducted: 'TDSDeducted',
    claimed: 'TDSClaimed',
  },
  tcs: {
    table: 'TCSRows',
    tan: 'CollectorTAN',
    name: 'CollectorName',
    collected: 'TCSCollected',
    claimed: 'TCSClaimed',
  },
  challan: { table: 'ITRows', bsr: 'BSRCode', date: 'DepDate', serial: 'ChallanNo', amount: 'TaxAmt' },
};

/** Head of income by TDS section — only known mappings; never invent. */
const SECTION_HEAD: Record<string, string> = {
  '193': 'OS',
  '194': 'OS',
  '194A': 'OS',
  '194K': 'OS',
  '194B': 'OS',
  '194BB': 'OS',
  '194BA': 'OS',
  '195': 'OS',
  '194I': 'HP',
  '194IB': 'HP',
  '194IA': 'CG',
  '194LA': 'CG',
};

/* ─────────────────────────── Schema index ─────────────────────────── */

interface FormIndex {
  fields: Map<string, FieldDef>;
  tables: Map<string, TableDef>;
}

const INDEXES = new Map<FormType, FormIndex>();

function buildIndex(schedules: ScheduleDef[]): FormIndex {
  const fields = new Map<string, FieldDef>();
  const tables = new Map<string, TableDef>();
  for (const schedule of schedules) {
    for (const section of schedule.sections) {
      for (const field of section.fields ?? []) fields.set(`${schedule.id}.${field.key}`, field);
      for (const table of section.tables ?? []) tables.set(table.key, table);
    }
  }
  return { fields, tables };
}

function formIndex(form: FormType): FormIndex {
  const held = INDEXES.get(form);
  if (held) return held;
  const built = buildIndex(form === 'ITR2' ? ITR2_SCHEDULES : ITR3_SCHEDULES);
  INDEXES.set(form, built);
  return built;
}

const filled = (value: FieldValue | undefined): boolean =>
  value !== undefined && value !== null && value !== '';

type Cells = Record<string, FieldValue | undefined>;

const cell = (key: string | undefined, value: FieldValue | undefined): Cells =>
  key === undefined || value === undefined ? {} : { [key]: value };

/* ─────────────────────────── Amount / table helpers ─────────────────────────── */

function money(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(n)) return undefined;
  const rounded = r0(n);
  return rounded === 0 ? undefined : rounded;
}

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t === '' ? undefined : t;
}

function normalizeSection(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  return cleaned || undefined;
}

function isSalarySection(section: string | undefined): boolean {
  const s = normalizeSection(section);
  return s === '192' || s === '192A' || (s?.startsWith('192') ?? false);
}

function headOfIncome(section: string | undefined): string | undefined {
  const s = normalizeSection(section);
  if (!s) return undefined;
  return SECTION_HEAD[s];
}

/**
 * Part A.tds is a jagged table: header then quarter rows and often a Total.
 * Prefer the Total row's tax_deducted; otherwise sum non-header rows.
 */
export function sumForm16Tds(tds: Array<Array<string | number | null>> | undefined): number | undefined {
  if (!tds || tds.length === 0) return undefined;
  const rows = tds.slice(1);
  if (rows.length === 0) return undefined;

  const header = (tds[0] ?? []).map((c) => String(c ?? '').toLowerCase());
  const taxIdx = Math.max(
    header.findIndex((h) => h.includes('tax_deducted') || h === 'tax deducted'),
    3,
  );

  const totalRow = rows.find((r) => String(r[0] ?? '').toLowerCase() === 'total');
  if (totalRow) {
    return money(totalRow[taxIdx] ?? totalRow[3]);
  }

  let sum = 0;
  let any = false;
  for (const row of rows) {
    const n = money(row[taxIdx] ?? row[3]);
    if (n === undefined) continue;
    sum += n;
    any = true;
  }
  return any ? r0(sum) : undefined;
}

/** First non-header section code from a deduction_wise table. */
function primarySection(
  deductionWise: Array<Array<string | number | null>> | undefined,
): string | undefined {
  if (!deductionWise || deductionWise.length < 2) return undefined;
  const header = (deductionWise[0] ?? []).map((c) => String(c ?? '').toLowerCase());
  const sectionIdx = Math.max(
    header.findIndex((h) => h === 'section' || h.includes('section')),
    1,
  );
  for (let i = 1; i < deductionWise.length; i += 1) {
    const section = text(deductionWise[i]?.[sectionIdx]);
    if (section) return section;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function pick(rec: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (rec[key] !== undefined && rec[key] !== null && rec[key] !== '') return rec[key];
  }
  return undefined;
}

interface SoftChallan {
  bsr?: string;
  date?: string;
  serial?: string;
  amount?: number;
}

interface SoftTcs {
  tan?: string;
  name?: string;
  collected?: number;
}

/** Defensive parse of Part IV (and similar) for challans / TCS. */
function parseLooseParts(parts: unknown[] | undefined): {
  challans: SoftChallan[];
  tcs: SoftTcs[];
} {
  const challans: SoftChallan[] = [];
  const tcs: SoftTcs[] = [];
  if (!parts) return { challans, tcs };

  for (const item of parts) {
    const r = asRecord(item);
    if (!r) continue;

    const bsr = text(pick(r, 'bsr_code', 'bsr', 'bsrCode', 'BSRCode'));
    const serial = text(pick(r, 'challan_serial_number', 'serial_number', 'challan_no', 'serial', 'ChallanNo'));
    const date = text(pick(r, 'date_of_deposit', 'deposit_date', 'date', 'DepDate'));
    const amount = money(pick(r, 'amount', 'tax_amount', 'amount_paid', 'TaxAmt'));
    if (bsr || serial || amount !== undefined) {
      challans.push({ bsr, date, serial, amount });
      continue;
    }

    const tan = text(pick(r, 'tan_of_collector', 'collector_tan', 'tan', 'CollectorTAN'));
    const name = text(pick(r, 'name_of_collector', 'collector_name', 'name', 'CollectorName'));
    const collected = money(
      pick(r, 'total_tcs', 'tcs_collected', 'tax_collected', 'amount_collected', 'TCSCollected'),
    );
    if (tan || collected !== undefined) {
      tcs.push({ tan, name, collected });
    }
  }

  return { challans, tcs };
}

/* ─────────────────────────── Writer ─────────────────────────── */

function createWriter(data: ReturnData, form: FormType, defaultSource: SourceKey) {
  const keys = form === 'ITR2' ? ITR2_KEYS : ITR3_KEYS;
  const index = formIndex(form);
  const fields: Record<string, FieldValue> = { ...data.fields };
  const tables: Record<string, TableRow[]> = { ...data.tables };
  const applied: AppliedOcrField[] = [];
  const skipped: string[] = [];

  function put(key: string | undefined, value: FieldValue | undefined, source: SourceKey = defaultSource): void {
    if (key === undefined || value === undefined || value === null || value === '') return;
    const def = index.fields.get(key);
    if (!def) return;
    if (filled(data.fields[key])) {
      skipped.push(key);
      return;
    }
    fields[key] = value;
    applied.push({ field: key, value, source: def.source ?? source });
  }

  function putTable(tableKey: string, cells: Cells[], source: SourceKey = defaultSource): void {
    const def = index.tables.get(tableKey);
    if (!def || cells.length === 0) return;
    if ((data.tables[tableKey] ?? []).some((row) => Object.values(row).some(filled))) {
      skipped.push(tableKey);
      return;
    }

    const rows = cells
      .map((sourceRow) => {
        const row: TableRow = {};
        for (const column of def.columns) {
          const value = sourceRow[column.key];
          if (value === undefined || value === null || value === '') continue;
          row[column.key] = value;
        }
        return row;
      })
      .filter((row) => Object.keys(row).length > 0);

    if (rows.length === 0) return;
    tables[tableKey] = rows;
    rows.forEach((row, i) => {
      for (const [col, value] of Object.entries(row)) {
        const column = def.columns.find((c) => c.key === col);
        applied.push({
          field: `${tableKey}[${i}].${col}`,
          value,
          source: column?.source ?? def.source ?? source,
        });
      }
    });
  }

  return {
    keys,
    put,
    putTable,
    result: (): OcrApplication => ({
      data: { ...data, fields, tables },
      applied,
      skipped,
      warnings: [],
    }),
  };
}

/* ─────────────────────────── Form 16 ─────────────────────────── */

export function applyForm16ToReturn(data: ReturnData, ocr: Form16Result | Form16Data): OcrApplication {
  const payload: Form16Data = 'ok' in ocr && ocr.ok === true ? ocr.data : (ocr as Form16Data);
  const form = data.meta.form;
  const w = createWriter(data, form, 'form16');
  const partA = payload['Part A'] ?? {};
  const partB = payload['Part B'] ?? {};
  const employer = partB.employer ?? partA.employer ?? {};
  const employee = partB.employee ?? partA.employee ?? {};
  const salary = partB.details_of_salary_paid ?? {};
  const gross = salary.gross_salary ?? {};
  const ded16 = salary.deduction_us_16 ?? {};

  w.put(w.keys.firstName, text(employee.first_name));
  w.put(w.keys.middleName, text(employee.middle_name));
  w.put(w.keys.surname, text(employee.last_name));
  w.put(w.keys.pan, text(employee.pan)?.toUpperCase());

  const employerName = text(employer.name);
  const employerTan = text(employer.tan)?.toUpperCase();
  w.put(w.keys.salary.employerName, employerName);
  w.put(w.keys.salary.employerTan, employerTan);

  w.put(w.keys.salary.sal17_1, money(gross.salary_as_per_provisions_contained_in_section_17_1));
  w.put(w.keys.salary.perq17_2, money(gross.value_of_perquisites_us_17_2));
  w.put(w.keys.salary.profit17_3, money(gross.profits_in_lieu_of_salary_us_17_3));
  w.put(w.keys.salary.standardDeduction, money(ded16.standard_deduction_us_16_ia));
  w.put(w.keys.salary.professionalTax, money(ded16.tax_on_employment_us_16_iii));

  if (w.keys.employers && (employerName || employerTan)) {
    w.putTable(w.keys.employers.table, [
      {
        ...cell(w.keys.employers.name, employerName),
        ...cell(w.keys.employers.tan, employerTan),
      },
    ]);
  }

  const chargeable =
    money(salary.income_chargeable_under_the_head_salaries) ??
    money(salary.total_amount_of_salary_received_from_current_employer);
  const taxDeducted = sumForm16Tds(partA.tds);

  if (employerTan || employerName || chargeable !== undefined || taxDeducted !== undefined) {
    w.putTable(w.keys.tds1.table, [
      {
        ...cell(w.keys.tds1.tan, employerTan),
        ...cell(w.keys.tds1.name, employerName),
        ...cell(w.keys.tds1.income, chargeable),
        ...cell(w.keys.tds1.claimed, taxDeducted),
      },
    ]);
  }

  const result = w.result();
  if (result.applied.length === 0) {
    result.warnings.push('Form 16 OCR produced no figures that could be applied.');
  }
  return result;
}

/* ─────────────────────────── Form 26AS ─────────────────────────── */

export function applyForm26AsToReturn(
  data: ReturnData,
  ocr: Form26AsResult | Form26AsData,
): OcrApplication {
  const payload: Form26AsData =
    'ok' in ocr && ocr.ok === true ? ocr.data : (ocr as Form26AsData);
  const form = data.meta.form;
  const w = createWriter(data, form, 'form26as');

  w.put(w.keys.pan, text(payload.pan)?.toUpperCase());

  const partI = Array.isArray(payload['Part I']) ? payload['Part I'] : [];
  const salaryRows: Cells[] = [];
  const otherRows: Cells[] = [];

  for (const entry of partI) {
    const tan = text(entry.tan_of_deductor)?.toUpperCase();
    const name = text(entry.name_of_deductor);
    const gross = money(entry.total_amount_paid_credited);
    const deducted = money(entry.total_tax_deducted) ?? money(entry.total_tds_deposited);
    const section = primarySection(entry.deduction_wise);
    const head = headOfIncome(section);
    const year = text(payload.financial_year);

    if (isSalarySection(section)) {
      salaryRows.push({
        ...cell(w.keys.tds1.tan, tan),
        ...cell(w.keys.tds1.name, name),
        ...cell(w.keys.tds1.income, gross),
        ...cell(w.keys.tds1.claimed, deducted),
      });
    } else {
      otherRows.push({
        ...cell(w.keys.tds2.tan, tan),
        ...cell(w.keys.tds2.name, name),
        ...cell(w.keys.tds2.gross, gross),
        ...cell(w.keys.tds2.head, head),
        ...cell(w.keys.tds2.year, year),
        ...cell(w.keys.tds2.deducted, deducted),
        ...cell(w.keys.tds2.claimed, deducted),
      });
    }
  }

  w.putTable(w.keys.tds1.table, salaryRows);
  w.putTable(w.keys.tds2.table, otherRows);

  const loose = [
    ...(Array.isArray(payload['Part IV']) ? payload['Part IV'] : []),
    ...(Array.isArray(payload['Part II']) ? payload['Part II'] : []),
    ...(Array.isArray(payload['Part III']) ? payload['Part III'] : []),
    ...(Array.isArray(payload['Part V']) ? payload['Part V'] : []),
    ...(Array.isArray(payload['Part VI']) ? payload['Part VI'] : []),
  ];
  const { challans, tcs } = parseLooseParts(loose);

  w.putTable(
    w.keys.tcs.table,
    tcs.map((row) => ({
      ...cell(w.keys.tcs.tan, row.tan?.toUpperCase()),
      ...cell(w.keys.tcs.name, row.name),
      ...cell(w.keys.tcs.collected, row.collected),
      ...cell(w.keys.tcs.claimed, row.collected),
    })),
  );

  w.putTable(
    w.keys.challan.table,
    challans.map((c) => ({
      ...cell(w.keys.challan.bsr, c.bsr),
      ...cell(w.keys.challan.date, c.date),
      ...cell(w.keys.challan.serial, c.serial),
      ...cell(w.keys.challan.amount, c.amount),
    })),
  );

  const result = w.result();
  if (result.applied.length === 0) {
    result.warnings.push('Form 26AS OCR produced no credits that could be applied.');
  }
  return result;
}
