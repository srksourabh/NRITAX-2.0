import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { JobStore } from '../store.js';
import {
  continueMockAfterLive,
  continueMockAfterOtp,
  runMockPrefill,
} from './mock-prefill.js';

describe('mock prefill flow', () => {
  it('Mode A: OTP then succeeds with specimen JSON', async () => {
    const store = new JobStore();
    // Use module store via monkeypatch — mock-prefill imports singleton.
    // Drive the singleton store instead.
    const { store: globalStore } = await import('../store.js');
    const job = globalStore.create({
      userId: 'u1',
      pan: 'ABCDE1234F',
      name: 'Priya NRI',
      dob: '1990-05-15',
      mobile: '9876543210',
      password: 'good-password',
      assessmentYear: '2026-27',
    });

    await runMockPrefill(job.id);
    assert.equal(globalStore.get(job.id)?.status, 'awaiting_otp');

    globalStore.setOtp(job.id, '654321');
    await continueMockAfterOtp(job.id);
    const done = globalStore.get(job.id)!;
    assert.equal(done.status, 'succeeded');
    assert.equal(done.secrets, null);
    assert.ok(done.artifactJson?.includes('ABCDE1234F'));
    assert.ok(done.artifactJson?.includes('Form_ITR2'));
    void store;
  });

  it('Mode B: captcha password escalates then live-done succeeds', async () => {
    const { store: globalStore } = await import('../store.js');
    const job = globalStore.create({
      userId: 'u1',
      pan: 'ABCDE1234F',
      name: 'Priya NRI',
      dob: '1990-05-15',
      mobile: '9876543210',
      password: 'needs-captcha',
      assessmentYear: '2026-27',
    });

    await runMockPrefill(job.id);
    const mid = globalStore.get(job.id)!;
    assert.equal(mid.status, 'needs_live_assist');
    assert.ok(mid.liveViewUrl);

    await continueMockAfterLive(job.id);
    const done = globalStore.get(job.id)!;
    assert.equal(done.status, 'succeeded');
    assert.equal(done.secrets, null);
    assert.ok(done.artifactJson);
  });

  it('wrong password fails and wipes secrets', async () => {
    const { store: globalStore } = await import('../store.js');
    const job = globalStore.create({
      userId: 'u1',
      pan: 'ABCDE1234F',
      name: 'X',
      dob: '1990-01-01',
      mobile: '9876543210',
      password: 'wrong-password',
      assessmentYear: '2026-27',
    });
    await runMockPrefill(job.id);
    const done = globalStore.get(job.id)!;
    assert.equal(done.status, 'failed');
    assert.equal(done.secrets, null);
  });
});
