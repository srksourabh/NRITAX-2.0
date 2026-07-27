import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createSandboxClient } from '@/lib/sandbox/client';
import { digilockerMockEnabled, isHttpsRedirect } from '@/lib/sandbox/digilocker-mock';

export const dynamic = 'force-dynamic';

function resolveRedirectUrl(requested: string | undefined): string {
  const fromEnv = (process.env.DIGILOCKER_REDIRECT_URL ?? '').trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '');
  const fallback = appUrl ? `${appUrl}/filing` : 'http://localhost:3000/filing';
  return (requested?.trim() || fromEnv || fallback).trim();
}

/**
 * Start a DigiLocker session. Soft JSON except 401.
 *
 * Live DigiLocker requires HTTPS redirect_url. For local debugging set
 * DIGILOCKER_MOCK=1 (mock consent, http OK) or DIGILOCKER_REDIRECT_URL to an
 * https tunnel that lands back on /filing.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to open DigiLocker.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { redirectUrl?: unknown };
    const redirectUrl = resolveRedirectUrl(
      typeof body.redirectUrl === 'string' ? body.redirectUrl : undefined,
    );
    const mock = digilockerMockEnabled();

    if (!mock && !isHttpsRedirect(redirectUrl)) {
      return NextResponse.json({
        ok: false,
        code: 'BAD_REQUEST',
        message:
          'DigiLocker requires HTTPS redirect. Set DIGILOCKER_REDIRECT_URL to a public https URL, or DIGILOCKER_MOCK=1 for local consent debugging. Enter identity by hand meanwhile.',
      });
    }

    const result = await createSandboxClient().initDigilocker({ redirectUrl });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message, code: result.code });
    }

    return NextResponse.json({
      ok: true,
      sessionId: result.sessionId,
      authorizationUrl: result.authorizationUrl,
      mock,
      message: mock
        ? 'Mock DigiLocker session started. Grant consent in the opened window, then apply.'
        : 'DigiLocker session started. Complete sign-in in the opened window, then we will poll for consent.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'DigiLocker is unavailable right now. Enter identity details by hand.',
    });
  }
}
