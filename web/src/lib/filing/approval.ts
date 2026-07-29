/**
 * Filing approval — immutable return snapshot + status transition.
 */

import { getServiceClient } from '@/lib/db/client';
import { buildReturnJson } from '@/lib/itr/build-json';
import type { ReturnData } from '@/lib/itr/types';

const SCHEMA_VERSION = 'Ver1.0';

async function nextSnapshotVersion(filingId: string): Promise<number> {
  const db = getServiceClient();
  const { data } = await db
    .from('return_snapshot')
    .select('version')
    .eq('filingId', filingId)
    .order('version', { ascending: false })
    .limit(1);

  const current = data?.[0]?.version ?? 0;
  return current + 1;
}

export async function approveFilingSnapshot(input: {
  filingId: string;
  userId: string;
  data: ReturnData;
}): Promise<
  | { ok: true; snapshotId: string; digest: string; version: number }
  | { ok: false; message: string }
> {
  try {
    const built = buildReturnJson(input.data);
    const db = getServiceClient();
    const now = new Date().toISOString();
    const version = await nextSnapshotVersion(input.filingId);

    const { data: snapRows, error: snapErr } = await db
      .from('return_snapshot')
      .insert({
        filingId: input.filingId,
        version,
        jsonHash: built.digest,
        json: built.json,
        softwareId: built.softwareId,
        schemaVersion: SCHEMA_VERSION,
        approvedByUserId: input.userId,
        approvedAt: now,
      })
      .select('id')
      .limit(1);

    if (snapErr || !snapRows?.[0]) throw snapErr ?? new Error('Snapshot insert failed.');
    const snapshotId = snapRows[0].id;

    const { error: filingErr } = await db
      .from('filing')
      .update({
        status: 'approved',
        snapshotHash: built.digest,
        approvedSnapshotId: snapshotId,
        updatedAt: now,
      })
      .eq('id', input.filingId);

    if (filingErr) throw filingErr;

    await db.from('filing_event').insert({
      filingId: input.filingId,
      event: 'filing_approved',
      actor: 'user',
      detail: {
        snapshotId,
        version,
        digest: built.digest,
        fileName: built.fileName,
        softwareId: built.softwareId,
      },
    });

    return { ok: true, snapshotId, digest: built.digest, version };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not approve filing.';
    return { ok: false, message };
  }
}

export async function invalidateApproval(
  filingId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const now = new Date().toISOString();

    const { error } = await db
      .from('filing')
      .update({
        status: 'draft',
        approvedSnapshotId: null,
        updatedAt: now,
      })
      .eq('id', filingId);

    if (error) throw error;

    await db.from('filing_event').insert({
      filingId,
      event: 'approval_invalidated',
      actor: 'user',
      detail: {},
    });

    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not invalidate approval.' };
  }
}
