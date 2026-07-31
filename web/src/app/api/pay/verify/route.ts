import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { verifyCheckoutAndGrant } from '@/lib/billing/razorpay';

export const dynamic = 'force-dynamic';

/** Client backup after Checkout.js success — verifies signature then grants. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON body required.' });
  }

  const payload = body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  const orderId = String(payload.razorpay_order_id ?? '').trim();
  const paymentId = String(payload.razorpay_payment_id ?? '').trim();
  const signature = String(payload.razorpay_signature ?? '').trim();
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({
      ok: false,
      message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
    });
  }

  try {
    const result = await verifyCheckoutAndGrant({
      userId: session.user.id,
      orderId,
      paymentId,
      signature,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message });
    }
    return NextResponse.json({ ok: true, plan: result.plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment verify failed.';
    return NextResponse.json({ ok: false, message });
  }
}
