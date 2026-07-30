/**
 * Persist / reload ERI consent ids on the filing row.
 *
 * Soft-fail: DB errors never block the upstream ERI ack.
 */

import { getServiceClient } from '@/lib/db/client';

export type EriConsentStore = {
  save(filingId: string, consentId: string): Promise<void>;
  get(filingId: string): Promise<string | null>;
};

const memory = new Map<string, string>();

/** In-memory store for unit tests. */
export function createMemoryEriConsentStore(
  seed?: Map<string, string>,
): EriConsentStore {
  const map = seed ?? memory;
  return {
    async save(filingId, consentId) {
      map.set(filingId, consentId);
    },
    async get(filingId) {
      return map.get(filingId) ?? null;
    },
  };
}

export function resetMemoryEriConsentStore(): void {
  memory.clear();
}

export function createSupabaseEriConsentStore(): EriConsentStore {
  return {
    async save(filingId, consentId) {
      const db = getServiceClient();
      const { error } = await db
        .from('filing')
        .update({ eriConsentId: consentId, updatedAt: new Date().toISOString() })
        .eq('id', filingId);
      if (error) throw error;
    },
    async get(filingId) {
      const db = getServiceClient();
      const { data, error } = await db
        .from('filing')
        .select('eriConsentId')
        .eq('id', filingId)
        .limit(1);
      if (error) throw error;
      const raw = data?.[0]?.eriConsentId;
      return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
    },
  };
}

function defaultStore(): EriConsentStore {
  return createSupabaseEriConsentStore();
}

/**
 * Write eriConsentId onto the filing. Soft-fails so ERI UX is never blocked.
 */
export async function persistEriConsentId(
  filingId: string,
  consentId: string,
  store: EriConsentStore = defaultStore(),
): Promise<{ ok: true } | { ok: false; warning: string }> {
  const id = filingId.trim();
  const consent = consentId.trim();
  if (!id || !consent) {
    return { ok: false, warning: 'Missing filing or consent id.' };
  }
  try {
    await store.save(id, consent);
    return { ok: true };
  } catch {
    return {
      ok: false,
      warning: 'Could not save ERI consent on the filing. Continue with the id shown.',
    };
  }
}

/**
 * Read eriConsentId from the filing when the client omits it.
 */
export async function loadEriConsentId(
  filingId: string,
  store: EriConsentStore = defaultStore(),
): Promise<{ ok: true; consentId: string | null } | { ok: false; message: string }> {
  const id = filingId.trim();
  if (!id) {
    return { ok: false, message: 'filingId required.' };
  }
  try {
    const consentId = await store.get(id);
    return { ok: true, consentId };
  } catch {
    return { ok: false, message: 'Could not load ERI consent from the filing.' };
  }
}
