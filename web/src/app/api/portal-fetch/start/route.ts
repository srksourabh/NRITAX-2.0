import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createPortalFetchClient } from '@/lib/portal-fetch/client';

export const dynamic = 'force-dynamic';

/**
 * Start an ephemeral portal prefill fetch job.
 * Password is forwarded to the worker only -- never logged or stored here.
 */
export async function POST(req: Request) {
  let body: {
    pan?: string;
    name?: string;
    dob?: string;
    password?: string;
    mobile?: string;
    assessmentYear?: string;
    formType?: string;
    politicallyExposed?: boolean | string;
    filingType?: string;
    consentFetch?: boolean;
    consentLiability?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Invalid request body.' },
      { status: 400 },
    );
  }

  if (!body.consentFetch || !body.consentLiability) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Both consent boxes must be checked before starting a portal fetch.',
      },
      { status: 400 },
    );
  }

  const pan = String(body.pan ?? '')
    .trim()
    .toUpperCase();
  const name = String(body.name ?? '').trim();
  const dob = String(body.dob ?? '').trim();
  const password = String(body.password ?? '');
  const mobile = String(body.mobile ?? '')
    .trim()
    .replace(/\D/g, '');
  const assessmentYear = String(body.assessmentYear ?? '2026-27').trim();
  const formType =
    String(body.formType ?? 'ITR2').toUpperCase() === 'ITR3' ? 'ITR3' : 'ITR2';
  // Agent always drives offline original + non-political answers.
  const politicallyExposed = false;
  const filingType = 'original' as const;

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return NextResponse.json(
      { ok: false, message: 'Enter a valid PAN (this is your e-Filing User ID).' },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json(
      { ok: false, message: 'Password is required for portal login.' },
      { status: 400 },
    );
  }

  const resolvedName = name || 'TAXPAYER';
  if (mobile && !/^\d{10}$/.test(mobile)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'If you enter a mobile, use the 10-digit Indian number registered on the e-Filing portal. Leave it blank if you use an overseas number or email OTP.',
      },
      { status: 400 },
    );
  }

  const session = await auth();
  const userId =
    session?.user?.id ??
    session?.user?.email ??
    `guest:${pan}`;

  const client = createPortalFetchClient();
  const result = await client.start({
    pan,
    name: resolvedName,
    dob: dob || '',
    password,
    mobile: mobile || '',
    assessmentYear,
    formType,
    politicallyExposed,
    filingType,
    consentFetch: true,
    consentLiability: true,
    userId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: result.code === 'SERVICE_UNAVAILABLE' ? 503 : 502 },
    );
  }

  return NextResponse.json({ ok: true, ...result.data });
}
