/**
 * NRI / RNOR workflow helpers — schedule visibility and evidence gates.
 */

import type { ResidentialStatus } from '@/lib/itr/types';

/** DTAA treaty evidence is required for non-residents claiming treaty relief. */
export function dtaaEvidenceRequired(status: ResidentialStatus): boolean {
  return status === 'NRI' || status === 'NOR';
}

/** Schedule FA (foreign assets) applies to residents and RNOR with foreign holdings. */
export function scheduleFaRequired(status: ResidentialStatus): boolean {
  return status === 'RES' || status === 'NOR';
}

/** Schedule FSI is shown when foreign-source income may be reported. */
export function scheduleFsiVisible(status: ResidentialStatus): boolean {
  return status === 'NRI' || status === 'NOR' || status === 'RES';
}

/** Form 67 is needed when foreign tax has been paid and FTC is claimed. */
export function ftcForm67Needed(input: { hasForeignTaxPaid: boolean }): boolean {
  return input.hasForeignTaxPaid;
}
