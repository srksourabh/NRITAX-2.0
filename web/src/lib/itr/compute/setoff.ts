/**
 * NRITAX — the loss set-off chain: Schedule CYLA, then Schedule BFLA.
 *
 * Ported from runSetoff() in docs/reference/ITR2-source.html and widened to
 * carry the three ITR-3 business heads, which ITR-2 does not have. Section
 * numbers are from the Income Tax Act; the rule numbers quoted in the comments
 * are CBDT validation-rule serials.
 *
 * The engine is pure: give it the head-wise figures and the brought-forward
 * pools and it returns the whole working, including every remainder Schedule
 * CFL has to carry forward.
 */

import type { FormType, Regime, SetoffResult, SetoffRow } from '@/lib/itr/types';
import { r0 } from '@/lib/itr/types';

/** Section 71(3A): at most this much house property loss leaves the head. */
export const HOUSE_PROPERTY_SETOFF_CEILING = 200000;

/** The heads of income, in the order the department sets them off. */
export type SetoffHeadId =
  | 'sal'
  | 'hp'
  | 'stcg15'
  | 'stcg20'
  | 'stcg30'
  | 'stcgap'
  | 'stcgdt'
  | 'ltcg10'
  | 'ltcg125'
  | 'ltcg20'
  | 'ltcgdt'
  | 'bp'
  | 'bpspec'
  | 'bpspecified'
  | 'osnorm'
  | 'osrace'
  | 'osdtaa';

/** Brought-forward losses, as positive amounts. From Schedule CFL and Schedule UD. */
export interface BroughtForwardLosses {
  houseProperty?: number;
  shortTerm?: number;
  longTerm?: number;
  raceHorses?: number;
  /** Business other than speculative — section 72. ITR-3 only. */
  business?: number;
  /** Section 73. ITR-3 only. */
  speculative?: number;
  /** Section 73A. ITR-3 only. */
  specified?: number;
  /** Section 32(2), from Schedule UD. ITR-3 only. */
  unabsorbedDepreciation?: number;
}

export interface SetoffInput {
  form: FormType;
  regime: Regime;
  /**
   * Current-year figure under each head before any set-off. A negative figure
   * is a loss under that head. Heads left out are nil.
   */
  income: Partial<Record<SetoffHeadId, number>>;
  broughtForward?: BroughtForwardLosses;
}

/** A CYLA row. SetoffRow has no column for the ITR-3 business loss, so add one. */
export interface CylaRow extends SetoffRow {
  businessSetoff: number;
}

/** SetoffResult plus the current-year remainders only ITR-3 can produce. */
export interface SetoffWorking extends SetoffResult {
  cyla: CylaRow[];
  /** Business loss other than speculative, not absorbed this year. */
  businessUnused: number;
  /** Speculative loss. It never leaves its own head, so all of it carries forward. */
  speculativeUnused: number;
  /** Specified business loss under section 73A. Same treatment. */
  specifiedUnused: number;
}

/** Which pool of brought-forward loss a head may absorb. */
type Pool = 'sal' | 'hp' | 'stcg' | 'ltcg' | 'bp' | 'spec' | 'specified' | 'os' | 'race';

interface HeadDef {
  id: SetoffHeadId;
  label: string;
  pool: Pool;
  /** Section 71: the current-year house property loss may be set off here. */
  takesHp: boolean;
  /** Section 71(2A) bars the business loss from salary only. */
  takesBp: boolean;
  /** Section 71: the current-year other-sources loss may be set off here. */
  takesOs: boolean;
  itr3Only?: boolean;
}

