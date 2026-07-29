import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { grantEntitlement, type PlanId } from '@/lib/billing/entitlements';

export const dynamic = 'force-dynamic';

/** Dev / no-Razorpay path: mark the plan paid after mock checkout. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const url = new URL(req.url);
  const plan = url.searchParams.get('plan') as PlanId | null;
  const orderId = url.searchParams.get('orderId') ?? `mock_${Date.now()}`;
  if (plan !== 'self_serve' && plan !== 'ca_assisted') {
    return NextResponse.json({ ok: false, message: 'Invalid plan.' }, { status: 400 });
  }

  await grantEntitlement({
    userId: session.user.id,
    plan,
    providerPaymentId: orderId,
  });

  return NextResponse.redirect(new URL(`/filing?paid=${plan}`, req.url));
}
