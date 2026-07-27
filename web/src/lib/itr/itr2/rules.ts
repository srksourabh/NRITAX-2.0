/**
 * CBDT validation rules for ITR-2, assessment year 2026-27.
 *
 * One entry per rule of the ITR-2 validation-rules document v1.0. The serial
 * number `n`, the category and the rule text are as published, so a taxpayer
 * can trace a failure back to the document. Category A stops the upload,
 * category D lets it through but flags a claim the department may disallow.
 *
 * A check reads the return only through RuleContext: `N`/`V` for fully
 * qualified field keys, `rows` for table keys, `C` for figures the calculation
 * engine derives. Nothing here imports another module of the engine.
 */

import {
  PREVIOUS_YEAR_END,
  money,
  type FieldValue,
  type RuleContext,
  type RuleDef,
  type TableRow,
} from '@/lib/itr/types';

/* ─────────────────────────── local helpers ─────────────────────────── */

const RE_MOBILE = /^[0-9]{10}$/;
const RE_IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const GOVERNMENT_EMPLOYER = /Central Government|State Government/i;
const ASSESSMENT_YEAR_START = '2026-04-01';

const num = (v: FieldValue): number => {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
};

const str = (v: FieldValue): string => (v == null ? '' : String(v));

/** Column total of a table, the prototype's `T(table.column)`. */
const sum = (rows: TableRow[], column: string): number =>
  rows.reduce((a, r) => a + num(r[column]), 0);

/** Rules 175 and 176 — the 110 per cent safe harbour of section 50C. */
function fvc50c(consideration: number, stampValue: number): number {
  if (!consideration && !stampValue) return 0;
  return stampValue <= 1.1 * consideration ? consideration : stampValue;
}

/** Rules 84 to 90 and 134 — one Schedule 112A row under section 55(2)(ac). */
function row112A(r: TableRow): { sale: number; fmv: number; cost: number; balance: number } {
  const units = num(r.qty);
  const sale = num(r.sale) || Math.round(units * num(r.sprice));
  const fmv = num(r.fmv) || Math.round(units * num(r.fmvu));
  const acquiredAfter = str(r.acq) === 'A';
  const lowerOfSaleAndFmv = acquiredAfter ? 0 : Math.min(sale, fmv);
  const cost = acquiredAfter ? num(r.cost) : Math.max(num(r.cost), lowerOfSaleAndFmv);
  return { sale, fmv, cost, balance: sale - (cost + num(r.exp)) };
}

/** Rules 520 and 521 — challans split by whether they fall inside the previous year. */
function challanSplit(ctx: RuleContext): { advance: number; self: number } {
  let advance = 0;
  let self = 0;
  for (const r of ctx.rows('chal')) {
    const amount = num(r.chAmt);
    const date = str(r.depDate);
    if (date && date > PREVIOUS_YEAR_END) self += amount;
    else advance += amount;
  }
  return { advance, self };
}

interface SetoffHead {
  id: string;
  label: string;
  income: number;
  hpSet: number;
  osSet: number;
  remaining: number;
  takesHp: boolean;
  takesOs: boolean;
  pool: 'sal' | 'hp' | 'cg' | 'os' | 'race';
}

interface Setoff {
  cyla: SetoffHead[];
  bfla: Array<{ id: string; label: string; income: number; set: number; remaining: number }>;
  hpLoss: number;
  hpSetOff: number;
  hpSpill: number;
  hpUnused: number;
  osLoss: number;
  osSetOff: number;
  osUnused: number;
  remaining: number;
}

/**
 * Schedule CYLA and BFLA, computed the way the department does it, so the
 * set-off rules have something to test. Capital gains sit in one head rather
 * than the departmental rate-wise rows, because RuleContext exposes the head
 * totals but not the quarterly grid those rows are built from.
 */
function setoff(ctx: RuleContext): Setoff {
  const hpLoss = Math.max(-ctx.C('hpTotal'), 0);
  // Rule 264: no set-off at all under the new regime.
  // Rule 249: the old regime allows 2,00,000 under section 71(3A).
  const hpPool = ctx.regime === 'old' ? Math.min(hpLoss, 200000) : 0;
  const hpSpill = hpLoss - hpPool;
  const osLoss = Math.max(-ctx.C('osNet'), 0);

  const head = (
    id: string,
    label: string,
    income: number,
    takesHp: boolean,
    takesOs: boolean,
    pool: SetoffHead['pool'],
  ): SetoffHead => {
    const positive = Math.max(income, 0);
    return { id, label, income: positive, hpSet: 0, osSet: 0, remaining: positive, takesHp, takesOs, pool };
  };

  const cyla: SetoffHead[] = [
    head('sal', 'Salaries', ctx.C('salChargeable'), true, true, 'sal'),
    head('hp', 'House property', ctx.C('hpTotal'), false, true, 'hp'),
    head('cg', 'Capital gains', ctx.C('cgTotal'), true, true, 'cg'),
    head('osnorm', 'Net income from other sources at normal rates', ctx.C('osNet'), true, false, 'os'),
    head('osrace', 'Profit from owning and maintaining race horses', ctx.N('CYLA.osraceInc'), true, true, 'race'),
    head('osdtaa', 'Income from other sources taxable at DTAA rates', ctx.N('CYLA.osdtaaInc'), true, true, 'os'),
  ];

  let hpLeft = hpPool;
  let osLeft = osLoss;

  // Rule 267: a normal other-sources loss goes against race horse profit first.
  const race = cyla.find((h) => h.id === 'osrace');
  if (race && osLeft > 0 && race.remaining > 0) {
    const applied = Math.min(osLeft, race.remaining);
    race.osSet += applied;
    race.remaining -= applied;
    osLeft -= applied;
  }

  for (const h of cyla) {
    if (h.takesHp && hpLeft > 0) {
      const applied = Math.min(hpLeft, h.remaining);
      h.hpSet += applied;
      h.remaining -= applied;
      hpLeft -= applied;
    }
    if (h.takesOs && osLeft > 0) {
      const applied = Math.min(osLeft, h.remaining);
      h.osSet += applied;
      h.remaining -= applied;
      osLeft -= applied;
    }
  }

  const brought = ctx.rows('cfl');
  let bfHp = sum(brought, 'hpLoss');
  let bfStcl = sum(brought, 'stcl');
  let bfLtcl = sum(brought, 'ltcl');
  let bfRace = sum(brought, 'raceLoss');

  const bfla = cyla.map((h) => {
    let remaining = h.remaining;
    let set = 0;
    const apply = (available: number): number => {
      const applied = Math.min(available, remaining);
      remaining -= applied;
      set += applied;
      return available - applied;
    };
    if (h.pool === 'hp' && bfHp > 0) bfHp = apply(bfHp);
    if (h.pool === 'cg') {
      if (bfStcl > 0) bfStcl = apply(bfStcl);
      if (bfLtcl > 0) bfLtcl = apply(bfLtcl);
    }
    if (h.pool === 'race' && bfRace > 0) bfRace = apply(bfRace);
    return { id: h.id, label: h.label, income: h.remaining, set, remaining };
  });

  return {
    cyla,
    bfla,
    hpLoss,
    hpSetOff: cyla.reduce((a, h) => a + h.hpSet, 0),
    hpSpill,
    hpUnused: hpLeft,
    osLoss,
    osSetOff: cyla.reduce((a, h) => a + h.osSet, 0),
    osUnused: osLeft,
    remaining: cyla.reduce((a, h) => a + h.remaining, 0),
  };
}

/** Deductions barred under the new regime — rule 342. */
const VIA_OLD_ONLY: ReadonlyArray<readonly [string, string]> = [
  ['VIA.d80c', '80C'],
  ['VIA.d80ccc', '80CCC'],
  ['VIA.d80ccd1', '80CCD(1)'],
  ['VIA.d80ccd1b', '80CCD(1B)'],
  ['VIA.d80d', '80D'],
  ['VIA.d80dd', '80DD'],
  ['VIA.d80ddb', '80DDB'],
  ['VIA.d80e', '80E'],
  ['VIA.d80eea', '80EEA'],
  ['VIA.d80eeb', '80EEB'],
  ['VIA.d80g', '80G'],
  ['VIA.d80gg', '80GG'],
  ['VIA.d80ggc', '80GGC'],
  ['VIA.d80tta', '80TTA'],
  ['VIA.d80ttb', '80TTB'],
  ['VIA.d80u', '80U'],
  ['VIA.d80ccg', '80CCG'],
];

/** Every table of Schedule FA — rules 746 and 20.1. */
const FA_TABLES = ['faA1', 'faA2', 'faA3', 'faA4', 'faB', 'faC', 'faD', 'faE', 'faF', 'faG'];

const hasFaRows = (ctx: RuleContext): boolean => FA_TABLES.some((t) => ctx.rows(t).length > 0);

const hasGovernmentEmployer = (ctx: RuleContext): boolean =>
  ctx.rows('emp').some((r) => GOVERNMENT_EMPLOYER.test(str(r.eCat)));

/* ─────────────────────────── the rules ─────────────────────────── */

