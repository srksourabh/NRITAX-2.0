/**
 * Jukti Yukti — local schedule guidance for the filing side panel.
 * Complements the full AI review; does not call the network by itself.
 */

import type { FormType, ReturnData, ScheduleDef } from '@/lib/itr/types';
import { compareReturnRegimes, computeReturnTax } from '@/lib/itr/compute/tax-adapter';
import { money } from '@/lib/itr/types';
import { validateReturn } from '@/lib/itr/validate';

export type JuktiTip = {
  id: string;
  tone: 'do' | 'skip' | 'check' | 'info';
  title: string;
  body: string;
};

export type JuktiSnapshot = {
  tips: JuktiTip[];
  validation: { blocking: number; field: number; advisory: number } | null;
  taxPayable: number | null;
  regimeNote: string | null;
};

const SKIP_FOR_NRI = new Set(['FA', 'FSI', 'AL']);

export function buildJuktiSnapshot(input: {
  form: FormType;
  data: ReturnData;
  schedule: ScheduleDef | undefined;
}): JuktiSnapshot {
  const { form, data, schedule } = input;
  const tips: JuktiTip[] = [];
  const status = String(data.fields['GEN.ResidentialStatus'] ?? data.meta.residentialStatus ?? '');

  if (schedule) {
    tips.push({
      id: `sch-${schedule.id}`,
      tone: 'info',
      title: `Working on ${schedule.no} · ${schedule.name}`,
      body:
        schedule.sub ??
        'Fill only what applies. Leave blank schedules that do not apply to you — empty is safer than guessing.',
    });

    if (status === 'NRI' && SKIP_FOR_NRI.has(schedule.id)) {
      tips.push({
        id: 'nri-skip',
        tone: 'skip',
        title: 'Usually skip for non-residents',
        body: 'Schedule FA / FSI / AL are generally not required when residential status is non-resident. Confirm before spending time here.',
      });
    }

    if (schedule.id === 'VIA' || schedule.id.startsWith('D80')) {
      const regime = data.meta.regime;
      if (regime === 'new') {
        tips.push({
          id: 'new-regime-ded',
          tone: 'skip',
          title: 'New regime — most Chapter VI-A deductions stay blank',
          body: 'Under section 115BAC, leave 80C / 80D / 80G style schedules blank unless a specific allowance still applies. Prefer the comparison before opting out.',
        });
      } else {
        tips.push({
          id: 'old-regime-ded',
          tone: 'do',
          title: 'Old regime — claim only what you can evidence',
          body: 'Keep receipts / statements for every Chapter VI-A claim. Totals here must agree with Schedule VI-A.',
        });
      }
    }

    if (schedule.id === 'BP' || schedule.id === 'BS' || schedule.id === 'PL') {
      tips.push({
        id: 'business',
        tone: 'check',
        title: form === 'ITR2' ? 'Wrong form risk' : 'Accounts must tie',
        body:
          form === 'ITR2'
            ? 'Business figures belong on ITR-3. Switch form if you have PGBP income.'
            : 'Balance sheet, P&L and Schedule BP must agree. If you are presumptive (44AD / 44ADA / 44AE), say so in Part A.',
      });
    }

    if (schedule.id === 'CG') {
      tips.push({
        id: 'cg',
        tone: 'do',
        title: 'Prefer CAS / broker JSON over typing scrips',
        body: 'Use the helper rail to import Detailed CAS or broker files into Schedule 112A where possible, then review balances.',
      });
    }
  }

  tips.push({
    id: 'validate',
    tone: 'check',
    title: 'Validate after each schedule',
    body: 'Run validation when you leave a schedule. Fix Cat A blocks before downloading JSON.',
  });

  let validation: JuktiSnapshot['validation'] = null;
  let taxPayable: number | null = null;
  let regimeNote: string | null = null;

  try {
    const report = validateReturn(data);
    validation = {
      blocking: report.blocking.length,
      field: report.fieldErrors.length,
      advisory: report.advisory.length,
    };
  } catch {
    validation = null;
  }

  try {
    const tax = computeReturnTax(data);
    taxPayable = tax.netTaxLiability;
  } catch {
    taxPayable = null;
  }

  try {
    const cmp = compareReturnRegimes(data);
    if (cmp.saving >= 500) {
      regimeNote = `${cmp.better === 'new' ? 'New' : 'Old'} regime looks lower by ${money(cmp.saving)} on these figures.`;
    } else {
      regimeNote = 'Old and new regimes are close on these figures.';
    }
  } catch {
    regimeNote = null;
  }

  return { tips, validation, taxPayable, regimeNote };
}
