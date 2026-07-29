/**
 * E-verification method matrix and filing helpers.
 */

import { getServiceClient } from '@/lib/db/client';
import type { ResidentialStatus } from '@/lib/itr/types';

export type EverifyMethodId =
  | 'aadhaar_otp'
  | 'netbanking'
  | 'demat'
  | 'dsc'
  | 'itr_v_post';

export type EverifyMethod = {
  id: EverifyMethodId;
  label: string;
  note: string;
  /** When false, method is generally unavailable for this residential status. */
  availableFor: ResidentialStatus[];
};

export const EVERIFY_METHODS: EverifyMethod[] = [
  {
    id: 'aadhaar_otp',
    label: 'Aadhaar OTP',
    note: 'Fastest when Aadhaar is linked to PAN. NRIs without Aadhaar cannot use this.',
    availableFor: ['RES', 'NOR'],
  },
  {
    id: 'netbanking',
    label: 'Net banking',
    note: 'Requires an Indian bank account with e-verification enabled. Unavailable for most NRIs without domestic accounts.',
    availableFor: ['RES', 'NOR'],
  },
  {
    id: 'demat',
    label: 'Demat account',
    note: 'Verify via a linked Indian demat account. Useful for residents with equity holdings.',
    availableFor: ['RES', 'NOR'],
  },
  {
    id: 'dsc',
    label: 'Digital Signature Certificate (DSC)',
    note: 'Class 2/3 DSC registered with the Income Tax portal. Works for NRIs who maintain a valid Indian DSC.',
    availableFor: ['RES', 'NOR', 'NRI'],
  },
  {
    id: 'itr_v_post',
    label: 'ITR-V by post',
    note: 'Print, sign, and post ITR-V to CPC Bengaluru within 30 days. Primary fallback for NRIs abroad.',
    availableFor: ['RES', 'NOR', 'NRI'],
  },
];

export function recommendEverifyMethods(residentialStatus: ResidentialStatus): EverifyMethod[] {
  return EVERIFY_METHODS.filter((m) => m.availableFor.includes(residentialStatus));
}

export async function setEverifyMethod(
  filingId: string,
  method: EverifyMethodId,
): Promise<{ ok: true; method: EverifyMethodId } | { ok: false; message: string }> {
  try {
    const known = EVERIFY_METHODS.find((m) => m.id === method);
    if (!known) return { ok: false, message: 'Unknown e-verify method.' };

    const db = getServiceClient();
    const now = new Date().toISOString();

    const { data: rows, error: loadErr } = await db
      .from('filing')
      .select('id')
      .eq('id', filingId)
      .limit(1);

    if (loadErr) throw loadErr;
    if (!rows?.[0]) return { ok: false, message: 'Filing not found.' };

    const { error: updErr } = await db
      .from('filing')
      .update({ eVerifyMethod: method, updatedAt: now })
      .eq('id', filingId);

    if (updErr) throw updErr;

    await db.from('filing_event').insert({
      filingId,
      event: 'everify_method_selected',
      actor: 'user',
      detail: { method, label: known.label },
    });

    return { ok: true, method };
  } catch {
    return { ok: false, message: 'Could not set e-verify method.' };
  }
}
