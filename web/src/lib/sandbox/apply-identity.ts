/**
 * Writes Sandbox / user-supplied identity into Part A General.
 *
 * By default only blank fields are filled (same as DigiLocker). Pass
 * `overwrite: true` when the taxpayer just typed values in the enrich prompt
 * and those values should land on the return before verification.
 */

import type { DigilockerIdentity } from '@/lib/sandbox/types';
import type { FieldValue, FormType, ReturnData } from '@/lib/itr/types';

export interface IdentityApplication {
  data: ReturnData;
  fieldsApplied: string[];
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

export function splitFullName(fullName: string): {
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

export function applyIdentityToReturn(
  data: ReturnData,
  identity: DigilockerIdentity,
  form: FormType = data.meta.form,
  options: { overwrite?: boolean } = {},
): IdentityApplication {
  const overwrite = Boolean(options.overwrite);
  const keys = form === 'ITR3' ? ITR3_GEN : ITR2_GEN;
  const fields: Record<string, FieldValue> = { ...data.fields };
  const fieldsApplied: string[] = [];
  const skipped: string[] = [];

  function put(key: string | undefined, value: string | undefined): void {
    if (!key || value === undefined || value === '') return;
    if (!overwrite && filled(data.fields[key])) {
      skipped.push(key);
      return;
    }
    fields[key] = value;
    fieldsApplied.push(key);
  }

  const fromFull = identity.fullName ? splitFullName(identity.fullName) : {};
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
