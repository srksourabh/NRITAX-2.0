import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';
import { grantMockCasparserDigilockerConsent } from '@/lib/casparser/digilocker-mock';

export const dynamic = 'force-dynamic';

/** Grant or deny a local casparser DigiLocker mock session. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to continue.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: unknown;
      decision?: unknown;
    };
    const sessionId =
      typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId) {
      return NextResponse.json({
        ok: false,
        message: 'Missing DigiLocker session. Connect again.',
      });
    }
    const decision =
      body.decision === 'denied' ? 'denied' : ('succeeded' as const);
    const result = grantMockCasparserDigilockerConsent(sessionId, decision);
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        message: result.message,
        code: result.code,
      });
    }
    return NextResponse.json({
      ok: true,
      sessionId: result.sessionId,
      status: result.status,
      message:
        decision === 'succeeded'
          ? 'Mock DigiLocker consent granted.'
          : 'Mock DigiLocker consent denied.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'Mock DigiLocker unavailable. Enter identity by hand.',
    });
  }
}
