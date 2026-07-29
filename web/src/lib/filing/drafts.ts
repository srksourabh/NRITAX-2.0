/**
 * Server-side draft persistence using the Supabase JS client.
 *
 * Callers get soft Result objects — never throws for expected failures.
 * Ownership is always scoped to taxpayer.userId via an inner join.
 */

import { getServiceClient } from '@/lib/db/client';
import type { FilingRow } from '@/lib/db/types';
import {
  RX,
  type FormType,
  type ResidentialStatus,
  type ReturnData,
} from '@/lib/itr/types';

export type { FilingRow };

export type DraftSummary = {
  id: string;
  form: FormType;
  assessmentYear: string;
  updatedAt: Date;
  pan: string;
};

export type TaxpayerIdentity = {
  pan: string;
  name: string;
  dateOfBirth: string;
  residentialStatus: ResidentialStatus;
};

const SAVE_FAIL = 'Could not save draft. Your entries stay on this device until you try again.';
const PAN_REQUIRED = 'Enter a PAN in Personal Info before saving a draft.';

function fieldStr(data: ReturnData, ...keys: string[]): string {
  for (const key of keys) {
    const raw = data.fields[key];
    if (raw === null || raw === undefined) continue;
    const s = String(raw).trim();
    if (s) return s;
  }
  return '';
}

export function taxpayerIdentityFromReturn(data: ReturnData): TaxpayerIdentity {
  const pan = fieldStr(data, 'GEN.pan', 'GEN.PAN').toUpperCase();
  const first = fieldStr(data, 'GEN.firstName', 'GEN.FirstName');
  const middle = fieldStr(data, 'GEN.middleName', 'GEN.MiddleName');
  const surname = fieldStr(data, 'GEN.surname', 'GEN.SurNameOrOrgName');
  const name = [first, middle, surname].filter(Boolean).join(' ').trim();
  const dateOfBirth = fieldStr(data, 'GEN.dob', 'GEN.DOB');
  const residentialStatus: ResidentialStatus = data.meta.residentialStatus ?? 'NRI';
  return { pan, name, dateOfBirth, residentialStatus };
}

export function isValidPan(pan: string): boolean {
  return RX.pan.test(pan);
}

export async function loadDraft(input: {
  userId: string;
  assessmentYear: string;
  form: FormType;
}): Promise<{ ok: true; filing: FilingRow | null } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();

    // Find taxpayer IDs owned by this user
    const { data: tRows } = await db
      .from('taxpayer')
      .select('id')
      .eq('userId', input.userId);

    if (!tRows || tRows.length === 0) return { ok: true, filing: null };
    const tIds = tRows.map((t) => t.id);

    const { data: rows, error } = await db
      .from('filing')
      .select('*')
      .in('taxpayerId', tIds)
      .eq('assessmentYear', input.assessmentYear)
      .eq('form', input.form)
      .limit(1);

    if (error) throw error;
    return { ok: true, filing: (rows?.[0] as FilingRow) ?? null };
  } catch {
    return { ok: false, message: 'Could not load draft. Try again in a moment.' };
  }
}

export async function saveDraft(input: {
  userId: string;
  data: ReturnData;
}): Promise<{ ok: true; filingId: string } | { ok: false; message: string }> {
  try {
    const identity = taxpayerIdentityFromReturn(input.data);
    if (!isValidPan(identity.pan)) {
      return { ok: false, message: PAN_REQUIRED };
    }

    const assessmentYear = input.data.meta.assessmentYear;
    const form = input.data.meta.form;
    const regime = input.data.meta.regime;
    const now = new Date().toISOString();

    const db = getServiceClient();

    // Upsert taxpayer
    const { data: tRows, error: tErr } = await db
      .from('taxpayer')
      .upsert(
        {
          userId: input.userId,
          pan: identity.pan,
          name: identity.name || 'Draft',
          dateOfBirth: identity.dateOfBirth || '1900-01-01',
          residentialStatus: identity.residentialStatus,
        },
        { onConflict: 'userId,pan', ignoreDuplicates: false },
      )
      .select('id')
      .limit(1);

    if (tErr || !tRows?.[0]) throw tErr ?? new Error('Taxpayer upsert failed.');
    const taxpayerId = tRows[0].id;

    // Upsert filing
    const { data: fRows, error: fErr } = await db
      .from('filing')
      .upsert(
        {
          taxpayerId,
          assessmentYear,
          form,
          regime,
          status: 'draft',
          data: input.data as unknown as Record<string, unknown>,
          updatedAt: now,
        },
        { onConflict: 'taxpayerId,assessmentYear,form', ignoreDuplicates: false },
      )
      .select('id')
      .limit(1);

    if (fErr || !fRows?.[0]) throw fErr ?? new Error('Filing upsert failed.');

    // Emit draft_saved event
    await db.from('filing_event').insert({
      filingId: fRows[0].id,
      event: 'draft_saved',
      actor: 'user',
      detail: { form, assessmentYear },
    });

    return { ok: true, filingId: fRows[0].id };
  } catch {
    return { ok: false, message: SAVE_FAIL };
  }
}

export async function listDrafts(
  userId: string,
): Promise<{ ok: true; drafts: DraftSummary[] } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();

    const { data: tRows } = await db
      .from('taxpayer')
      .select('id, pan')
      .eq('userId', userId);

    if (!tRows || tRows.length === 0) return { ok: true, drafts: [] };

    const panByTaxpayerId = Object.fromEntries(tRows.map((t) => [t.id, t.pan]));
    const tIds = tRows.map((t) => t.id);

    const { data: rows, error } = await db
      .from('filing')
      .select('id, form, assessmentYear, updatedAt, taxpayerId')
      .in('taxpayerId', tIds)
      .order('updatedAt', { ascending: false });

    if (error) throw error;

    const drafts: DraftSummary[] = (rows ?? []).map((r) => ({
      id: r.id,
      form: r.form as FormType,
      assessmentYear: r.assessmentYear,
      updatedAt: new Date(r.updatedAt),
      pan: panByTaxpayerId[r.taxpayerId] ?? '',
    }));

    return { ok: true, drafts };
  } catch {
    return { ok: false, message: 'Could not list drafts. Try again in a moment.' };
  }
}
