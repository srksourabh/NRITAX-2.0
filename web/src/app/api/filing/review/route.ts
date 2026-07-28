import { NextResponse } from 'next/server';

import { reviewReturn } from '@/lib/ai/review';
import { auth } from '@/lib/auth';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Sign in to run AI review.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Request body must be JSON.' });
  }

  const data = (body as { data?: ReturnData } | null)?.data;
  if (!data?.meta || !data.fields) {
    return NextResponse.json({ ok: false, message: 'Provide { data: ReturnData }.' });
  }

  try {
    const result = await reviewReturn(data);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Review failed.';
    return NextResponse.json({ ok: false, message });
  }
}
