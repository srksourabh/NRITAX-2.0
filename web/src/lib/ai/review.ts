/**
 * Form review — wraps auditReturn with the warn/flag/block schema from
 * docs/prompts/itr-ai-full-form-review.md. Falls back to a local heuristic
 * wrong-form check when Anthropic is unavailable.
 */

import { auditReturn, type AuditReport } from '@/lib/ai/audit';
import {
  compareReturnRegimes,
  computeReturnTax,
} from '@/lib/itr/compute/tax-adapter';
import type { ReturnData, ValidationReport } from '@/lib/itr/types';
import { validateReturn } from '@/lib/itr/validate';

export type ReviewAction = 'info' | 'warn' | 'flag' | 'block';

export interface ReviewFinding {
  id: string;
  code: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: ReviewAction;
  title: string;
  userMessage: string;
  where: string[];
  suggestedFix?: string;
}

export interface FormReviewReport {
  available: boolean;
  source: 'anthropic' | 'local';
  wrongFormSuspected: boolean;
  blocksFilingRecommendation: boolean;
  highestAction: ReviewAction;
  summary: string;
  findings: ReviewFinding[];
  /** Legacy audit payload when Anthropic ran. */
  audit?: AuditReport;
}

const ACTION_RANK: Record<ReviewAction, number> = {
  info: 0,
  warn: 1,
  flag: 2,
  block: 3,
};

function maxAction(actions: ReviewAction[]): ReviewAction {
  return actions.reduce<ReviewAction>(
    (best, a) => (ACTION_RANK[a] > ACTION_RANK[best] ? a : best),
    'info',
  );
}

function localWrongFormCheck(data: ReturnData): ReviewFinding[] {
  const form = data.meta.form;
  const findings: ReviewFinding[] = [];
  const bpSignal =
    Number(data.fields['BP.bpTotal'] ?? 0) > 0 ||
    Number(data.fields['TI.tiBp'] ?? 0) > 0 ||
    (data.tables['partner'] ?? []).length > 0 ||
    Object.keys(data.fields).some(
      (k) => k.startsWith('BP.') && Number(data.fields[k]) > 0,
    );

  if (form === 'ITR2' && bpSignal) {
    findings.push({
      id: 'D-WRONG-FORM',
      code: 'WRONG_FORM',
      severity: 'critical',
      action: 'block',
      title: 'Wrong form suspected',
      userMessage:
        'Business or profession figures appear on an ITR-2 return. Switch to ITR-3 or clear those fields.',
      where: ['meta.form', 'BP'],
      suggestedFix: 'Change form to ITR-3, or remove PGBP amounts if they were entered by mistake.',
    });
  }

  if (form === 'ITR3' && !bpSignal) {
    const hasOther =
      Number(data.fields['S.salChargeable'] ?? 0) > 0 ||
      Number(data.fields['TI.gti'] ?? 0) > 0;
    if (hasOther) {
      findings.push({
        id: 'D-FORM-ITR3-EMPTY-BP',
        code: 'WRONG_FORM',
        severity: 'medium',
        action: 'warn',
        title: 'ITR-3 with no business signal',
        userMessage:
          'This ITR-3 has little or no business income filled. Confirm ITR-3 is required, or switch to ITR-2.',
        where: ['meta.form'],
        suggestedFix: 'Confirm partner/PGBP facts, or open ITR-2 instead.',
      });
    }
  }

  return findings;
}

function mapAuditToFindings(audit: AuditReport): ReviewFinding[] {
  return audit.observations.map((obs, i) => {
    const action: ReviewAction =
      audit.verdict === 'blocked' && obs.severity === 'high'
        ? 'block'
        : obs.severity === 'high'
          ? 'flag'
          : obs.severity === 'medium'
            ? 'warn'
            : 'info';
    return {
      id: `A${i + 1}`,
      code: 'OTHER',
      severity:
        obs.severity === 'high' ? 'high' : obs.severity === 'medium' ? 'medium' : 'low',
      action,
      title: obs.schedule,
      userMessage: obs.message,
      where: obs.field ? [obs.field] : [obs.schedule],
      suggestedFix: obs.suggestion,
    };
  });
}

export async function reviewReturn(data: ReturnData): Promise<{
  validation: ValidationReport;
  review: FormReviewReport;
}> {
  const validation = validateReturn(data);
  const local = localWrongFormCheck(data);

  let audit: AuditReport | undefined;
  try {
    const tax = computeReturnTax(data);
    const comparison = compareReturnRegimes(data);
    audit = await auditReturn({ data, tax, validation, comparison });
  } catch {
    audit = {
      available: false,
      verdict: 'clean',
      observations: [],
      summary: 'AI audit failed to run.',
    };
  }

  const aiFindings =
    audit?.available && audit.observations.length > 0 ? mapAuditToFindings(audit) : [];

  const findings = [...local, ...aiFindings];
  const highestAction = findings.length ? maxAction(findings.map((f) => f.action)) : 'info';
  const wrongFormSuspected = findings.some((f) => f.code === 'WRONG_FORM');
  const blocksFilingRecommendation =
    highestAction === 'block' || findings.some((f) => f.action === 'block');

  const summary =
    findings[0]?.userMessage ??
    (audit?.available
      ? audit.summary
      : local.length
        ? local[0].userMessage
        : 'No material review findings. Validate and download when ready.');

  return {
    validation,
    review: {
      available: Boolean(audit?.available) || local.length > 0,
      source: audit?.available ? 'anthropic' : 'local',
      wrongFormSuspected,
      blocksFilingRecommendation,
      highestAction,
      summary,
      findings,
      audit,
    },
  };
}
