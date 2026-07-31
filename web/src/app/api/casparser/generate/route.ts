import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';
import { resolveCasGenerateWindow } from '@/lib/casparser/generate-cas';

export const dynamic = 'force-dynamic';

/**
 * Request a Detailed MF CAS mailback via CAS Parser Pro `/v4/generate`.
 * Soft-fail JSON — never blocks the filing wizard.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to request a Detailed CAS.' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON body required.' });
  }

  const payload = body as {
    email?: string;
    password?: string;
    pan?: string;
    fromDate?: string;
    toDate?: string;
  };

  const email = String(payload.email ?? '').trim();
  const password = String(payload.password ?? '').trim();
  const pan = String(payload.pan ?? '').trim().toUpperCase() || undefined;
  const { fromDate, toDate } = resolveCasGenerateWindow({
    fromDate: payload.fromDate,
    toDate: payload.toDate,
  });

  if (!email || !email.includes('@')) {
    return NextResponse.json({
      ok: false,
      message: 'Enter the email registered with CAMS / KFintech.',
    });
  }
  if (!password) {
    return NextResponse.json({
      ok: false,
      message: 'Enter a PDF password (usually your PAN).',
    });
  }

  try {
    const result = await createCasparserClient({ digilockerMock: false }).generateMutualFundCas({
      email,
      password,
      pan,
      fromDate,
      toDate,
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
      message: result.message,
      fromDate,
      toDate,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message:
        'Could not request a Detailed CAS. Set CASPARSER_API_KEY in web/.env.local, or request the statement from CAMS / KFintech and upload the PDF.',
    });
  }
}
