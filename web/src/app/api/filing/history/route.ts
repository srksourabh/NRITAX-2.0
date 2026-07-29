import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getServiceClient } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/filing/history?filingId=<id>
 *
 * Returns the full event history for a specific filing owned by the signed-in user.
 * Each event includes actor, timestamp, and optional detail payload.
 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const filingId = url.searchParams.get('filingId')?.trim();

  if (!filingId) {
    return NextResponse.json({ ok: false, message: 'filingId is required.' }, { status: 400 });
  }

  const db = getServiceClient();

  // Verify ownership: filing → taxpayer → userId
  const { data: filingRows } = await db
    .from('filing')
    .select('id, taxpayerId, assessmentYear, form, status, createdAt, updatedAt')
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

  // Fetch all events ordered by time
  const { data: events, error } = await db
    .from('filing_event')
    .select('id, event, actor, detail, createdAt')
    .eq('filingId', filingId)
    .order('createdAt', { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, message: 'Could not load history.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    filing: {
      id: filing.id,
      assessmentYear: filing.assessmentYear,
      form: filing.form,
      status: filing.status,
      createdAt: filing.createdAt,
      updatedAt: filing.updatedAt,
    },
    events: events ?? [],
  });
}
