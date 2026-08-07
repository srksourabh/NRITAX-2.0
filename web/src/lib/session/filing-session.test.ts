import { describe, expect, it } from 'vitest';

import { isValidPan, normalizePan, splitFullName } from '@/lib/session/filing-session';

describe('filing-session helpers', () => {
  it('normalises and validates PAN', () => {
    expect(normalizePan('abcde1234f')).toBe('ABCDE1234F');
    expect(isValidPan('ABCDE1234F')).toBe(true);
    expect(isValidPan('BAD')).toBe(false);
  });

  it('splits full name into first and surname', () => {
    expect(splitFullName('Priya Sharma')).toEqual({ first: 'Priya', surname: 'Sharma' });
    expect(splitFullName('Priya')).toEqual({ first: 'Priya', surname: '' });
  });
});
