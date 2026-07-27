import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createSandboxClient } from '@/lib/sandbox/client';

export const dynamic = 'force-dynamic';

/**
 * Optional IFSC lookup. Soft JSON except 401.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to look up an IFSC.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as { ifsc?: unknown };
    const ifsc = String(body.ifsc ?? '').trim();

    if (!ifsc) {
      return NextResponse.json({
        ok: false,
        message: 'Provide an IFSC code, or enter bank details by hand.',
      });
    }

    const result = await createSandboxClient().lookupIfsc(ifsc);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message, code: result.code });
    }

    return NextResponse.json({
      ok: true,
      result,
      message: result.bank
        ? `${result.bank}${result.branch ? ` · ${result.branch}` : ''}`
        : 'IFSC looked up.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'IFSC lookup is unavailable right now. Enter bank details by hand.',
    });
  }
}
