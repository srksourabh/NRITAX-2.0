/**
 * Puts a departmental prefill payload into a return.
 *
 * The mapper is pure: it returns a new ReturnData and never touches the one it
 * was given. A field the taxpayer has already filled is left exactly as it is
 * and its key is reported in `skipped`, because prefill is a starting point and
 * the taxpayer's own figure is the one that gets filed.
 *
 * Field and table keys are not written out twice. The two key maps below name
 * the keys ITR-2 and ITR-3 use, and every write is resolved against the real
 * schedule definitions in src/lib/itr/itr2/schedules.ts and
 * src/lib/itr/itr3/schedules.ts — a key that is not in the schema is not
 * written, and a column the form does not declare is dropped.
 */

import type { PrefillChallan, PrefillPayload, PrefillSalary, PrefillTdsEntry } from '@/lib/eri/types';
import { ITR2_SCHEDULES } from '@/lib/itr/itr2/schedules';
import { ITR3_SCHEDULES } from '@/lib/itr/itr3/schedules';
import { PREVIOUS_YEAR_END, r0 } from '@/lib/itr/types';
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

/** One figure the mapper wrote, and where it came from. */
export interface AppliedField {
  /** `SCHEDULE.field` for a field, `table[row].column` for a table cell. */
  field: string;
  value: FieldValue;
  source: SourceKey;
}

export interface PrefillApplication {
  data: ReturnData;
  applied: AppliedField[];
  /** Keys left alone because the taxpayer had already filled them. */
  skipped: string[];
}

/* ─────────────────────────── Key maps ─────────────────────────── */

interface GeneralKeys {
  firstName?: string;
  middleName?: string;
  surname?: string;
  pan?: string;
  dob?: string;
  aadhaar?: string;
  status?: string;
  gender?: string;
  email?: string;
  mobile?: string;
  flatNo?: string;
  premises?: string;
  road?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  pin?: string;
}

interface SalaryKeys {
  employerName?: string;
  employerTan?: string;
  employerCategory?: string;
  sal17_1?: string;
  perq17_2?: string;
  profit17_3?: string;
  exemptAllowances?: string;
  standardDeduction?: string;
  professionalTax?: string;
}

interface OtherSourcesKeys {
  dividend?: string;
  interestGross?: string;
  savings?: string;
  deposits?: string;
  refund?: string;
  others?: string;
}

interface FormKeys {
  general: GeneralKeys;
  salary: SalaryKeys;
  otherSources: OtherSourcesKeys;
  /** Number of bank accounts held during the year. */
  bankCount?: string;
  employers?: { table: string; name: string; category: string; tan: string };
  tds1: { table: string; tan: string; name: string; income: string; claimed: string };
  tds2: {
    table: string;
    tan: string;
    name: string;
    gross: string;
    head: string;
    year?: string;
    deducted?: string;
    claimed: string;
  };
  tds3: {
    table: string;
    pan: string;
    name: string;
    gross: string;
    head?: string;
    deducted?: string;
    claimed: string;
  };
  tcs: { table: string; tan: string; name: string; collected: string; claimed: string };
  challan: { table: string; bsr: string; date: string; serial: string; amount: string };
  bank: { table: string; ifsc: string; name: string; account: string; type?: string; refund: string };
}

