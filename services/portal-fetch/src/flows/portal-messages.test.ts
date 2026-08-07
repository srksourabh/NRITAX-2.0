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

  it('detects account lock wording only with explicit sentence', () => {
    assert.equal(
      isPortalAccountLocked(
        'Your e-filing account has been locked due to security reasons, you can try after 30 minutes',
      ),
      true,
    );
    assert.equal(isPortalAccountLocked('loginLock.svg padlock graphic'), false);
    assert.equal(isPortalAccountLocked('Click here to unlock your account help'), false);
    assert.equal(isPortalAccountLocked('due to security reasons alone'), false);
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

  it('does not treat buried i18n lock templates as a live lock', () => {
    const html = `
      <html><head>
      <script>window.i18n={"LOCK":"Your e-filing account has been locked due to security reasons, you can try after 30 minutes"}</script>
      </head>
      <body>
        <h1>Login</h1>
        <label>Password</label>
        <img alt="loginLock" src="/assets/loginLock.svg"/>
        <button>Continue</button>
      </body></html>
    `;
    const msg = extractPortalMessage(html);
    assert.equal(msg == null || !isPortalAccountLocked(msg), true);
  });

  it('strips dialog chrome from locked-account scrape', () => {
    const raw =
      'Continue Back Your e-filing account has been locked due to security reasons, you can try after 30 minutes or to unlock your account now, Click here OK You have one attempt remaining';
    const msg = extractPortalMessage(raw);
    assert.ok(msg && /account has been locked/i.test(msg));
    assert.ok(msg && !/^Continue/i.test(msg));
  });

  it('formats locked account with clear next steps', () => {
    const out = formatPortalFailure(
      'Your e-filing account has been locked due to security reasons',
      'fallback',
    );
    assert.match(out, /locked for security/i);
    assert.match(out, /30 minutes|unlock/i);
  });

  it('formats portal text for the UI', () => {
    assert.equal(
      formatPortalFailure('Invalid credentials. Please try again', 'fallback'),
      'Income Tax portal: Invalid credentials. Please try again',
    );
    assert.equal(formatPortalFailure(null, 'fallback'), 'fallback');
  });
});
