import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';
import {
  digilockerMockEnabled,
  isHttpsRedirect,
} from '@/lib/casparser/digilocker-mock';

export const dynamic = 'force-dynamic';

function resolveRedirectUrl(requested: string | undefined): string {
  const fromEnv = (process.env.DIGILOCKER_REDIRECT_URL ?? '').trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '');
  const fallback = appUrl
    ? `${appUrl}/filing/digilocker/callback`
    : 'http://localhost:3000/filing/digilocker/callback';
  return (requested?.trim() || fromEnv || fallback).trim();
}

/**
 * Start casparser DigiLocker session. Soft JSON except 401.
 * DIGILOCKER_MOCK=1 allows http://localhost for local UI testing.
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
    const body = (await req.json().catch(() => ({}))) as {
      redirectUrl?: unknown;
      mobile?: unknown;
      consent?: unknown;
    };
    if (body.consent !== true) {
      return NextResponse.json({
        ok: false,
        code: 'BAD_REQUEST',
        message: 'Tick consent to open DigiLocker, or enter Part A by hand.',
      });
    }

    const redirectUrl = resolveRedirectUrl(
      typeof body.redirectUrl === 'string' ? body.redirectUrl : undefined,
    );
    const mobile =
      typeof body.mobile === 'string'
        ? body.mobile.replace(/\D/g, '').slice(-10)
        : '';
    const mock = digilockerMockEnabled();

    if (!mock && !isHttpsRedirect(redirectUrl)) {
      return NextResponse.json({
        ok: false,
        code: 'BAD_REQUEST',
        message:
          'Live DigiLocker needs an HTTPS redirect. Set DIGILOCKER_REDIRECT_URL (ngrok), or DIGILOCKER_MOCK=1 for local consent debugging.',
      });
    }

    const client = createCasparserClient();
    let userFlow: 'signin' | 'signup' | undefined;
    if (mobile.length === 10 && !mock) {
      const lookup = await client.digilockerAccountLookup({ mobile });
      if (lookup.ok && (lookup.suggestedUserFlow === 'signin' || lookup.suggestedUserFlow === 'signup')) {
        userFlow = lookup.suggestedUserFlow;
      }
    }

    const result = await client.digilockerStartSession({
      redirectUrl,
      consentPurpose: 'KYC for income tax return filing with NRITAX 2.0',
      documents: ['aadhaar', 'pan'],
      userFlow,
      prefillMobile: userFlow === 'signup' && mobile.length === 10 ? mobile : undefined,
    });

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
      authorizationUrl: result.authorizationUrl,
      mock: Boolean(result.mock || mock),
      message: result.mock || mock
        ? 'Mock DigiLocker ready. Grant consent below to fill Part A.'
        : 'DigiLocker opened. Finish consent on your phone — then we apply identity.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'DigiLocker is unavailable right now. Enter identity by hand.',
    });
  }
}
