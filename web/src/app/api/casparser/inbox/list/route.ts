import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';
import { getInboxToken } from '@/lib/casparser/inbox-token';

export const dynamic = 'force-dynamic';

/** List CAS attachments from the connected Gmail inbox (token stays server-side). */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to list CAS files from Gmail.' },
      { status: 401 },
    );
  }

  try {
    const stored = await getInboxToken(session.user.id);
    if (!stored) {
      return NextResponse.json({
        ok: false,
        connected: false,
        message: 'Connect Gmail first to import CAS from your inbox.',
      });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') ?? undefined;
    const endDate = url.searchParams.get('endDate') ?? undefined;
    const client = createCasparserClient({ digilockerMock: false });
    const result = await client.inboxListCas({
      inboxToken: stored.inboxToken,
      startDate,
      endDate,
    });
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        connected: true,
        email: stored.email,
        message: result.message,
        code: result.code,
      });
    }
    return NextResponse.json({
      ok: true,
      connected: true,
      email: stored.email,
      files: result.files,
      message: result.message,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message:
        'Could not list Gmail CAS files. Reconnect Gmail, or upload a PDF by hand.',
    });
  }
}

/** Connection status without listing files. */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, message: 'Sign in required.' },
      { status: 401 },
    );
  }

  try {
    const stored = await getInboxToken(session.user.id);
    if (!stored) {
      return NextResponse.json({
        ok: true,
        connected: false,
        message: 'Gmail inbox is not connected.',
      });
    }
    const status = await createCasparserClient({ digilockerMock: false }).inboxStatus(
      stored.inboxToken,
    );
    if (!status.ok) {
      return NextResponse.json({
        ok: false,
        connected: false,
        message: status.message,
        code: status.code,
      });
    }
    return NextResponse.json({
      ok: true,
      connected: status.connected,
      email: status.email ?? stored.email,
      message: status.message,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'Could not check Gmail connection status.',
    });
  }
}
