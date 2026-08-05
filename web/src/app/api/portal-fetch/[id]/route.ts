import { NextResponse } from 'next/server';

import { createPortalFetchClient } from '@/lib/portal-fetch/client';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Job IDs are unguessable UUIDs; guest filing may poll without NRITAX login. */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const client = createPortalFetchClient();
  const result = await client.get(id);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: result.code === 'SERVICE_UNAVAILABLE' ? 503 : 404 },
    );
  }

  return NextResponse.json({ ok: true, ...result.data });
}
