/**
 * Server-side draft persistence for ReturnData against the filing table.
 *
 * Callers get soft Result objects — never throw for expected failures (missing
 * PAN, DB hiccup). Ownership is always scoped to taxpayer.userId.
 */

import { and, desc, eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { filings, taxpayers } from '@/lib/db/schema';
import {
  RX,
  type FormType,
  type ResidentialStatus,
  type ReturnData,
} from '@/lib/itr/types';

export type FilingRow = InferSelectModel<typeof filings>;

export type DraftSummary = {
  id: string;
  form: FormType;
  assessmentYear: string;
  updatedAt: Date;
  pan: string;
};

export type TaxpayerIdentity = {
  /** Uppercased PAN when present; empty string when absent. */
  pan: string;
  name: string;
  dateOfBirth: string;
  residentialStatus: ResidentialStatus;
};

const SAVE_FAIL =
  'Could not save draft. Your entries stay on this device until you try again.';
const PAN_REQUIRED =
  'Enter a PAN in Personal Info before saving a draft.';

function fieldStr(data: ReturnData, ...keys: string[]): string {
  for (const key of keys) {
    const raw = data.fields[key];
    if (raw === null || raw === undefined) continue;
    const s = String(raw).trim();
    if (s) return s;
  }
  return '';
}

/** Pull taxpayer identity from ITR-2 or ITR-3 field key styles. */
export function taxpayerIdentityFromReturn(data: ReturnData): TaxpayerIdentity {
  const pan = fieldStr(data, 'GEN.pan', 'GEN.PAN').toUpperCase();

  const first = fieldStr(data, 'GEN.firstName', 'GEN.FirstName');
  const middle = fieldStr(data, 'GEN.middleName', 'GEN.MiddleName');
  const surname = fieldStr(data, 'GEN.surname', 'GEN.SurNameOrOrgName');
  const name = [first, middle, surname].filter(Boolean).join(' ').trim();

  const dateOfBirth = fieldStr(data, 'GEN.dob', 'GEN.DOB');

  const residentialStatus: ResidentialStatus =
    data.meta.residentialStatus ?? 'NRI';

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
    const db = getDb();
    const rows = await db
      .select({ filing: filings })
      .from(filings)
      .innerJoin(taxpayers, eq(filings.taxpayerId, taxpayers.id))
      .where(
        and(
          eq(taxpayers.userId, input.userId),
          eq(filings.assessmentYear, input.assessmentYear),
          eq(filings.form, input.form),
        ),
      )
      .limit(1);

    return { ok: true, filing: rows[0]?.filing ?? null };
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
    const now = new Date();

    const db = getDb();

    const existingTaxpayer = await db
      .select()
      .from(taxpayers)
      .where(and(eq(taxpayers.userId, input.userId), eq(taxpayers.pan, identity.pan)))
      .limit(1);

    let taxpayerId: string;

    if (existingTaxpayer[0]) {
      taxpayerId = existingTaxpayer[0].id;
      const patch: Partial<typeof taxpayers.$inferInsert> = {};
      if (identity.name && identity.name !== existingTaxpayer[0].name) {
        patch.name = identity.name;
      }
      if (identity.dateOfBirth && identity.dateOfBirth !== existingTaxpayer[0].dateOfBirth) {
        patch.dateOfBirth = identity.dateOfBirth;
      }
      if (identity.residentialStatus !== existingTaxpayer[0].residentialStatus) {
        patch.residentialStatus = identity.residentialStatus;
      }
      if (Object.keys(patch).length > 0) {
        await db.update(taxpayers).set(patch).where(eq(taxpayers.id, taxpayerId));
      }
    } else {
      const inserted = await db
        .insert(taxpayers)
        .values({
          userId: input.userId,
          pan: identity.pan,
          name: identity.name || 'Draft',
          dateOfBirth: identity.dateOfBirth || '1900-01-01',
          residentialStatus: identity.residentialStatus,
        })
        .returning({ id: taxpayers.id });
      taxpayerId = inserted[0]!.id;
    }

    const existingFiling = await db
      .select()
      .from(filings)
      .where(
        and(
          eq(filings.taxpayerId, taxpayerId),
          eq(filings.assessmentYear, assessmentYear),
          eq(filings.form, form),
        ),
      )
      .limit(1);

    if (existingFiling[0]) {
      const updated = await db
        .update(filings)
        .set({
          data: input.data,
          regime,
          status: 'draft',
          updatedAt: now,
        })
        .where(eq(filings.id, existingFiling[0].id))
        .returning({ id: filings.id });
      return { ok: true, filingId: updated[0]!.id };
    }

    const created = await db
      .insert(filings)
      .values({
        taxpayerId,
        assessmentYear,
        form,
        regime,
        status: 'draft',
        data: input.data,
        updatedAt: now,
      })
      .returning({ id: filings.id });

    return { ok: true, filingId: created[0]!.id };
  } catch {
    return { ok: false, message: SAVE_FAIL };
  }
}

export async function listDrafts(
  userId: string,
): Promise<{ ok: true; drafts: DraftSummary[] } | { ok: false; message: string }> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: filings.id,
        form: filings.form,
        assessmentYear: filings.assessmentYear,
        updatedAt: filings.updatedAt,
        pan: taxpayers.pan,
      })
      .from(filings)
      .innerJoin(taxpayers, eq(filings.taxpayerId, taxpayers.id))
      .where(eq(taxpayers.userId, userId))
      .orderBy(desc(filings.updatedAt));

    return { ok: true, drafts: rows };
  } catch {
    return { ok: false, message: 'Could not list drafts. Try again in a moment.' };
  }
}
