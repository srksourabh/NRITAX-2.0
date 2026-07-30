import { describe, expect, it } from 'vitest';

import {
  canAcceptOtp,
  canLiveAssist,
  transition,
} from '@/lib/portal-fetch/job-machine';

describe('portal-fetch job machine', () => {
  it('moves queued to logging_in on START_LOGIN', () => {
    expect(transition('queued', { type: 'START_LOGIN' })).toBe('logging_in');
  });

  it('accepts OTP only while awaiting_otp', () => {
    expect(canAcceptOtp('awaiting_otp')).toBe(true);
    expect(canAcceptOtp('logging_in')).toBe(false);
    expect(transition('awaiting_otp', { type: 'OTP_SUBMITTED' })).toBe(
      'logging_in',
    );
    expect(transition('logging_in', { type: 'OTP_SUBMITTED' })).toBeNull();
  });

  it('escalates to needs_live_assist from login or otp', () => {
    expect(transition('logging_in', { type: 'NEED_LIVE_ASSIST' })).toBe(
      'needs_live_assist',
    );
    expect(transition('awaiting_otp', { type: 'NEED_LIVE_ASSIST' })).toBe(
      'needs_live_assist',
    );
    expect(canLiveAssist('needs_live_assist')).toBe(true);
  });

  it('rejects transitions from terminal statuses', () => {
    expect(transition('succeeded', { type: 'FAIL' })).toBeNull();
    expect(transition('failed', { type: 'START_LOGIN' })).toBeNull();
    expect(transition('timed_out', { type: 'NEED_OTP' })).toBeNull();
  });

  it('completes download to succeeded', () => {
    expect(transition('downloading', { type: 'SUCCESS' })).toBe('succeeded');
  });
});
