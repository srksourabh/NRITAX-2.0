/**
 * Entitlements + Razorpay (or mock) checkout for self-serve vs CA-assisted plans.
 */

import { getServiceClient } from '@/lib/db/client';

export type PlanId = 'self_serve' | 'ca_assisted';

export const PLANS: Record<
  PlanId,
  { label: string; amountPaise: number; description: string }
> = {
  self_serve: {
    label: 'Self-serve',
    amountPaise: 49900,
    description: 'AI review + JSON download + optional ERI submit helpers.',
  },
  ca_assisted: {
    label: 'CA-assisted',
    amountPaise: 149900,
    description: 'Everything in self-serve, plus CA call booking and approval gate.',
  },
};

export async function getEntitlement(userId: string): Promise<{
  plan: PlanId | null;
  active: boolean;
  providerPaymentId?: string;
}> {
  const db = getServiceClient();
  const { data: rows } = await db
    .from('entitlement')
    .select('plan, status, providerPaymentId')
    .eq('userId', userId)
    .limit(1);

  const row = rows?.[0];
  if (!row || row.status !== 'active') return { plan: null, active: false };
  return {
    plan: row.plan as PlanId,
    active: true,
    providerPaymentId: row.providerPaymentId ?? undefined,
  };
}

export async function grantEntitlement(input: {
  userId: string;
  plan: PlanId;
  providerPaymentId: string;
}): Promise<void> {
  const db = getServiceClient();
  await db.from('entitlement').upsert(
    {
      userId: input.userId,
      plan: input.plan,
      status: 'active',
      providerPaymentId: input.providerPaymentId,
      paidAt: new Date().toISOString(),
    },
    { onConflict: 'userId', ignoreDuplicates: false },
  );
}

/** Create a checkout session. Mock when RAZORPAY_KEY_ID is unset. */
export async function createCheckoutSession(input: {
  userId: string;
  plan: PlanId;
}): Promise<{
  mode: 'mock' | 'razorpay';
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId?: string;
  mockCompleteUrl: string;
}> {
  const plan = PLANS[input.plan];
  const orderId = `order_${input.plan}_${Date.now()}`;
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();

  if (!keyId) {
    return {
      mode: 'mock',
      orderId,
      amountPaise: plan.amountPaise,
      currency: 'INR',
      mockCompleteUrl: `/api/pay/mock-complete?orderId=${encodeURIComponent(orderId)}&plan=${input.plan}`,
    };
  }

  const secret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? '';
  const basicAuth = Buffer.from(`${keyId}:${secret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: 'INR',
      receipt: orderId.slice(0, 40),
      notes: { userId: input.userId, plan: input.plan },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed: ${text}`);
  }
  const json = (await res.json()) as { id: string };
  return {
    mode: 'razorpay',
    orderId: json.id,
    amountPaise: plan.amountPaise,
    currency: 'INR',
    keyId,
    mockCompleteUrl: '',
  };
}

export function hasCaAccess(plan: PlanId | null): boolean {
  return plan === 'ca_assisted';
}

export function hasPaidAccess(plan: PlanId | null): boolean {
  return plan === 'self_serve' || plan === 'ca_assisted';
}
