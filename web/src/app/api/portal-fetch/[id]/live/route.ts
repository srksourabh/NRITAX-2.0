import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createPortalFetchClient } from '@/lib/portal-fetch/client';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Escalate to Mode B (live Browserbase view) or signal that the user finished login.
 * Body: { action?: 'open' | 'done' } — default open.
 */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in for live assist.' },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  let action: 'open' | 'done' = 'open';
  try {
    const body = (await req.json()) as { action?: string };
    if (body.action === 'done') action = 'done';
  } catch {
    /* empty body = open */
  }

  const client = createPortalFetchClient();
  const result =
    action === 'done'
      ? await client.signalLiveDone(id)
      : await client.requestLiveAssist(id);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, ...result.data });
}
