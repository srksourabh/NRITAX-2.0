import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { digilockerMockEnabled, grantMockDigilockerConsent } from '@/lib/sandbox/digilocker-mock';

export const dynamic = 'force-dynamic';

/**
 * Local-only: mark a DigiLocker mock session as consented (or denied).
 * Soft JSON except 401. No-op unless DIGILOCKER_MOCK is on or session is mock_*.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to complete DigiLocker consent.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: unknown;
      decision?: unknown;
    };
    const sessionId = String(body.sessionId ?? '').trim();
    const decisionRaw = String(body.decision ?? 'succeeded').toLowerCase();
    const decision = decisionRaw === 'denied' ? 'denied' : 'succeeded';

    if (!sessionId) {
      return NextResponse.json({
        ok: false,
        message: 'Provide a DigiLocker sessionId.',
      });
    }

    if (!digilockerMockEnabled() && !sessionId.startsWith('mock_')) {
      return NextResponse.json({
        ok: false,
        message:
          'Mock DigiLocker consent is off. Enable DIGILOCKER_MOCK=1, or use the live DigiLocker product.',
      });
    }

    const result = grantMockDigilockerConsent(sessionId, decision);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message, code: result.code });
    }

    return NextResponse.json({
      ok: true,
      sessionId: result.sessionId,
      status: result.status,
      message:
        decision === 'succeeded'
          ? 'Mock DigiLocker consent granted. Apply documents into Part A.'
          : 'Mock DigiLocker consent denied. Enter identity by hand.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'Could not record DigiLocker consent. Enter identity by hand.',
    });
  }
}
