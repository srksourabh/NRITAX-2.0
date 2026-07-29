import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getServiceClient } from '@/lib/db/client';
import type { MismatchDecision } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

const VALID_DECISIONS: MismatchDecision[] = ['open', 'accepted', 'overridden', 'deferred'];

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
 * POST /api/mismatch/decide — record a user decision on a mismatch row.
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
    mismatchId?: string;
    filingId?: string;
    decision?: MismatchDecision;
    reason?: string;
  };

  const mismatchId = payload.mismatchId?.trim();
  const decision = payload.decision;

  if (!mismatchId) {
    return NextResponse.json({ ok: false, message: 'mismatchId is required.' }, { status: 400 });
  }
  if (!decision || !VALID_DECISIONS.includes(decision)) {
    return NextResponse.json({ ok: false, message: 'Valid decision is required.' }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: rows, error: loadErr } = await db
    .from('mismatch')
    .select('id, filingId')
    .eq('id', mismatchId)
    .limit(1);

  if (loadErr) {
    return NextResponse.json({ ok: false, message: 'Could not load mismatch.' }, { status: 500 });
  }

  const row = rows?.[0];
  if (!row) {
    return NextResponse.json({ ok: false, message: 'Mismatch not found.' }, { status: 404 });
  }

  const filingId = payload.filingId?.trim() || row.filingId;
  if (filingId !== row.filingId) {
    return NextResponse.json({ ok: false, message: 'filingId does not match mismatch.' }, { status: 400 });
  }

  const allowed = await verifyFilingAccess(filingId, userId);
  if (!allowed) {
    return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { error: updErr } = await db
    .from('mismatch')
    .update({
      decision,
      reason: payload.reason?.trim() || null,
      updatedAt: now,
    })
    .eq('id', mismatchId);

  if (updErr) {
    return NextResponse.json({ ok: false, message: 'Could not save decision.' }, { status: 500 });
  }

  await db.from('filing_event').insert({
    filingId,
    event: 'mismatch_decided',
    actor: 'user',
    detail: { mismatchId, decision, reason: payload.reason?.trim() || null },
  });

  return NextResponse.json({ ok: true, mismatchId, decision });
}