const ITR2_KEYS: FormKeys = {
  general: {
    firstName: 'GEN.firstName',
    middleName: 'GEN.middleName',
    surname: 'GEN.surname',
    pan: 'GEN.pan',
    dob: 'GEN.dob',
    aadhaar: 'GEN.aadhaar',
    status: 'GEN.status',
    gender: 'GEN.gender',
    email: 'GEN.email',
    mobile: 'GEN.mobile',
    flatNo: 'GEN.flatNo',
    premises: 'GEN.premises',
    road: 'GEN.road',
    locality: 'GEN.locality',
    city: 'GEN.city',
    state: 'GEN.state',
    country: 'GEN.country',
    pin: 'GEN.pin',
  },
  // ITR-2 holds the gross salary figures as totals across employers and the
  // employers themselves in a table; the exempt allowances need a nature code
  // the prefill does not carry, so they are left for the wizard.
  salary: {
    sal17_1: 'S.sal17_1',
    perq17_2: 'S.sal17_2',
    profit17_3: 'S.sal17_3',
    standardDeduction: 'S.dedStd',
    professionalTax: 'S.dedProf',
  },
  otherSources: {
    dividend: 'OS.osDiv',
    savings: 'OS.osSb',
    deposits: 'OS.osFd',
    refund: 'OS.osItr',
    others: 'OS.osOthInt',
  },
  bankCount: 'TTI.nAccounts',
  employers: { table: 'emp', name: 'eName', category: 'eCat', tan: 'eTan' },
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
  tds3: { table: 'tds3', pan: 't3Pan', name: 't3Name', gross: 't3Gross', head: 't3Head', claimed: 't3Tds' },
  tcs: { table: 'tcs', tan: 'tcTan', name: 'tcName', collected: 'tcAmt', claimed: 'tcClaim' },
  challan: { table: 'chal', bsr: 'bsr', date: 'depDate', serial: 'srl', amount: 'chAmt' },
  bank: { table: 'bank', ifsc: 'bIfsc', name: 'bName', account: 'bAcc', type: 'bType', refund: 'bRefund' },
};

