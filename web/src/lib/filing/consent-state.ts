/**
 * Filing consent lifecycle — draft through client activation and revocation.
 */

import { getServiceClient } from '@/lib/db/client';
import type { ConsentLifecycle } from '@/lib/db/types';

export type { ConsentLifecycle };

const ALLOWED_TRANSITIONS: Record<ConsentLifecycle, ConsentLifecycle[]> = {
  draft: ['consent_captured'],
  consent_captured: ['client_active', 'revoked', 'draft'],
  client_active: ['revoked'],
  revoked: ['draft', 'consent_captured'],
};

export function canTransitionConsent(from: ConsentLifecycle, to: ConsentLifecycle): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function transitionConsent(
  filingId: string,
  next: ConsentLifecycle,
  detail?: Record<string, unknown>,
): Promise<
  { ok: true; consentState: ConsentLifecycle } | { ok: false; message: string }
> {
  try {
    const db = getServiceClient();
    const now = new Date().toISOString();

    const { data: rows, error: loadErr } = await db
      .from('filing')
      .select('id, consentState')
      .eq('id', filingId)
      .limit(1);

    if (loadErr) throw loadErr;
    if (!rows?.[0]) return { ok: false, message: 'Filing not found.' };

    const current = (rows[0].consentState ?? 'draft') as ConsentLifecycle;
    if (!canTransitionConsent(current, next)) {
      return {
        ok: false,
        message: `Cannot transition consent from "${current}" to "${next}".`,
      };
    }

    const { error: updErr } = await db
      .from('filing')
      .update({ consentState: next, updatedAt: now })
      .eq('id', filingId);

    if (updErr) throw updErr;

    await db.from('filing_event').insert({
      filingId,
      event: `consent_${next}`,
      actor: 'user',
      detail: { from: current, to: next, ...(detail ?? {}) },
    });

    return { ok: true, consentState: next };
  } catch {
    return { ok: false, message: 'Could not update consent state.' };
  }
}
