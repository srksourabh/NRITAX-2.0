import { randomBytes } from 'node:crypto';

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'nritax_gmail_oauth_state';

/** Start Gmail OAuth via CAS Parser Pro `/v4/inbox/connect`. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to connect Gmail for CAS import.' },
      { status: 401 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin).replace(
    /\/+$/,
    '',
  );
  const redirectUri = `${appUrl}/api/casparser/inbox/callback`;
  const state = randomBytes(16).toString('hex');

  try {
    const result = await createCasparserClient({ digilockerMock: false }).inboxConnect({
      redirectUri,
      state,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message, code: result.code });
    }

    const res = NextResponse.json({
      ok: true,
      oauthUrl: result.oauthUrl,
      message: 'Redirect to Google to allow read-only Gmail access for CAS statements.',
    });
    res.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: appUrl.startsWith('https'),
      path: '/',
      maxAge: 60 * 15,
    });
    return res;
  } catch {
    return NextResponse.json({
      ok: false,
      message:
        'Could not start Gmail connect. Try again later, or upload a CAS PDF by hand.',
    });
  }
}
