import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';
import { clearInboxToken, getInboxToken } from '@/lib/casparser/inbox-token';

export const dynamic = 'force-dynamic';

/** Revoke Gmail access upstream and clear the stored inbox token. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to disconnect Gmail.' },
      { status: 401 },
    );
  }

  try {
    const stored = await getInboxToken(session.user.id);
    if (stored) {
      await createCasparserClient({ digilockerMock: false }).inboxDisconnect(stored.inboxToken);
    }
    await clearInboxToken(session.user.id);
    return NextResponse.json({
      ok: true,
      message: 'Gmail inbox disconnected. You can still upload a CAS PDF by hand.',
    });
  } catch {
    try {
      await clearInboxToken(session.user.id);
    } catch {
      /* ignore */
    }
    return NextResponse.json({
      ok: true,
      message:
        'Cleared local Gmail connection. If Google still shows access, revoke it in your Google account.',
    });
  }
}
