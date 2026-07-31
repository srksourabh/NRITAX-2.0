import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { saveInboxToken } from '@/lib/casparser/inbox-token';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'nritax_gmail_oauth_state';

/**
 * OAuth return from CAS Parser Gmail connect.
 * Stores inbox_token server-side; never exposes it to the client.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const filingBase = new URL('/filing', req.url);
  const error = url.searchParams.get('error');
  const inboxToken = url.searchParams.get('inbox_token')?.trim() ?? '';
  const email = url.searchParams.get('email')?.trim() ?? '';
  const state = url.searchParams.get('state')?.trim() ?? '';
  const cookieState = req.headers.get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);

  const clearState = (res: NextResponse) => {
    res.cookies.set(STATE_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
  };

  if (error) {
    filingBase.searchParams.set('gmail', 'error');
    filingBase.searchParams.set('gmail_msg', error);
    return clearState(NextResponse.redirect(filingBase));
  }

  if (!inboxToken) {
    filingBase.searchParams.set('gmail', 'error');
    filingBase.searchParams.set('gmail_msg', 'missing_token');
    return clearState(NextResponse.redirect(filingBase));
  }

  if (!cookieState || !state || cookieState !== state) {
    filingBase.searchParams.set('gmail', 'error');
    filingBase.searchParams.set('gmail_msg', 'state_mismatch');
    return clearState(NextResponse.redirect(filingBase));
  }

  const session = await auth();
  if (!session?.user?.id) {
    filingBase.searchParams.set('gmail', 'error');
    filingBase.searchParams.set('gmail_msg', 'sign_in_required');
    return clearState(NextResponse.redirect(filingBase));
  }

  try {
    await saveInboxToken({
      userId: session.user.id,
      inboxToken,
      email: email || null,
    });
    filingBase.searchParams.set('gmail', 'connected');
    if (email) filingBase.searchParams.set('gmail_email', email);
    return clearState(NextResponse.redirect(filingBase));
  } catch {
    filingBase.searchParams.set('gmail', 'error');
    filingBase.searchParams.set(
      'gmail_msg',
      'Could not store Gmail connection. Check Supabase and try again.',
    );
    return clearState(NextResponse.redirect(filingBase));
  }
}
