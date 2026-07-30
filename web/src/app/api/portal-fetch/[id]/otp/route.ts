import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createPortalFetchClient } from '@/lib/portal-fetch/client';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, message: 'Sign in to submit OTP.' },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  let body: { otp?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Invalid request body.' },
      { status: 400 },
    );
  }

  const otp = String(body.otp ?? '').trim();
  if (!/^\d{4,8}$/.test(otp)) {
    return NextResponse.json(
      { ok: false, message: 'Enter the OTP from your registered mobile or email.' },
      { status: 400 },
    );
  }

  const client = createPortalFetchClient();
  const result = await client.submitOtp(id, otp);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, ...result.data });
}
