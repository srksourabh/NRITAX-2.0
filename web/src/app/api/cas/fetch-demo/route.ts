import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { demoCasSpecimen } from '@/lib/cas/demo-specimen';

export const dynamic = 'force-dynamic';

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * Demo: enter PAN + DOB and receive a specimen CAS JSON (as if fetched).
 * Live CDSL OTP fetch is a separate product path requiring BO ID + SMS OTP.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to run the CAS fetch demo.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      pan?: unknown;
      dateOfBirth?: unknown;
      fullName?: unknown;
    };
    const pan = String(body.pan ?? '').trim().toUpperCase();
    const dateOfBirth = String(body.dateOfBirth ?? '').trim();
    const fullName = String(body.fullName ?? '').trim();

    if (!pan || !PAN_RE.test(pan)) {
      return NextResponse.json({
        ok: false,
        message: 'Enter a valid 10-character PAN, for example ABCDE1234F.',
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return NextResponse.json({
        ok: false,
        message: 'Enter date of birth as YYYY-MM-DD.',
      });
    }

    // Soft delay so the demo feels like a fetch.
    await new Promise((r) => setTimeout(r, 600));

    const result = demoCasSpecimen({ pan, dateOfBirth, fullName });
    return NextResponse.json({
      ok: true,
      demo: true,
      result,
      message: `Demo CAS fetched for ${pan}. ${result.gains.length} gain legs · ${result.summary.schedule112A.length} Schedule 112A rows. Apply to fill Schedule CG.`,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'CAS demo fetch failed. Enter capital gains by hand, or upload a PDF.',
    });
  }
}
