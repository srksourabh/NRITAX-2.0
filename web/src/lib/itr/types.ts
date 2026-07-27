/**
 * NRITAX — shared type contract for the ITR engine.
 *
 * Every module under src/lib/itr imports from this file. Nothing here depends
 * on React, Next.js, or the DOM, so the whole engine runs in Node (tests, the
 * JSON builder, the AI auditor) and in the browser (the wizard) unchanged.
 */

/* ─────────────────────────── Core enums ─────────────────────────── */

export const ASSESSMENT_YEAR = '2026-27' as const;
export const PREVIOUS_YEAR_START = '2025-04-01' as const;
export const PREVIOUS_YEAR_END = '2026-03-31' as const;

export type FormType = 'ITR2' | 'ITR3';

/** 'new' = section 115BAC default regime. 'old' = opted out via Form 10-IEA. */
export type Regime = 'old' | 'new';

/** RES = resident, NOR = resident but not ordinarily resident, NRI = non-resident. */
export type ResidentialStatus = 'RES' | 'NOR' | 'NRI';

/** I = individual, H = Hindu undivided family. */
export type AssesseeStatus = 'I' | 'H';

export type FilingSection =
  | '139(1)'
  | '139(4)'
  | '139(5)'
  | '139(8A)'
  | '139(9)'
  | '142(1)'
  | '148'
  | '119(2)(b)'
  | '92CD';

/* ─────────────────────────── Field model ─────────────────────────── */

export type FieldType =
  | 'text'
  | 'longtext'
  | 'num' // whole rupees
  | 'dec' // decimal (units, percentages)
  | 'date' // ISO yyyy-mm-dd
  | 'sel'
  | 'email'
  | 'pan'
  | 'tan'
  | 'aadhaar'
  | 'mobile'
  | 'ifsc'
  | 'pin'
  | 'gstin'
  | 'isin'
  | 'bsr';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Where a figure comes from. Rendered as the "auto-fetch" affordance next to
 * every input and used by the prefill mapper to explain provenance.
 */
export type SourceKey =
  | 'eri' // pulled from the departmental prefill JSON
  | 'ais' // Annual Information Statement
  | 'tis' // Taxpayer Information Summary
  | 'form26as' // TDS / TCS / advance tax credits
  | 'form16' // employer salary certificate
  | 'cas' // CAMS / KFintech consolidated account statement
  | 'broker' // broker tax P&L
  | 'demat' // NSDL / CDSL holdings
  | 'bank' // interest certificate
  | 'lender' // home / education loan certificate
  | 'insurer' // premium certificate
  | 'epfo'
  | 'nps'
  | 'gst'
  | 'books' // books of account (ITR-3)
  | 'audit' // Form 3CA/3CB-3CD
  | 'forms' // acknowledgement numbers of filed forms
  | 'computed' // derived, never keyed in
  | 'user'; // manual entry from own records

/** Show this field only when another field holds one of these values. */
export interface FieldCondition {
  field: string; // fully qualified "SCHEDULE.field" key
  equals?: string | string[];
  notEquals?: string | string[];
  regime?: Regime;
  form?: FormType;
}

export interface FieldDef {
  /** Unique within its schedule. Fully qualified as `${scheduleId}.${key}`. */
  key: string;
  label: string;
  type: FieldType;
  /** Mandatory for a valid return. Conditional requirements live in rules. */
  required?: boolean;
  maxLen?: number;
  min?: number;
  max?: number;
  options?: SelectOption[];
  /** Slash-delimited path into the departmental JSON, e.g. `ScheduleS/NetSalary`. */
  path?: string;
  hint?: string;
  source?: SourceKey;
  showIf?: FieldCondition;
  /** Grid width, 1-12. Defaults to 4. */
  span?: number;
  /** Populated by the calculation engine; never editable. */
  readOnly?: boolean;
  /** Marks a figure the taxpayer may override even though we compute it. */
  overridable?: boolean;
}

export interface ColumnDef extends FieldDef {
  /** Column width as a CSS value, e.g. "18%". */
  width?: string;
}

