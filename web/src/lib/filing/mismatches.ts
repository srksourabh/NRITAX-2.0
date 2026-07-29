/**
 * Declared vs imported mismatch detection and persistence.
 */

import { getServiceClient } from '@/lib/db/client';
import type { MismatchDecision, MismatchRow, MismatchSeverity } from '@/lib/db/types';

export type ComputedMismatch = {
  code: string;
  severity: MismatchSeverity;
  title: string;
  detail?: string;
  declaredValue: unknown;
  importedValue: unknown;
};

const BLOCKING_THRESHOLD = 1;

function severityForDiff(diff: number): MismatchSeverity {
  return Math.abs(diff) > BLOCKING_THRESHOLD ? 'blocking' : 'advisory';
}

function pushNumericMismatch(
  rows: ComputedMismatch[],
  input: {
    code: string;
    title: string;
    declared?: number;
    imported?: number;
    unit?: string;
  },
): void {
  const declared = input.declared ?? 0;
  const imported = input.imported ?? 0;
  const diff = declared - imported;
  if (diff === 0) return;

  const unit = input.unit ?? '₹';
  rows.push({
    code: input.code,
    severity: severityForDiff(diff),
    title: input.title,
    detail: `Declared ${unit}${declared.toLocaleString('en-IN')} vs imported ${unit}${imported.toLocaleString('en-IN')} (diff ${unit}${Math.abs(diff).toLocaleString('en-IN')}).`,
    declaredValue: declared,
    importedValue: imported,
  });
}

/** Compare declared return figures against imported source totals. */
export function computeMismatches(input: {
  declaredTds: number;
  importedTds: number;
  declaredCg?: number;
  importedCg?: number;
}): ComputedMismatch[] {
  const rows: ComputedMismatch[] = [];

  pushNumericMismatch(rows, {
    code: 'tds_total',
    title: 'TDS credit mismatch',
    declared: input.declaredTds,
    imported: input.importedTds,
  });

  if (input.declaredCg !== undefined || input.importedCg !== undefined) {
    pushNumericMismatch(rows, {
      code: 'capital_gains_total',
      title: 'Capital gains mismatch',
      declared: input.declaredCg ?? 0,
      imported: input.importedCg ?? 0,
    });
  }

  return rows;
}

export async function saveMismatches(
  filingId: string,
  rows: ComputedMismatch[],
): Promise<{ ok: true; count: number } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const now = new Date().toISOString();

    await db.from('mismatch').delete().eq('filingId', filingId);

    if (rows.length === 0) return { ok: true, count: 0 };

    const inserts = rows.map((row) => ({
      filingId,
      code: row.code,
      severity: row.severity,
      title: row.title,
      detail: row.detail ?? null,
      declaredValue: row.declaredValue,
      importedValue: row.importedValue,
      decision: 'open' as MismatchDecision,
      reason: null,
      updatedAt: now,
    }));

    const { error } = await db.from('mismatch').insert(inserts);
    if (error) throw error;
    return { ok: true, count: rows.length };
  } catch {
    return { ok: false, message: 'Could not save mismatches.' };
  }
}

export async function listMismatches(
  filingId: string,
): Promise<{ ok: true; mismatches: MismatchRow[] } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('mismatch')
      .select('*')
      .eq('filingId', filingId)
      .order('severity', { ascending: true })
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return { ok: true, mismatches: (data ?? []) as MismatchRow[] };
  } catch {
    return { ok: false, message: 'Could not list mismatches.' };
  }
}

export async function decideMismatch(
  id: string,
  decision: MismatchDecision,
  reason?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const now = new Date().toISOString();
    const { data: rows, error: loadErr } = await db
      .from('mismatch')
      .select('id, filingId')
      .eq('id', id)
      .limit(1);

    if (loadErr) throw loadErr;
    const row = rows?.[0];
    if (!row) return { ok: false, message: 'Mismatch not found.' };

    const { error: updErr } = await db
      .from('mismatch')
      .update({
        decision,
        reason: reason?.trim() || null,
        updatedAt: now,
      })
      .eq('id', id);

    if (updErr) throw updErr;

    await db.from('filing_event').insert({
      filingId: row.filingId,
      event: 'mismatch_decided',
      actor: 'user',
      detail: { mismatchId: id, decision, reason: reason?.trim() || null },
    });

    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not save mismatch decision.' };
  }
}
