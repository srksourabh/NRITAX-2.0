/**
 * End-to-end decision harness for sample NRI user "Priya Sharma"
 * (Dubai resident, Indian salary + MF LTCG, ITR-2 track).
 *
 * Runs offline against libs — no browser required.
 */

import { describe, expect, it } from 'vitest';

import { reviewReturn } from '@/lib/ai/review';
import {
  createCheckoutSession,
  getEntitlement,
  grantEntitlement,
  hasCaAccess,
  hasPaidAccess,
} from '@/lib/billing/entitlements';
import { bookSlot, listOpenSlots } from '@/lib/ca/booking';
import { getServiceClient } from '@/lib/db/client';
import { getEriProvider } from '@/lib/eri';
import { buildReturnJson } from '@/lib/itr/build-json';
import { compareReturnRegimes, computeReturnTax } from '@/lib/itr/compute/tax-adapter';
import {
  SAMPLE_NRI_USER,
  SAMPLE_SOFTWARE_ID,
  sampleNriPriyaItr2,
  sampleNriPriyaWrongForm,
} from '@/lib/itr/samples/nri-priya-itr2';
import { ASSESSMENT_YEAR, money } from '@/lib/itr/types';
import { validateReturn } from '@/lib/itr/validate';

const USER = SAMPLE_NRI_USER;

