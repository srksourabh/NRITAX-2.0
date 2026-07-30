/**
 * FY window helpers for CAS Generator (Detailed MF CAS mailback).
 * AY 2026-27 uses FY 2025-26: 2025-04-01 … 2026-03-31.
 */

export const DEFAULT_CAS_FY = {
  fromDate: '2025-04-01',
  toDate: '2026-03-31',
  label: 'FY 2025-26 (AY 2026-27)',
} as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function resolveCasGenerateWindow(input?: {
  fromDate?: string;
  toDate?: string;
}): { fromDate: string; toDate: string } {
  const fromDate =
    input?.fromDate && isIsoDate(input.fromDate)
      ? input.fromDate
      : DEFAULT_CAS_FY.fromDate;
  const toDate =
    input?.toDate && isIsoDate(input.toDate) ? input.toDate : DEFAULT_CAS_FY.toDate;
  return { fromDate, toDate };
}
