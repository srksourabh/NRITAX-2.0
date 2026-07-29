/**
 * Post-filing lifecycle — acknowledgement, e-verify, refund, ITR-V tracking.
 */

import { getServiceClient } from '@/lib/db/client';
import type { FilingRow } from '@/lib/db/types';

export type PostFilingState = {
  filingId: string;
  acknowledgementNumber: string | null;
  eVerifyMethod: string | null;
  refundStatus: string | null;
  itrvStatus: string | null;
  verifiedAt: string | null;
  uploadedAt: string | null;
  status: string;
};

export async function recordPostFiling(input: {
  filingId: string;
  acknowledgementNumber?: string;
  eVerifyMethod?: string;
  refundStatus?: string;
  itrvStatus?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();
    const now = new Date().toISOString();

    const { data: rows, error: loadErr } = await db
      .from('filing')
      .select('id')
      .eq('id', input.filingId)
      .limit(1);

    if (loadErr) throw loadErr;
    if (!rows?.[0]) return { ok: false, message: 'Filing not found.' };

    const patch: Record<string, unknown> = { updatedAt: now };
    const detail: Record<string, unknown> = {};

    if (input.acknowledgementNumber !== undefined) {
      const ack = input.acknowledgementNumber.trim();
      patch.acknowledgementNumber = ack || null;
      detail.acknowledgementNumber = ack || null;
      if (ack) {
        patch.uploadedAt = now;
        patch.status = 'uploaded';
      }
    }

    if (input.eVerifyMethod !== undefined) {
      patch.eVerifyMethod = input.eVerifyMethod.trim() || null;
      detail.eVerifyMethod = input.eVerifyMethod.trim() || null;
      if (input.eVerifyMethod.trim()) {
        patch.verifiedAt = now;
        patch.status = 'verified';
      }
    }

    if (input.refundStatus !== undefined) {
      patch.refundStatus = input.refundStatus.trim() || null;
      detail.refundStatus = input.refundStatus.trim() || null;
    }

    if (input.itrvStatus !== undefined) {
      patch.itrvStatus = input.itrvStatus.trim() || null;
      detail.itrvStatus = input.itrvStatus.trim() || null;
    }

    const { error: updErr } = await db.from('filing').update(patch).eq('id', input.filingId);
    if (updErr) throw updErr;

    await db.from('filing_event').insert({
      filingId: input.filingId,
      event: 'post_filing_updated',
      actor: 'user',
      detail,
    });

    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not record post-filing update.' };
  }
}

export async function getPostFilingState(
  filingId: string,
): Promise<{ ok: true; state: PostFilingState } | { ok: false; message: string }> {
  try {
    const db = getServiceClient();

    const { data: rows, error } = await db
      .from('filing')
      .select(
        'id, acknowledgementNumber, eVerifyMethod, refundStatus, itrvStatus, verifiedAt, uploadedAt, status',
      )
      .eq('id', filingId)
      .limit(1);

    if (error) throw error;
    const row = rows?.[0] as Pick<
      FilingRow,
      | 'id'
      | 'acknowledgementNumber'
      | 'eVerifyMethod'
      | 'refundStatus'
      | 'itrvStatus'
      | 'verifiedAt'
      | 'uploadedAt'
      | 'status'
    > | undefined;

    if (!row) return { ok: false, message: 'Filing not found.' };

    return {
      ok: true,
      state: {
        filingId: row.id,
        acknowledgementNumber: row.acknowledgementNumber,
        eVerifyMethod: row.eVerifyMethod,
        refundStatus: row.refundStatus,
        itrvStatus: row.itrvStatus,
        verifiedAt: row.verifiedAt,
        uploadedAt: row.uploadedAt,
        status: row.status,
      },
    };
  } catch {
    return { ok: false, message: 'Could not load post-filing state.' };
  }
}
