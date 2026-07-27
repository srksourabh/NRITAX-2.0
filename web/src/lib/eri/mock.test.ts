import { beforeEach, describe, expect, it } from 'vitest';

import { createMockProvider, resetMockState } from '@/lib/eri/mock';
import type { UploadRequest } from '@/lib/eri/types';
import { EriError } from '@/lib/eri/types';
import { ASSESSMENT_YEAR } from '@/lib/itr/types';

const PAN = 'AAJPS4321K';

const provider = createMockProvider();

const consentFor = (pan: string) =>
  provider.requestConsent({
    pan,
    assessmentYear: ASSESSMENT_YEAR,
    name: 'Specimen Taxpayer',
    dateOfBirth: '1980-04-01',
    email: 'specimen@example.com',
  });

const uploadOf = (pan: string, consentId: string, json: Record<string, unknown>): UploadRequest => ({
  pan,
  assessmentYear: ASSESSMENT_YEAR,
  form: 'ITR2',
  consentId,
  json,
});

const goodJson = {
  ITR: { ITR2: { Verification: { Declaration: { AssesseeVerName: 'Specimen Taxpayer' } } } },
};

beforeEach(() => {
  resetMockState();
});

describe('mock ERI provider', () => {
  it('files a return end to end without a network', async () => {
    const consent = await consentFor(PAN);
    expect(consent.status).toBe('granted');

    const prefill = await provider.fetchPrefill({
      pan: PAN,
      assessmentYear: ASSESSMENT_YEAR,
      consentId: consent.consentId,
    });
    expect(prefill.pan).toBe(PAN);
    expect(prefill.source).toBe('mock');

    const upload = await provider.uploadReturn(uploadOf(PAN, consent.consentId, goodJson));
    expect(upload.status).toBe('accepted');
    expect(upload.acknowledgementNumber).toMatch(/^MOCK\d{11}$/);

    const status = await provider.getFilingStatus({
      pan: PAN,
      acknowledgementNumber: upload.acknowledgementNumber ?? '',
    });
    expect(status.status).toBe('accepted');
  });

  it('gives one PAN one consent id', async () => {
    const first = await consentFor(PAN);
    const second = await consentFor(PAN);
    const other = await consentFor('BBJPS7654L');

    expect(second.consentId).toBe(first.consentId);
    expect(other.consentId).not.toBe(first.consentId);
    expect((await provider.getConsent(first.consentId)).consentId).toBe(first.consentId);
  });

  it('refuses prefill without a consent', async () => {
    await expect(
      provider.fetchPrefill({ pan: PAN, assessmentYear: ASSESSMENT_YEAR, consentId: 'nope' }),
    ).rejects.toBeInstanceOf(EriError);
  });

  it('returns the same figures for the same PAN and different ones for another', async () => {
    const consent = await consentFor(PAN);
    const otherConsent = await consentFor('BBJPS7654L');
    const ask = (pan: string, consentId: string) =>
      provider.fetchPrefill({ pan, assessmentYear: ASSESSMENT_YEAR, consentId });

    const first = await ask(PAN, consent.consentId);
    const second = await ask(PAN, consent.consentId);
    const other = await ask('BBJPS7654L', otherConsent.consentId);

    // fetchedAt is the clock, not the taxpayer.
    expect({ ...second, fetchedAt: '' }).toEqual({ ...first, fetchedAt: '' });
    expect(other.bankAccounts[0].accountNumber).not.toBe(first.bankAccounts[0].accountNumber);
  });

  it('describes a non-resident individual with credits and challans', async () => {
    const consent = await consentFor(PAN);
    const prefill = await provider.fetchPrefill({
      pan: PAN,
      assessmentYear: ASSESSMENT_YEAR,
      consentId: consent.consentId,
    });

    expect(prefill.personal.status).toBe('I');
    expect(prefill.personal.surname).toMatch(/^S/); // fifth letter of the PAN
    expect(prefill.bankAccounts).toHaveLength(2);
    expect(prefill.bankAccounts.filter((a) => a.nominatedForRefund)).toHaveLength(1);
    expect(prefill.salaries).toHaveLength(1);
    expect(prefill.salaries[0].taxDeducted).toBeGreaterThan(0);
    expect(prefill.tds.filter((e) => e.kind !== 'salary')).toHaveLength(3);
    expect(prefill.challans).toHaveLength(2);
    expect(prefill.challans.every((c) => c.kind === 'advance')).toBe(true);
    expect(prefill.interest.savingsBank).toBeGreaterThan(0);
    expect(prefill.interest.termDeposits).toBeGreaterThan(0);
    expect(prefill.dividend).toBeGreaterThan(0);
  });

  it.each([
    ['no ITR root', {}, 'MOCK_NO_ITR_ROOT'],
    ['the wrong form node', { ITR: { ITR3: { Verification: { x: 1 } } } }, 'MOCK_FORM_MISMATCH'],
    ['an empty verification block', { ITR: { ITR2: { Verification: {} } } }, 'MOCK_NO_VERIFICATION'],
    ['no verification block', { ITR: { ITR2: {} } }, 'MOCK_NO_VERIFICATION'],
  ])('rejects a return with %s', async (_case, json, code) => {
    const consent = await consentFor(PAN);
    const result = await provider.uploadReturn(uploadOf(PAN, consent.consentId, json));

    expect(result.status).toBe('rejected');
    expect(result.acknowledgementNumber).toBeUndefined();
    expect(result.errors?.[0].code).toBe(code);
  });

  it('walks the filing from accepted to verified over successive enquiries', async () => {
    const consent = await consentFor(PAN);
    const upload = await provider.uploadReturn(uploadOf(PAN, consent.consentId, goodJson));
    const ack = upload.acknowledgementNumber ?? '';
    const ask = () => provider.getFilingStatus({ pan: PAN, acknowledgementNumber: ack });

    expect((await ask()).status).toBe('accepted');
    expect((await ask()).status).toBe('pending_verification');

    const verified = await ask();
    expect(verified.status).toBe('verified');
    expect(verified.verifiedAt).toBeDefined();
    expect((await ask()).status).toBe('verified');
  });

  it('knows nothing of an acknowledgement number it did not issue', async () => {
    await expect(
      provider.getFilingStatus({ pan: PAN, acknowledgementNumber: 'MOCK00000000000' }),
    ).rejects.toBeInstanceOf(EriError);
  });
});
