import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createSandboxClient } from '@/lib/sandbox/client';

export const dynamic = 'force-dynamic';

/**
 * Poll DigiLocker session status. Soft JSON except 401.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to check DigiLocker status.' },
      { status: 401 },
    );
  }

  try {
    const sessionId = new URL(req.url).searchParams.get('sessionId')?.trim() ?? '';
    if (!sessionId) {
      return NextResponse.json({
        ok: false,
        message: 'Provide a DigiLocker sessionId.',
      });
    }

    const result = await createSandboxClient().digilockerStatus(sessionId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message, code: result.code });
    }

    return NextResponse.json({
      ok: true,
      sessionId: result.sessionId,
      status: result.status,
      message: `DigiLocker session is ${result.status}.`,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'DigiLocker status is unavailable right now. Enter identity details by hand.',
    });
  }
}