export interface TableDef {
  key: string;
  title: string;
  note?: string;
  columns: ColumnDef[];
  /** Rows rendered on first paint. */
  initialRows?: number;
  maxRows?: number;
  /** Repeating-block path in the departmental JSON. */
  path?: string;
  source?: SourceKey;
  showIf?: FieldCondition;
}

/**
 * A derived figure. `expr` is evaluated by the calculation engine against the
 * current ReturnData; see src/lib/itr/compute/evaluate.ts for the grammar.
 */
export interface CalcDef {
  key: string;
  label: string;
  expr: string;
  path?: string;
  /** Hide from the UI but still compute (intermediate values). */
  internal?: boolean;
}

export interface SectionDef {
  key: string;
  title: string;
  note?: string;
  fields?: FieldDef[];
  tables?: TableDef[];
  calcs?: CalcDef[];
  showIf?: FieldCondition;
}

export interface ScheduleDef {
  /** Short id used to namespace field keys, e.g. `S`, `HP`, `CG`, `BP`. */
  id: string;
  /** Departmental JSON node name, e.g. `ScheduleS`. */
  code: string;
  /** Display number in the index, e.g. `B-1`. */
  no: string;
  name: string;
  sub?: string;
  part: string;
  forms: FormType[];
  sections: SectionDef[];
  /** Skip entirely when the predicate fails (e.g. HUF cannot file Schedule S). */
  showIf?: FieldCondition;
}

/* ─────────────────────────── Return data ─────────────────────────── */

export type FieldValue = string | number | null;
export type TableRow = Record<string, FieldValue>;

export interface ReturnMeta {
  form: FormType;
  assessmentYear: typeof ASSESSMENT_YEAR;
  regime: Regime;
  status: AssesseeStatus;
  residentialStatus: ResidentialStatus;
  filingSection: FilingSection;
  /** ISO date the taxpayer is filing on; drives 234A/234F and due-date rules. */
  filingDate: string;
  dueDate: string;
  /** Date of birth — needed for senior-citizen slabs and 80TTB. */
  dateOfBirth?: string;
}

export interface ReturnData {
  meta: ReturnMeta;
  /** Keyed `${scheduleId}.${fieldKey}`. */
  fields: Record<string, FieldValue>;
  /** Keyed by TableDef.key. */
  tables: Record<string, TableRow[]>;
}

export function emptyReturn(meta: ReturnMeta): ReturnData {
  return { meta, fields: {}, tables: {} };
}

/* ─────────────────────────── Validation ─────────────────────────── */

/**
 * Category A — the portal refuses the upload.
 * Category B — the portal accepts it but flags the return as defective-risk.
 * Category D — the upload succeeds; the claim may later be disallowed.
 */
export type RuleCategory = 'A' | 'B' | 'D';

export interface RuleContext {
  data: ReturnData;
  form: FormType;
  regime: Regime;
  status: AssesseeStatus;
  residentialStatus: ResidentialStatus;
  /** Numeric value of a fully qualified field key; 0 when absent. */
  N(key: string): number;
  /** String value of a fully qualified field key; '' when absent. */
  V(key: string): string;
  /** Non-empty rows of a table. */
  rows(tableKey: string): TableRow[];
  /** Computed value from the calculation engine. */
  C(key: string): number;
  isHUF: boolean;
  isIndividual: boolean;
  isNRI: boolean;
  isResident: boolean;
  isSenior: boolean;
  isSuperSenior: boolean;
  isBelated: boolean;
}

/**
 * A rule returns `null` when it passes and a human-readable message when it
 * fails. Rules never throw — the runner catches, but a throwing rule is a bug.
 */
export interface RuleDef {
  /** Serial number from the CBDT validation-rules document. */
  n: number | string;
  cat: RuleCategory;
  /** Schedule id used to deep-link the taxpayer to the offending field. */
  schedule: string;
  /** The rule text as published. */
  text: string;
  forms?: FormType[];
  check(ctx: RuleContext): string | null;
}

