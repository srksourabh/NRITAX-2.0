import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createPortalFetchClient } from '@/lib/portal-fetch/client';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to check fetch status.' },
      { status: 401 },
    );
  }

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
