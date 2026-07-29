/**
 * Writes an IFSC lookup into the first blank bank row (or creates one).
 * ITR-2 uses table `bank` / `bIfsc` / `bName`. ITR-3 uses `BankRows` / `IFSC` / `BankName`.
 */

import type { IfscSuccess } from '@/lib/sandbox/types';
import type { FormType, ReturnData, TableRow } from '@/lib/itr/types';

export interface IfscApplication {
  data: ReturnData;
  fieldsApplied: string[];
  skipped: string[];
}

function bankKeys(form: FormType): {
  table: string;
  ifsc: string;
  name: string;
} {
  return form === 'ITR3'
    ? { table: 'BankRows', ifsc: 'IFSC', name: 'BankName' }
    : { table: 'bank', ifsc: 'bIfsc', name: 'bName' };
}

const cellFilled = (row: TableRow | undefined, key: string): boolean => {
  if (!row) return false;
  const value = row[key];
  return value !== undefined && value !== null && String(value).trim() !== '';
};

export function applyIfscToReturn(
  data: ReturnData,
  result: IfscSuccess,
  form: FormType = data.meta.form,
  options: { overwrite?: boolean } = {},
): IfscApplication {
  const overwrite = Boolean(options.overwrite);
  const keys = bankKeys(form);
  const tables = { ...data.tables };
  const rows = [...(tables[keys.table] ?? [])];
  const fieldsApplied: string[] = [];
  const skipped: string[] = [];

  const bankLabel = [result.bank, result.branch].filter(Boolean).join(' · ');
  let row = rows[0] ? { ...rows[0] } : {};
  const created = rows.length === 0;

  const write = (key: string, value: string | undefined) => {
    if (!value) return;
    if (!overwrite && cellFilled(row, key)) {
      skipped.push(`${keys.table}.${key}`);
      return;
    }
    row = { ...row, [key]: value };
    fieldsApplied.push(`${keys.table}.${key}`);
  };

  write(keys.ifsc, result.ifsc.toUpperCase());
  write(keys.name, bankLabel || result.bank);

  if (created) rows.push(row);
  else rows[0] = row;
  tables[keys.table] = rows;

  return {
    data: { ...data, fields: { ...data.fields }, tables },
    fieldsApplied,
    skipped,
  };
}
