import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getServiceClient } from '@/lib/db/client';
import { submitManualTransport } from '@/lib/filing/transport';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/filing/transport
 * Body: { filingId, data, acknowledgementNumber?, mode?: 'manual' }
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON body required.' });
  }

  const payload = body as {
    filingId?: string;
    data?: ReturnData;
    acknowledgementNumber?: string;
    mode?: 'manual' | 'eri' | 'partner';
  };

  if (!payload.filingId || !payload.data?.meta) {
    return NextResponse.json({ ok: false, message: 'filingId and data are required.' });
  }

  const db = getServiceClient();
  const { data: filingRows } = await db
    .from('filing')
    .select('id, taxpayerId')
    .eq('id', payload.filingId)
    .limit(1);
  const filing = filingRows?.[0];
  if (!filing) {
    return NextResponse.json({ ok: false, message: 'Filing not found.' }, { status: 404 });
  }

  const { data: tRows } = await db
    .from('taxpayer')
    .select('userId')
    .eq('id', filing.taxpayerId)
    .limit(1);
  if (tRows?.[0]?.userId !== userId) {
    return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 });
  }

  if (payload.mode && payload.mode !== 'manual') {
    return NextResponse.json({
      ok: false,
      message: 'ERI / partner transport is not enabled yet. Use manual portal upload.',
    });
  }

  const result = await submitManualTransport({
    filingId: payload.filingId,
    data: payload.data,
    acknowledgementNumber: payload.acknowledgementNumber,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
