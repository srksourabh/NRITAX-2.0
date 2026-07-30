import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { applyCasPipeline } from '@/lib/cas/pipeline';
import { createCasparserClient } from '@/lib/casparser/client';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

/**
 * Step 2: verify CDSL OTP, smart-parse the newest CAS PDF URL, apply Schedule CG.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to apply CDSL CAS.' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: unknown;
      otp?: unknown;
      data?: unknown;
      password?: unknown;
      numPeriods?: unknown;
    };
    const sessionId =
      typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    const data = body.data as ReturnData | undefined;
    const password =
      typeof body.password === 'string' ? body.password.trim() : undefined;
    const numPeriods =
      typeof body.numPeriods === 'number' ? body.numPeriods : 6;

    if (!sessionId || !otp || !data?.meta) {
      return NextResponse.json({
        ok: false,
        message: 'Missing CDSL session, OTP, or return data.',
      });
    }

    const client = createCasparserClient();
    const verified = await client.cdslVerifyOtp({ sessionId, otp, numPeriods });
    if (!verified.ok) {
      return NextResponse.json({
        ok: false,
        message: verified.message,
        code: verified.code,
      });
    }

    const file = verified.files[0];
    if (!file?.url) {
      return NextResponse.json({
        ok: false,
        message: 'No CAS PDF URL from CDSL. Upload a statement instead.',
      });
    }

    const parsed = await client.smartParsePdfUrl({
      pdfUrl: file.url,
      password,
    });
    if (!parsed.ok) {
      return NextResponse.json({
        ok: false,
        message: parsed.message,
        code: parsed.code,
      });
    }

    const applied = applyCasPipeline({
      data,
      source: 'cdsl',
      raw: parsed.raw,
      financialYear: '2025-26',
    });
    if (!applied.ok) {
      return NextResponse.json({
        ok: false,
        message: applied.message || 'Could not read the CDSL CAS. Upload a Detailed PDF instead.',
      });
    }

    return NextResponse.json({
      ok: true,
      data: applied.data,
      fieldsApplied: applied.fieldsApplied,
      rowsApplied: applied.rowsApplied,
      warnings: applied.warnings,
      files: verified.files,
      message: `${verified.message ?? 'CAS fetched.'} · ${applied.fieldsApplied} CG fields · ${applied.rowsApplied} Schedule 112A rows. Review carefully.`,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: 'CDSL verify failed. Upload a CAS PDF, or try again.',
    });
  }
}
