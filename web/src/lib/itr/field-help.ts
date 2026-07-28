/**
 * Help copy for ITR field controls — prefers schema `hint`, else a short
 * description of what the taxpayer should enter.
 */

import type { FieldDef, FieldType, SourceKey } from '@/lib/itr/types';

const TYPE_GUIDE: Partial<Record<FieldType, string>> = {
  pan: 'Enter the 10-character Permanent Account Number exactly as on the PAN card (AAAAA9999A).',
  tan: 'Enter the 10-character Tax Deduction Account Number of the deductor (AAAA99999A).',
  aadhaar: 'Enter the 12-digit Aadhaar number with no spaces. Enrolment id may be used if Aadhaar is not yet issued.',
  mobile: 'Enter a 10-digit Indian mobile number linked for OTP / portal communication.',
  email: 'Enter the email address you use (or will use) on the Income Tax portal.',
  ifsc: 'Enter the 11-character IFSC of the bank branch for refund credit.',
  pin: 'Enter the 6-digit PIN code. For a foreign address, use 999999 when the portal requires a PIN.',
  date: 'Enter the date as yyyy-mm-dd.',
  num: 'Enter the amount in whole Indian rupees (no commas or paise).',
  dec: 'Enter the figure as a number. Decimals are allowed where the form requires them.',
  gstin: 'Enter the 15-character GSTIN if applicable.',
  isin: 'Enter the 12-character ISIN of the security from your demat / broker statement.',
  bsr: 'Enter the 7-digit BSR code from the tax payment challan.',
  text: 'Enter the particular exactly as it should appear on the return.',
  sel: 'Choose the option that correctly describes your situation for this assessment year.',
};

const SOURCE_GUIDE: Partial<Record<SourceKey, string>> = {
  form16: 'Usually taken from Form 16 Part B.',
  form26as: 'Usually taken from Form 26AS / AIS.',
  ais: 'Usually taken from the Annual Information Statement (AIS).',
  tis: 'Usually taken from the Taxpayer Information Summary (TIS).',
  demat: 'Usually taken from your demat or broker statement.',
  broker: 'Usually taken from your broker contract note or capital-gains statement.',
  cas: 'Usually taken from your CAS (consolidated account statement).',
  eri: 'Often available from ITD prefill once consent is granted.',
  lender: 'Usually taken from the lender’s interest certificate.',
  bank: 'Usually taken from your bank interest certificate or passbook.',
  nps: 'Usually taken from your NPS / PRAN statement.',
  forms: 'Usually taken from the acknowledgement of the related form.',
  user: 'Enter from your own records if it is not on a tax statement.',
  computed: 'Normally calculated by the form; only change if you are sure.',
};

/** Whether this field should show a help (?) control. */
export function isImportantField(field: FieldDef): boolean {
  if (field.readOnly) return false;
  if (field.required) return true;
  if (field.hint) return true;
  if (field.source && field.source !== 'computed') return true;
  return ['pan', 'tan', 'aadhaar', 'mobile', 'email', 'ifsc', 'pin', 'sel'].includes(
    field.type,
  );
}

/** Short description shown when the taxpayer taps ?. */
export function fieldHelpText(field: FieldDef): string {
  const parts: string[] = [];

  if (field.hint) {
    parts.push(field.hint);
  } else {
    parts.push(TYPE_GUIDE[field.type] ?? `Enter ${field.label.toLowerCase()}.`);
  }

  if (field.required) {
    parts.push('This particular is mandatory for a valid return.');
  }

  if (field.source && SOURCE_GUIDE[field.source]) {
    parts.push(SOURCE_GUIDE[field.source]!);
  }

  if (field.maxLen) {
    parts.push(`Maximum ${field.maxLen} characters.`);
  }

  if (field.type === 'num' && field.max !== undefined) {
    parts.push(`Cannot exceed ₹${field.max.toLocaleString('en-IN')}.`);
  }

  return parts.join(' ');
}
