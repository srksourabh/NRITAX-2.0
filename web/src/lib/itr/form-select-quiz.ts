import type { FormType } from '@/lib/itr/types';

/** FY label used in form-selection copy (matches docs/itr-form-selection.md). */
export const FORM_SELECT_FY_LABEL = '2025-26';

export type FormQuizAnswer = 'yes' | 'no' | 'unsure';

export type FormQuizQuestion = {
  id: string;
  prompt: string;
  onYes?: FormType;
  onNo?: FormType;
  onUnsure?: FormType;
};

export const FORM_SELECT_QUIZ: FormQuizQuestion[] = [
  {
    id: 'partner',
    prompt: `Did you receive any income as a partner in a firm during FY ${FORM_SELECT_FY_LABEL}?`,
    onYes: 'ITR3',
    onUnsure: 'ITR3',
  },
  {
    id: 'pgbp',
    prompt: `Did you run a business or profession in India this year (shop, consultancy billed as business, freelancing treated as profession, coaching, agency, etc.)?`,
    onYes: 'ITR3',
  },
  {
    id: 'presumptive',
    prompt:
      'Are you reporting (or required to report) income under a presumptive scheme such as sections 44AD, 44ADA, or 44AE?',
    onYes: 'ITR3',
  },
  {
    id: 'fno',
    prompt:
      'Did you have speculative business income or futures & options that you treat as business income (not only as capital gains)?',
    onYes: 'ITR3',
  },
  {
    id: 'windup',
    prompt: `Did a business or profession exist at any time in FY ${FORM_SELECT_FY_LABEL}, even if you closed it before year-end?`,
    onYes: 'ITR3',
  },
  {
    id: 'salary_only',
    prompt:
      'Was your Indian income only from salary, house property, capital gains, and/or other sources (interest, dividends, etc.) — with no business or profession head?',
    onYes: 'ITR2',
  },
];

export function resolveFormQuizAnswer(
  q: FormQuizQuestion,
  answer: FormQuizAnswer,
): FormType | 'continue' | 'ambiguous' {
  if (answer === 'yes' && q.onYes) return q.onYes;
  if (answer === 'no' && q.onNo) return q.onNo;
  if (answer === 'unsure' && q.onUnsure) return q.onUnsure;
  if (q.id === 'salary_only' && (answer === 'no' || answer === 'unsure')) {
    return 'ambiguous';
  }
  return 'continue';
}