const HEADS: readonly HeadDef[] = [
  { id: 'sal', label: 'Salaries', pool: 'sal', takesHp: true, takesBp: false, takesOs: true },
  { id: 'hp', label: 'House property', pool: 'hp', takesHp: false, takesBp: true, takesOs: true },
  { id: 'stcg15', label: 'Short term capital gain taxable at 15%', pool: 'stcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'stcg20', label: 'Short term capital gain taxable at 20%', pool: 'stcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'stcg30', label: 'Short term capital gain taxable at 30%', pool: 'stcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'stcgap', label: 'Short term capital gain taxable at applicable rates', pool: 'stcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'stcgdt', label: 'Short term capital gain taxable at DTAA rates', pool: 'stcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'ltcg10', label: 'Long term capital gain taxable at 10%', pool: 'ltcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'ltcg125', label: 'Long term capital gain taxable at 12.5%', pool: 'ltcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'ltcg20', label: 'Long term capital gain taxable at 20%', pool: 'ltcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'ltcgdt', label: 'Long term capital gain taxable at DTAA rates', pool: 'ltcg', takesHp: true, takesBp: true, takesOs: true },
  { id: 'bp', label: 'Profits and gains from business other than speculative and specified business', pool: 'bp', takesHp: true, takesBp: false, takesOs: true, itr3Only: true },
  { id: 'bpspec', label: 'Profits from speculative business', pool: 'spec', takesHp: true, takesBp: true, takesOs: true, itr3Only: true },
  { id: 'bpspecified', label: 'Profits from specified business under section 35AD', pool: 'specified', takesHp: true, takesBp: true, takesOs: true, itr3Only: true },
  { id: 'osnorm', label: 'Net income from other sources at normal rates', pool: 'os', takesHp: true, takesBp: true, takesOs: false },
  { id: 'osrace', label: 'Profit from owning and maintaining race horses', pool: 'race', takesHp: true, takesBp: true, takesOs: true },
  { id: 'osdtaa', label: 'Income from other sources taxable at DTAA rates', pool: 'os', takesHp: true, takesBp: true, takesOs: true },
];

/** A head as it is being worked through CYLA. */
interface Working {
  def: HeadDef;
  income: number;
  hpSetoff: number;
  businessSetoff: number;
  osSetoff: number;
  remaining: number;
}

/**
 * Run Schedule CYLA and Schedule BFLA over one return.
 *
 * CYLA first: the current-year house property, business and other-sources
 * losses are spread over the remaining heads, in the department's column order.
 * BFLA next: the brought-forward pools are applied to whatever survived CYLA.
 * Everything left over comes back on the result for Schedule CFL.
 */
