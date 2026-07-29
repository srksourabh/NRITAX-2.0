import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { loadDraft, saveDraft } from '@/lib/filing/drafts';
import type { FormType, ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

const FORMS = new Set<FormType>(['ITR2', 'ITR3']);

function asFormType(value: string | null): FormType | null {
  if (!value) return null;
  return FORMS.has(value as FormType) ? (value as FormType) : null;
}

/**
 * Load a draft for the signed-in user.
 * Query: assessmentYear, form → { ok, filing: null | { id, data, updatedAt, status } }
 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Sign in to load a draft.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const assessmentYear = url.searchParams.get('assessmentYear')?.trim() ?? '';
  const form = asFormType(url.searchParams.get('form'));

  if (!assessmentYear || !form) {
    return NextResponse.json({
      ok: false,
      message: 'Provide assessmentYear and form (ITR2 or ITR3).',
      filing: null,
    });
  }

  const result = await loadDraft({ userId, assessmentYear, form });
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message, filing: null });
  }

  const filing = result.filing
    ? {
        id: result.filing.id,
        data: result.filing.data,
        updatedAt: result.filing.updatedAt,
        status: result.filing.status,
      }
    : null;

  return NextResponse.json({ ok: true, filing });
}

/**
 * Save a ReturnData draft for the signed-in user.
 * Body: { data: ReturnData } → { ok, filingId?, message? }
 */
export async function PUT(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Sign in to save a draft.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Request body must be JSON.' });
  }

  const data = (body as { data?: ReturnData } | null)?.data;
  if (!data || typeof data !== 'object' || !data.meta || !data.fields) {
    return NextResponse.json({
      ok: false,
      message: 'Body must include { data: ReturnData }.',
    });
  }

  const result = await saveDraft({ userId, data });
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message });
  }

  return NextResponse.json({ ok: true, filingId: result.filingId });
}
