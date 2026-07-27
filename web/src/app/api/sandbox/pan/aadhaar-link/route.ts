import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createSandboxClient } from '@/lib/sandbox/client';

export const dynamic = 'force-dynamic';

/**
 * Optional PAN–Aadhaar link status. Soft JSON except 401.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to check PAN–Aadhaar link status.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as { pan?: unknown; aadhaar?: unknown };
    const pan = String(body.pan ?? '').trim();
    const aadhaar = String(body.aadhaar ?? '').trim() || undefined;

    if (!pan) {
      return NextResponse.json({
        ok: false,
        message: 'Provide a PAN, or enter Aadhaar link details by hand.',
      });
    }

    const result = await createSandboxClient().panAadhaarLink({ pan, aadhaar });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message, code: result.code });
    }

    return NextResponse.json({
      ok: true,
      result,
      message: result.linked
        ? result.message || 'PAN is linked to Aadhaar.'
        : result.message || 'PAN does not appear linked to Aadhaar.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'PAN–Aadhaar link check is unavailable right now. Enter details by hand.',
    });
  }
}
