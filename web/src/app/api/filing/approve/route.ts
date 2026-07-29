import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getServiceClient } from '@/lib/db/client';
import { approveFilingSnapshot } from '@/lib/filing/approval';
import type { ReturnData } from '@/lib/itr/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/filing/approve — body: { filingId, data }
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
    return NextResponse.json({ ok: false, message: 'JSON body required.' }, { status: 400 });
  }

  const payload = body as {
    filingId?: string;
    data?: ReturnData;
  };

  const filingId = payload.filingId?.trim();
  if (!filingId || !payload.data?.meta) {
    return NextResponse.json({ ok: false, message: 'filingId and data are required.' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: filingRows } = await db
    .from('filing')
    .select('id, taxpayerId')
    .eq('id', filingId)
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

  const result = await approveFilingSnapshot({
    filingId,
    userId,
    data: payload.data,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
