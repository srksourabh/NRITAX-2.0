/**
 * Answers collected before Browserbase drives the e-Filing "File ITR" wizard.
 * Mapped from the live portal path seen in session
 * .../dashboard/fileIncomeTaxReturn (+ offlineJsonSubmission + getPrefillCurrentYr).
 */

export type PortalFormType = 'ITR2' | 'ITR3';

export type PortalFilingType = 'original' | 'revised' | 'belated' | 'updated';

export type PortalPrefillAnswers = {
  formType: PortalFormType;
  assessmentYear: string;
  /** Portal: "Are you a Politically Exposed Person?" */
  politicallyExposed: boolean;
  filingType: PortalFilingType;
};

export const DEFAULT_ASSESSMENT_YEAR = '2026-27';

export function normalizeAssessmentYear(raw: string): string {
  const t = String(raw ?? '').trim();
  if (/^\d{4}-\d{2}$/.test(t)) return t;
  if (/^\d{4}$/.test(t)) {
    const y = Number(t);
    return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
  }
  return DEFAULT_ASSESSMENT_YEAR;
}

export function formTypeLabel(form: PortalFormType): string {
  return form === 'ITR3' ? 'ITR-3' : 'ITR-2';
}

export function filingTypeLabel(t: PortalFilingType): string {
  switch (t) {
    case 'revised':
      return 'Revised';
    case 'belated':
      return 'Belated';
    case 'updated':
      return 'Updated';
    default:
      return 'Original';
  }
}