/** The published ITR-2 validation rules, in schedule order. */
export const ITR2_RULES: RuleDef[] = [
  /* ---------------- Part A General and filing status ---------------- */
  {
    n: 1,
    cat: 'A',
    schedule: 'GEN',
    text: 'Assessee should enter valid Mobile Number',
    check: (ctx) =>
      RE_MOBILE.test(ctx.V('GEN.mobile')) ? null : 'Primary mobile number must be exactly 10 digits',
  },
  {
    n: 5,
    cat: 'A',
    schedule: 'GEN',
    text: 'Unlisted equity shares selected as Yes, details should be filled',
    check: (ctx) =>
      ctx.V('GEN.unlisted') === 'Y'
        ? 'Unlisted shares answered Yes. The share-wise detail table is not part of this return, so complete it in the departmental utility before upload'
        : null,
  },
  {
    n: 6,
    cat: 'A',
    schedule: 'GEN',
    text: 'Portuguese Civil Code Yes, Schedule 5A is mandatory',
    check: (ctx) =>
      ctx.V('GEN.portuguese') === 'Y'
        ? 'Governed by the Portuguese Civil Code. Schedule 5A is mandatory and is not part of this return'
        : null,
  },
  {
    n: 7,
    cat: 'A',
    schedule: 'GEN',
    text: 'Representative assessee Yes, details should be provided',
    check: (ctx) =>
      ctx.V('GEN.repFlag') === 'Y' && !(ctx.V('GEN.repName') && ctx.V('GEN.repPan'))
        ? 'Representative assessee selected. Name and PAN of the representative are mandatory'
        : null,
  },
  {
    n: 9,
    cat: 'A',
    schedule: 'GEN',
    text: 'Seventh proviso to 139(1) Yes, respective details should be filled',
    check: (ctx) =>
      ctx.V('GEN.seventh') === 'Y' &&
      !(ctx.V('GEN.cash1cr') || ctx.V('GEN.travel2l') || ctx.V('GEN.elec1l'))
        ? 'Filing under the seventh proviso. At least one of the deposit, travel or electricity conditions must be answered'
        : null,
  },
  {
    n: 10,
    cat: 'A',
    schedule: 'GEN',
    text: 'Director in a company Yes, respective details should be filled',
    check: (ctx) =>
      ctx.V('GEN.director') === 'Y'
        ? 'Director answered Yes. The company-wise detail table is not part of this return, so complete it in the departmental utility before upload'
        : null,
  },
  {
    n: 14,
    cat: 'A',
    schedule: 'GEN',
    text: 'Portuguese Civil Code No, Schedule 5A should not be filed',
    // Schedule 5A is not part of the ITR-2 schema, so there is nothing to test.
    check: () => null,
  },
  {
    n: 15,
    cat: 'A',
    schedule: 'GEN',
    text: 'FPI must be Yes to enable Schedule 115AD(1)(b)(iii) proviso',
    // The 115AD(1)(b)(iii) proviso schedule is not part of the ITR-2 schema.
    check: () => null,
  },
  {
    n: 16,
    cat: 'A',
    schedule: 'GEN',
    text: 'Notice u/s 139(9)/142(1)/148 or order u/s 119(2)(b): DIN and date are mandatory',
    check: (ctx) => {
      const notice = ctx.V('GEN.noticeUs');
      const served = notice !== '' && notice !== '11';
      return served && !(ctx.V('GEN.din') && ctx.V('GEN.dinDate'))
        ? 'Filed in response to a notice. The Document Identification Number and its date are both mandatory'
        : null;
    },
  },
  {
    n: 18,
    cat: 'A',
    schedule: 'GEN',
    text: 'Opting out of the new tax regime is not available after the due date u/s 139(1)',
    check: (ctx) =>
      ctx.regime === 'old' && ctx.isBelated
        ? 'The return is filed u/s 139(4), after the due date of 31 July 2026. The old regime cannot be chosen in a belated return'
        : null,
  },
  {
    n: 20,
    cat: 'A',
    schedule: 'GEN',
    text: 'Residents and not ordinarily residents cannot be FII or FPI',
    check: (ctx) =>
      ctx.residentialStatus !== 'NRI' && ctx.V('GEN.isFpi') === 'Y'
        ? 'A resident or resident but not ordinarily resident cannot be a Foreign Portfolio Investor'
        : null,
  },
  {
    n: 449,
    cat: 'A',
    schedule: 'GEN',
    text: 'Governed by Portuguese Code, PAN of spouse should be provided',
    // The spouse PAN lives in Schedule 5A, which is not part of the ITR-2 schema.
    check: () => null,
  },
  {
    n: 457,
    cat: 'A',
    schedule: 'GEN',
    text: 'Verification capacity Representative: name, email and contact of representative are mandatory',
    check: (ctx) =>
      ctx.V('VER.vCapacity') === 'R' &&
      !(ctx.V('GEN.repName') && ctx.V('GEN.repEmail') && ctx.V('GEN.repMobile'))
        ? "Verification capacity is Representative, so the representative's name, email and contact number are all mandatory in Part A General"
        : null,
  },
  {
    n: 747,
    cat: 'A',
    schedule: 'GEN',
    text: "Representative email and contact must not match the taxpayer's",
    check: (ctx) => {
      const repEmail = ctx.V('GEN.repEmail').toLowerCase();
      if (
        repEmail &&
        (repEmail === ctx.V('GEN.email').toLowerCase() || repEmail === ctx.V('GEN.email2').toLowerCase())
      ) {
        return "The representative's email must not be the same as the taxpayer's";
      }
      const repMobile = ctx.V('GEN.repMobile');
      if (repMobile && (repMobile === ctx.V('GEN.mobile') || repMobile === ctx.V('GEN.mobile2'))) {
        return "The representative's contact number must not be the same as the taxpayer's";
      }
      return null;
    },
  },
  {
    n: 652,
    cat: 'A',
    schedule: 'GEN',
    text: 'Date of birth or formation should be before 01/04 of the assessment year',
    check: (ctx) => {
      const dob = ctx.V('GEN.dob');
      return dob && dob >= ASSESSMENT_YEAR_START ? 'Date of birth must be before 1 April 2026' : null;
    },
  },
  {
    n: 746,
    cat: 'A',
    schedule: 'FA',
    text: 'Schedule FA has to be filled if the foreign asset question is Yes',
    check: (ctx) => {
      if (ctx.V('FA.faFlag') !== 'Y') return null;
      return hasFaRows(ctx) ? null : 'Foreign assets answered Yes but every table in Schedule FA is empty';
    },
  },
  {
    n: 20.1,
    cat: 'A',
    schedule: 'FA',
    text: 'Schedule FA is not applicable to a non-resident',
    check: (ctx) => {
      if (!ctx.isNRI) return null;
      return hasFaRows(ctx)
        ? 'Schedule FA does not apply to a non-resident. Clear these rows'
        : null;
    },
  },

  /* ---------------- Schedule S ---------------- */
  {
    n: 22,
    cat: 'A',
    schedule: 'S',
    text: 'Gross Salary should be consistent with 1a+1b+1c+1d',
    check: (ctx) =>
      ctx.C('grossSal') ===
      ctx.N('S.sal17_1') + ctx.N('S.sal17_2') + ctx.N('S.sal17_3') + ctx.N('S.sal89A')
        ? null
        : 'Gross salary does not equal the sum of its components',
  },
  {
    n: 24,
    cat: 'A',
    schedule: 'S',
    text: 'Allowances exempt u/s 10 should equal the sum of all dropdowns',
    check: (ctx) =>
      ctx.C('totExempt') === sum(ctx.rows('ex10'), 'exAmt')
        ? null
        : 'Total exempt allowance does not equal the sum of the allowance rows',
  },
  {
    n: 25,
    cat: 'A',
    schedule: 'S',
    text: 'Net Salary should be output of 2 - 3 - 3a',
    check: (ctx) =>
      ctx.C('netSalary') === ctx.C('grossSal') - ctx.C('totExempt')
        ? null
        : 'Net salary does not equal gross salary less exempt allowances',
  },
  {
    n: 27,
    cat: 'A',
    schedule: 'S',
    text: 'Income chargeable under Salaries should be output of 4 - 5',
    check: (ctx) =>
      ctx.C('salChargeable') ===
      ctx.C('netSalary') - ctx.N('S.dedStd') - ctx.N('S.dedEnt') - ctx.N('S.dedProf')
        ? null
        : 'Income chargeable under Salaries does not equal net salary less section 16 deductions',
  },
  {
    n: 37,
    cat: 'A',
    schedule: 'S',
    text: 'Professional tax u/s 16(iii) allowed only to the extent of Rs.5,000',
    check: (ctx) =>
      ctx.N('S.dedProf') > 5000
        ? `Professional tax u/s 16(iii) cannot exceed ${money(5000)}. You have claimed ${money(ctx.N('S.dedProf'))}`
        : null,
  },
  {
    n: 40,
    cat: 'A',
    schedule: 'S',
    text: 'Old regime: standard deduction not more than the lower of Rs.50,000 or net salary',
    check: (ctx) => {
      if (ctx.regime !== 'old') return null;
      const cap = Math.min(50000, Math.max(ctx.C('netSalary'), 0));
      return ctx.N('S.dedStd') > cap
        ? `Under the old regime the standard deduction is capped at the lower of ${money(50000)} or net salary, that is ${money(cap)}`
        : null;
    },
  },
  {
    n: 596,
    cat: 'A',
    schedule: 'S',
    text: 'New regime: standard deduction not more than the lower of Rs.75,000 or net salary',
    check: (ctx) => {
      if (ctx.regime !== 'new') return null;
      const cap = Math.min(75000, Math.max(ctx.C('netSalary'), 0));
      return ctx.N('S.dedStd') > cap
        ? `Under the new regime the standard deduction is capped at the lower of ${money(75000)} or net salary, that is ${money(cap)}`
        : null;
    },
  },
  {
    n: 57,
    cat: 'A',
    schedule: 'S',
    text: 'New regime: entertainment allowance u/s 16(ii) cannot be claimed',
    check: (ctx) =>
      ctx.regime === 'new' && ctx.N('S.dedEnt') > 0
        ? 'Entertainment allowance u/s 16(ii) cannot be claimed under the new regime'
        : null,
  },
  {
    n: 58,
    cat: 'A',
    schedule: 'S',
    text: 'New regime: professional tax u/s 16(iii) cannot be claimed',
    check: (ctx) =>
      ctx.regime === 'new' && ctx.N('S.dedProf') > 0
        ? 'Professional tax u/s 16(iii) cannot be claimed under the new regime'
        : null,
  },
  {
    n: 35,
    cat: 'A',
    schedule: 'S',
    text: 'Entertainment allowance not allowed for employees other than government',
    check: (ctx) => {
      if (ctx.N('S.dedEnt') <= 0) return null;
      return hasGovernmentEmployer(ctx)
        ? null
        : 'Entertainment allowance u/s 16(ii) is available only to government employees';
    },
  },
  {
    n: 36,
    cat: 'A',
    schedule: 'S',
    text: 'Old regime: entertainment allowance limited to Rs.5,000 or one fifth of basic salary',
    check: (ctx) =>
      ctx.regime === 'old' && ctx.N('S.dedEnt') > 5000
        ? `Entertainment allowance is limited to ${money(5000)} or one fifth of basic salary, whichever is lower`
        : null,
  },
  {
    n: 51,
    cat: 'A',
    schedule: 'S',
    text: 'Same exempt allowance cannot be selected more than once',
    check: (ctx) => {
      const seen = new Set<string>();
      for (const r of ctx.rows('ex10')) {
        const nature = str(r.exNat);
        if (!nature) continue;
        if (seen.has(nature)) {
          return `The same exempt allowance appears more than once: ${nature.slice(0, 60)}`;
        }
        seen.add(nature);
      }
      return null;
    },
  },
  {
    n: 54,
    cat: 'A',
    schedule: 'S',
    text: 'New regime: LTC, HRA and 10(14)(i)/(ii) allowances cannot be claimed exempt',
    check: (ctx) => {
      if (ctx.regime !== 'new') return null;
      const barred = /10\(5\)|10\(13A\)|10\(14\)\(i\)|10\(14\)\(ii\)|10\(17\)/;
      const bad = ctx.rows('ex10').filter((r) => barred.test(str(r.exNat)) && num(r.exAmt) > 0);
      return bad.length
        ? `Under the new regime these allowances cannot be exempt: ${bad
            .map((r) => str(r.exNat).slice(0, 40))
            .join('; ')}`
        : null;
    },
  },
  {
    n: 46,
    cat: 'A',
    schedule: 'S',
    text: 'Exempt allowance u/s 10(10C) cannot exceed Rs.5,00,000',
    check: (ctx) => {
      const row = ctx.rows('ex10').find((r) => /10\(10C\)/.test(str(r.exNat)));
      return row && num(row.exAmt) > 500000
        ? `Exemption u/s 10(10C) cannot exceed ${money(500000)}`
        : null;
    },
  },
  {
    n: 66,
    cat: 'A',
    schedule: 'S',
    text: 'Exempt allowance u/s 10(10B)(ii) cannot exceed Rs.5,00,000',
    check: (ctx) => {
      const row = ctx.rows('ex10').find((r) => /10\(10B\)\(ii\)/.test(str(r.exNat)));
      return row && num(row.exAmt) > 500000
        ? `Exemption u/s 10(10B)(ii) cannot exceed ${money(500000)}`
        : null;
    },
  },
  {
    n: 56,
    cat: 'A',
    schedule: 'S',
    text: 'Transport allowance for handicapped assessee cannot exceed Rs.38,400',
    check: (ctx) => {
      const row = ctx.rows('ex10').find((r) => /Transport allowance/i.test(str(r.exNat)));
      return row && num(row.exAmt) > 38400
        ? `Transport allowance for a handicapped assessee cannot exceed ${money(38400)}`
        : null;
    },
  },
  {
    n: 53,
    cat: 'A',
    schedule: 'S',
    text: 'Non government employer: 10(10AA) leave encashment not more than Rs.25 lakh',
    check: (ctx) => {
      const row = ctx.rows('ex10').find((r) => /10\(10AA\)/.test(str(r.exNat)));
      if (!row) return null;
      return !hasGovernmentEmployer(ctx) && num(row.exAmt) > 2500000
        ? `Leave encashment u/s 10(10AA) is capped at ${money(2500000)} for a non government employer`
        : null;
    },
  },
  {
    n: 31,
    cat: 'A',
    schedule: 'S',
    text: 'Total exempt allowance excluding HRA shall not exceed gross salary',
    check: (ctx) =>
      ctx.C('totExempt') > ctx.C('grossSal') && ctx.C('grossSal') > 0
        ? 'Total exempt allowances exceed gross salary'
        : null,
  },
  {
    n: 59,
    cat: 'A',
    schedule: 'S',
    text: 'HUF cannot claim income for relief from taxation u/s 89A',
    check: (ctx) => (ctx.isHUF && ctx.N('S.sal89A') > 0 ? 'An HUF cannot claim relief u/s 89A' : null),
  },
  {
    n: 472,
    cat: 'A',
    schedule: 'TDS',
    text: 'TDS on salary can be claimed only if salary income is disclosed',
    check: (ctx) =>
      sum(ctx.rows('tds1'), 't1Tds') > 0 && ctx.C('salChargeable') <= 0
        ? 'TDS on salary is claimed but no salary income is disclosed in Schedule S'
        : null,
  },
  {
    n: 468,
    cat: 'A',
    schedule: 'TDS',
    text: 'HUF cannot have TDS on salary',
    check: (ctx) =>
      ctx.isHUF && ctx.rows('tds1').length ? 'An HUF cannot report TDS on salary' : null,
  },
  {
    n: 471,
    cat: 'A',
    schedule: 'TDS',
    text: 'Total tax deducted cannot be more than income chargeable under Salary',
    check: (ctx) => {
      const bad = ctx.rows('tds1').find((r) => num(r.t1Tds) > num(r.t1Inc));
      return bad
        ? `TDS of ${money(num(bad.t1Tds))} exceeds the salary income of ${money(num(bad.t1Inc))} reported against ${str(bad.t1Name) || 'that employer'}`
        : null;
    },
  },

  /* ---------------- Schedule HP ---------------- */
  {
    n: 67,
    cat: 'A',
    schedule: 'HP',
    text: 'Standard deduction on house property should equal 30% of annual value',
    check: (ctx) =>
      ctx.C('hpStd1') === Math.round(ctx.C('hpAnnual1') * 0.3)
        ? null
        : 'The 30% standard deduction does not equal 30% of the annual value',
  },
  {
    n: 71,
    cat: 'A',
    schedule: 'HP',
    text: 'Municipal tax not allowed where gross rent is zero or null',
    check: (ctx) =>
      ctx.N('HP.hpTax1') > 0 && ctx.N('HP.hpAlv1') <= 0
        ? 'Tax paid to local authorities cannot be claimed when the gross rent is zero'
        : null,
  },
  {
    n: 74,
    cat: 'A',
    schedule: 'HP',
    text: 'Let out or deemed let out: gross rent should be more than zero',
    check: (ctx) => {
      const type = ctx.V('HP.hpType1');
      return (type === 'L' || type === 'D') && ctx.N('HP.hpAlv1') <= 0
        ? 'For a let out or deemed let out property the gross rent must be more than zero'
        : null;
    },
  },
  {
    n: 757,
    cat: 'A',
    schedule: 'HP',
    text: 'Rent which cannot be realised cannot exceed gross rent',
    check: (ctx) =>
      ctx.N('HP.hpUnreal1') > ctx.N('HP.hpAlv1')
        ? 'Unrealised rent cannot exceed the gross rent received or receivable'
        : null,
  },
  {
    n: 72,
    cat: 'A',
    schedule: 'HP',
    text: 'Old regime: interest on borrowed capital not more than Rs.2 lakh for self occupied',
    check: (ctx) =>
      ctx.regime === 'old' && ctx.V('HP.hpType1') === 'S' && ctx.N('HP.hpInt1') > 200000
        ? `For a self occupied property the interest deduction is capped at ${money(200000)} under the old regime`
        : null,
  },
  {
    n: 81,
    cat: 'A',
    schedule: 'HP',
    text: 'New regime: interest on borrowed capital cannot be claimed for self occupied property',
    check: (ctx) =>
      ctx.regime === 'new' && ctx.V('HP.hpType1') === 'S' && ctx.N('HP.hpInt1') > 0
        ? 'Interest on borrowed capital cannot be claimed on a self occupied property under the new regime'
        : null,
  },
  {
    n: 751,
    cat: 'A',
    schedule: 'HP',
    text: "Co-owned: assessee's percentage share should be less than 100%",
    check: (ctx) =>
      ctx.V('HP.hpCo1') === 'Y' && ctx.N('HP.hpShare1') >= 100
        ? 'The property is co-owned, so your share must be less than 100%'
        : null,
  },
  {
    n: 753,
    cat: 'A',
    schedule: 'HP',
    text: "Not co-owned: assessee's share should be equal to 100%",
    check: (ctx) =>
      ctx.V('HP.hpCo1') === 'N' && ctx.V('HP.hpShare1') !== '' && ctx.N('HP.hpShare1') !== 100
        ? 'The property is not co-owned, so your share must be 100%'
        : null,
  },
  {
    n: 549,
    cat: 'A',
    schedule: 'HP',
    text: 'Co-owned: percentage share and name and PAN of co-owners are mandatory',
    check: (ctx) =>
      ctx.V('HP.hpCo1') === 'Y' && !ctx.N('HP.hpShare1')
        ? 'The property is co-owned, so your percentage share and the co-owner details are mandatory'
        : null,
  },
  {
    n: 607,
    cat: 'A',
    schedule: 'HP',
    text: 'Interest payable on borrowed capital should match Table 24(b)',
    check: (ctx) => {
      const total = sum(ctx.rows('loan'), 'lnInt');
      if (!ctx.rows('loan').length && ctx.N('HP.hpInt1') === 0) return null;
      return ctx.N('HP.hpInt1') !== total
        ? `Interest of ${money(ctx.N('HP.hpInt1'))} does not match the loan table total of ${money(total)}`
        : null;
    },
  },
  {
    n: 610,
    cat: 'A',
    schedule: 'HP',
    text: 'Details of loan must be provided to claim interest u/s 24(b)',
    check: (ctx) =>
      ctx.N('HP.hpInt1') > 0 && !ctx.rows('loan').length
        ? 'Interest u/s 24(b) is claimed but no loan details have been entered'
        : null,
  },
  {
    n: 78,
    cat: 'A',
    schedule: 'HP',
    text: 'Income from house property should equal 1f - 1i + 1j',
    check: (ctx) =>
      ctx.C('hpNet1') ===
      ctx.C('hpAnnual1') - ctx.C('hpStd1') - ctx.N('HP.hpInt1') + ctx.N('HP.hpArrear1')
        ? null
        : 'House property income does not follow from its components',
  },

  /* ---------------- Schedule 112A ---------------- */
  {
    n: 84,
    cat: 'A',
    schedule: 'CG',
    text: 'Col.6 Total Sale Value should equal Col.4 x Col.5',
    check: (ctx) => {
      const bad = ctx
        .rows('s112a')
        .find(
          (r) =>
            num(r.qty) > 0 &&
            num(r.sprice) > 0 &&
            Math.abs(num(r.sale) - num(r.qty) * num(r.sprice)) > 1,
        );
      return bad
        ? `Total sale value for ${str(bad.scrip) || 'a row'} does not equal units multiplied by sale price per unit`
        : null;
    },
  },
  {
    n: 87,
    cat: 'A',
    schedule: 'CG',
    text: 'Col.11 Total Fair Market Value should equal Col.4 x Col.10',
    check: (ctx) => {
      const bad = ctx
        .rows('s112a')
        .find(
          (r) =>
            num(r.qty) > 0 && num(r.fmvu) > 0 && Math.abs(num(r.fmv) - num(r.qty) * num(r.fmvu)) > 1,
        );
      return bad
        ? `Total fair market value for ${str(bad.scrip) || 'a row'} does not equal units multiplied by the 31 January 2018 price per unit`
        : null;
    },
  },
  {
    n: 173,
    cat: 'A',
    schedule: 'CG',
    text: 'Acquired after 31.01.2018: cols 4, 5, 10 and 11 cannot be greater than zero',
    check: (ctx) => {
      const bad = ctx
        .rows('s112a')
        .find((r) => str(r.acq) === 'A' && (num(r.fmvu) > 0 || num(r.fmv) > 0));
      return bad
        ? `For ${str(bad.scrip) || 'a row'} acquired after 31 January 2018, the fair market value columns must be zero`
        : null;
    },
  },
  {
    n: 90,
    cat: 'A',
    schedule: 'CG',
    text: 'Schedule 112A total should equal the sum of individual rows',
    check: (ctx) => {
      const total = ctx.rows('s112a').reduce((a, r) => a + row112A(r).balance, 0);
      return Math.abs(ctx.N('CG.b3Ltcg') - total) > 1
        ? `B3 of ${money(ctx.N('CG.b3Ltcg'))} does not equal the Schedule 112A row total of ${money(total)}`
        : null;
    },
  },
  {
    n: 134,
    cat: 'A',
    schedule: 'CG',
    text: 'B3a LTCG u/s 112A should equal the total of Col.14 of Schedule 112A',
    check: (ctx) => {
      if (!ctx.rows('s112a').length) return null;
      const total = ctx.rows('s112a').reduce((a, r) => a + row112A(r).balance, 0);
      return Math.abs(ctx.N('CG.b3Ltcg') - total) > 1
        ? `B3a must equal the Schedule 112A balance total of ${money(total)}`
        : null;
    },
  },
  {
    n: 177,
    cat: 'A',
    schedule: 'CG',
    text: 'Fill either Schedule 112A or Schedule 115AD(1)(b)(iii) proviso as applicable',
    check: (ctx) =>
      ctx.rows('s112a').length && ctx.V('GEN.isFpi') === 'Y'
        ? 'An FPI should report under Schedule 115AD(1)(b)(iii) proviso rather than Schedule 112A'
        : null,
  },

  /* ---------------- Schedule CG ---------------- */
  {
    n: 175,
    cat: 'A',
    schedule: 'CG',
    text: 'A1: if stamp value does not exceed 1.10 times consideration, use consideration',
    check: (ctx) => {
      const expected = fvc50c(ctx.N('CG.a1Fvc'), ctx.N('CG.a1Stamp'));
      if (!ctx.N('CG.a1Fvc') && !ctx.N('CG.a1Stamp')) return null;
      return ctx.N('CG.a1Fvc50c') === expected
        ? null
        : `Full value u/s 50C should be ${money(expected)} under the 110% safe harbour`;
    },
  },
  {
    n: 176,
    cat: 'A',
    schedule: 'CG',
    text: 'B1: if stamp value does not exceed 1.10 times consideration, use consideration',
    check: (ctx) => {
      const expected = fvc50c(ctx.N('CG.b1Fvc'), ctx.N('CG.b1Stamp'));
      if (!ctx.N('CG.b1Fvc') && !ctx.N('CG.b1Stamp')) return null;
      return ctx.N('CG.b1Fvc50c') === expected
        ? null
        : `Full value u/s 50C should be ${money(expected)} under the 110% safe harbour`;
    },
  },
  {
    n: 101,
    cat: 'A',
    schedule: 'CG',
    text: 'A1: if full value of consideration is zero, expenses should not be claimed',
    check: (ctx) =>
      ctx.N('CG.a1Fvc') <= 0 && ctx.N('CG.a1Cost') + ctx.N('CG.a1Imp') + ctx.N('CG.a1Exp') > 0
        ? 'A1 has no consideration, so deductions u/s 48 cannot be claimed'
        : null,
  },
  {
    n: 105,
    cat: 'A',
    schedule: 'CG',
    text: 'B1: if full value of consideration is zero, expenses should not be claimed',
    check: (ctx) =>
      ctx.N('CG.b1Fvc') <= 0 && ctx.N('CG.b1Cost') + ctx.N('CG.b1Imp') + ctx.N('CG.b1Exp') > 0
        ? 'B1 has no consideration, so deductions u/s 48 cannot be claimed'
        : null,
  },
  {
    n: 103,
    cat: 'A',
    schedule: 'CG',
    text: 'A5: if full value of consideration is zero, expenses should not be claimed',
    check: (ctx) =>
      ctx.N('CG.a5Fvc') <= 0 && ctx.N('CG.a5Cost') + ctx.N('CG.a5Imp') + ctx.N('CG.a5Exp') > 0
        ? 'A5 has no consideration, so deductions u/s 48 cannot be claimed'
        : null,
  },
  {
    n: 104,
    cat: 'A',
    schedule: 'CG',
    text: 'A6: if full value of consideration is zero, expenses should not be claimed',
    check: (ctx) =>
      ctx.N('CG.a6Fvc') <= 0 && ctx.N('CG.a6Cost') + ctx.N('CG.a6Imp') + ctx.N('CG.a6Exp') > 0
        ? 'A6 has no consideration, so deductions u/s 48 cannot be claimed'
        : null,
  },
  {
    n: 98,
    cat: 'A',
    schedule: 'CG',
    text: 'Total of STCG should equal the individual breakup in Schedule CG',
    check: (ctx) => {
      const expected =
        ctx.C('a1Net') +
        ctx.C('a2Gain') +
        ctx.C('a3aNet') +
        ctx.C('a3bNet') +
        ctx.C('a4Net') +
        ctx.C('a5Net') +
        ctx.C('a6Net') +
        ctx.N('CG.a7Dep') +
        ctx.N('CG.a7Unutil') +
        ctx.N('CG.a8Pti15') +
        ctx.N('CG.a8Pti20') +
        ctx.N('CG.a8Pti30') +
        ctx.N('CG.a8PtiApp') -
        ctx.N('CG.a9Dtaa');
      return ctx.C('stTotal') === expected ? null : 'Total STCG does not equal the sum of A1 to A9';
    },
  },
  {
    n: 99,
    cat: 'A',
    schedule: 'CG',
    text: 'Total of LTCG should equal the individual breakup in Schedule CG',
    check: (ctx) => {
      const expected =
        ctx.C('b1Net') +
        ctx.C('b2Net') +
        ctx.N('CG.b3Ltcg') +
        ctx.C('b4Net') +
        ctx.C('b5Net') +
        ctx.N('CG.b6Nri112a') +
        ctx.N('CG.b6Nri115') +
        ctx.N('CG.b7Unutil') +
        ctx.N('CG.b8Pti10') +
        ctx.N('CG.b8Pti125') +
        ctx.N('CG.b8Pti20') -
        ctx.N('CG.b9Dtaa');
      return ctx.C('ltTotal') === expected ? null : 'Total LTCG does not equal the sum of B1 to B9';
    },
  },
  {
    n: 100,
    cat: 'A',
    schedule: 'CG',
    text: 'Income chargeable under Capital Gain should equal A9 + B12',
    check: (ctx) =>
      ctx.C('cgTotal') === ctx.C('stTotal') + ctx.C('ltTotal') - sum(ctx.rows('cgex'), 'exAmt')
        ? null
        : 'Capital gains total is inconsistent with its components',
  },
  {
    n: 591,
    cat: 'A',
    schedule: 'CG',
    text: 'Deduction u/s 54EC: amount invested should not be more than Rs.50 lakh',
    check: (ctx) => {
      const claimed = ctx
        .rows('cgex')
        .filter((r) => str(r.exSec) === '54EC')
        .reduce((a, r) => a + num(r.exAmt), 0);
      return claimed > 5000000
        ? `Deduction u/s 54EC is capped at ${money(5000000)}. You have claimed ${money(claimed)}`
        : null;
    },
  },
  {
    n: 750,
    cat: 'A',
    schedule: 'CG',
    text: 'Date of sale of land or building cannot be after 31 March of the financial year',
    check: (ctx) => {
      const bad = ctx.rows('cgex').find((r) => {
        const date = str(r.exDatePur);
        return date !== '' && date > PREVIOUS_YEAR_END;
      });
      return bad
        ? `A date of transfer of ${str(bad.exDatePur)} falls outside the financial year ending 31 March 2026`
        : null;
    },
  },
  {
    n: 184,
    cat: 'A',
    schedule: 'CG',
    text: 'Holding of less than 24 months does not qualify as long term',
    check: (ctx) => {
      const bad = ctx.rows('s112a').find((r) => {
        const bought = str(r.dbuy);
        const sold = str(r.dsale);
        if (!bought || !sold) return false;
        const held = (Date.parse(sold) - Date.parse(bought)) / 86400000;
        return Number.isFinite(held) && held < 366;
      });
      return bad
        ? `${str(bad.scrip) || 'A holding'} was held for less than 12 months, so it does not qualify for long term treatment under section 112A`
        : null;
    },
  },
  {
    n: 167,
    cat: 'A',
    schedule: 'CG',
    text: 'Total deductions claimed in STCG and LTCG should match Table D',
    check: (ctx) => {
      const tableD = sum(ctx.rows('cgex'), 'exAmt');
      const claimed =
        ctx.N('CG.a1Ded') + ctx.N('CG.a6Ded') + ctx.N('CG.b1Ded') + ctx.N('CG.b5Ded');
      if (!tableD && !claimed) return null;
      return Math.abs(tableD - claimed) <= 1
        ? null
        : `Deductions claimed inside the CG blocks (${money(claimed)}) do not match Table D (${money(tableD)})`;
    },
  },

  /* ---------------- Schedule VDA ---------------- */
  {
    n: 749,
    cat: 'A',
    schedule: 'CG',
    text: 'VDA date of acquisition or transfer cannot be after 31 March of the financial year',
    // Schedule VDA carries a single total in the ITR-2 schema, with no dated rows to test.
    check: () => null,
  },

  /* ---------------- Schedule OS ---------------- */
  {
    n: 190,
    cat: 'A',
    schedule: 'OS',
    text: 'Gross amount chargeable at normal rates should equal 1a+1b+1c+1d+1e',
    check: (ctx) =>
      ctx.C('osGross') ===
      ctx.N('OS.osDiv') +
        ctx.N('OS.osSb') +
        ctx.N('OS.osFd') +
        ctx.N('OS.osItr') +
        ctx.N('OS.osFamPen') +
        ctx.N('OS.osOthInt') +
        ctx.N('OS.osGift') +
        ctx.N('OS.osLottery') +
        ctx.N('OS.osOther') +
        ctx.N('OS.os2_22e')
        ? null
        : 'Gross other sources income does not equal the sum of its components',
  },
  {
    n: 191,
    cat: 'A',
    schedule: 'OS',
    text: 'Deduction u/s 57 should equal the sum of 3a(i)+3a(ii)+3a(iii)+3b',
    check: (ctx) =>
      ctx.C('os57Tot') ===
      ctx.N('OS.os57i') + ctx.N('OS.os57iia') + ctx.N('OS.os57Dep') + ctx.N('OS.os57Oth')
        ? null
        : 'Total deduction u/s 57 does not equal the sum of its components',
  },
  {
    n: 206,
    cat: 'A',
    schedule: 'OS',
    text: 'Net income from other sources should equal 1 - 3 + 4 + 5 - 5a',
    check: (ctx) =>
      ctx.C('osNet') === ctx.C('osGross') - ctx.C('os57Tot')
        ? null
        : 'Net other sources income does not equal gross less deductions u/s 57',
  },
  {
    n: 209,
    cat: 'A',
    schedule: 'OS',
    text: 'Deduction u/s 57(iia) can be claimed only if family pension income is offered',
    check: (ctx) =>
      ctx.N('OS.os57iia') > 0 && ctx.N('OS.osFamPen') <= 0
        ? 'Deduction u/s 57(iia) requires family pension income to be offered in Schedule OS'
        : null,
  },
  {
    n: 215,
    cat: 'A',
    schedule: 'OS',
    text: 'Old regime: 57(iia) not more than one third of family pension or Rs.15,000',
    check: (ctx) => {
      if (ctx.regime !== 'old' || ctx.N('OS.os57iia') <= 0) return null;
      const cap = Math.min(Math.round(ctx.N('OS.osFamPen') / 3), 15000);
      return ctx.N('OS.os57iia') > cap + 1
        ? `Under the old regime the family pension deduction is the lower of one third of the pension or ${money(15000)}, that is ${money(cap)}`
        : null;
    },
  },
  {
    n: 215.1,
    cat: 'A',
    schedule: 'OS',
    text: 'New regime: 57(iia) not more than one third of family pension or Rs.25,000',
    check: (ctx) => {
      if (ctx.regime !== 'new' || ctx.N('OS.os57iia') <= 0) return null;
      const cap = Math.min(Math.round(ctx.N('OS.osFamPen') / 3), 25000);
      return ctx.N('OS.os57iia') > cap + 1
        ? `Under the new regime the family pension deduction is the lower of one third of the pension or ${money(25000)}, that is ${money(cap)}`
        : null;
    },
  },
  {
    n: 216,
    cat: 'A',
    schedule: 'OS',
    text: 'Interest expenditure on dividend u/s 57(1) not more than 20% of dividend income',
    check: (ctx) => {
      if (ctx.N('OS.os57i') <= 0) return null;
      const cap = Math.round(ctx.N('OS.osDiv') * 0.2);
      return ctx.N('OS.os57i') > cap
        ? `Interest expenditure against dividend is capped at 20% of dividend income, that is ${money(cap)}`
        : null;
    },
  },
  {
    n: 217,
    cat: 'A',
    schedule: 'OS',
    text: 'Expenses allowed only if corresponding income is offered',
    check: (ctx) =>
      ctx.C('os57Tot') > 0 && ctx.C('osGross') <= 0
        ? 'Deductions u/s 57 are claimed but no other sources income is offered'
        : null,
  },

  /* ---------------- Chapter VI-A ---------------- */
  {
    n: 342,
    cat: 'A',
    schedule: 'VIA',
    text: 'New regime: deductions u/s 80C to 80U cannot be claimed',
    check: (ctx) => {
      if (ctx.regime !== 'new') return null;
      const claimed = VIA_OLD_ONLY.filter(([key]) => ctx.N(key) > 0).map(([, label]) => label);
      return claimed.length
        ? `Under the new tax regime these deductions cannot be claimed: ${claimed.join(', ')}. Only 80CCD(2) and 80CCH remain available`
        : null;
    },
  },
  {
    n: 330,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deductions under Chapter VI-A should not be greater than Gross Total Income',
    check: (ctx) => {
      const gti = ctx.C('gti');
      return ctx.C('viaRaw') > gti
        ? `Chapter VI-A deductions of ${money(ctx.C('viaRaw'))} exceed gross total income of ${money(gti)}. They have been restricted to gross total income`
        : null;
    },
  },
  {
    n: 346,
    cat: 'A',
    schedule: 'VIA',
    text: 'Sum of 80C, 80CCC and 80CCD(1) is more than Rs.1,50,000',
    check: (ctx) => {
      const claimed = ctx.N('VIA.d80c') + ctx.N('VIA.d80ccc') + ctx.N('VIA.d80ccd1');
      return claimed > 150000
        ? `80C, 80CCC and 80CCD(1) together are capped at ${money(150000)}. You have entered ${money(claimed)}`
        : null;
    },
  },
  {
    n: 348,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80CCD(1) limited to 10% of salary or 20% of GTI as applicable',
    check: (ctx) => {
      if (ctx.N('VIA.d80ccd1') <= 0) return null;
      const cap = Math.round(Math.max(ctx.C('salChargeable') * 0.1, ctx.C('gti') * 0.2));
      return ctx.N('VIA.d80ccd1') > cap
        ? `80CCD(1) is limited to 10% of salary or 20% of gross total income, that is ${money(cap)}`
        : null;
    },
  },
  {
    n: 339,
    cat: 'A',
    schedule: 'VIA',
    text: 'Old regime: 80CCD(2) not more than 14% of salary for CG or SG employers',
    check: (ctx) => {
      if (ctx.regime !== 'old' || ctx.N('VIA.d80ccd2') <= 0) return null;
      if (!hasGovernmentEmployer(ctx)) return null;
      const cap = Math.round(ctx.C('salChargeable') * 0.14);
      return ctx.N('VIA.d80ccd2') > cap
        ? `80CCD(2) is capped at 14% of salary for a government employer, that is ${money(cap)}`
        : null;
    },
  },
  {
    n: 345,
    cat: 'A',
    schedule: 'VIA',
    text: 'Old regime: 80CCD(2) not more than 10% of salary for other employers',
    check: (ctx) => {
      if (ctx.regime !== 'old' || ctx.N('VIA.d80ccd2') <= 0) return null;
      if (hasGovernmentEmployer(ctx)) return null;
      const cap = Math.round(ctx.C('salChargeable') * 0.1);
      return ctx.N('VIA.d80ccd2') > cap
        ? `80CCD(2) is capped at 10% of salary for a non government employer, that is ${money(cap)}`
        : null;
    },
  },
  {
    n: 598,
    cat: 'A',
    schedule: 'VIA',
    text: 'New regime: 80CCD(2) should not exceed 14% of basic salary and dearness allowance',
    check: (ctx) => {
      if (ctx.regime !== 'new' || ctx.N('VIA.d80ccd2') <= 0) return null;
      const cap = Math.round(ctx.C('salChargeable') * 0.14);
      return ctx.N('VIA.d80ccd2') > cap
        ? `Under the new regime 80CCD(2) is capped at 14% of basic salary and dearness allowance, that is about ${money(cap)}`
        : null;
    },
  },
  {
    n: 338,
    cat: 'A',
    schedule: 'VIA',
    text: '80CCD(2) cannot be claimed if every employer category is a pensioner category',
    check: (ctx) => {
      if (ctx.N('VIA.d80ccd2') <= 0 || !ctx.rows('emp').length) return null;
      return ctx.rows('emp').every((r) => /Pensioners/i.test(str(r.eCat)))
        ? '80CCD(2) cannot be claimed when every employer is a pensioner category'
        : null;
    },
  },
  {
    n: 343,
    cat: 'A',
    schedule: 'VIA',
    text: '80TTA restricted to interest income from a savings account',
    check: (ctx) =>
      ctx.N('VIA.d80tta') > ctx.N('OS.osSb')
        ? `80TTA cannot exceed the savings bank interest of ${money(ctx.N('OS.osSb'))} reported in Schedule OS`
        : null,
  },
  {
    n: 344,
    cat: 'A',
    schedule: 'VIA',
    text: '80TTB restricted to interest income from savings and deposits',
    check: (ctx) => {
      const cap = ctx.N('OS.osSb') + ctx.N('OS.osFd');
      return ctx.N('VIA.d80ttb') > cap
        ? `80TTB cannot exceed the total interest income of ${money(cap)} reported in Schedule OS`
        : null;
    },
  },
  {
    n: 322,
    cat: 'A',
    schedule: 'VIA',
    text: 'Old regime: 80TTA cannot be claimed by a resident senior citizen',
    check: (ctx) =>
      ctx.regime === 'old' && ctx.isResident && ctx.isSenior && ctx.N('VIA.d80tta') > 0
        ? 'A resident senior citizen should claim 80TTB rather than 80TTA'
        : null,
  },
  {
    n: 349,
    cat: 'A',
    schedule: 'VIA',
    text: 'Non resident individuals cannot claim deduction u/s 80TTB',
    check: (ctx) => (ctx.isNRI && ctx.N('VIA.d80ttb') > 0 ? 'A non resident cannot claim 80TTB' : null),
  },
  {
    n: 327,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80DD is not allowed to a non resident',
    check: (ctx) => (ctx.isNRI && ctx.N('VIA.d80dd') > 0 ? '80DD is not available to a non resident' : null),
  },
  {
    n: 328,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80DDB is claimed by a non resident',
    check: (ctx) =>
      ctx.isNRI && ctx.N('VIA.d80ddb') > 0 ? '80DDB is not available to a non resident' : null,
  },
  {
    n: 329,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80U is claimed by a non resident',
    check: (ctx) => (ctx.isNRI && ctx.N('VIA.d80u') > 0 ? '80U is not available to a non resident' : null),
  },
  {
    n: 317,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80CCD(1) is not applicable to HUF',
    check: (ctx) => (ctx.isHUF && ctx.N('VIA.d80ccd1') > 0 ? '80CCD(1) is not available to an HUF' : null),
  },
  {
    n: 318,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80CCD(1B) is not allowed to HUF',
    check: (ctx) =>
      ctx.isHUF && ctx.N('VIA.d80ccd1b') > 0 ? '80CCD(1B) is not available to an HUF' : null,
  },
  {
    n: 319,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80CCD(2) is not allowed to HUF',
    check: (ctx) => (ctx.isHUF && ctx.N('VIA.d80ccd2') > 0 ? '80CCD(2) is not available to an HUF' : null),
  },
  {
    n: 320,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80E is not allowed to HUF',
    check: (ctx) => (ctx.isHUF && ctx.N('VIA.d80e') > 0 ? '80E is not available to an HUF' : null),
  },
  {
    n: 324,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80U is not allowed to HUF',
    check: (ctx) => (ctx.isHUF && ctx.N('VIA.d80u') > 0 ? '80U is not available to an HUF' : null),
  },
  {
    n: 325,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80EEA is not allowed to HUF',
    check: (ctx) => (ctx.isHUF && ctx.N('VIA.d80eea') > 0 ? '80EEA is not available to an HUF' : null),
  },
  {
    n: 326,
    cat: 'A',
    schedule: 'VIA',
    text: 'Deduction u/s 80EEB is not allowed to HUF',
    check: (ctx) => (ctx.isHUF && ctx.N('VIA.d80eeb') > 0 ? '80EEB is not available to an HUF' : null),
  },
  {
    n: 620,
    cat: 'A',
    schedule: 'VIA',
    text: '80EE or 80EEA can be claimed only when the limit u/s 24(b) is exhausted',
    check: (ctx) =>
      ctx.N('VIA.d80eea') > 0 && ctx.N('HP.hpInt1') < 200000 && ctx.V('HP.hpType1') === 'S'
        ? `80EEA becomes available only after the ${money(200000)} limit u/s 24(b) is exhausted`
        : null,
  },
  {
    n: 759,
    cat: 'A',
    schedule: 'VIA',
    text: '80EE and 80EEA cannot both be claimed',
    // The ITR-2 schema carries one housing-interest deduction field, so the two
    // sections cannot both be populated and there is nothing to test.
    check: () => null,
  },
  {
    n: 288,
    cat: 'A',
    schedule: 'VIA',
    text: '80G claimed in Schedule VIA should not exceed Schedule 80G',
    check: (ctx) =>
      ctx.regime === 'old' && ctx.N('VIA.d80g') > 0
        ? 'Deduction u/s 80G is claimed. Schedule 80G with donee-wise detail is not part of this return and is mandatory before upload'
        : null,
  },
  {
    n: 302,
    cat: 'A',
    schedule: 'VIA',
    text: '80D claimed in Schedule VIA requires Schedule 80D to be filled',
    check: (ctx) =>
      ctx.regime === 'old' && ctx.N('VIA.d80d') > 0 && !ctx.V('VIA.s80dType')
        ? 'Deduction u/s 80D is claimed, so the coverage dropdown must be selected'
        : null,
  },
  {
    n: 291,
    cat: 'A',
    schedule: 'VIA',
    text: 'Old regime: 80D for self and family allowed to the extent of Rs.25,000',
    check: (ctx) => {
      if (ctx.regime !== 'old' || ctx.N('VIA.d80d') <= 0) return null;
      const cap = /Senior/i.test(ctx.V('VIA.s80dType')) ? 100000 : 50000;
      return ctx.N('VIA.d80d') > cap
        ? `80D is capped at ${money(cap)} for the coverage you have selected`
        : null;
    },
  },
  {
    n: 300,
    cat: 'A',
    schedule: 'VIA',
    text: 'Old regime: eligible amount of 80D should not be more than Rs.1,00,000',
    check: (ctx) =>
      ctx.regime === 'old' && ctx.N('VIA.d80d') > 100000
        ? `80D cannot exceed ${money(100000)} in aggregate`
        : null,
  },
  {
    n: 645,
    cat: 'A',
    schedule: 'VIA',
    text: 'PRAN should be provided to claim 80CCD(1) or 80CCD(1B)',
    check: (ctx) =>
      (ctx.N('VIA.d80ccd1') > 0 || ctx.N('VIA.d80ccd1b') > 0) && !ctx.rows('nps80ccd').length
        ? 'A PRAN and the contribution detail must be provided to claim 80CCD(1) or 80CCD(1B)'
        : null,
  },
  {
    n: 340,
    cat: 'D',
    schedule: 'VIA',
    text: '80QQB cannot be claimed if the return is not filed within the due date',
    // ITR-2 carries no 80QQB field; royalty income of an author needs ITR-3.
    check: () => null,
  },

  /* ---------------- Schedule EI ---------------- */
  {
    n: 435,
    cat: 'A',
    schedule: 'EI',
    text: 'Total exempt income should equal the sum of 1 to 5',
    check: (ctx) =>
      ctx.C('eiTotal') ===
      ctx.C('eiNetAgri') + ctx.N('EI.eiPpf') + ctx.N('EI.eiNri') + ctx.N('EI.eiPti')
        ? null
        : 'Total exempt income does not equal the sum of its components',
  },
  {
    n: 436,
    cat: 'A',
    schedule: 'EI',
    text: 'Net agricultural income should equal gross receipts less expenditure less unabsorbed loss',
    check: (ctx) =>
      ctx.C('eiNetAgri') === ctx.N('EI.eiAgri') - ctx.N('EI.eiAgriExp') - ctx.N('EI.eiAgriLoss')
        ? null
        : 'Net agricultural income does not follow from its components',
  },
  {
    n: 445,
    cat: 'A',
    schedule: 'EI',
    text: 'Net agricultural income above Rs.5 lakh requires details of each agricultural land',
    check: (ctx) =>
      ctx.C('eiNetAgri') > 500000
        ? `Net agricultural income exceeds ${money(500000)}, so land-wise detail is mandatory. That table is not part of this return`
        : null,
  },
  {
    n: 433,
    cat: 'A',
    schedule: 'EI',
    text: 'Total of other exempt income should equal the amounts entered',
    check: (ctx) => {
      if (!ctx.rows('eiOth').length) return null;
      const total = sum(ctx.rows('eiOth'), 'eiAmt');
      return Math.abs(ctx.N('EI.eiPpf') - total) > 1
        ? `Other exempt income of ${money(ctx.N('EI.eiPpf'))} does not match the breakup total of ${money(total)}`
        : null;
    },
  },
  {
    n: 698,
    cat: 'A',
    schedule: 'EI',
    text: 'An exempt income nature cannot be selected more than once',
    check: (ctx) => {
      const seen = new Set<string>();
      for (const r of ctx.rows('eiOth')) {
        const nature = str(r.eiNat);
        if (!nature) continue;
        if (seen.has(nature)) {
          return `The exempt income nature appears more than once: ${nature.slice(0, 60)}`;
        }
        seen.add(nature);
      }
      return null;
    },
  },

  /* ---------------- CYLA, BFLA, CFL ---------------- */
  {
    n: 264,
    cat: 'A',
    schedule: 'CYLA',
    text: 'New regime: house property loss cannot be set off against any other income',
    check: (ctx) => {
      if (ctx.regime !== 'new') return null;
      return setoff(ctx).hpSetOff > 0
        ? 'Under the new regime house property loss cannot be set off against any other head'
        : null;
    },
  },
  {
    n: 249,
    cat: 'A',
    schedule: 'CYLA',
    text: 'Old regime: total house property loss set off should not exceed Rs.2,00,000',
    check: (ctx) =>
      setoff(ctx).hpSetOff > 200000
        ? `House property loss set off exceeds the ${money(200000)} ceiling u/s 71(3A)`
        : null,
  },
  {
    n: 250,
    cat: 'A',
    schedule: 'CYLA',
    text: 'House property loss claimed at CYLA should equal the amount at Schedule HP',
    check: (ctx) => {
      const r = setoff(ctx);
      return r.hpSetOff + r.hpSpill + r.hpUnused === r.hpLoss
        ? null
        : 'The house property loss carried into CYLA does not reconcile with Schedule HP';
    },
  },
  {
    n: 251,
    cat: 'A',
    schedule: 'CYLA',
    text: 'Other sources loss at CYLA should equal the amount at Schedule OS',
    check: (ctx) => {
      const r = setoff(ctx);
      return r.osSetOff + r.osUnused === r.osLoss
        ? null
        : 'The other sources loss carried into CYLA does not reconcile with Schedule OS';
    },
  },
  {
    n: 267,
    cat: 'A',
    schedule: 'CYLA',
    text: 'Normal OS loss should be set off first against profit from race horses',
    check: (ctx) => {
      const r = setoff(ctx);
      const race = r.cyla.find((h) => h.id === 'osrace');
      if (!r.osLoss || !race || race.income <= 0) return null;
      return race.osSet < Math.min(r.osLoss, race.income)
        ? 'Loss under other sources must be set off against race horse profit before any other head'
        : null;
    },
  },
  {
    n: 266,
    cat: 'A',
    schedule: 'CYLA',
    text: 'Total loss set off cannot be more than the loss to be set off',
    check: (ctx) => {
      const r = setoff(ctx);
      return r.hpSetOff > r.hpLoss || r.osSetOff > r.osLoss
        ? 'Loss set off exceeds the loss available'
        : null;
    },
  },
  {
    n: 268,
    cat: 'A',
    schedule: 'CYLA',
    text: 'CYLA: column 2 plus column 3 should not exceed column 1',
    check: (ctx) => {
      const bad = setoff(ctx).cyla.find((h) => h.hpSet + h.osSet > h.income + 0.5);
      return bad ? `Set off against ${bad.label} exceeds the income available` : null;
    },
  },
  {
    n: 269,
    cat: 'A',
    schedule: 'CYLA',
    text: 'BFLA: column 2 should not exceed column 1',
    check: (ctx) => {
      const bad = setoff(ctx).bfla.find((h) => h.set > h.income + 0.5);
      return bad ? `Brought forward set off against ${bad.label} exceeds the income available` : null;
    },
  },
  {
    n: 274,
    cat: 'A',
    schedule: 'CFL',
    text: 'House property loss at CFL should equal the loss remaining after set off at CYLA',
    check: (ctx) => {
      const r = setoff(ctx);
      const expected = Math.round(r.hpSpill + r.hpUnused);
      return ctx.N('CFL.cyHpLoss') === expected
        ? null
        : `Current year house property loss carried forward should be ${money(expected)}`;
    },
  },
  {
    n: 762,
    cat: 'A',
    schedule: 'CYLA',
    text: 'House property loss not fully set off although income is available',
    check: (ctx) => {
      const r = setoff(ctx);
      return r.hpUnused > 0 && r.remaining > 0
        ? `Income is still available for set off but house property loss of ${money(r.hpUnused)} has not been applied. It cannot be carried forward while income remains`
        : null;
    },
  },
  {
    n: 486,
    cat: 'A',
    schedule: 'CFL',
    text: 'Losses of current year to be carried forward should equal the CFL total',
    // The CFL total is derived from the same current-year figures it is compared
    // against, so the equality holds by construction and cannot be tested.
    check: () => null,
  },
  {
    n: 748,
    cat: 'A',
    schedule: 'CFL',
    text: 'CFL loss carried forward restricted to zero if the computation is negative',
    check: (ctx) => (ctx.C('cflCarry') < 0 ? 'Loss carried forward cannot be negative' : null),
  },
  {
    n: 26.4,
    cat: 'D',
    schedule: 'CFL',
    text: 'Current year losses should not be more than zero if the return is filed u/s 139(4)',
    check: (ctx) => {
      if (!ctx.isBelated) return null;
      const losses = ctx.N('CFL.cyStcl') + ctx.N('CFL.cyLtcl') + ctx.N('CFL.cyHpLoss');
      return losses > 0
        ? `The return is belated u/s 139(4), so current year losses of ${money(losses)} cannot be carried forward`
        : null;
    },
  },

  /* ---------------- Schedule TR, FA, AL ---------------- */
  {
    n: 453,
    cat: 'A',
    schedule: 'TR',
    text: 'Schedule TR is not applicable if residential status is non resident',
    check: (ctx) =>
      ctx.isNRI && ctx.rows('tr1').length ? 'Schedule TR does not apply to a non resident' : null,
  },
  {
    n: 451,
    cat: 'A',
    schedule: 'TR',
    text: 'Relief u/s 90 or 90A should match the rows where that section is selected',
    check: (ctx) => {
      const total = ctx
        .rows('tr1')
        .filter((r) => /^90/.test(str(r.trSec)))
        .reduce((a, r) => a + num(r.trAvail), 0);
      return ctx.N('TR.trDtaa') && Math.abs(ctx.N('TR.trDtaa') - total) > 1
        ? `Relief where a DTAA applies should be ${money(total)}`
        : null;
    },
  },
  {
    n: 452,
    cat: 'A',
    schedule: 'TR',
    text: 'Relief u/s 91 should match the rows where section 91 is selected',
    check: (ctx) => {
      const total = ctx
        .rows('tr1')
        .filter((r) => str(r.trSec) === '91')
        .reduce((a, r) => a + num(r.trAvail), 0);
      return ctx.N('TR.trNoDtaa') && Math.abs(ctx.N('TR.trNoDtaa') - total) > 1
        ? `Relief where no DTAA applies should be ${money(total)}`
        : null;
    },
  },
  {
    n: 456,
    cat: 'A',
    schedule: 'AL',
    text: 'Schedule AL should be filled if total income is greater than Rs.1 crore',
    check: (ctx) => {
      const totalIncome = ctx.C('totalIncome');
      if (totalIncome <= 10000000) return null;
      const filled = ctx.rows('alA').length > 0 || ctx.C('alMovable') > 0;
      return filled
        ? null
        : `Total income of ${money(totalIncome)} exceeds ${money(10000000)}, so Schedule AL is mandatory`;
    },
  },

  /* ---------------- TDS, TCS, tax payments ---------------- */
  {
    n: 463,
    cat: 'A',
    schedule: 'TDS',
    text: 'TDS claimed cannot be more than the gross income disclosed',
    check: (ctx) => {
      const bad = ctx.rows('tds2').find((r) => num(r.t2Tds) > num(r.t2Gross));
      return bad
        ? `TDS of ${money(num(bad.t2Tds))} exceeds the gross amount of ${money(num(bad.t2Gross))} against ${str(bad.t2Name) || 'a deductor'}`
        : null;
    },
  },
  {
    n: 466,
    cat: 'A',
    schedule: 'TDS',
    text: 'TDS claimed cannot be more than TDS brought forward plus TDS deducted',
    // Needs the department's own 26AS ledger for the year; the return carries
    // only what the taxpayer claims, so there is nothing to compare against.
    check: () => null,
  },
  {
    n: 464,
    cat: 'A',
    schedule: 'TDS',
    text: 'Gross amount and head of income must be filled where TDS is claimed',
    check: (ctx) => {
      const bad = ctx.rows('tds2').find((r) => num(r.t2Tds) > 0 && (!num(r.t2Gross) || !str(r.t2Head)));
      return bad ? 'Where TDS is claimed the gross amount and head of income are both mandatory' : null;
    },
  },
  {
    n: 650,
    cat: 'A',
    schedule: 'TDS',
    text: 'Section 192 cannot be selected in the non-salary TDS schedules',
    // TDS 2 and TDS 3 carry a head of income rather than a deduction section,
    // so section 192 cannot be selected there.
    check: () => null,
  },
  {
    n: 458,
    cat: 'A',
    schedule: 'TDS',
    text: 'TCS claimed this year cannot be more than tax collected',
    check: (ctx) => {
      const bad = ctx.rows('tcs').find((r) => num(r.tcClaim) > num(r.tcAmt));
      return bad
        ? `TCS claimed of ${money(num(bad.tcClaim))} exceeds the tax collected of ${money(num(bad.tcAmt))}`
        : null;
    },
  },
  {
    n: 459,
    cat: 'A',
    schedule: 'IT',
    text: 'Total of the amount column should equal the sum of the amounts entered',
    check: (ctx) =>
      ctx.C('itTotal') === sum(ctx.rows('chal'), 'chAmt')
        ? null
        : 'The challan total does not equal the sum of the rows',
  },
  {
    n: 493,
    cat: 'A',
    schedule: 'TTI',
    text: 'Tax payments in Part B-TTI should equal the claims in TDS, TCS and Schedule IT',
    check: (ctx) =>
      ctx.C('taxesPaid') === ctx.C('tdsTotal') + ctx.C('itTotal')
        ? null
        : 'Total taxes paid does not equal the sum of the TDS, TCS and challan schedules',
  },

  /* ---------------- Part B TI and TTI ---------------- */
  {
    n: 492,
    cat: 'A',
    schedule: 'TTI',
    text: 'The total of all heads of income should equal the sum of the individual heads',
    check: (ctx) =>
      ctx.C('gti') === ctx.C('salChargeable') + ctx.C('hpTotal') + ctx.C('cgTotal') + ctx.C('osNet')
        ? null
        : 'Gross total income does not equal the sum of the heads',
  },
  {
    n: 494,
    cat: 'A',
    schedule: 'TTI',
    text: 'Income under Salaries in Part B-TI should equal Schedule S',
    check: (ctx) =>
      ctx.C('tiSal') === ctx.C('salChargeable') ? null : 'Salary in Part B-TI does not match Schedule S',
  },
  {
    n: 495,
    cat: 'A',
    schedule: 'TTI',
    text: 'Income under House Property in Part B-TI should equal Schedule HP',
    check: (ctx) =>
      ctx.C('tiHp') === ctx.C('hpTotal') ? null : 'House property in Part B-TI does not match Schedule HP',
  },
  {
    n: 506,
    cat: 'A',
    schedule: 'TTI',
    text: 'Total income should equal gross total income less Chapter VI-A deductions',
    check: (ctx) =>
      ctx.C('totalIncome') === Math.max(ctx.C('gti') - ctx.C('viaTotal'), 0)
        ? null
        : 'Total income does not equal gross total income less Chapter VI-A deductions',
  },
  {
    n: 509,
    cat: 'A',
    schedule: 'TTI',
    text: 'Chapter VI-A in Part B-TI should be the lower of Schedule VI-A or gross total income',
    check: (ctx) =>
      ctx.C('viaTotal') === Math.min(ctx.C('viaRaw'), Math.max(ctx.C('gti'), 0))
        ? null
        : 'Chapter VI-A deduction is not restricted to the lower of the schedule total or gross total income',
  },
  {
    n: 487,
    cat: 'A',
    schedule: 'TTI',
    text: 'Tax computation should not be more than zero if gross total income is nil',
    check: (ctx) =>
      ctx.C('gti') <= 0 && ctx.C('xTax') > 0 ? 'Gross total income is nil, so no tax can be payable' : null,
  },
  {
    n: 508,
    cat: 'A',
    schedule: 'TTI',
    text: 'Net agricultural income for rate purposes should equal Schedule EI',
    // Part B-TI has no separate agricultural-income field in this schema; the
    // rate computation reads Schedule EI directly.
    check: () => null,
  },
  {
    n: 525,
    cat: 'A',
    schedule: 'TTI',
    text: 'Gross tax liability should equal tax payable plus surcharge plus cess',
    check: (ctx) =>
      ctx.C('grossTax') === ctx.C('xTax') + ctx.C('xSur') + ctx.C('xCess')
        ? null
        : 'Gross tax liability does not equal tax payable plus surcharge plus cess',
  },
  {
    n: 524,
    cat: 'A',
    schedule: 'TTI',
    text: 'Tax payable should equal tax on total income less rebate u/s 87A',
    check: (ctx) =>
      ctx.C('xReb') > ctx.C('xTax') ? 'Rebate u/s 87A cannot exceed the tax payable on total income' : null,
  },
  {
    n: 484,
    cat: 'A',
    schedule: 'TTI',
    text: 'Total income above Rs.12,00,000 cannot claim rebate u/s 87A',
    check: (ctx) =>
      ctx.regime === 'new' && ctx.C('totalIncome') > 1200000 && ctx.C('xReb') > 0
        ? `Under the new regime the rebate u/s 87A is not available once total income exceeds ${money(1200000)}`
        : null,
  },
  {
    n: 485,
    cat: 'A',
    schedule: 'TTI',
    text: 'Old regime: rebate u/s 87A should not be more than Rs.12,500',
    check: (ctx) =>
      ctx.regime === 'old' && ctx.C('xReb') > 12500
        ? `Under the old regime the rebate u/s 87A is capped at ${money(12500)}`
        : null,
  },
  {
    n: 535,
    cat: 'A',
    schedule: 'TTI',
    text: 'Old regime: total income above Rs.5 lakh cannot claim rebate u/s 87A',
    check: (ctx) =>
      ctx.regime === 'old' &&
      ctx.residentialStatus !== 'NRI' &&
      ctx.C('totalIncome') > 500000 &&
      ctx.C('xReb') > 0
        ? `Under the old regime the rebate u/s 87A is not available once total income exceeds ${money(500000)}`
        : null,
  },
  {
    n: 533,
    cat: 'A',
    schedule: 'TTI',
    text: 'Rebate u/s 87A is not allowed to a non resident',
    check: (ctx) =>
      ctx.isNRI && ctx.C('xReb') > 0 ? 'The rebate u/s 87A is not available to a non resident' : null,
  },
  {
    n: 534,
    cat: 'A',
    schedule: 'TTI',
    text: 'Rebate u/s 87A is not allowed to HUF',
    check: (ctx) =>
      ctx.isHUF && ctx.C('xReb') > 0 ? 'The rebate u/s 87A is not available to an HUF' : null,
  },
  {
    n: 528,
    cat: 'A',
    schedule: 'TTI',
    text: 'Total tax relief should equal relief u/s 89 plus 90/90A plus 91',
    check: (ctx) =>
      ctx.C('totRelief') === ctx.N('TTI.rel89') + ctx.N('TTI.rel90') + ctx.N('TTI.rel91')
        ? null
        : 'Total tax relief does not equal the sum of its components',
  },
  {
    n: 516,
    cat: 'A',
    schedule: 'TTI',
    text: 'HUF cannot claim relief u/s 89',
    check: (ctx) => (ctx.isHUF && ctx.N('TTI.rel89') > 0 ? 'An HUF cannot claim relief u/s 89' : null),
  },
  {
    n: 542,
    cat: 'A',
    schedule: 'TTI',
    text: 'Relief u/s 89 cannot be claimed if salary details are zero or blank',
    check: (ctx) =>
      ctx.N('TTI.rel89') > 0 && ctx.C('salChargeable') <= 0
        ? 'Relief u/s 89 requires salary income to be disclosed'
        : null,
  },
  {
    n: 526,
    cat: 'A',
    schedule: 'TTI',
    text: 'Relief u/s 90 or 90A in Part B-TTI should equal the amount in Schedule TR',
    check: (ctx) => {
      if (!ctx.rows('tr1').length) return null;
      return Math.abs(ctx.N('TTI.rel90') - ctx.N('TR.trDtaa')) > 1
        ? `Relief u/s 90 or 90A of ${money(ctx.N('TTI.rel90'))} does not match Schedule TR`
        : null;
    },
  },
  {
    n: 527,
    cat: 'A',
    schedule: 'TTI',
    text: 'Relief u/s 91 in Part B-TTI should equal the amount in Schedule TR',
    check: (ctx) => {
      if (!ctx.rows('tr1').length) return null;
      return Math.abs(ctx.N('TTI.rel91') - ctx.N('TR.trNoDtaa')) > 1
        ? `Relief u/s 91 of ${money(ctx.N('TTI.rel91'))} does not match Schedule TR`
        : null;
    },
  },
  {
    n: 529,
    cat: 'A',
    schedule: 'TTI',
    text: 'Total interest and fee should equal 234A + 234B + 234C + 234F + 234-I',
    check: (ctx) =>
      ctx.C('totInterest') ===
      ctx.N('TTI.int234a') +
        ctx.N('TTI.int234b') +
        ctx.N('TTI.int234c') +
        ctx.N('TTI.fee234f') +
        ctx.N('TTI.fee234i')
        ? null
        : 'Total interest and fee does not equal the sum of its components',
  },
  {
    n: 530,
    cat: 'A',
    schedule: 'TTI',
    text: 'Aggregate liability should equal net tax liability plus total interest payable',
    check: (ctx) =>
      ctx.C('aggLiab') === ctx.C('netTax') + ctx.C('totInterest')
        ? null
        : 'Aggregate liability does not equal net tax plus interest',
  },
  {
    n: 531,
    cat: 'A',
    schedule: 'TTI',
    text: 'Total taxes paid should equal advance tax, TDS, TCS and self assessment tax',
    check: (ctx) =>
      ctx.C('taxesPaid') === ctx.C('advTax') + ctx.C('selfAsmt') + ctx.C('tdsTotal')
        ? null
        : 'Total taxes paid does not reconcile with the advance and self assessment split',
  },
  {
    n: 536,
    cat: 'A',
    schedule: 'TTI',
    text: 'Refund should equal the difference between taxes paid and aggregate liability',
    check: (ctx) =>
      ctx.C('refund') === Math.max(ctx.C('taxesPaid') - ctx.C('aggLiab'), 0)
        ? null
        : 'Refund does not equal taxes paid less aggregate liability',
  },
  {
    n: 537,
    cat: 'A',
    schedule: 'TTI',
    text: 'Tax payable should equal the difference between aggregate liability and taxes paid',
    check: (ctx) =>
      ctx.C('balDue') === Math.max(ctx.C('aggLiab') - ctx.C('taxesPaid'), 0)
        ? null
        : 'Amount payable does not equal aggregate liability less taxes paid',
  },
  {
    n: 694,
    cat: 'A',
    schedule: 'TTI',
    text: 'Fee u/s 234-I is Rs.1,000 for a revised return after 31/12/2026 where income is up to Rs.5 lakh',
    // The fee falls due only on a revision filed after 31 December 2026, a date
    // outside the filing window this return is built for.
    check: () => null,
  },
  {
    n: 520,
    cat: 'A',
    schedule: 'TTI',
    text: 'Self assessment tax should equal challans deposited after 31/03/2026',
    check: (ctx) =>
      ctx.C('selfAsmt') === challanSplit(ctx).self
        ? null
        : 'The self assessment tax figure does not match the challans dated after 31 March 2026',
  },
  {
    n: 521,
    cat: 'A',
    schedule: 'TTI',
    text: 'Advance tax should equal challans deposited during the previous year',
    check: (ctx) =>
      ctx.C('advTax') === challanSplit(ctx).advance
        ? null
        : 'The advance tax figure does not match the challans dated within the previous year',
  },
  {
    n: 532,
    cat: 'A',
    schedule: 'TTI',
    text: 'IFSC under bank details should match the RBI database',
    check: (ctx) => {
      const bad = ctx.rows('bank').find((r) => {
        const ifsc = str(r.bIfsc);
        return ifsc !== '' && !RE_IFSC.test(ifsc.toUpperCase());
      });
      return bad
        ? `IFSC ${str(bad.bIfsc)} is not in the valid format of four letters, a zero and six characters`
        : null;
    },
  },
  {
    n: 662,
    cat: 'A',
    schedule: 'TTI',
    text: 'CGAS bank account details must be present where a capital gains account is used',
    check: (ctx) => {
      const deposited = ctx.rows('cgex').some((r) => num(r.exDep) > 0);
      if (!deposited) return null;
      return ctx.rows('bank').some((r) => str(r.bType) === 'CGAS')
        ? null
        : 'An amount is deposited in the Capital Gains Account Scheme, so a CGAS bank account must be listed';
    },
  },
  {
    n: 538,
    cat: 'A',
    schedule: 'TTI',
    text: 'Income details and tax computation must be disclosed where taxes paid are disclosed',
    check: (ctx) =>
      ctx.C('taxesPaid') > 0 && ctx.C('gti') <= 0
        ? 'Taxes paid are disclosed but no income has been offered'
        : null,
  },

  /* ---------------- Verification ---------------- */
  {
    n: 8,
    cat: 'A',
    schedule: 'VER',
    text: 'PAN in Schedule Verification must match the PAN uploading the return',
    check: (ctx) => {
      if (ctx.V('GEN.repFlag') === 'Y') return null;
      const verifier = ctx.V('VER.vPan');
      const assessee = ctx.V('GEN.pan');
      return verifier && assessee && verifier !== assessee
        ? 'The PAN in Verification does not match the PAN in Part A General'
        : null;
    },
  },

  /* ---------------- Category D advisories ---------------- */
  {
    n: 'D3',
    cat: 'D',
    schedule: 'TR',
    text: 'Form 67 is mandatory where relief u/s 90 or 91 is claimed',
    check: (ctx) =>
      ctx.N('TTI.rel90') > 0 || ctx.N('TTI.rel91') > 0
        ? 'Relief u/s 90, 90A or 91 is claimed. Form 67 must be filed separately or the relief may be disallowed'
        : null,
  },
  {
    n: 'D5',
    cat: 'D',
    schedule: 'TTI',
    text: 'Form 10E is required to claim relief u/s 89',
    check: (ctx) =>
      ctx.N('TTI.rel89') > 0
        ? 'Relief u/s 89 is claimed. Form 10E must be filed separately or the relief may be disallowed'
        : null,
  },
  {
    n: 'D6',
    cat: 'D',
    schedule: 'VIA',
    text: 'Form 10BA is required to claim deduction u/s 80GG',
    check: (ctx) =>
      ctx.N('VIA.d80gg') > 0
        ? `Deduction u/s 80GG of ${money(ctx.N('VIA.d80gg'))} is claimed. Form 10BA must be filed separately or the deduction may be disallowed`
        : null,
  },
  {
    n: 'D19',
    cat: 'D',
    schedule: 'S',
    text: 'Form 10EE should be filed with income claimed for relief u/s 89A',
    check: (ctx) =>
      ctx.N('S.sal89A') > 0 ? 'Income u/s 89A is reported. Form 10EE must be filed separately' : null,
  },
  {
    n: 'D20',
    cat: 'D',
    schedule: 'GEN',
    text: 'Refund above Rs.50 crore requires the LEI number and validity date',
    check: (ctx) =>
      ctx.C('refund') > 500000000 && !(ctx.V('GEN.lei') && ctx.V('GEN.leiDate'))
        ? `The refund exceeds ${money(500000000)}, so the LEI number and its validity date are mandatory`
        : null,
  },
  {
    n: 'D8',
    cat: 'D',
    schedule: 'CG',
    text: 'Residents cannot take a DTAA rate benefit; claim relief under Schedule TR and FSI',
    check: (ctx) =>
      ctx.isResident && (ctx.N('CG.a9Dtaa') > 0 || ctx.N('CG.b9Dtaa') > 0)
        ? 'A resident cannot take a DTAA rate benefit in Schedule CG. Claim the relief through Schedule TR and FSI instead'
        : null,
  },
  {
    n: 'D23',
    cat: 'D',
    schedule: 'GEN',
    text: 'Linking of Aadhaar and PAN is required per Circular 03/2023',
    check: (ctx) =>
      !ctx.V('GEN.aadhaar') && !ctx.V('GEN.aadhaarEnrol')
        ? 'Quoting Aadhaar is required u/s 139AA. Enter the Aadhaar number or the enrolment id'
        : null,
  },
  {
    n: 619,
    cat: 'D',
    schedule: 'VIA',
    text: 'Form 10-IA must be filed separately to claim 80U and 80DD',
    check: (ctx) =>
      ctx.N('VIA.d80u') > 0 || ctx.N('VIA.d80dd') > 0
        ? 'Deduction u/s 80U or 80DD is claimed. Form 10-IA must be filed separately'
        : null,
  },
  {
    n: 'D1',
    cat: 'D',
    schedule: 'TTI',
    text: 'Form 29C is mandatory where AMT exceeds normal tax',
    // Alternate minimum tax applies to a claim under Chapter VI-A part C or
    // section 10AA, neither of which an ITR-2 filer can make.
    check: () => null,
  },
];

