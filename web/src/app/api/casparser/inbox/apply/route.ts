import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { applyCasPipeline } from '@/lib/cas/pipeline';
import { createCasparserClient } from '@/lib/casparser/client';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

/**
 * Smart-parse a Gmail CAS PDF URL and apply Schedule CG via the shared pipeline.
 * Soft-fail JSON — never blocks the wizard.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to apply a CAS from Gmail.' },
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
    pdfUrl?: string;
    password?: string;
    data?: ReturnData;
    financialYear?: string;
  };

  const pdfUrl = String(payload.pdfUrl ?? '').trim();
  const password = String(payload.password ?? '').trim();
  if (!pdfUrl || !/^https?:\/\//i.test(pdfUrl)) {
    return NextResponse.json({ ok: false, message: 'A valid CAS PDF URL is required.' });
  }
  if (!payload.data) {
    return NextResponse.json({ ok: false, message: 'Return data is required to apply gains.' });
  }

  try {
    const parsed = await createCasparserClient({ digilockerMock: false }).smartParsePdfUrl({
      pdfUrl,
      password: password || undefined,
    });
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, message: parsed.message, code: parsed.code });
    }

    const applied = applyCasPipeline({
      data: payload.data,
      source: 'gmail-inbox',
      raw: parsed.raw,
      financialYear: payload.financialYear ?? '2025-26',
    });
    if (!applied.ok) {
      return NextResponse.json({
        ok: false,
        message: applied.message,
        warnings: applied.warnings,
      });
    }

    return NextResponse.json({
      ok: true,
      data: applied.data,
      fieldsApplied: applied.fieldsApplied,
      rowsApplied: applied.rowsApplied,
      warnings: applied.warnings,
      message: `Applied ${applied.fieldsApplied} fields and ${applied.rowsApplied} Schedule 112A rows from Gmail CAS.`,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message:
        'Could not apply the Gmail CAS. Upload the PDF below, or enter gains in Schedule CG by hand.',
    });
  }
}