export interface Finding {
  n: number | string;
  cat: RuleCategory;
  schedule: string;
  text: string;
  message: string;
  /** Fully qualified field key to focus, when the rule can name one. */
  field?: string;
}

export interface ValidationReport {
  findings: Finding[];
  blocking: Finding[]; // category A
  advisory: Finding[]; // categories B and D
  fieldErrors: Finding[]; // format / mandatory failures
  rulesApplied: number;
  canUpload: boolean;
}

/* ─────────────────────────── Tax computation ─────────────────────────── */

export interface SpecialRateBucket {
  key: string;
  label: string;
  rate: number;
  amount: number;
  /** Portion exempt under the section 112A ₹1,25,000 threshold. */
  exempt?: number;
  taxable: number;
  tax: number;
}

export interface TaxComputation {
  regime: Regime;
  basicExemption: number;
  grossTotalIncome: number;
  chapterVIA: number;
  totalIncome: number;
  specialRateIncome: number;
  normalRateIncome: number;
  buckets: SpecialRateBucket[];
  taxOnNormal: number;
  taxOnSpecial: number;
  rebate87A: number;
  rebateNote?: string;
  surchargeRate: number;
  surcharge: number;
  marginalRelief: number;
  cess: number;
  grossTaxLiability: number;
  reliefs: number;
  interest234A: number;
  interest234B: number;
  interest234C: number;
  fee234F: number;
  netTaxLiability: number;
  aggregateLiability: number;
  taxesPaid: number;
  balancePayable: number;
  refundDue: number;
  notes: string[];
}

export interface RegimeComparison {
  old: TaxComputation;
  new: TaxComputation;
  better: Regime;
  saving: number;
  /** Per-regime deduction totals, so the UI can explain *why* one wins. */
  detail: Record<Regime, { standardDeduction: number; chapterVIA: number; totalIncome: number }>;
}

/* ─────────────────────────── Loss set-off ─────────────────────────── */

export interface SetoffRow {
  id: string;
  label: string;
  income: number;
  hpSetoff: number;
  osSetoff: number;
  broughtForwardSetoff: number;
  remaining: number;
}

export interface SetoffResult {
  cyla: SetoffRow[];
  bfla: SetoffRow[];
  housePropertySpill: number; // above the ₹2,00,000 section 71(3A) ceiling
  housePropertyUnused: number;
  otherSourcesUnused: number;
  broughtForwardRemaining: {
    houseProperty: number;
    shortTerm: number;
    longTerm: number;
    raceHorses: number;
    business?: number;
    speculative?: number;
    specified?: number;
    unabsorbedDepreciation?: number;
  };
}

/* ─────────────────────────── JSON output ─────────────────────────── */

export interface GeneratedReturn {
  form: FormType;
  pan: string;
  assessmentYear: typeof ASSESSMENT_YEAR;
  fileName: string;
  json: Record<string, unknown>;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

export const RX = {
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  tan: /^[A-Z]{4}[0-9]{5}[A-Z]$/,
  aadhaar: /^[2-9][0-9]{11}$/,
  mobile: /^[6-9][0-9]{9}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  pin: /^[1-9][0-9]{5}$/,
  email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/,
  isin: /^IN[A-Z0-9]{10}$/,
  bsr: /^[0-9]{7}$/,
} as const;

export const FIELD_PATTERN: Partial<Record<FieldType, RegExp>> = {
  pan: RX.pan,
  tan: RX.tan,
  aadhaar: RX.aadhaar,
  mobile: RX.mobile,
  ifsc: RX.ifsc,
  pin: RX.pin,
  email: RX.email,
  gstin: RX.gstin,
  isin: RX.isin,
  bsr: RX.bsr,
};

/** Round to the nearest rupee. */
export const r0 = (n: number): number => Math.round(n) || 0;

/** Round to the nearest ten rupees, as section 288B requires for tax. */
export const r10 = (n: number): number => Math.round((n || 0) / 10) * 10;

/** Indian digit grouping, e.g. 1234567 -> "12,34,567". */
export const inr = (n: number): string => (n || 0).toLocaleString('en-IN');

export const money = (n: number): string => `₹${inr(r0(n))}`;
