import { describe, expect, it } from 'vitest';

import { fieldHelpText, isImportantField } from '@/lib/itr/field-help';
import type { FieldDef } from '@/lib/itr/types';

describe('field-help', () => {
  it('treats required and typed identity fields as important', () => {
    expect(isImportantField({ key: 'pan', label: 'PAN', type: 'pan', required: true })).toBe(
      true,
    );
    expect(isImportantField({ key: 'x', label: 'Note', type: 'text' })).toBe(false);
    expect(
      isImportantField({ key: 'y', label: 'Note', type: 'text', hint: 'Say more' }),
    ).toBe(true);
  });

  it('prefers schema hint and mentions mandatory when required', () => {
    const field: FieldDef = {
      key: 'aadhaar',
      label: 'Aadhaar',
      type: 'aadhaar',
      required: true,
      hint: '12 digits, no spaces',
    };
    const text = fieldHelpText(field);
    expect(text).toContain('12 digits');
    expect(text).toContain('mandatory');
  });

  it('falls back to type guidance when no hint', () => {
    const text = fieldHelpText({ key: 'pan', label: 'PAN', type: 'pan' });
    expect(text.toLowerCase()).toContain('permanent account');
  });
});
