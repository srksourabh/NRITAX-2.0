import type { JobRecord } from '../store.js';

/**
 * Minimal specimen ITD-shaped JSON for mock / CI runs.
 * Real Mode A replaces this with the downloaded portal file.
 */
export function specimenPrefillJson(job: JobRecord): string {
  const ay = job.assessmentYear.replace(/[^0-9]/g, '').slice(0, 4) || '2026';
  const parts = job.name.trim().split(/\s+/);
  const firstName = parts[0] ?? 'TAXPAYER';
  const surname = parts.length > 1 ? parts[parts.length - 1]! : 'NRITAX';
  const payload = {
    Form_ITR2: {
      FormName: 'ITR-2',
      AssessmentYear: ay,
      SchemaVer: 'Ver1.0',
      PartA_GEN1: {
        PersonalInfo: {
          AssesseeName: {
            FirstName: firstName,
            SurNameOrOrgName: surname,
          },
          PAN: job.pan,
          DOB: job.dob.replace(/-/g, ''),
        },
      },
    },
  };
  return JSON.stringify(payload);
}
