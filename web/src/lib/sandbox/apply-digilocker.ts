/**
 * Puts DigiLocker PAN / Aadhaar identity into Part A General on a return.
 *
 * Pure: returns a new ReturnData. A field the taxpayer has already filled is
 * left alone and listed in `skipped`, matching applyPrefill.
 */

import type { DigilockerIdentity } from '@/lib/sandbox/types';
import type { FieldValue, FormType, ReturnData } from '@/lib/itr/types';

export interface DigilockerApplication {
  data: ReturnData;
  /** Fully qualified field keys that were written. */
  fieldsApplied: string[];
  /** Keys left alone because the taxpayer had already filled them. */
  skipped: string[];
}

interface GenKeys {
  firstName: string;
  middleName?: string;
  surname: string;
  pan: string;
  dob: string;
  aadhaar: string;
}

const ITR2_GEN: GenKeys = {
  firstName: 'GEN.firstName',
  middleName: 'GEN.middleName',
  surname: 'GEN.surname',
  pan: 'GEN.pan',
  dob: 'GEN.dob',
  aadhaar: 'GEN.aadhaar',
};

const ITR3_GEN: GenKeys = {
  firstName: 'GEN.FirstName',
  middleName: 'GEN.MiddleName',
  surname: 'GEN.SurNameOrOrgName',
  pan: 'GEN.PAN',
  dob: 'GEN.DOB',
  aadhaar: 'GEN.AadhaarCardNo',
};

const filled = (value: FieldValue | undefined): boolean =>
  value !== undefined && value !== null && value !== '';

function splitName(fullName: string): {
  firstName?: string;
  middleName?: string;
  surname?: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], surname: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    surname: parts[parts.length - 1],
  };
}

/**
 * Fills blank GEN fields from DigiLocker identity. Existing taxpayer figures
 * win. Returns a new ReturnData; the input is never mutated.
 */
export function applyDigilockerToReturn(
  data: ReturnData,
  identity: DigilockerIdentity,
  form: FormType = data.meta.form,
): DigilockerApplication {
  const keys = form === 'ITR3' ? ITR3_GEN : ITR2_GEN;
  const fields: Record<string, FieldValue> = { ...data.fields };
  const fieldsApplied: string[] = [];
  const skipped: string[] = [];

  function put(key: string | undefined, value: string | undefined): void {
    if (!key || value === undefined || value === '') return;
    if (filled(data.fields[key])) {
      skipped.push(key);
      return;
    }
    fields[key] = value;
    fieldsApplied.push(key);
  }

  const fromFull = identity.fullName ? splitName(identity.fullName) : {};
  put(keys.firstName, identity.firstName ?? fromFull.firstName);
  put(keys.middleName, identity.middleName ?? fromFull.middleName);
  put(keys.surname, identity.surname ?? fromFull.surname);
  put(keys.pan, identity.pan?.toUpperCase());
  put(keys.dob, identity.dateOfBirth);
  put(keys.aadhaar, identity.aadhaar);

  return {
    data: { ...data, fields, tables: { ...data.tables } },
    fieldsApplied,
    skipped,
  };
}

/** Merge several DigiLocker identity fragments (PAN doc + Aadhaar doc). */
export function mergeDigilockerIdentity(
  ...parts: Array<DigilockerIdentity | undefined>
): DigilockerIdentity {
  const out: DigilockerIdentity = {};
  for (const part of parts) {
    if (!part) continue;
    if (part.pan && !out.pan) out.pan = part.pan;
    if (part.aadhaar && !out.aadhaar) out.aadhaar = part.aadhaar;
    if (part.firstName && !out.firstName) out.firstName = part.firstName;
    if (part.middleName && !out.middleName) out.middleName = part.middleName;
    if (part.surname && !out.surname) out.surname = part.surname;
    if (part.fullName && !out.fullName) out.fullName = part.fullName;
    if (part.dateOfBirth && !out.dateOfBirth) out.dateOfBirth = part.dateOfBirth;
  }
  return out;
}
