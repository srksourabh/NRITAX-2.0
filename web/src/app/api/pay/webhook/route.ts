import { NextResponse } from 'next/server';

import {
  grantFromCapturedPayment,
  verifyWebhookSignature,
} from '@/lib/billing/razorpay';

export const dynamic = 'force-dynamic';

/** Razorpay webhook — grant entitlement on payment.captured. */
export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { ok: false, message: 'RAZORPAY_WEBHOOK_SECRET is not set.' },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  if (
    !verifyWebhookSignature({
      rawBody,
      signature,
      webhookSecret,
    })
  ) {
    return NextResponse.json({ ok: false, message: 'Invalid webhook signature.' }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: Record<string, unknown> } };
  };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON.' }, { status: 400 });
  }

  if (event.event !== 'payment.captured') {
    return NextResponse.json({ ok: true, ignored: true, event: event.event ?? null });
  }

  const entity = event.payload?.payment?.entity;
  if (!entity || typeof entity.id !== 'string') {
    return NextResponse.json({ ok: false, message: 'Missing payment entity.' }, { status: 400 });
  }

  try {
    const result = await grantFromCapturedPayment({
      id: entity.id,
      order_id: typeof entity.order_id === 'string' ? entity.order_id : undefined,
      notes:
        entity.notes && typeof entity.notes === 'object' && !Array.isArray(entity.notes)
          ? (entity.notes as Record<string, unknown>)
          : undefined,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 422 });
    }
    return NextResponse.json({ ok: true, plan: result.plan, userId: result.userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook grant failed.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
