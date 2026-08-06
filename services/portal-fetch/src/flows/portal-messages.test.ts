import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  extractPortalMessage,
  formatPortalFailure,
  isPortalAccountLocked,
  isPortalAuthFailure,
} from './portal-messages.js';

describe('portal-messages', () => {
  it('detects invalid credentials wording', () => {
    assert.equal(isPortalAuthFailure('Invalid credentials. Please try again'), true);
  });

  it('detects account lock wording', () => {
    assert.equal(
      isPortalAccountLocked(
        'Your e-filing account has been locked due to security reasons, you can try after 30 minutes',
      ),
      true,
    );
  });

  it('extracts alert-role text from HTML', () => {
    const html = `
      <div role="alert">Invalid credentials. Please try again</div>
      <p>Copyright Income Tax Department</p>
    `;
    assert.equal(
      extractPortalMessage(html),
      'Invalid credentials. Please try again',
    );
  });

  it('extracts PAN-not-registered style messages', () => {
    const html = '<body>PAN does not exist, please register this PAN or try with some other PAN</body>';
    const msg = extractPortalMessage(html);
    assert.ok(msg && /PAN does not exist/i.test(msg));
  });

  it('strips dialog chrome from locked-account scrape', () => {
    const raw =
      'Continue Back Your e-filing account has been locked due to security reasons, you can try after 30 minutes or to unlock your account now, Click here OK You have one attempt remaining';
    const msg = extractPortalMessage(raw);
    assert.ok(msg && /account has been locked/i.test(msg));
    assert.ok(msg && !/^Continue/i.test(msg));
    assert.ok(msg && !/\bOK\b/.test(msg));
  });

  it('formats locked account with clear next steps', () => {
    const out = formatPortalFailure(
      'Continue Back Your e-filing account has been locked due to security reasons OK',
      'fallback',
    );
    assert.match(out, /locked for security/i);
    assert.match(out, /30 minutes|unlock/i);
    assert.match(out, /Do not retry/i);
  });

  it('formats portal text for the UI', () => {
    assert.equal(
      formatPortalFailure('Invalid credentials. Please try again', 'fallback'),
      'Income Tax portal: Invalid credentials. Please try again',
    );
    assert.equal(formatPortalFailure(null, 'fallback'), 'fallback');
  });
});