const ITR3_KEYS: FormKeys = {
  general: {
    firstName: 'GEN.FirstName',
    middleName: 'GEN.MiddleName',
    surname: 'GEN.SurNameOrOrgName',
    pan: 'GEN.PAN',
    dob: 'GEN.DOB',
    aadhaar: 'GEN.AadhaarCardNo',
    status: 'GEN.Status',
    email: 'GEN.EmailAddress',
    mobile: 'GEN.MobileNo',
    flatNo: 'GEN.FlatDoorNo',
    premises: 'GEN.PremiseName',
    road: 'GEN.RoadStreet',
    locality: 'GEN.Locality',
    city: 'GEN.City',
    state: 'GEN.State',
    country: 'GEN.Country',
    pin: 'GEN.PinCode',
  },
  // ITR-3 collapses the employers into one Salaries block, so the first
  // employer's particulars go in and the amounts are the totals.
  salary: {
    employerName: 'S.EmployerName',
    employerTan: 'S.EmployerTAN',
    employerCategory: 'S.EmployerCategory',
    sal17_1: 'S.Sal17_1',
    perq17_2: 'S.Perq17_2',
    profit17_3: 'S.Profit17_3',
    exemptAllowances: 'S.ExemptAllow',
    standardDeduction: 'S.StdDeduction',
    professionalTax: 'S.ProfTax',
  },
  otherSources: {
    dividend: 'OS.Dividend1a',
    interestGross: 'OS.Interest1b',
    savings: 'OS.IntSavings',
    deposits: 'OS.IntDeposits',
    refund: 'OS.IntITRefund',
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
  tds3: {
    table: 'TDS3Rows',
    pan: 'TenantPAN',
    name: 'TenantName',
    gross: 'GrossRentAmt',
    deducted: 'TDSDed3',
    claimed: 'TDSClm3',
  },
  tcs: {
    table: 'TCSRows',
    tan: 'CollectorTAN',
    name: 'CollectorName',
    collected: 'TCSCollected',
    claimed: 'TCSClaimed',
  },
  challan: { table: 'ITRows', bsr: 'BSRCode', date: 'DepDate', serial: 'ChallanNo', amount: 'TaxAmt' },
  bank: { table: 'BankRows', ifsc: 'IFSC', name: 'BankName', account: 'AccountNo', refund: 'Nominate' },
};

/* ─────────────────────────── Departmental codes ─────────────────────────── */

/** Nature of employer. ITR-2 files the wording, ITR-3 the short code. */
const EMPLOYER_CATEGORY: ReadonlyArray<{ ITR2: string; ITR3: string }> = [
  { ITR2: 'Central Government', ITR3: 'CGOV' },
  { ITR2: 'State Government', ITR3: 'SGOV' },
  { ITR2: 'Public Sector Undertaking', ITR3: 'PSU' },
  { ITR2: 'CG-Pensioners', ITR3: 'PE' },
  { ITR2: 'SG-Pensioners', ITR3: 'PESG' },
  { ITR2: 'PSU-Pensioners', ITR3: 'PEPS' },
  { ITR2: 'Others-Pensioners', ITR3: 'PEO' },
  { ITR2: 'OTHERS', ITR3: 'OTH' },
];

/** Head of income the credit belongs under, by the section it was deducted under. */
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

/** Bank account types ITR-2 accepts. The department has no NRE code; it is a savings account. */
const ACCOUNT_TYPE: Record<string, string> = {
  SB: 'SB',
  SAVINGS: 'SB',
  NRE: 'SB',
  CA: 'CA',
  CURRENT: 'CA',
  CC: 'CC',
  OD: 'OD',
  NRO: 'NRO',
  CGAS: 'CGAS',
};

function employerCategory(raw: string | undefined, form: FormType): string | undefined {
  if (raw === undefined) return undefined;
  const wanted = raw.trim().toUpperCase();
  const row = EMPLOYER_CATEGORY.find((c) => c.ITR2.toUpperCase() === wanted || c.ITR3 === wanted);
  return row?.[form];
}

function headOfIncome(section: string | undefined): string | undefined {
  if (section === undefined) return undefined;
  return SECTION_HEAD[section.replace(/[^0-9A-Za-z]/g, '').toUpperCase()];
}

function accountType(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  return ACCOUNT_TYPE[raw.trim().toUpperCase()];
}

function assesseeStatus(raw: string | undefined): string | undefined {
  const wanted = raw?.trim().toUpperCase();
  if (wanted === 'I' || wanted === 'INDIVIDUAL') return 'I';
  if (wanted === 'H' || wanted === 'HUF') return 'H';
  return undefined;
}

function gender(raw: string | undefined): string | undefined {
  const first = raw?.trim().charAt(0).toUpperCase();
  return first === 'M' || first === 'F' || first === 'T' ? first : undefined;
}

/* ─────────────────────────── Amounts ─────────────────────────── */

/**
 * A figure in whole rupees, or undefined when there is nothing to write. A zero
 * is dropped: on the form a blank and a nought say the same thing.
 */
function money(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const rounded = r0(value);
  return rounded === 0 ? undefined : rounded;
}

function total(values: Array<number | undefined>): number | undefined {
  const present = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return present.length === 0 ? undefined : present.reduce((a, b) => a + b, 0);
}

/** Salary chargeable under the head, for one employer. */
function chargeableSalary(salary: PrefillSalary): number {
  const gross = (salary.salary17_1 ?? 0) + (salary.perquisites17_2 ?? 0) + (salary.profitInLieu17_3 ?? 0);
  const deductions = (salary.exemptAllowances ?? 0)
    + (salary.standardDeduction ?? 0)
    + (salary.professionalTax ?? 0);
  return Math.max(gross - deductions, 0);
}

/**
 * Splits challans into advance tax and self-assessment tax. A challan the
 * provider has already labelled keeps its label; otherwise anything deposited
 * by 31 March is advance tax and anything later is self-assessment tax.
 */
export function splitChallans(challans: PrefillChallan[]): {
  advance: PrefillChallan[];
  self: PrefillChallan[];
} {
  const advance: PrefillChallan[] = [];
  const self: PrefillChallan[] = [];
  for (const challan of challans) {
    const kind = challan.kind ?? (challan.depositDate <= PREVIOUS_YEAR_END ? 'advance' : 'self');
    (kind === 'advance' ? advance : self).push(challan);
  }
  return { advance, self };
}

/* ─────────────────────────── The form schema ─────────────────────────── */

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

/* ─────────────────────────── The mapper ─────────────────────────── */

type Cells = Record<string, FieldValue | undefined>;

/** One cell of a table row, or nothing when the form has no such column. */
const cell = (key: string | undefined, value: FieldValue | undefined): Cells =>
  key === undefined || value === undefined ? {} : { [key]: value };

/**
 * Fills a return from a prefill payload. Returns the new return, the figures
 * that were written with the provenance the schema claims for them, and the
 * keys that were left to the taxpayer.
 */
export function applyPrefill(
  data: ReturnData,
  payload: PrefillPayload,
  form: FormType,
): PrefillApplication {
  const keys = form === 'ITR2' ? ITR2_KEYS : ITR3_KEYS;
  const index = formIndex(form);
  const fields: Record<string, FieldValue> = { ...data.fields };
  const tables: Record<string, TableRow[]> = { ...data.tables };
  const applied: AppliedField[] = [];
  const skipped: string[] = [];

  function put(key: string | undefined, value: FieldValue | undefined): void {
    if (key === undefined || value === undefined || value === null || value === '') return;
    const def = index.fields.get(key);
    if (!def) return; // this form has no such field
    if (filled(data.fields[key])) {
      skipped.push(key);
      return;
    }
    fields[key] = value;
    applied.push({ field: key, value, source: def.source ?? 'eri' });
  }

  function putTable(tableKey: string, cells: Cells[]): void {
    const def = index.tables.get(tableKey);
    if (!def || cells.length === 0) return;
    if ((data.tables[tableKey] ?? []).some((row) => Object.values(row).some(filled))) {
      skipped.push(tableKey);
      return;
    }

    const rows = cells
      .map((source) => {
        const row: TableRow = {};
        for (const column of def.columns) {
          const value = source[column.key];
          if (value === undefined || value === null || value === '') continue;
          row[column.key] = value;
        }
        return row;
      })
      .filter((row) => Object.keys(row).length > 0);

    if (rows.length === 0) return;
    tables[tableKey] = rows;
    rows.forEach((row, i) => {
      for (const [key, value] of Object.entries(row)) {
        const column = def.columns.find((c) => c.key === key);
        applied.push({
          field: `${tableKey}[${i}].${key}`,
          value,
          source: column?.source ?? def.source ?? 'eri',
        });
      }
    });
  }

  /* Personal particulars and address → Part A General. */
  const person = payload.personal;
  const address = person.address ?? {};
  put(keys.general.firstName, person.firstName);
  put(keys.general.middleName, person.middleName);
  put(keys.general.surname, person.surname);
  put(keys.general.pan, person.pan ?? payload.pan);
  put(keys.general.dob, person.dateOfBirth);
  put(keys.general.aadhaar, person.aadhaar);
  put(keys.general.status, assesseeStatus(person.status));
  put(keys.general.gender, gender(person.gender));
  put(keys.general.email, person.email);
  put(keys.general.mobile, person.mobile);
  put(keys.general.flatNo, address.flatNo);
  put(keys.general.premises, address.premises);
  put(keys.general.road, address.road);
  put(keys.general.locality, address.locality);
  put(keys.general.city, address.city);
  put(keys.general.state, address.stateCode);
  put(keys.general.country, address.countryCode);
  put(keys.general.pin, address.pinCode);

  /* Salaries → Schedule S. */
  const salaries = payload.salaries;
  const firstEmployer = salaries[0];
  if (firstEmployer) {
    put(keys.salary.employerName, firstEmployer.employerName);
    put(keys.salary.employerTan, firstEmployer.employerTan);
    put(keys.salary.employerCategory, employerCategory(firstEmployer.employerCategory, form));
  }
  put(keys.salary.sal17_1, money(total(salaries.map((s) => s.salary17_1))));
  put(keys.salary.perq17_2, money(total(salaries.map((s) => s.perquisites17_2))));
  put(keys.salary.profit17_3, money(total(salaries.map((s) => s.profitInLieu17_3))));
  put(keys.salary.exemptAllowances, money(total(salaries.map((s) => s.exemptAllowances))));
  // One standard deduction is allowed however many employers reported it.
  put(
    keys.salary.standardDeduction,
    money(Math.max(0, ...salaries.map((s) => s.standardDeduction ?? 0))),
  );
  put(keys.salary.professionalTax, money(total(salaries.map((s) => s.professionalTax))));

  if (keys.employers) {
    const employers = keys.employers;
    putTable(employers.table, salaries.map((s) => ({
      ...cell(employers.name, s.employerName),
      ...cell(employers.category, employerCategory(s.employerCategory, form)),
      ...cell(employers.tan, s.employerTan),
    })));
  }

  /* Salary TDS → TDS-1. Employers come from the salary block; a salary credit
     the provider reported separately is added only when its TAN is not there. */
  const salaryTans = new Set(salaries.map((s) => s.employerTan).filter((t): t is string => !!t));
  const extraSalaryTds = payload.tds.filter(
    (e) => e.kind === 'salary' && (!e.deductorTan || !salaryTans.has(e.deductorTan)),
  );
  putTable(keys.tds1.table, [
    ...salaries.map((s) => ({
      ...cell(keys.tds1.tan, s.employerTan),
      ...cell(keys.tds1.name, s.employerName),
      ...cell(keys.tds1.income, money(chargeableSalary(s))),
      ...cell(keys.tds1.claimed, money(s.taxDeducted)),
    })),
    ...extraSalaryTds.map((e) => ({
      ...cell(keys.tds1.tan, e.deductorTan),
      ...cell(keys.tds1.name, e.deductorName),
      ...cell(keys.tds1.income, money(e.grossAmount)),
      ...cell(keys.tds1.claimed, money(e.taxDeducted)),
    })),
  ]);

  /* Non-salary TDS → TDS-2, property TDS → TDS-3, collections → TCS. */
  const byKind = (kind: PrefillTdsEntry['kind']): PrefillTdsEntry[] =>
    payload.tds.filter((e) => e.kind === kind);

  putTable(keys.tds2.table, byKind('other').map((e) => ({
    ...cell(keys.tds2.tan, e.deductorTan ?? e.deductorPan),
    ...cell(keys.tds2.name, e.deductorName),
    ...cell(keys.tds2.gross, money(e.grossAmount)),
    ...cell(keys.tds2.head, headOfIncome(e.section)),
    ...cell(keys.tds2.year, e.financialYear),
    ...cell(keys.tds2.deducted, money(e.taxDeducted)),
    ...cell(keys.tds2.claimed, money(e.taxDeducted)),
  })));

  putTable(keys.tds3.table, byKind('property').map((e) => ({
    ...cell(keys.tds3.pan, e.deductorPan),
    ...cell(keys.tds3.name, e.deductorName),
    ...cell(keys.tds3.gross, money(e.grossAmount)),
    ...cell(keys.tds3.head, headOfIncome(e.section)),
    ...cell(keys.tds3.deducted, money(e.taxDeducted)),
    ...cell(keys.tds3.claimed, money(e.taxDeducted)),
  })));

  putTable(keys.tcs.table, byKind('tcs').map((e) => ({
    ...cell(keys.tcs.tan, e.deductorTan),
    ...cell(keys.tcs.name, e.deductorName),
    ...cell(keys.tcs.collected, money(e.taxDeducted)),
    ...cell(keys.tcs.claimed, money(e.taxDeducted)),
  })));

  /* Challans → Schedule IT, advance tax first and self-assessment tax after. */
  const { advance, self } = splitChallans(payload.challans);
  putTable(keys.challan.table, [...advance, ...self].map((c) => ({
    ...cell(keys.challan.bsr, c.bsrCode),
    ...cell(keys.challan.date, c.depositDate),
    ...cell(keys.challan.serial, c.serialNumber),
    ...cell(keys.challan.amount, money(c.amount)),
  })));

  /* Interest and dividend → Schedule OS. */
  const interest = payload.interest;
  put(keys.otherSources.savings, money(interest.savingsBank));
  put(keys.otherSources.deposits, money(interest.termDeposits));
  put(keys.otherSources.refund, money(interest.incomeTaxRefund));
  put(keys.otherSources.others, money(interest.others));
  put(keys.otherSources.interestGross, money(total([
    interest.savingsBank,
    interest.termDeposits,
    interest.incomeTaxRefund,
    interest.others,
  ])));
  put(keys.otherSources.dividend, money(payload.dividend));

  /* Bank accounts → Part B-TTI. */
  const accounts = payload.bankAccounts;
  put(keys.bankCount, accounts.length === 0 ? undefined : accounts.length);
  putTable(keys.bank.table, accounts.map((a) => ({
    ...cell(keys.bank.ifsc, a.ifsc),
    ...cell(keys.bank.name, a.bankName),
    ...cell(keys.bank.account, a.accountNumber),
    ...cell(keys.bank.type, accountType(a.accountType)),
    ...cell(keys.bank.refund, a.nominatedForRefund ? 'Y' : 'N'),
  })));

  return { data: { ...data, fields, tables }, applied, skipped };
}
