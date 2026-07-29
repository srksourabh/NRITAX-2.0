import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getServiceClient } from '@/lib/db/client';
import type { MismatchDecision } from '@/lib/db/types';
import {
  computeMismatches,
  decideMismatch,
  listMismatches,
  saveMismatches,
} from '@/lib/filing/mismatches';

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
 * GET /api/filing/mismatches?filingId=<id>
 * POST /api/filing/mismatches — compute/save or decide on a mismatch
 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  const filingId = new URL(req.url).searchParams.get('filingId')?.trim();
  if (!filingId) {
    return NextResponse.json({ ok: false, message: 'filingId is required.' }, { status: 400 });
  }

  const allowed = await verifyFilingAccess(filingId, userId);
  if (!allowed) {
    return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 });
  }

  const result = await listMismatches(filingId);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

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
    declaredTds?: number;
    importedTds?: number;
    declaredCg?: number;
    importedCg?: number;
    mismatchId?: string;
    decision?: MismatchDecision;
    reason?: string;
  };

  const filingId = payload.filingId?.trim();

  if (payload.mismatchId) {
    const decision = payload.decision;
    if (!decision || !VALID_DECISIONS.includes(decision)) {
      return NextResponse.json({ ok: false, message: 'Valid decision is required.' }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: rows } = await db
      .from('mismatch')
      .select('filingId')
      .eq('id', payload.mismatchId.trim())
      .limit(1);

    const row = rows?.[0];
    if (!row) {
      return NextResponse.json({ ok: false, message: 'Mismatch not found.' }, { status: 404 });
    }

    const targetFilingId = filingId || row.filingId;
    if (targetFilingId !== row.filingId) {
      return NextResponse.json({ ok: false, message: 'filingId does not match mismatch.' }, { status: 400 });
    }

    const allowed = await verifyFilingAccess(targetFilingId, userId);
    if (!allowed) {
      return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 });
    }

    const result = await decideMismatch(payload.mismatchId.trim(), decision, payload.reason);
    return NextResponse.json(
      result.ok ? { ok: true, mismatchId: payload.mismatchId.trim(), decision } : result,
      { status: result.ok ? 200 : 500 },
    );
  }

  if (!filingId) {
    return NextResponse.json({ ok: false, message: 'filingId is required.' }, { status: 400 });
  }

  const allowed = await verifyFilingAccess(filingId, userId);
  if (!allowed) {
    return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 });
  }

  if (payload.declaredTds === undefined || payload.importedTds === undefined) {
    return NextResponse.json(
      { ok: false, message: 'declaredTds and importedTds are required.' },
      { status: 400 },
    );
  }

  const rows = computeMismatches({
    declaredTds: Number(payload.declaredTds),
    importedTds: Number(payload.importedTds),
    declaredCg: payload.declaredCg !== undefined ? Number(payload.declaredCg) : undefined,
    importedCg: payload.importedCg !== undefined ? Number(payload.importedCg) : undefined,
  });

  const saved = await saveMismatches(filingId, rows);
  if (!saved.ok) {
    return NextResponse.json(saved, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: saved.count, mismatches: rows });
}
