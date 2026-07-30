import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { JobStore } from './store.js';

describe('JobStore secrets', () => {
  it('wipes password and otp on terminal success', () => {
    const store = new JobStore();
    const job = store.create({
      userId: 'u1',
      pan: 'ABCDE1234F',
      name: 'Test',
      dob: '1990-01-01',
      mobile: '9999999999',
      password: 'secret-pass',
      assessmentYear: '2026-27',
    });
    assert.ok(job.secrets?.password);

    store.apply(job.id, { type: 'START_LOGIN' });
    store.apply(job.id, { type: 'NEED_OTP' });
    store.setOtp(job.id, '123456');
    store.apply(job.id, { type: 'OTP_SUBMITTED' });
    store.apply(job.id, { type: 'START_DOWNLOAD' });
    const done = store.apply(job.id, { type: 'SUCCESS' }, {
      artifactJson: '{"Form_ITR2":{}}',
    });

    assert.equal(done?.status, 'succeeded');
    assert.equal(done?.secrets, null);
    const pub = store.toPublic(done!);
    assert.equal(pub.artifactJson, '{"Form_ITR2":{}}');
    assert.equal(
      JSON.stringify(pub).includes('secret-pass'),
      false,
    );
  });

  it('rejects otp when not awaiting_otp', () => {
    const store = new JobStore();
    const job = store.create({
      userId: 'u1',
      pan: 'ABCDE1234F',
      name: 'Test',
      dob: '1990-01-01',
      mobile: '9999999999',
      password: 'x',
      assessmentYear: '2026-27',
    });
    assert.equal(store.setOtp(job.id, '111111'), null);
  });
});
