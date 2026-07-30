import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCasClient } from '@/lib/cas/client';
import { applyCasPipeline } from '@/lib/cas/pipeline';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

/**
 * Optional CAS parse. Always returns JSON the wizard can soft-handle — a down
 * or unconfigured service must never block manual capital-gain entry.
 *
 * When `return_data` is present, also runs the shared apply pipeline (local
 * FIFO result preferred over re-mapping).
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
    const returnDataRaw = form.get('return_data');

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
        code: parsed.code,
        message:
          parsed.message ||
          'The statement could not be read. Enter capital gains manually in Schedule CG.',
      });
    }

    let applied:
      | {
          data: ReturnData;
          fieldsApplied: number;
          rowsApplied: number;
          warnings: string[];
        }
      | undefined;

    if (typeof returnDataRaw === 'string' && returnDataRaw.trim()) {
      try {
        const data = JSON.parse(returnDataRaw) as ReturnData;
        if (data?.meta) {
          const pipeline = applyCasPipeline({
            data,
            source: 'local-cas',
            casResult: parsed,
            financialYear,
          });
          if (pipeline.ok) {
            applied = {
              data: pipeline.data,
              fieldsApplied: pipeline.fieldsApplied,
              rowsApplied: pipeline.rowsApplied,
              warnings: pipeline.warnings,
            };
          }
        }
      } catch {
        // Soft-fail: still return the parse result for client-side apply.
      }
    }

    return NextResponse.json({
      ok: true,
      result: parsed,
      ...(applied
        ? {
            data: applied.data,
            fieldsApplied: applied.fieldsApplied,
            rowsApplied: applied.rowsApplied,
            warnings: applied.warnings,
          }
        : {}),
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