/**
 * Every fully qualified field key the rules above read. A test compares this
 * with the ITR-2 schema so a renamed field fails the build rather than the
 * upload.
 */
export const ITR2_RULE_FIELD_KEYS: readonly string[] = [
  'GEN.aadhaar',
  'GEN.aadhaarEnrol',
  'GEN.cash1cr',
  'GEN.din',
  'GEN.dinDate',
  'GEN.director',
  'GEN.dob',
  'GEN.elec1l',
  'GEN.email',
  'GEN.email2',
  'GEN.isFpi',
  'GEN.lei',
  'GEN.leiDate',
  'GEN.mobile',
  'GEN.mobile2',
  'GEN.noticeUs',
  'GEN.pan',
  'GEN.portuguese',
  'GEN.repEmail',
  'GEN.repFlag',
  'GEN.repMobile',
  'GEN.repName',
  'GEN.repPan',
  'GEN.seventh',
  'GEN.travel2l',
  'GEN.unlisted',
  'S.dedEnt',
  'S.dedProf',
  'S.dedStd',
  'S.sal17_1',
  'S.sal17_2',
  'S.sal17_3',
  'S.sal89A',
  'HP.hpAlv1',
  'HP.hpArrear1',
  'HP.hpCo1',
  'HP.hpInt1',
  'HP.hpShare1',
  'HP.hpTax1',
  'HP.hpType1',
  'HP.hpUnreal1',
  'CG.a1Cost',
  'CG.a1Ded',
  'CG.a1Exp',
  'CG.a1Fvc',
  'CG.a1Fvc50c',
  'CG.a1Imp',
  'CG.a1Stamp',
  'CG.a5Cost',
  'CG.a5Exp',
  'CG.a5Fvc',
  'CG.a5Imp',
  'CG.a6Cost',
  'CG.a6Ded',
  'CG.a6Exp',
  'CG.a6Fvc',
  'CG.a6Imp',
  'CG.a7Dep',
  'CG.a7Unutil',
  'CG.a8Pti15',
  'CG.a8Pti20',
  'CG.a8Pti30',
  'CG.a8PtiApp',
  'CG.a9Dtaa',
  'CG.b1Cost',
  'CG.b1Ded',
  'CG.b1Exp',
  'CG.b1Fvc',
  'CG.b1Fvc50c',
  'CG.b1Imp',
  'CG.b1Stamp',
  'CG.b3Ltcg',
  'CG.b5Ded',
  'CG.b6Nri112a',
  'CG.b6Nri115',
  'CG.b7Unutil',
  'CG.b8Pti10',
  'CG.b8Pti125',
  'CG.b8Pti20',
  'CG.b9Dtaa',
  'OS.os2_22e',
  'OS.os57Dep',
  'OS.os57Oth',
  'OS.os57i',
  'OS.os57iia',
  'OS.osDiv',
  'OS.osFamPen',
  'OS.osFd',
  'OS.osGift',
  'OS.osItr',
  'OS.osLottery',
  'OS.osOthInt',
  'OS.osOther',
  'OS.osSb',
  'VIA.d80c',
  'VIA.d80ccc',
  'VIA.d80ccd1',
  'VIA.d80ccd1b',
  'VIA.d80ccd2',
  'VIA.d80ccg',
  'VIA.d80d',
  'VIA.d80dd',
  'VIA.d80ddb',
  'VIA.d80e',
  'VIA.d80eea',
  'VIA.d80eeb',
  'VIA.d80g',
  'VIA.d80gg',
  'VIA.d80ggc',
  'VIA.d80tta',
  'VIA.d80ttb',
  'VIA.d80u',
  'VIA.s80dType',
  'EI.eiAgri',
  'EI.eiAgriExp',
  'EI.eiAgriLoss',
  'EI.eiNri',
  'EI.eiPpf',
  'EI.eiPti',
  'CYLA.osdtaaInc',
  'CYLA.osraceInc',
  'CFL.cyHpLoss',
  'CFL.cyLtcl',
  'CFL.cyStcl',
  'TR.trDtaa',
  'TR.trNoDtaa',
  'FA.faFlag',
  'TTI.fee234f',
  'TTI.fee234i',
  'TTI.int234a',
  'TTI.int234b',
  'TTI.int234c',
  'TTI.rel89',
  'TTI.rel90',
  'TTI.rel91',
  'VER.vCapacity',
  'VER.vPan',
];
