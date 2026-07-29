/**
 * Evidence / provenance ledger for filing fields.
 */

import { getServiceClient } from '@/lib/db/client';
import type { EvidenceRow } from '@/lib/db/types';

export async function recordEvidence(input: {
  filingId: string;
  fieldKey?: string;
  source: string;
  artifactId?: string;
  label?: string;
  value?: unknown;
}): Promise<{ ok: true; evidenceId: string } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const { data: rows, error } = await db
      .from('evidence')
      .insert({
        filingId: input.filingId,
        fieldKey: input.fieldKey?.trim() || null,
        source: input.source.trim(),
        artifactId: input.artifactId?.trim() || null,
        label: input.label?.trim() || null,
        value:
          input.value === undefined || input.value === null
            ? null
            : (input.value as Record<string, unknown>),
      })
      .select('id')
      .limit(1);

    if (error || !rows?.[0]) throw error ?? new Error('Insert failed.');
    return { ok: true, evidenceId: rows[0].id };
  } catch {
    return { ok: false, message: 'Could not record evidence.' };
  }
}

export async function listEvidence(
  filingId: string,
): Promise<{ ok: true; evidence: EvidenceRow[] } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('evidence')
      .select('*')
      .eq('filingId', filingId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return { ok: true, evidence: (data ?? []) as EvidenceRow[] };
  } catch {
    return { ok: false, message: 'Could not list evidence.' };
  }
}
