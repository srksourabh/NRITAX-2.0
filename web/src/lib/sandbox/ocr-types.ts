/**
 * Shapes returned by Sandbox Income Tax OCR (Form 16 / Form 26AS).
 *
 * Field names match the wire envelope. Amounts may arrive as numbers or
 * numeric strings; callers parse defensively. Soft failures never throw.
 */

export type OcrKind = 'form16' | 'form26as';

export type OcrErrorCode =
  | 'UNAVAILABLE'
  | 'AUTH_FAILED'
  | 'PARSE_FAILED'
  | 'BAD_REQUEST';

export interface OcrError {
  ok: false;
  code: OcrErrorCode;
  message: string;
}

/* ─────────────────────────── Form 16 ─────────────────────────── */

export interface Form16Party {
  name?: string;
  tan?: string;
  pan?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
}

export interface Form16GrossSalary {
  salary_as_per_provisions_contained_in_section_17_1?: number | string;
  value_of_perquisites_us_17_2?: number | string;
  profits_in_lieu_of_salary_us_17_3?: number | string;
  reported_total_amount_of_salary_received_from_other_employer?: number | string;
}

export interface Form16DeductionUs16 {
  standard_deduction_us_16_ia?: number | string;
  tax_on_employment_us_16_iii?: number | string;
  entertainment_allowance_us_16_ii?: number | string;
}

export interface Form16SalaryPaid {
  gross_salary?: Form16GrossSalary;
  deduction_us_16?: Form16DeductionUs16;
  income_chargeable_under_the_head_salaries?: number | string;
  total_amount_of_salary_received_from_current_employer?: number | string;
}

export interface Form16PartA {
  assessment_year?: string;
  employer?: Form16Party;
  employee?: Form16Party;
  /** Tabular TDS: header row then quarter / Total rows. */
  tds?: Array<Array<string | number | null>>;
}

export interface Form16PartB {
  assessment_year?: string;
  employer?: Form16Party;
  employee?: Form16Party;
  details_of_salary_paid?: Form16SalaryPaid;
}

export interface Form16Data {
  'Part A'?: Form16PartA;
  'Part B'?: Form16PartB;
}

export interface Form16Result {
  ok: true;
  kind: 'form16';
  data: Form16Data;
  transactionId?: string;
}

/* ─────────────────────────── Form 26AS ─────────────────────────── */

export interface Form26AsPartIEntry {
  tan_of_deductor?: string;
  name_of_deductor?: string;
  total_amount_paid_credited?: number | string;
  total_tax_deducted?: number | string;
  total_tds_deposited?: number | string;
  sr_no?: string;
  /** Header row then detail rows; section lives in column index 1 typically. */
  deduction_wise?: Array<Array<string | number | null>>;
}

export interface Form26AsData {
  pan?: string;
  name?: string;
  financial_year?: string;
  assessment_year?: string;
  'Part I'?: Form26AsPartIEntry[];
  /** TCS / other credits — shape varies; parse defensively. */
  'Part II'?: unknown[];
  'Part III'?: unknown[];
  'Part IV'?: unknown[];
  'Part V'?: unknown[];
  'Part VI'?: unknown[];
}

export interface Form26AsResult {
  ok: true;
  kind: 'form26as';
  data: Form26AsData;
  transactionId?: string;
}

export type OcrResult = Form16Result | Form26AsResult;
export type OcrResponse = OcrResult | OcrError;

export const OCR_SOFT_FAIL_MESSAGE = 'OCR unavailable. Enter salary / TDS by hand.';
