import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  isPlanId,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '@/lib/billing/razorpay';

describe('razorpay signatures', () => {
  it('accepts valid checkout signature', () => {
    const keySecret = 'test_secret';
    const orderId = 'order_ABC';
    const paymentId = 'pay_XYZ';
    const signature = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    expect(
      verifyCheckoutSignature({ orderId, paymentId, signature, keySecret }),
    ).toBe(true);
  });

  it('rejects tampered checkout signature', () => {
    expect(
      verifyCheckoutSignature({
        orderId: 'order_ABC',
        paymentId: 'pay_XYZ',
        signature: 'deadbeef',
        keySecret: 'test_secret',
      }),
    ).toBe(false);
  });

  it('accepts valid webhook signature', () => {
    const webhookSecret = 'whsec_test';
    const rawBody = '{"event":"payment.captured"}';
    const signature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    expect(verifyWebhookSignature({ rawBody, signature, webhookSecret })).toBe(true);
  });

  it('rejects invalid webhook signature', () => {
    expect(
      verifyWebhookSignature({
        rawBody: '{}',
        signature: 'nope',
        webhookSecret: 'whsec_test',
      }),
    ).toBe(false);
  });

  it('narrows plan ids', () => {
    expect(isPlanId('self_serve')).toBe(true);
    expect(isPlanId('ca_assisted')).toBe(true);
    expect(isPlanId('free')).toBe(false);
  });
});
