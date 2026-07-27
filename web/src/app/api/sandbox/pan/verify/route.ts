import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createSandboxClient } from '@/lib/sandbox/client';

export const dynamic = 'force-dynamic';

/**
 * Optional PAN verify via Sandbox KYC. Soft JSON except 401 — never blocks
 * manual entry of Part A General.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to verify a PAN.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      pan?: unknown;
      name?: unknown;
      dateOfBirth?: unknown;
    };
    const pan = String(body.pan ?? '').trim();
    const name = String(body.name ?? '').trim();
    const dateOfBirth = String(body.dateOfBirth ?? '').trim();

    if (!pan || !name || !dateOfBirth) {
      return NextResponse.json({
        ok: false,
        message: 'Provide PAN, name, and date of birth, or enter them by hand.',
      });
    }

    const result = await createSandboxClient().verifyPan({ pan, name, dateOfBirth });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message, code: result.code });
    }

    return NextResponse.json({
      ok: true,
      result,
      message:
        result.status === 'valid'
          ? 'PAN verified against the department.'
          : 'PAN check completed.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'PAN verification is unavailable right now. Enter details by hand.',
    });
  }
}
