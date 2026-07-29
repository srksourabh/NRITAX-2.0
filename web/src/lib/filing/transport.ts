/**
 * Filing transport helpers — manual upload now, ERI/partner later.
 */

import { getServiceClient } from '@/lib/db/client';
import type { TransportMode, TransportStatus } from '@/lib/db/types';
import { buildReturnJson } from '@/lib/itr/build-json';
import type { ReturnData } from '@/lib/itr/types';

export interface TransportResult {
  ok: boolean;
  message: string;
  acknowledgementNumber?: string;
  digest?: string;
  transportStatus?: TransportStatus;
}

export async function recordTransportEvent(input: {
  filingId: string;
  mode: TransportMode;
  status: TransportStatus;
  acknowledgementNumber?: string;
  digest?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const db = getServiceClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    transportMode: input.mode,
    transportStatus: input.status,
    updatedAt: now,
  };
  if (input.acknowledgementNumber) patch.acknowledgementNumber = input.acknowledgementNumber;
  if (input.digest) patch.snapshotHash = input.digest;
  if (input.status === 'submitted' || input.status === 'acknowledged') {
    patch.uploadedAt = now;
    patch.status = 'uploaded';
  }

  await db.from('filing').update(patch).eq('id', input.filingId);

  await db.from('filing_event').insert({
    filingId: input.filingId,
    event: `transport_${input.status}`,
    actor: 'user',
    detail: {
      mode: input.mode,
      acknowledgementNumber: input.acknowledgementNumber ?? null,
      digest: input.digest ?? null,
      ...(input.detail ?? {}),
    },
  });
}

/** Manual portal transport: generate JSON metadata and mark filing ready/submitted. */
export async function submitManualTransport(input: {
  filingId: string;
  data: ReturnData;
  acknowledgementNumber?: string;
}): Promise<TransportResult> {
  try {
    const built = buildReturnJson(input.data);
    const ack = input.acknowledgementNumber?.trim();
    const status: TransportStatus = ack ? 'acknowledged' : 'ready';
    await recordTransportEvent({
      filingId: input.filingId,
      mode: 'manual',
      status,
      acknowledgementNumber: ack,
      digest: built.digest,
      detail: { fileName: built.fileName, softwareId: built.softwareId },
    });
    return {
      ok: true,
      message: ack
        ? `Manual upload recorded with acknowledgement ${ack}.`
        : `JSON ready (${built.fileName}). Upload on the Income Tax portal, then enter the acknowledgement number.`,
      acknowledgementNumber: ack,
      digest: built.digest,
      transportStatus: status,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Transport failed.',
      transportStatus: 'failed',
    };
  }
}
