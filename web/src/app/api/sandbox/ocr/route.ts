import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createOcrClient } from '@/lib/sandbox/ocr';
import { OCR_SOFT_FAIL_MESSAGE, type OcrKind } from '@/lib/sandbox/ocr-types';

export const dynamic = 'force-dynamic';

/**
 * Optional Form 16 / Form 26AS OCR. Always returns JSON the wizard can
 * soft-handle — a down or unconfigured service must never block manual entry.
 * Uploaded PDF bytes are not persisted.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to upload a tax document.' },
      { status: 401 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get('file');
    const kindRaw = String(form.get('kind') ?? '').toLowerCase();
    const kind: OcrKind | null =
      kindRaw === 'form16' || kindRaw === 'form26as' ? kindRaw : null;
    const password = String(form.get('password') ?? '') || undefined;

    if (!kind) {
      return NextResponse.json({
        ok: false,
        message: OCR_SOFT_FAIL_MESSAGE,
      });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({
        ok: false,
        kind,
        message: OCR_SOFT_FAIL_MESSAGE,
      });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const client = createOcrClient();
    const result =
      kind === 'form16'
        ? await client.readForm16({ file: bytes, fileName: file.name, password })
        : await client.readForm26As({ file: bytes, fileName: file.name });

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        kind,
        message: result.message || OCR_SOFT_FAIL_MESSAGE,
      });
    }

    return NextResponse.json({
      ok: true,
      kind,
      result,
      message:
        kind === 'form16'
          ? 'Form 16 read. Review Schedule S and salary TDS, then continue.'
          : 'Form 26AS read. Review TDS / TCS / challans, then continue.',
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: OCR_SOFT_FAIL_MESSAGE,
    });
  }
}
