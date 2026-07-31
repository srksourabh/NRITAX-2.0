/**
 * Server-side storage for CAS Parser Gmail inbox_token (never sent to the browser).
 */

import { getServiceClient } from '@/lib/db/client';

export async function getInboxToken(userId: string): Promise<{
  inboxToken: string;
  email: string | null;
} | null> {
  const db = getServiceClient();
  const { data: rows } = await db
    .from('cas_inbox_token')
    .select('inboxToken, email')
    .eq('userId', userId)
    .limit(1);
  const row = rows?.[0];
  if (!row?.inboxToken) return null;
  return {
    inboxToken: String(row.inboxToken),
    email: row.email ? String(row.email) : null,
  };
}

export async function saveInboxToken(input: {
  userId: string;
  inboxToken: string;
  email?: string | null;
}): Promise<void> {
  const db = getServiceClient();
  await db.from('cas_inbox_token').upsert(
    {
      userId: input.userId,
      inboxToken: input.inboxToken,
      email: input.email?.trim() || null,
      updatedAt: new Date().toISOString(),
    },
    { onConflict: 'userId', ignoreDuplicates: false },
  );
}

export async function clearInboxToken(userId: string): Promise<void> {
  const db = getServiceClient();
  await db.from('cas_inbox_token').delete().eq('userId', userId);
}
