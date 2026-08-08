import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { extractJsonArtifact, unwrapPrefillText } from './file-itr-prefill.js';

describe('unwrapPrefillText / extractJsonArtifact', () => {
  it('unwraps getPrefillCurrentYr content string into personalInfo JSON', () => {
    const inner = {
      personalInfo: { assesseeName: { firstName: 'A' } },
      filingStatus: {},
    };
    const wrapped = {
      responseCode: 0,
      responseDesc: 'Success',
      content: JSON.stringify(inner),
    };
    const out = unwrapPrefillText(JSON.stringify(wrapped));
    assert.ok(out);
    const parsed = JSON.parse(out!) as { personalInfo: unknown };
    assert.ok(parsed.personalInfo);
  });

  it('accepts Form_ITR3 payload as-is', () => {
    const form = { Form_ITR3: { PersonalInfo: { PAN: 'ABCDE1234F' } } };
    const out = extractJsonArtifact(form);
    assert.ok(out);
    assert.match(out!, /Form_ITR3/);
  });

  it('rejects unrelated JSON', () => {
    assert.equal(unwrapPrefillText('{"ok":true}'), null);
    assert.equal(extractJsonArtifact({ hello: 'world' }), null);
  });
});
