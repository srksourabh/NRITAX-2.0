import { describe, expect, it } from 'vitest';

import { casFailureMessage, resolveCasPdfPassword } from '@/lib/cas/password';

describe('resolveCasPdfPassword', () => {
  it('uses an explicit override before the PAN', () => {
    expect(resolveCasPdfPassword('abcde1234f', 'custom')).toBe('custom');
  });

  it('uppercases the PAN when there is no override', () => {
    expect(resolveCasPdfPassword('abcde1234f')).toBe('ABCDE1234F');
  });

  it('returns undefined when neither PAN nor override is set', () => {
    expect(resolveCasPdfPassword('')).toBeUndefined();
    expect(resolveCasPdfPassword(null, '  ')).toBeUndefined();
  });
});

describe('casFailureMessage', () => {
  it('explains a bad password', () => {
    expect(casFailureMessage('BAD_PASSWORD')).toMatch(/Wrong PDF password/);
  });

  it('rejects depository and summary statements clearly', () => {
    expect(casFailureMessage('UNSUPPORTED_FORMAT')).toMatch(/Detailed CAMS/);
  });

  it('falls back when the code is unknown', () => {
    expect(casFailureMessage(undefined, 'custom')).toBe('custom');
  });
});
