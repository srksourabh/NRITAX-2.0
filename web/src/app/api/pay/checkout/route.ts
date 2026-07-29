import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import {
  createCheckoutSession,
  getEntitlement,
  type PlanId,
  PLANS,
} from '@/lib/billing/entitlements';

export const dynamic = 'force-dynamic';

const PLANS_SET = new Set<PlanId>(['self_serve', 'ca_assisted']);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }
  const entitlement = await getEntitlement(session.user.id);
  return NextResponse.json({ ok: true, plans: PLANS, entitlement });
}

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

  const plan = (body as { plan?: string } | null)?.plan;
  if (!plan || !PLANS_SET.has(plan as PlanId)) {
    return NextResponse.json({ ok: false, message: 'plan must be self_serve or ca_assisted.' });
  }

  try {
    const sessionCheckout = await createCheckoutSession({
      userId: session.user.id,
      plan: plan as PlanId,
    });
    return NextResponse.json({ ok: true, checkout: sessionCheckout, plan: PLANS[plan as PlanId] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed.';
    return NextResponse.json({ ok: false, message });
  }
}
