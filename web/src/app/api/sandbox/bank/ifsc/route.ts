import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { applyIfscToReturn } from '@/lib/sandbox/apply-ifsc';
import { createSandboxClient } from '@/lib/sandbox/client';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

/**
 * Optional IFSC lookup. Soft JSON except 401.
 * Pass `apply: true` with `data` to write bank name / IFSC into the return.
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
    const body = (await req.json()) as {
      ifsc?: unknown;
      data?: ReturnData;
      apply?: unknown;
    };
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

    let data = body.data;
    let fieldsApplied: string[] = [];
    if (body.apply && data && typeof data === 'object') {
      const applied = applyIfscToReturn(data, result, data.meta.form, {
        overwrite: true,
      });
      data = applied.data;
      fieldsApplied = applied.fieldsApplied;
    }

    return NextResponse.json({
      ok: true,
      result,
      data,
      fieldsApplied,
      message: result.bank
        ? `${result.bank}${result.branch ? ` · ${result.branch}` : ''}${
            fieldsApplied.length ? ' · written to bank details' : ''
          }`
        : 'IFSC looked up.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'IFSC lookup is unavailable right now. Enter bank details by hand.',
    });
  }
}
