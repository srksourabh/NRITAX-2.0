/**
 * Browser-session filing credentials.
 *
 * Password lives in sessionStorage only (tab lifetime), never localStorage or
 * the database. Used to drive portal-fetch / portal-upload for this session.
 */

import type { FormType } from '@/lib/itr/types';

export const FILING_SESSION_KEY = 'nritax.filingSession';

export type FilingAccessMode = 'has_password' | 'create_account';

export type FilingSession = {
  fullName: string;
  dob: string;
  pan: string;
  /** Always the PAN on the Income Tax portal. */
  userId: string;
  /** Present only when accessMode is has_password. */
  password?: string;
  mobile?: string;
  accessMode: FilingAccessMode;
  form?: FormType;
  assessmentYear?: string;
  politicallyExposed?: boolean;
  filingType?: 'original' | 'revised' | 'belated' | 'updated';
  /** User authorised session automation on the landing form. */
  consentAutomation: boolean;
  savedAt: string;
};

const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function normalizePan(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

export function isValidPan(value: string): boolean {
  return panPattern.test(normalizePan(value));
}

export function splitFullName(fullName: string): { first: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', surname: '' };
  if (parts.length === 1) return { first: parts[0]!, surname: '' };
  return { first: parts[0]!, surname: parts.slice(1).join(' ') };
}

export function readFilingSession(): FilingSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(FILING_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FilingSession;
    if (!parsed || typeof parsed.pan !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeFilingSession(session: FilingSession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(FILING_SESSION_KEY, JSON.stringify(session));
}

export function clearFilingSessionPassword(): void {
  const current = readFilingSession();
  if (!current?.password) return;
  const { password: _omit, ...rest } = current;
  writeFilingSession(rest);
}

export function clearFilingSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FILING_SESSION_KEY);
}
