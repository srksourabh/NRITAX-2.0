import { NextResponse } from 'next/server';

import { createPortalFetchClient } from '@/lib/portal-fetch/client';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
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
      {
        ok: false,
        message:
          'Enter the OTP from your registered mobile or email (as shown by the Income Tax portal).',
      },
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
