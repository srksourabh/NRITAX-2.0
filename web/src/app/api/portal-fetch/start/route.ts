import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createPortalFetchClient } from '@/lib/portal-fetch/client';

export const dynamic = 'force-dynamic';

/**
 * Start an ephemeral portal prefill fetch job.
 * Password is forwarded to the worker only -- never logged or stored here.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to fetch prefill.' },
      { status: 401 },
    );
  }

  let body: {
    pan?: string;
    name?: string;
    dob?: string;
    password?: string;
    mobile?: string;
    assessmentYear?: string;
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

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return NextResponse.json(
      { ok: false, message: 'Enter a valid PAN.' },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json(
      { ok: false, message: 'Enter your name as on the e-Filing portal.' },
      { status: 400 },
    );
  }
  if (!dob) {
    return NextResponse.json(
      { ok: false, message: 'Enter date of birth.' },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Enter your e-Filing portal password for automated fetch (Mode A).',
      },
      { status: 400 },
    );
  }
  if (!/^\d{10}$/.test(mobile)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Enter the 10-digit mobile registered on the e-Filing portal.',
      },
      { status: 400 },
    );
  }

  const client = createPortalFetchClient();
  const result = await client.start({
    pan,
    name,
    dob,
    password,
    mobile,
    assessmentYear,
    consentFetch: true,
    consentLiability: true,
    userId: session.user.id ?? session.user.email ?? 'unknown',
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: result.code === 'SERVICE_UNAVAILABLE' ? 503 : 502 },
    );
  }

  return NextResponse.json({ ok: true, ...result.data });
}
