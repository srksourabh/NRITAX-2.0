import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';

export const dynamic = 'force-dynamic';

/**
 * Mint a short-lived casparser `at_` token for Portfolio Connect.
 * Never send CASPARSER_API_KEY to the browser.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to open Portfolio Connect.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      expiryMinutes?: unknown;
    };
    const expiryMinutes =
      typeof body.expiryMinutes === 'number' ? body.expiryMinutes : 30;

    const result = await createCasparserClient({ digilockerMock: false }).createAccessToken(
      expiryMinutes,
    );
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        message: result.message,
        code: result.code,
      });
    }

    return NextResponse.json({
      ok: true,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      tokenType: result.tokenType,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message:
        'Could not mint a Portfolio Connect token. Try again later, or upload a CAS PDF.',
    });
  }
}