export function runSetoff(input: SetoffInput): SetoffWorking {
  const isItr3 = input.form === 'ITR3';
  const heads = HEADS.filter((h) => isItr3 || !h.itr3Only);
  const figure = (id: SetoffHeadId): number => r0(input.income[id] ?? 0);
  const lossUnder = (id: SetoffHeadId): number => Math.max(-figure(id), 0);

  /* ---- pools of current-year loss ---- */
  const houseLoss = lossUnder('hp');
  // Rules 264, 572 and 579: under the new regime a house property loss may not
  // be set off against any head at all. Rules 249 and 551: the old regime
  // allows 2,00,000 under section 71(3A). Whatever cannot be set off — the
  // excess above the ceiling, and the whole loss under the new regime —
  // carries forward through Schedule CFL.
  const housePool =
    input.regime === 'old' ? Math.min(houseLoss, HOUSE_PROPERTY_SETOFF_CEILING) : 0;
  const housePropertySpill = houseLoss - housePool;
  const businessPool = isItr3 ? lossUnder('bp') : 0;
  const otherPool = lossUnder('osnorm');

  let houseLeft = housePool;
  let businessLeft = businessPool;
  let otherLeft = otherPool;

  const work: Working[] = heads.map((def) => {
    const income = Math.max(figure(def.id), 0);
    return { def, income, hpSetoff: 0, businessSetoff: 0, osSetoff: 0, remaining: income };
  });

  // Rule 267: a normal other-sources loss must go against race horse profit
  // before it touches any other head.
  const race = work.find((w) => w.def.id === 'osrace');
  if (race && otherLeft > 0 && race.remaining > 0) {
    const applied = Math.min(otherLeft, race.remaining);
    race.osSetoff += applied;
    race.remaining -= applied;
    otherLeft -= applied;
  }

  // Then the three loss columns in the order the departmental table prints them.
  for (const w of work) {
    if (w.def.takesHp && houseLeft > 0) {
      const applied = Math.min(houseLeft, w.remaining);
      w.hpSetoff += applied;
      w.remaining -= applied;
      houseLeft -= applied;
    }
    if (w.def.takesBp && businessLeft > 0) {
      const applied = Math.min(businessLeft, w.remaining);
      w.businessSetoff += applied;
      w.remaining -= applied;
      businessLeft -= applied;
    }
    if (w.def.takesOs && otherLeft > 0) {
      const applied = Math.min(otherLeft, w.remaining);
      w.osSetoff += applied;
      w.remaining -= applied;
      otherLeft -= applied;
    }
  }

  const cyla: CylaRow[] = work.map((w) => ({
    id: w.def.id,
    label: w.def.label,
    income: w.income,
    hpSetoff: w.hpSetoff,
    osSetoff: w.osSetoff,
    businessSetoff: w.businessSetoff,
    broughtForwardSetoff: 0,
    remaining: w.remaining,
  }));

  /* ---- brought-forward pools from Schedule CFL and Schedule UD ---- */
  const bf = input.broughtForward ?? {};
  const pool = (n: number | undefined): number => Math.max(r0(n ?? 0), 0);
  let bfHouse = pool(bf.houseProperty);
  let bfShort = pool(bf.shortTerm);
  let bfLong = pool(bf.longTerm);
  let bfRace = pool(bf.raceHorses);
  let bfBusiness = isItr3 ? pool(bf.business) : 0;
  let bfSpeculative = isItr3 ? pool(bf.speculative) : 0;
  let bfSpecified = isItr3 ? pool(bf.specified) : 0;
  let bfDepreciation = isItr3 ? pool(bf.unabsorbedDepreciation) : 0;

  const bfla: SetoffRow[] = work.map((w) => {
    let remaining = w.remaining;
    let broughtForwardSetoff = 0;
    /** Draw on a pool, return what is left of it. */
    const draw = (available: number): number => {
      const applied = Math.min(available, remaining);
      remaining -= applied;
      broughtForwardSetoff += applied;
      return available - applied;
    };

    switch (w.def.pool) {
      case 'hp':
        // Section 71B: brought-forward house property loss, house property only.
        bfHouse = draw(bfHouse);
        break;
      case 'stcg':
        // Section 74: a short-term capital loss against a short-term gain.
        bfShort = draw(bfShort);
        break;
      case 'ltcg':
        // A long-term loss only against a long-term gain; a short-term loss may
        // also be set off here, so spend the narrower pool first.
        bfLong = draw(bfLong);
        bfShort = draw(bfShort);
        break;
      case 'bp':
        // Section 72: brought-forward business loss against business income.
        bfBusiness = draw(bfBusiness);
        break;
      case 'spec':
        // Section 73: a speculative loss only against speculative profit. A
        // plain business loss may follow it here.
        bfSpeculative = draw(bfSpeculative);
        bfBusiness = draw(bfBusiness);
        break;
      case 'specified':
        // Section 73A, the same shape as speculative.
        bfSpecified = draw(bfSpecified);
        bfBusiness = draw(bfBusiness);
        break;
      case 'race':
        // Section 74A: race horse loss only against race horse profit.
        bfRace = draw(bfRace);
        break;
      default:
        break;
    }

    // Section 32(2): unabsorbed depreciation is treated as current depreciation
    // and goes against any head other than salary, after the loss pools.
    if (w.def.pool !== 'sal') bfDepreciation = draw(bfDepreciation);

    return {
      id: w.def.id,
      label: w.def.label,
      income: w.remaining,
      hpSetoff: 0,
      osSetoff: 0,
      broughtForwardSetoff,
      remaining,
    };
  });

  return {
    cyla,
    bfla,
    housePropertySpill,
    housePropertyUnused: houseLeft,
    otherSourcesUnused: otherLeft,
    businessUnused: businessLeft,
    speculativeUnused: isItr3 ? lossUnder('bpspec') : 0,
    specifiedUnused: isItr3 ? lossUnder('bpspecified') : 0,
    broughtForwardRemaining: isItr3
      ? {
          houseProperty: bfHouse,
          shortTerm: bfShort,
          longTerm: bfLong,
          raceHorses: bfRace,
          business: bfBusiness,
          speculative: bfSpeculative,
          specified: bfSpecified,
          unabsorbedDepreciation: bfDepreciation,
        }
      : {
          houseProperty: bfHouse,
          shortTerm: bfShort,
          longTerm: bfLong,
          raceHorses: bfRace,
        },
  };
}
