import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getServiceClient } from '@/lib/db/client';
import {
  listTaxImports,
  parseAisOr26asJson,
  saveTaxImport,
  type TaxImportKind,
} from '@/lib/filing/tax-imports';

export const dynamic = 'force-dynamic';

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
 * GET /api/filing/imports?filingId=<id>
 * POST /api/filing/imports — body: { filingId, kind, payload, sourceName? }
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

  const result = await listTaxImports(filingId);
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
    kind?: TaxImportKind;
    payload?: unknown;
    sourceName?: string;
  };

  const filingId = payload.filingId?.trim();
  const kind = payload.kind;

  if (!filingId || (kind !== 'ais' && kind !== 'form26as')) {
    return NextResponse.json(
      { ok: false, message: 'filingId and kind (ais | form26as) are required.' },
      { status: 400 },
    );
  }

  const allowed = await verifyFilingAccess(filingId, userId);
  if (!allowed) {
    return NextResponse.json({ ok: false, message: 'Not authorized.' }, { status: 403 });
  }

  const parsed = parseAisOr26asJson(payload.payload, kind);
  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const saved = await saveTaxImport({
    filingId,
    kind,
    sourceName: payload.sourceName,
    records: parsed.records,
    summary: parsed.summary,
  });

  if (!saved.ok) {
    return NextResponse.json(saved, { status: 500 });
  }

  const db = getServiceClient();
  await db.from('filing_event').insert({
    filingId,
    event: 'tax_import_saved',
    actor: 'user',
    detail: {
      importId: saved.importId,
      kind,
      recordCount: parsed.records.length,
      sourceName: payload.sourceName?.trim() || null,
    },
  });

  return NextResponse.json({
    ok: true,
    importId: saved.importId,
    recordCount: parsed.records.length,
    summary: parsed.summary,
  });
}
