import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasClient } from '@/lib/cas/client';

export const dynamic = 'force-dynamic';

/**
 * Optional CAS parse. Always returns JSON the wizard can soft-handle — a down
 * or unconfigured service must never block manual capital-gain entry.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to upload a statement.' },
      { status: 401 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get('file');
    const financialYear = String(form.get('financial_year') ?? '2025-26');
    const password = String(form.get('password') ?? '') || undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({
        ok: false,
        message: 'Choose a CAMS or KFintech statement PDF, or enter gains by hand.',
      });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const client = createCasClient();
    const parsed = await client.parse({
      file: bytes,
      fileName: file.name,
      financialYear,
      password,
    });

    if (!parsed.ok) {
      return NextResponse.json({
        ok: false,
        message:
          parsed.message ||
          'The statement could not be read. Enter capital gains manually in Schedule CG.',
      });
    }

    return NextResponse.json({
      ok: true,
      result: parsed,
      message: `Statement read (${parsed.source}). ${parsed.gains.length} gain legs · ${parsed.summary.schedule112A.length} Schedule 112A rows.`,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message:
        'CAS parsing is unavailable right now. Enter capital gains manually in Schedule CG.',
    });
  }
}
