/**
 * Razorpay signature helpers + payment verification → entitlement grant.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

import { grantEntitlement, type PlanId } from '@/lib/billing/entitlements';

export function isPlanId(value: unknown): value is PlanId {
  return value === 'self_serve' || value === 'ca_assisted';
}

function equalHex(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right || left.length !== right.length) return false;
  try {
    return timingSafeEqual(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
  } catch {
    return false;
  }
}

export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = createHmac('sha256', input.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex');
  return equalHex(expected, input.signature);
}

export function verifyWebhookSignature(input: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  const expected = createHmac('sha256', input.webhookSecret)
    .update(input.rawBody)
    .digest('hex');
  return equalHex(expected, input.signature);
}

async function razorpayGet(path: string): Promise<Record<string, unknown> | null> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !secret) return null;
  const basicAuth = Buffer.from(`${keyId}:${secret}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    headers: { Authorization: `Basic ${basicAuth}`, accept: 'application/json' },
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function resolveOrderPlan(orderId: string): Promise<{
  userId: string;
  plan: PlanId;
} | null> {
  const order = await razorpayGet(`/orders/${encodeURIComponent(orderId)}`);
  if (!order) return null;
  const notes = (order.notes ?? {}) as Record<string, unknown>;
  const userId = typeof notes.userId === 'string' ? notes.userId.trim() : '';
  const plan = notes.plan;
  if (!userId || !isPlanId(plan)) return null;
  return { userId, plan };
}

/** Idempotent grant after Checkout.js success (signature verified). */
export async function verifyCheckoutAndGrant(input: {
  userId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ ok: true; plan: PlanId } | { ok: false; message: string }> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    return { ok: false, message: 'Razorpay is not configured.' };
  }
  if (
    !verifyCheckoutSignature({
      orderId: input.orderId,
      paymentId: input.paymentId,
      signature: input.signature,
      keySecret,
    })
  ) {
    return { ok: false, message: 'Payment signature invalid.' };
  }

  const resolved = await resolveOrderPlan(input.orderId);
  if (!resolved) {
    return { ok: false, message: 'Could not resolve order plan from Razorpay.' };
  }
  if (resolved.userId !== input.userId) {
    return { ok: false, message: 'Payment does not belong to this account.' };
  }

  await grantEntitlement({
    userId: input.userId,
    plan: resolved.plan,
    providerPaymentId: input.paymentId,
  });
  return { ok: true, plan: resolved.plan };
}

/** Grant from webhook payment.captured (signature already verified). */
export async function grantFromCapturedPayment(payment: {
  id: string;
  order_id?: string;
  notes?: Record<string, unknown>;
}): Promise<{ ok: true; plan: PlanId; userId: string } | { ok: false; message: string }> {
  const paymentId = String(payment.id ?? '').trim();
  const orderId = String(payment.order_id ?? '').trim();
  if (!paymentId || !orderId) {
    return { ok: false, message: 'Payment payload missing id or order_id.' };
  }

  let userId = '';
  let plan: PlanId | null = null;
  const notes = payment.notes ?? {};
  if (typeof notes.userId === 'string') userId = notes.userId.trim();
  if (isPlanId(notes.plan)) plan = notes.plan;

  if (!userId || !plan) {
    const resolved = await resolveOrderPlan(orderId);
    if (!resolved) {
      return { ok: false, message: 'Could not resolve user/plan from order notes.' };
    }
    userId = resolved.userId;
    plan = resolved.plan;
  }

  await grantEntitlement({
    userId,
    plan,
    providerPaymentId: paymentId,
  });
  return { ok: true, plan, userId };
}
