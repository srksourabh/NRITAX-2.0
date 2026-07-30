import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isTerminal, transition } from './machine.js';

describe('portal-fetch machine', () => {
  it('queued -> logging_in -> awaiting_otp -> logging_in -> downloading -> succeeded', () => {
    let s = transition('queued', { type: 'START_LOGIN' });
    assert.equal(s, 'logging_in');
    s = transition(s!, { type: 'NEED_OTP' });
    assert.equal(s, 'awaiting_otp');
    s = transition(s!, { type: 'OTP_SUBMITTED' });
    assert.equal(s, 'logging_in');
    s = transition(s!, { type: 'START_DOWNLOAD' });
    assert.equal(s, 'downloading');
    s = transition(s!, { type: 'SUCCESS' });
    assert.equal(s, 'succeeded');
    assert.equal(isTerminal(s!), true);
  });

  it('escalates to needs_live_assist then downloading', () => {
    let s = transition('queued', { type: 'START_LOGIN' });
    s = transition(s!, { type: 'NEED_LIVE_ASSIST' });
    assert.equal(s, 'needs_live_assist');
    s = transition(s!, { type: 'LIVE_ASSIST_DONE' });
    assert.equal(s, 'downloading');
    s = transition(s!, { type: 'SUCCESS' });
    assert.equal(s, 'succeeded');
  });

  it('rejects OTP when not awaiting_otp', () => {
    assert.equal(transition('logging_in', { type: 'OTP_SUBMITTED' }), null);
    assert.equal(transition('succeeded', { type: 'FAIL' }), null);
  });
});
