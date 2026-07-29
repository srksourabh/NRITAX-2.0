import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getCaCase, listCaCases, updateCaCase, type CaCaseUpdateStatus } from '@/lib/ca/workspace';
import { getServiceClient } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

const POST_STATUSES: Record<string, CaCaseUpdateStatus> = {
  approve: 'approved',
  approved: 'approved',
  changes_needed: 'ca_changes_needed',
  ca_changes_needed: 'ca_changes_needed',
  requested: 'requested',
};

async function verifyFilingAccess(filingId: string, userId: string): Promise<boolean> {
  const db = getServiceClient();
  const { data: filingRows } = await db
    .from('filing')
    .select('taxpayerId')
    .eq('id', filingId)
    .limit(1);

  const filing = filingRows?.[0];
  if (!filing) return false;

  const { data: tRows } = await db
    .from('taxpayer')
    .select('userId')
    .eq('id', filing.taxpayerId)
    .limit(1);

  return tRows?.[0]?.userId === userId;
}

/**
 * GET /api/ca/cases — list CA cases for the signed-in user.
 * GET /api/ca/cases?filingId=<id> — case detail.
 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const filingId = url.searchParams.get('filingId')?.trim();

  if (filingId) {
    const allowed = await verifyFilingAccess(filingId, userId);
    if (!allowed) {
      return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 });
    }

    const result = await getCaCase(filingId);
    if (!result.ok) {
      return NextResponse.json(result, { status: result.message === 'Filing not found.' ? 404 : 400 });
    }
    return NextResponse.json({ ok: true, case: result.case });
  }

  const result = await listCaCases({ userId });
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json({ ok: true, cases: result.cases });
}

/**
 * POST /api/ca/cases — update CA case status (approve / changes_needed / requested).
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

  const payload = body as { filingId?: string; status?: string; action?: string; note?: string };
  const filingId = payload.filingId?.trim();
  const rawStatus = (payload.status ?? payload.action)?.trim().toLowerCase();

  if (!filingId) {
    return NextResponse.json({ ok: false, message: 'filingId is required.' }, { status: 400 });
  }
  if (!rawStatus) {
    return NextResponse.json({ ok: false, message: 'status or action is required.' }, { status: 400 });
  }

  const mapped = POST_STATUSES[rawStatus];
  if (!mapped) {
    return NextResponse.json(
      { ok: false, message: 'status must be approve, changes_needed, or requested.' },
      { status: 400 },
    );
  }

  const allowed = await verifyFilingAccess(filingId, userId);
  if (!allowed) {
    return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 });
  }

  const result = await updateCaCase({ filingId, status: mapped, note: payload.note });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
