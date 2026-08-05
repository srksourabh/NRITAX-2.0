import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  extractPortalMessage,
  formatPortalFailure,
  isPortalAuthFailure,
} from './portal-messages.js';

describe('portal-messages', () => {
  it('detects invalid credentials wording', () => {
    assert.equal(isPortalAuthFailure('Invalid credentials. Please try again'), true);
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

  it('formats portal text for the UI', () => {
    assert.equal(
      formatPortalFailure('Invalid credentials. Please try again', 'fallback'),
      'Income Tax portal: Invalid credentials. Please try again',
    );
    assert.equal(formatPortalFailure(null, 'fallback'), 'fallback');
  });
});