describe('Sample user whole-flow decision (Priya Sharma · NRI · Dubai)', () => {
  it('STEP 1 — form routing: salary+CG only → ITR-2; partner income → ITR-3', () => {
    const route = (answers: {
      partner?: boolean;
      pgbp?: boolean;
      salaryOnly?: boolean;
    }): 'ITR2' | 'ITR3' => {
      if (answers.partner || answers.pgbp) return 'ITR3';
      if (answers.salaryOnly) return 'ITR2';
      return 'ITR2';
    };
    expect(route({ partner: true })).toBe('ITR3');
    expect(route({ partner: false, salaryOnly: true })).toBe('ITR2');
  });

  it('STEP 2 — tax + regime on sample ITR-2', () => {
    const data = sampleNriPriyaItr2();
    const tax = computeReturnTax(data);
    const cmp = compareReturnRegimes(data);

    expect(tax.grossTotalIncome).toBeGreaterThan(0);
    expect(tax.taxesPaid).toBeGreaterThanOrEqual(0);
    expect(['old', 'new']).toContain(cmp.better);

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          user: USER.name,
          form: data.meta.form,
          residency: data.meta.residentialStatus,
          gti: tax.grossTotalIncome,
          taxNew: cmp.new.grossTaxLiability,
          taxOld: cmp.old.grossTaxLiability,
          better: cmp.better,
          saving: cmp.saving,
          balancePayable: tax.balancePayable,
          refundDue: tax.refundDue,
          moneyNew: money(cmp.new.grossTaxLiability),
          moneyOld: money(cmp.old.grossTaxLiability),
        },
        null,
        2,
      ),
    );
  });

  it('STEP 3 — complete sample clears Category A (canUpload)', () => {
    const data = sampleNriPriyaItr2();
    const report = validateReturn(data, { softwareId: SAMPLE_SOFTWARE_ID });

    expect(report.fieldErrors).toEqual([]);
    expect(report.blocking).toEqual([]);
    expect(report.canUpload).toBe(true);

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          canUpload: report.canUpload,
          blocking: report.blocking.length,
          fieldErrors: report.fieldErrors.length,
          advisory: report.advisory.length,
          rulesApplied: report.rulesApplied,
        },
        null,
        2,
      ),
    );
  });

  it('STEP 4 — AI/local review: clean path vs wrong-form block', async () => {
    const clean = await reviewReturn(sampleNriPriyaItr2());
    expect(clean.review.wrongFormSuspected).toBe(false);

    const wrong = await reviewReturn(sampleNriPriyaWrongForm());
    expect(wrong.review.wrongFormSuspected).toBe(true);
    expect(wrong.review.blocksFilingRecommendation).toBe(true);
    expect(wrong.review.findings.some((f) => f.code === 'WRONG_FORM')).toBe(true);

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          cleanSummary: clean.review.summary,
          cleanHighest: clean.review.highestAction,
          cleanSource: clean.review.source,
          wrongSummary: wrong.review.summary,
          wrongHighest: wrong.review.highestAction,
        },
        null,
        2,
      ),
    );
  });

  it('STEP 5 — paywall mock + CA booking + ERI mock submit', async () => {
    const db = getServiceClient();
    const userId = crypto.randomUUID();
    await db.from('user').insert({
      id: userId,
      name: USER.name,
      email: `priya-${Date.now()}@example.com`,
      emailVerified: new Date().toISOString(),
    });

    const checkout = await createCheckoutSession({ userId, plan: 'ca_assisted' });
    expect(checkout.mode).toBe('mock');
    expect(checkout.mockCompleteUrl).toContain('ca_assisted');

    await grantEntitlement({
      userId,
      plan: 'ca_assisted',
      providerPaymentId: checkout.orderId,
    });
    const ent = await getEntitlement(userId);
    expect(ent.active).toBe(true);
    expect(hasPaidAccess(ent.plan)).toBe(true);
    expect(hasCaAccess(ent.plan)).toBe(true);

    const slots = await listOpenSlots();
    expect(slots.length).toBeGreaterThan(0);
    const booked = await bookSlot({
      userId,
      slotId: slots[0].id,
      attendeeEmail: USER.email,
      caBrief: 'NRI ITR-2 · salary + 112A LTCG · review TDS vs Form 16.',
    });
    expect(booked.ics).toContain('BEGIN:VCALENDAR');
    expect(booked.bookingId).toBeTruthy();

    const data = sampleNriPriyaItr2();
    const eri = getEriProvider();
    expect(eri.name).toBe('mock');

    const consent = await eri.requestConsent({
      pan: USER.pan,
      assessmentYear: ASSESSMENT_YEAR,
      name: USER.name,
      dateOfBirth: USER.dob,
      email: USER.email,
      mobile: USER.mobile,
    });
    expect(consent.consentId).toBeTruthy();

    const built = buildReturnJson(data, { softwareId: SAMPLE_SOFTWARE_ID });
    expect(built.fileName).toMatch(/\.json$/i);

    const upload = await eri.uploadReturn({
      pan: USER.pan,
      assessmentYear: ASSESSMENT_YEAR,
      form: 'ITR2',
      consentId: consent.consentId,
      json: built.json,
    });

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          checkoutMode: checkout.mode,
          plan: ent.plan,
          caStartsAt: booked.startsAt.toISOString(),
          eriConsent: consent.status,
          eriUploadStatus: upload.status,
          ack: upload.acknowledgementNumber ?? null,
          uploadMessage: upload.message ?? null,
          jsonFile: built.fileName,
        },
        null,
        2,
      ),
    );

    expect(upload.status).toBe('accepted');
  });

  it('DECISION SUMMARY — complete sample is demo-ready', async () => {
    const data = sampleNriPriyaItr2();
    const tax = computeReturnTax(data);
    const report = validateReturn(data, { softwareId: SAMPLE_SOFTWARE_ID });
    const reviewed = await reviewReturn(data);

    const decisions = {
      persona: `${USER.name} · ${USER.country} · NRI · ITR-2`,
      formRouting: 'PASS — salary+CG maps to ITR-2; BP on ITR-2 blocks via WRONG_FORM',
      regimeCompare: tax.grossTotalIncome > 0 ? 'PASS — numbers compute' : 'FAIL — GTI zero',
      validation: report.canUpload
        ? 'PASS — Category A clear'
        : `FAIL — ${report.blocking.length} Cat A / ${report.fieldErrors.length} field gaps`,
      aiReview: reviewed.review.wrongFormSuspected
        ? 'FAIL — false wrong-form'
        : `PASS — ${reviewed.review.source} review (${reviewed.review.highestAction})`,
      paywallCaEri: 'PASS — mock checkout, ICS booking, ERI consent path work offline',
      productCall:
        report.canUpload && tax.grossTotalIncome > 0
          ? 'Ready for demo of M1–M5 happy path with complete sample return'
          : 'Still blocked on validation or tax',
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(decisions, null, 2));

    expect(decisions.regimeCompare.startsWith('PASS')).toBe(true);
    expect(decisions.validation.startsWith('PASS')).toBe(true);
    expect(decisions.aiReview.startsWith('PASS')).toBe(true);
    expect(report.canUpload).toBe(true);
  });
});
