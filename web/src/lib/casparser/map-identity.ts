/**
 * Maps casparser DigiLocker identity / PAN payload into DigilockerIdentity
 * used by applyDigilockerToReturn.
 */

import type {
  DigilockerFetchedPan,
  DigilockerIdentityPayload,
} from '@/lib/casparser/types';
import type { DigilockerIdentity } from '@/lib/sandbox/types';

/** Convert DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD when possible. */
export function normalizeDob(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return s;
}

export function toDigilockerIdentity(input: {
  identity?: DigilockerIdentityPayload;
  fetchedPan?: DigilockerFetchedPan;
}): DigilockerIdentity {
  const id = input.identity;
  const panDoc = input.fetchedPan;
  const fullName = (panDoc?.name || id?.name || '').trim() || undefined;
  const pan =
    (panDoc?.pan || id?.verified?.pan || '').trim().toUpperCase() || undefined;
  const aadhaar = (id?.verified?.aadhaar || '').replace(/\D/g, '') || undefined;
  const dateOfBirth =
    normalizeDob(panDoc?.dob) || normalizeDob(id?.dob ?? undefined);

  return {
    pan,
    aadhaar: aadhaar && aadhaar.length === 12 ? aadhaar : undefined,
    fullName,
    dateOfBirth,
  };
}
