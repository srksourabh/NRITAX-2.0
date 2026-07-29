import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasparserClient } from '@/lib/casparser/client';

export const dynamic = 'force-dynamic';

/** Step 1: request CDSL OTP (needs PAN + BO ID + DOB). ~15–20s. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to fetch CDSL CAS.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      pan?: unknown;
      boId?: unknown;
      dob?: unknown;
    };
    const pan = typeof body.pan === 'string' ? body.pan.trim().toUpperCase() : '';
    const boId =
      typeof body.boId === 'string' ? body.boId.replace(/\D/g, '') : '';
    const dob = typeof body.dob === 'string' ? body.dob.trim() : '';

    const result = await createCasparserClient().cdslFetchOtp({ pan, boId, dob });
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
      message: result.message ?? 'OTP sent. Enter it below.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'CDSL OTP request failed. Upload a CAS PDF, or try again.',
    });
  }
}
