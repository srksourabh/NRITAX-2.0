/**
 * NRITAX — CBDT validation rules for ITR-3, assessment year 2026-27.
 *
 * Ported from the departmental validation-rules document version 1.0 dated
 * 18 June 2026, by way of docs/reference/ITR3-source.html. Serial numbers and
 * categories are the published ones, so a taxpayer told "Category A rule 52"
 * can trace the failure back to the document.
 *
 * The published set has 1,029 Category-A checks, 40 Category-B checks and 17
 * Category-D checks. What is applied here is the subset that can be decided
 * from the return alone; everything else is named in ITR3_UNCHECKABLE rather
 * than dropped.
 */

import { PREVIOUS_YEAR_END, PREVIOUS_YEAR_START, RX } from '@/lib/itr/types';
import type { RuleCategory, RuleContext, RuleDef, TableRow } from '@/lib/itr/types';

/* ─────────────────────────── Helpers ─────────────────────────── */

/** Rounding tolerance in rupees allowed on every totalling rule. */
const VTOL = 1;

const eq = (a: number, b: number): boolean => Math.abs(a - b) <= VTOL;
const sum = (...a: number[]): number => a.reduce((x, y) => x + y, 0);
const pos = (v: number): boolean => v > 0;

/** Numeric cell of a table row; 0 when absent or unparsable. */
const num = (r: TableRow, k: string): number => Number(r[k] ?? 0) || 0;

/** String cell of a table row; '' when absent. */
const str = (r: TableRow, k: string): string => String(r[k] ?? '').trim();

const isNew = (c: RuleContext): boolean => c.regime === 'new';
const isOld = (c: RuleContext): boolean => c.regime === 'old';
const isRES = (c: RuleContext): boolean => c.residentialStatus === 'RES';
const isNOR = (c: RuleContext): boolean => c.residentialStatus === 'NOR';

/** The accounts are liable to audit under section 44AB. */
const audited = (c: RuleContext): boolean => c.V('GEN.LiableAudit44AB') === 'Yes';

/** The return is filed under the given section. */
const filedUnder = (c: RuleContext, section: string): boolean =>
  (c.V('GEN.ReturnFileSec') || c.data.meta.filingSection).startsWith(section);

/** The date the rules are being applied on — the date of filing. */
const asOn = (c: RuleContext): string => c.data.meta.filingDate;

/** Gross turnover offered under section 44AD, banked plus cash plus other. */
const turnover44AD = (c: RuleContext): number =>
  c.N('PL.GT44ADBank') + c.N('PL.GT44ADCash') + c.N('PL.GT44ADOther');

const pan = (c: RuleContext): string => c.V('GEN.PAN').toUpperCase();
const verifierPan = (c: RuleContext): string => c.V('VER.VerPAN').toUpperCase();

/**
 * Build a rule from a predicate that is true when the rule is violated.
 * A non-empty string return appends detail — the row or value at fault — to
 * the published text.
 */
function rule(
  n: number | string,
  cat: RuleCategory,
  schedule: string,
  text: string,
  fails: (c: RuleContext) => boolean | string,
): RuleDef {
  return {
    n,
    cat,
    schedule,
    text,
    check(c) {
      const out = fails(c);
      if (out === true) return text;
      return typeof out === 'string' && out !== '' ? text + out : null;
    },
  };
}

/**
 * Build a rule that walks a table and names the rows at fault, so the message
 * reads "Property 2: ..." rather than pointing at the schedule as a whole.
 */
function rowRule(
  n: number | string,
  cat: RuleCategory,
  schedule: string,
  table: string,
  text: string,
  label: (r: TableRow, i: number) => string,
  fails: (r: TableRow, c: RuleContext) => boolean,
): RuleDef {
  return {
    n,
    cat,
    schedule,
    text,
    check(c) {
      const bad = c
        .rows(table)
        .map((r, i) => (fails(r, c) ? label(r, i) : ''))
        .filter((l) => l !== '');
      return bad.length ? `${bad.join(', ')}: ${text}` : null;
    },
  };
}

const property = (_r: TableRow, i: number): string => `Property ${i + 1}`;
const donee = (r: TableRow): string => `Donee ${str(r, 'DoneeName') || '(unnamed)'}`;
const party = (r: TableRow): string => `Party ${str(r, 'PartyName') || '(unnamed)'}`;

/* ─────────────────────────── Rules ─────────────────────────── */

export const ITR3_RULES: readonly RuleDef[] = [
  /* ── Block 1 · Part A General, rules 1–50 ─────────────────────────── */
  rule(1, 'A', 'GEN', 'A valid mobile number must be furnished.', (c) =>
    !RX.mobile.test(c.V('GEN.MobileNo')),
  ),
  rule(2, 'A', 'BTTI', 'A Hindu Undivided Family cannot claim relief under section 89.', (c) =>
    c.isHUF && pos(c.N('BTTI.TTI_Relief89')),
  ),
  rule(
    5,
    'A',
    'GEN',
    'A revised return cannot be filed where the original return was filed under section 142(1).',
    (c) =>
      filedUnder(c, '139(5)') &&
      c.V('GEN.OrigRetAckNo') !== '' &&
      c.V('GEN.NoticeDIN') !== '' &&
      c.V('GEN.ReturnFileSec').includes('142(1)'),
  ),
  rule(7, 'A', 'S5A', 'Section 5A is answered Yes, so Schedule 5A must be completed.', (c) =>
    c.V('GEN.PortugueseCC') === 'Yes' && !pos(c.N('S5A.Tot5A')),
  ),
  rule(
    9,
    'A',
    'GEN',
    'Verification is signed in a representative capacity, so the representative particulars and the flag in Part A General are compulsory.',
    (c) =>
      c.V('VER.VerCapacity') === 'Representative assessee' &&
      (c.V('GEN.RepAssesseeFlag') !== 'Yes' || c.V('GEN.RepName') === ''),
  ),
  rule(
    10,
    'A',
    'GEN',
    'Filing under the seventh proviso to section 139(1) is answered Yes, but no particulars have been furnished.',
    (c) =>
      c.V('GEN.SeventhProviso139') === 'Yes' &&
      c.V('GEN.NoticeDIN') === '' &&
      !pos(c.N('BTI.TI_GTI')),
  ),
  rule(
    12,
    'A',
    'D80G',
    'A donee Permanent Account Number is the same as that of the assessee or the verifier.',
    (c) =>
      c.rows('Rows80G').some((r) => {
        const p = str(r, 'DoneePAN').toUpperCase();
        return p !== '' && (p === pan(c) || p === verifierPan(c));
      }),
  ),
  rule(
    13,
    'A',
    'GEN',
    'The accounts are audited, so the auditor particulars and the audit report details are compulsory.',
    (c) =>
      audited(c) &&
      c.V('GEN.AuditedFlag') === 'Yes' &&
      (c.V('GEN.AuditFirmName') === '' ||
        c.V('GEN.AuditReportDate') === '' ||
        c.V('GEN.AuditFirmPAN') === ''),
  ),
  rule(
    14,
    'A',
    'GEN',
    'Item A14, whether income is declared only under the presumptive sections, is compulsory.',
    (c) => c.V('GEN.PresumptiveOnly') === '',
  ),
  rule(
    15,
    'A',
    'GEN',
    'Turnover falls between ₹1 crore and ₹10 crore, so item a2(ii) cannot be left blank.',
    (c) =>
      c.V('GEN.TurnoverRange').startsWith('More than ₹1 crore') && c.V('GEN.CashReceiptPct') === '',
  ),
  rule(
    16,
    'A',
    'GEN',
    'Turnover falls between ₹1 crore and ₹10 crore, so item a2(iii) cannot be left blank.',
    (c) =>
      c.V('GEN.TurnoverRange').startsWith('More than ₹1 crore') && c.V('GEN.CashPaymentPct') === '',
  ),
  rule(17, 'A', 'GEN', 'The date of the audit report cannot be later than today.', (c) =>
    c.V('GEN.AuditReportDate') !== '' && c.V('GEN.AuditReportDate') > asOn(c),
  ),
  rule(
    20,
    'A',
    'S',
    'A Hindu Undivided Family or a non-resident individual cannot claim relief from taxation under section 89A.',
    (c) => (c.isHUF || c.isNRI) && (pos(c.N('S.Relief89A')) || pos(c.N('OS.Relief89A_5a'))),
  ),
  rule(22, 'A', 'S5A', 'Section 5A is answered No, so Schedule 5A must not be filled.', (c) =>
    c.V('GEN.PortugueseCC') === 'No' && pos(c.N('S5A.Tot5A')),
  ),
  rule(
    23,
    'A',
    'GEN',
    'Where the return responds to a notice or order, the unique number or Document Identification Number and its date are compulsory.',
    (c) =>
      ['139(9)', '142(1)', '148', '119(2)(b)'].some((s) => filedUnder(c, s)) &&
      (c.V('GEN.NoticeDIN') === '' || c.V('GEN.NoticeDate') === ''),
  ),
  rule(
    24,
    'A',
    'GEN',
    'The condition by virtue of which the assessee is liable to audit under section 44AB must be selected.',
    (c) => audited(c) && c.V('GEN.Audit44ABCondition') === '',
  ),
  rule(25, 'A', 'GEN', 'The applicable due date for filing the return must be selected.', (c) =>
    c.V('GEN.DueDate') === '',
  ),
  rule(
    26,
    'A',
    'GEN',
    'Where the due date is 31 October, Schedule IF, Schedule 5A or the audit particulars must be completed.',
    (c) =>
      c.V('GEN.DueDate') === '31st October' &&
      c.rows('IFRows').length === 0 &&
      !pos(c.N('S5A.Tot5A')) &&
      !audited(c),
  ),
  rule(
    27,
    'A',
    'GEN',
    'Where the due date is 30 November, Schedule IF, Schedule 5A or the audit particulars must be completed.',
    (c) =>
      c.V('GEN.DueDate') === '30th November' &&
      c.rows('IFRows').length === 0 &&
      !pos(c.N('S5A.Tot5A')) &&
      !audited(c),
  ),
  rule(
    28,
    'A',
    'GEN',
    'Cash receipts exceed five per cent, so audit under section 44AB is attracted.',
    (c) => c.V('GEN.CashReceiptPct') === 'More than 5%' && !audited(c),
  ),
  rule(
    29,
    'A',
    'GEN',
    'Cash payments exceed five per cent, so audit under section 44AB is attracted.',
    (c) => c.V('GEN.CashPaymentPct') === 'More than 5%' && !audited(c),
  ),
  rule(
    30,
    'A',
    'GEN',
    'Turnover is between ₹1 crore and ₹10 crore and cash receipts or payments exceed five per cent, so audit under section 44AB is attracted.',
    (c) =>
      c.V('GEN.TurnoverRange').startsWith('More than ₹1 crore') &&
      (c.V('GEN.CashReceiptPct') === 'More than 5%' ||
        c.V('GEN.CashPaymentPct') === 'More than 5%') &&
      !audited(c),
  ),
  rule(33, 'A', 'GEN', 'The date of birth or formation must fall before 1 April 2026.', (c) =>
    c.V('GEN.DOB') !== '' && c.V('GEN.DOB') >= '2026-04-01',
  ),
  rule(
    37,
    'A',
    'CG',
    'The taxpayer is not a non-resident, so relief at treaty rates is not available.',
    (c) =>
      !c.isNRI &&
      (pos(c.N('CG.LTCG_B11_DTAA')) ||
        pos(c.N('CG.STCG_A8_DTAA')) ||
        pos(c.N('OS.DTAA2f')) ||
        pos(c.N('EI.EI_DTAA'))),
  ),
  rule(
    38,
    'A',
    'S',
    'Exempt allowance under section 10(13A) does not agree with the eligible amount computed in Table 10(13A).',
    (c) =>
      pos(c.N('S.HRAExempt')) &&
      pos(c.N('S.HRAReceived')) &&
      c.N('S.HRAExempt') > c.N('S.HRAReceived'),
  ),
  rule(39, 'A', 'GEN', 'Business income is declared, so item A19(b)(I) must be answered.', (c) =>
    (pos(c.N('BP.D_TotalPGBP')) || pos(turnover44AD(c))) && c.V('GEN.BusIncomeFlag') === '',
  ),
  rule(40, 'A', 'GEN', 'There is no business income, so item A19(b)(II) must be answered.', (c) =>
    !pos(c.N('BP.D_TotalPGBP')) && !pos(turnover44AD(c)) && c.V('GEN.BusIncomeFlag') === '',
  ),
  rule(
    44,
    'A',
    'GEN',
    'Form 10-IEA particulars are compulsory for re-entering the new tax regime.',
    (c) =>
      c.V('GEN.OptOutNewTaxRegime') === 'Re-entering the new regime' &&
      (c.V('GEN.Form10IEAAckNo') === '' || c.V('GEN.Form10IEADate') === ''),
  ),
  rule(
    45,
    'A',
    'GEN',
    'Form 10-IEA particulars are compulsory where the old tax regime is opted for.',
    (c) =>
      c.V('GEN.OptOutNewTaxRegime').startsWith('Yes') &&
      (c.V('GEN.Form10IEAAckNo') === '' || c.V('GEN.Form10IEADate') === ''),
  ),
  rule(46, 'A', 'GEN', 'Item A19(b) has been answered, so business income is compulsory.', (c) =>
    c.V('GEN.BusIncomeFlag') === 'Yes' &&
    !pos(c.N('BP.D_TotalPGBP')) &&
    !pos(turnover44AD(c)),
  ),
  rule(
    48,
    'A',
    'GEN',
    'Income is offered under section 115AD(1)(i) in Schedule OS, so the foreign portfolio investor flag must be Yes.',
    (c) => pos(c.N('OS.AnySpecial2d')) && c.V('GEN.FPIFlag') === 'No' && c.isNRI,
  ),
  rule(49, 'A', 'GEN', 'The secondary address is compulsory.', (c) =>
    c.V('GEN.SecAddSame') === 'No' && c.V('GEN.SecAddress') === '',
  ),
  rule(50, 'A', 'GEN', 'The secondary address must differ from the primary address.', (c) =>
    c.V('GEN.SecAddSame') === 'No' &&
    c.V('GEN.SecAddress') !== '' &&
    c.V('GEN.SecAddress').trim().toUpperCase() ===
      [c.V('GEN.FlatDoorNo'), c.V('GEN.PremiseName'), c.V('GEN.RoadStreet')]
        .join(' ')
        .trim()
        .toUpperCase(),
  ),

  /* ── Block 2 · Part A Balance Sheet, rules 51–60 ───────────────────── */
  rule(
    51,
    'A',
    'BS',
    'The assessee is liable to audit under section 44AB, so the balance sheet and the profit and loss account must be completed.',
    (c) => audited(c) && !pos(c.N('BS.SourcesTotal')) && !pos(c.N('BS.ApplicationTotal')),
  ),
  rule(52, 'A', 'BS', 'Total sources of funds do not agree with total application of funds.', (c) =>
    pos(c.N('BS.SourcesTotal')) &&
    pos(c.N('BS.ApplicationTotal')) &&
    !eq(c.N('BS.SourcesTotal'), c.N('BS.ApplicationTotal')),
  ),
  rule(
    53,
    'A',
    'BS',
    'Total proprietor’s fund does not equal capital plus total reserves and surplus.',
    (c) =>
      pos(c.N('BS.TotPropFund')) &&
      !eq(c.N('BS.PropCapital') + c.N('BS.TotReserve'), c.N('BS.TotPropFund')),
  ),
  rule(54, 'A', 'BS', 'Total loan funds do not equal secured plus unsecured loans.', (c) =>
    pos(c.N('BS.TotLoanFunds')) &&
    !eq(
      sum(c.N('BS.SecuredLoansFin'), c.N('BS.SecuredLoansOth'), c.N('BS.UnsecuredLoans')),
      c.N('BS.TotLoanFunds'),
    ),
  ),
  rule(
    55,
    'A',
    'BS',
    'Total sources of funds do not equal proprietor’s fund, loan funds, deferred tax liability and advances.',
    (c) =>
      pos(c.N('BS.SourcesTotal')) &&
      !eq(
        sum(
          c.N('BS.TotPropFund'),
          c.N('BS.TotLoanFunds'),
          c.N('BS.DefTaxLiab'),
          c.N('BS.TotAdvances'),
        ),
        c.N('BS.SourcesTotal'),
      ),
  ),
  rule(56, 'A', 'BS', 'Total investments do not equal long-term plus short-term investments.', (c) =>
    pos(c.N('BS.TotInvest')) &&
    !eq(c.N('BS.LTInvest') + c.N('BS.STInvest'), c.N('BS.TotInvest')),
  ),
  rule(
    57,
    'A',
    'BS',
    'Total current assets do not equal inventories, sundry debtors, cash and bank balances, other current assets and loans and advances.',
    (c) =>
      pos(c.N('BS.TotCurrAssets')) &&
      !eq(
        sum(
          c.N('BS.Inventories'),
          c.N('BS.SundryDebtors'),
          c.N('BS.CashBank'),
          c.N('BS.OthCurrAssets'),
          c.N('BS.LoansAdvGiven'),
        ),
        c.N('BS.TotCurrAssets'),
      ),
  ),
  rule(
    58,
    'A',
    'BS',
    'Net current assets do not equal total current assets less total current liabilities and provisions.',
    (c) =>
      pos(c.N('BS.NetCurrAssets')) &&
      !eq(c.N('BS.TotCurrAssets') - c.N('BS.TotCurrLiab'), c.N('BS.NetCurrAssets')),
  ),
  rule(
    59,
    'A',
    'BS',
    'Total application of funds does not equal fixed assets, investments, net current assets and miscellaneous expenditure.',
    (c) =>
      pos(c.N('BS.ApplicationTotal')) &&
      !eq(
        sum(
          c.N('BS.FixedAssetsNet'),
          c.N('BS.TotInvest'),
          c.N('BS.NetCurrAssets'),
          c.N('BS.MiscExp'),
        ),
        c.N('BS.ApplicationTotal'),
      ),
  ),
  rule(
    60,
    'A',
    'BS',
    'Total advances do not equal advances from persons specified in section 40A(2)(b) plus advances from others.',
    (c) =>
      pos(c.N('BS.TotAdvances')) &&
      !eq(c.N('BS.AdvFrom40A2b') + c.N('BS.AdvFromOthers'), c.N('BS.TotAdvances')),
  ),
  rule(
    1000.1,
    'A',
    'BS',
    'Total current liabilities and provisions do not equal current liabilities plus provisions.',
    (c) =>
      pos(c.N('BS.TotCurrLiab')) &&
      !eq(c.N('BS.CurrLiab') + c.N('BS.Provisions'), c.N('BS.TotCurrLiab')),
  ),

  /* ── Block 3 · Manufacturing and Trading, rules 61–79 ──────────────── */
  rule(
    61,
    'A',
    'MFG',
    'Total opening inventory at 1A(iii) does not equal raw material plus work in progress.',
    (c) =>
      pos(c.N('MFG.OpTotal')) && !eq(c.N('MFG.OpRawMat') + c.N('MFG.OpWIP'), c.N('MFG.OpTotal')),
  ),
  rule(
    64,
    'A',
    'MFG',
    'Total debits to the manufacturing account do not equal opening inventory, purchases, direct wages, direct expenses and factory overheads.',
    (c) =>
      pos(c.N('MFG.TotalDebits')) &&
      !eq(
        sum(
          c.N('MFG.OpTotal'),
          c.N('MFG.Purchases'),
          c.N('MFG.DirectWages'),
          c.N('MFG.DirectExpTotal'),
          c.N('MFG.FactoryOverheads'),
        ),
        c.N('MFG.TotalDebits'),
      ),
  ),
  rule(66, 'A', 'MFG', 'Cost of goods produced does not equal total debits less closing stock.', (c) =>
    pos(c.N('MFG.CostGoodsProduced')) &&
    !eq(c.N('MFG.TotalDebits') - c.N('MFG.ClosingStock'), c.N('MFG.CostGoodsProduced')),
  ),
  rule(67, 'A', 'MFG', 'Negative amounts are permitted only at item 3, cost of goods produced.', (c) =>
    [
      'OpRawMat',
      'OpWIP',
      'OpTotal',
      'Purchases',
      'DirectWages',
      'DirectExpTotal',
      'FactoryOverheads',
      'FactoryDep',
      'TotalDebits',
      'ClosingStock',
    ].some((k) => c.N(`MFG.${k}`) < 0),
  ),
  rule(
    68,
    'A',
    'TRD',
    'Cost of goods produced transferred to the trading account does not agree with the manufacturing account.',
    (c) =>
      pos(c.N('TRD.CostGoodsFromMfg')) &&
      pos(c.N('MFG.CostGoodsProduced')) &&
      !eq(c.N('TRD.CostGoodsFromMfg'), c.N('MFG.CostGoodsProduced')),
  ),
  rule(
    70,
    'A',
    'TRD',
    'Item 4A(iv) does not equal the sum of sale of goods, sale of services and other operating revenue.',
    (c) =>
      pos(c.N('TRD.GrossReceipts')) &&
      !eq(
        sum(c.N('TRD.SaleGoods'), c.N('TRD.SaleServices'), c.N('TRD.OtherOpRevenue')),
        c.N('TRD.GrossReceipts'),
      ),
  ),
  rule(
    72,
    'A',
    'TRD',
    'Total revenue from operations at 4D does not equal 4A(iv) plus 4B plus 4C(ix).',
    (c) =>
      pos(c.N('TRD.TotRevenueOps')) &&
      !eq(
        sum(c.N('TRD.GrossReceipts'), c.N('TRD.GrossReceiptsGST'), c.N('TRD.DutiesTotal')),
        c.N('TRD.TotRevenueOps'),
      ),
  ),
  rule(
    75,
    'A',
    'TRD',
    'Gross profit at item 12 does not equal total credits less opening stock, purchases, direct expenses, duties and taxes paid, and cost of goods produced.',
    (c) =>
      pos(c.N('TRD.GrossProfit')) &&
      pos(c.N('TRD.TotalOfCredits')) &&
      !eq(
        c.N('TRD.TotalOfCredits') -
          sum(
            c.N('TRD.OpStockFG'),
            c.N('TRD.PurchasesTrd'),
            c.N('TRD.DirectExpTrd'),
            c.N('TRD.DutiesTaxesPaid'),
            c.N('TRD.CostGoodsFromMfg'),
          ),
        c.N('TRD.GrossProfit'),
      ),
  ),
  rule(
    76,
    'A',
    'TRD',
    'Negative amounts are permitted only at items 11 and 12 of the trading account.',
    (c) =>
      [
        'SaleGoods',
        'SaleServices',
        'OtherOpRevenue',
        'GrossReceipts',
        'DutiesTotal',
        'TotRevenueOps',
        'ClosingStockTrd',
        'TotalOfCredits',
        'OpStockFG',
        'PurchasesTrd',
        'DirectExpTrd',
        'DutiesTaxesPaid',
      ].some((k) => c.N(`TRD.${k}`) < 0),
  ),
  rule(77, 'A', 'TRD', 'Income from intraday trading exceeds the turnover declared at item 12(a).', (c) =>
    pos(c.N('TRD.IntradayTurnover')) && c.N('TRD.IntradayIncome') > c.N('TRD.IntradayTurnover'),
  ),
  rule(
    78,
    'A',
    'TRD',
    'Income from futures and options exceeds the turnover declared at item 12(c).',
    (c) => pos(c.N('TRD.FOTurnover')) && c.N('TRD.FOIncome') > c.N('TRD.FOTurnover'),
  ),
  rule(
    79,
    'A',
    'PL',
    'Gross profit transferred at item 13 does not equal items 12, 12(b) and 12(d) of the trading account.',
    (c) =>
      pos(c.N('PL.GrossProfitTrf')) &&
      !eq(
        sum(c.N('TRD.GrossProfit'), c.N('TRD.IntradayIncome'), c.N('TRD.FOIncome')),
        c.N('PL.GrossProfitTrf'),
      ),
  ),
  /* ── Block 4 · Part A Profit and Loss, rules 80–147 ────────────────── */
  rule(
    82,
    'A',
    'PL',
    'Total credits at item 15 do not equal gross profit transferred plus total other income.',
    (c) =>
      pos(c.N('PL.TotalCredits')) &&
      !eq(c.N('PL.GrossProfitTrf') + c.N('PL.OtherIncTotal'), c.N('PL.TotalCredits')),
  ),
  rule(
    92,
    'A',
    'PL',
    'Profit before interest, depreciation and taxes at item 50 does not agree with total credits less the expense heads.',
    (c) =>
      pos(c.N('PL.PBIDT')) &&
      pos(c.N('PL.TotalCredits')) &&
      !eq(
        c.N('PL.TotalCredits') -
          sum(
            c.N('PL.OpeningStockPL'),
            c.N('PL.EmpComp'),
            c.N('PL.Insurance'),
            c.N('PL.CommissionTot'),
            c.N('PL.RoyaltyTot'),
            c.N('PL.ProfFees'),
            c.N('PL.OtherExp'),
            c.N('PL.BadDebt'),
            c.N('PL.ProvBadDebt'),
            c.N('PL.OtherProv'),
          ),
        c.N('PL.PBIDT'),
      ),
  ),
  rule(
    94,
    'A',
    'PL',
    'Net profit before taxes at item 53 does not equal item 50 less total interest and depreciation.',
    (c) =>
      pos(c.N('PL.NPBT')) &&
      !eq(c.N('PL.PBIDT') - c.N('PL.InterestTot') - c.N('PL.Depreciation52'), c.N('PL.NPBT')),
  ),
  rule(
    95,
    'A',
    'PL',
    'Profit after tax at item 56 does not equal net profit before taxes less the provisions for current and deferred tax.',
    (c) =>
      pos(c.N('PL.PAT')) &&
      !eq(c.N('PL.NPBT') - c.N('PL.ProvCurrTax') - c.N('PL.ProvDefTax'), c.N('PL.PAT')),
  ),
  rule(
    96,
    'A',
    'PL',
    'Amount available for appropriation at item 58 does not equal profit after tax plus the balance brought forward.',
    (c) =>
      pos(c.N('PL.AmtAvailAppr')) &&
      !eq(c.N('PL.PAT') + c.N('PL.BalBroughtFwd'), c.N('PL.AmtAvailAppr')),
  ),
  rule(
    97,
    'A',
    'PL',
    'Balance carried to the balance sheet at item 60 does not equal item 58 less item 59.',
    (c) =>
      pos(c.N('PL.BalCarriedBS')) &&
      !eq(c.N('PL.AmtAvailAppr') - c.N('PL.Appropriations'), c.N('PL.BalCarriedBS')),
  ),
  rule(
    99,
    'A',
    'PL',
    'Presumptive income under section 44AD at item 61(ii) does not equal the sum of items 61(ii)(A) and 61(ii)(B).',
    (c) =>
      pos(c.N('BP.A35i_44AD')) &&
      !eq(c.N('PL.PI44ADBank') + c.N('PL.PI44ADCash'), c.N('BP.A35i_44AD')),
  ),
  rule(
    100,
    'A',
    'PL',
    'Presumptive income at item 61(ii)(A) is below six per cent of the turnover at item 61(i)(a).',
    (c) =>
      pos(c.N('PL.GT44ADBank')) && c.N('PL.PI44ADBank') < 0.06 * c.N('PL.GT44ADBank') - VTOL,
  ),
  rule(
    101,
    'A',
    'PL',
    'Presumptive income at item 61(ii)(B) is below eight per cent of the turnover at items 61(i)(b) and (c).',
    (c) =>
      c.N('PL.GT44ADCash') + c.N('PL.GT44ADOther') > 0 &&
      c.N('PL.PI44ADCash') < 0.08 * (c.N('PL.GT44ADCash') + c.N('PL.GT44ADOther')) - VTOL,
  ),
  rule(102, 'A', 'PL', 'Income declared under section 44AD exceeds the gross receipts.', (c) =>
    pos(turnover44AD(c)) && c.N('PL.PI44ADBank') + c.N('PL.PI44ADCash') > turnover44AD(c),
  ),
  rule(
    104,
    'A',
    'PL',
    'Income declared under section 44ADA is below fifty per cent of the gross receipts.',
    (c) => pos(c.N('PL.GR44ADA')) && c.N('PL.PI44ADA') < 0.5 * c.N('PL.GR44ADA') - VTOL,
  ),
  rule(
    105,
    'A',
    'PL',
    'A business code under section 44AD is selected, so presumptive income under section 44AD must be declared.',
    (c) =>
      c.rows('NOBRows').length > 0 &&
      pos(turnover44AD(c)) &&
      !pos(c.N('PL.PI44ADBank') + c.N('PL.PI44ADCash')),
  ),
  rule(
    106,
    'A',
    'PL',
    'The nature of business must be stated where presumptive income under section 44AD is declared.',
    (c) =>
      (pos(turnover44AD(c)) || pos(c.N('PL.PI44ADBank') + c.N('PL.PI44ADCash'))) &&
      c.rows('NOBRows').length === 0,
  ),
  rule(
    108,
    'A',
    'PL',
    'The nature of profession must be stated where presumptive income under section 44ADA is declared.',
    (c) =>
      (pos(c.N('PL.GR44ADA')) || pos(c.N('PL.PI44ADA'))) && c.rows('NOBRows').length === 0,
  ),
  rule(
    110,
    'A',
    'PL',
    'The nature of business must be stated where presumptive income under section 44AE is declared.',
    (c) => pos(c.N('PL.PI44AE')) && c.rows('NOBRows').length === 0,
  ),
  rule(111, 'A', 'PL', 'Income under section 44ADA exceeds the gross receipts.', (c) =>
    pos(c.N('PL.GR44ADA')) && c.N('PL.PI44ADA') > c.N('PL.GR44ADA'),
  ),
  rule(
    112,
    'A',
    'BP',
    'Item A35(i) of Schedule BP does not agree with the presumptive income under section 44AD in the profit and loss account.',
    (c) =>
      pos(c.N('BP.A35i_44AD')) &&
      !eq(c.N('BP.A35i_44AD'), c.N('PL.PI44ADBank') + c.N('PL.PI44ADCash')),
  ),
  rule(
    113,
    'A',
    'BP',
    'Item A35(ii) of Schedule BP does not agree with the presumptive income under section 44ADA.',
    (c) => pos(c.N('BP.A35ii_44ADA')) && !eq(c.N('BP.A35ii_44ADA'), c.N('PL.PI44ADA')),
  ),
  rule(
    114,
    'A',
    'BP',
    'Item A35(iii) of Schedule BP does not agree with the presumptive income under section 44AE.',
    (c) => pos(c.N('BP.A35iii_44AE')) && !eq(c.N('BP.A35iii_44AE'), c.N('PL.PI44AE')),
  ),
  rule(
    115,
    'A',
    'PL',
    'Presumptive income under section 44AE is declared, so the goods carriage table at item 63(i) must be completed.',
    (c) => pos(c.N('PL.PI44AE')) && c.rows('Goods44AE').length === 0,
  ),
  rule(
    116,
    'A',
    'PL',
    'Total presumptive income under section 44AE does not equal the sum of the carriage-wise amounts.',
    (c) =>
      pos(c.N('PL.PI44AE')) &&
      c.rows('Goods44AE').length > 0 &&
      !eq(
        c.rows('Goods44AE').reduce((a, r) => a + num(r, 'PresInc'), 0),
        c.N('PL.PI44AE'),
      ),
  ),
  rule(117, 'A', 'PL', 'The aggregate number of months for goods carriages exceeds 120.', (c) =>
    c.rows('Goods44AE').reduce((a, r) => a + num(r, 'Months'), 0) > 120,
  ),
  rule(
    118,
    'A',
    'PL',
    'Presumptive income for a carriage of 12 metric tonnes or less is below ₹7,500 for each month of holding.',
    (c) => {
      const bad = c
        .rows('Goods44AE')
        .filter(
          (r) =>
            num(r, 'Tonnage') > 0 &&
            num(r, 'Tonnage') <= 12 &&
            num(r, 'PresInc') < 7500 * num(r, 'Months') - VTOL,
        );
      return bad.length
        ? ` Carriage: ${bad.map((r) => str(r, 'RegNo') || '(unnumbered)').join(', ')}.`
        : false;
    },
  ),
  rule(
    119,
    'A',
    'BP',
    'Net profit from speculative business at item A2(a) does not agree with the profit and loss account and the trading account.',
    (c) =>
      pos(c.N('BP.A2a_SpecProfit')) &&
      !eq(c.N('BP.A2a_SpecProfit'), c.N('PL.SpecNet') + c.N('TRD.IntradayIncome')),
  ),
  rule(
    120,
    'A',
    'PL',
    'Presumptive business income under section 44AD cannot be declared by a non-resident.',
    (c) => c.isNRI && pos(c.N('PL.PI44ADBank') + c.N('PL.PI44ADCash')),
  ),
  rule(
    122,
    'A',
    'PL',
    'Net profit at item 64(i)(d) does not equal gross profit less expenses in the no-accounts business case.',
    (c) =>
      pos(c.N('PL.NA_BusNP')) && !eq(c.N('PL.NA_BusGP') - c.N('PL.NA_BusExp'), c.N('PL.NA_BusNP')),
  ),
  rule(
    123,
    'A',
    'PL',
    'Net profit at item 64(ii)(d) does not equal gross profit less expenses in the no-accounts profession case.',
    (c) =>
      pos(c.N('PL.NA_ProfNP')) &&
      !eq(c.N('PL.NA_ProfGP') - c.N('PL.NA_ProfExp'), c.N('PL.NA_ProfNP')),
  ),
  rule(
    124,
    'A',
    'PL',
    'Gross profit exceeds gross receipts in the no-accounts business case.',
    (c) => pos(c.N('PL.NA_BusGR')) && c.N('PL.NA_BusGP') > c.N('PL.NA_BusGR'),
  ),
  rule(
    125,
    'A',
    'PL',
    'Gross profit exceeds gross receipts in the no-accounts profession case.',
    (c) => pos(c.N('PL.NA_ProfGR')) && c.N('PL.NA_ProfGP') > c.N('PL.NA_ProfGR'),
  ),
  rule(
    128,
    'A',
    'PL',
    'Total profit at item 64(iii) does not equal the sum of items 64(i) and 64(ii).',
    (c) =>
      pos(c.N('PL.NA_Total')) && !eq(c.N('PL.NA_BusNP') + c.N('PL.NA_ProfNP'), c.N('PL.NA_Total')),
  ),
  rule(
    129,
    'A',
    'PL',
    'Net income from speculative activity at item 65(iv) does not equal gross profit less expenditure.',
    (c) => pos(c.N('PL.SpecNet')) && !eq(c.N('PL.SpecGP') - c.N('PL.SpecExp'), c.N('PL.SpecNet')),
  ),
  rule(
    130,
    'A',
    'PL',
    'A Hindu Undivided Family is not eligible to declare presumptive income under section 44ADA.',
    (c) => c.isHUF && pos(c.N('PL.PI44ADA')),
  ),
  rule(
    131,
    'A',
    'PL',
    'Bad debts are claimed at item 47(i), so the Permanent Account Number or Aadhaar of the debtor must be furnished.',
    (c) =>
      c
        .rows('BadDebtors')
        .some((r) => num(r, 'Amt') > 0 && str(r, 'DebtorPAN') === '' && str(r, 'DebtorName') === ''),
  ),
  rule(132, 'A', 'PL', 'A registration number is repeated under section 44AE.', (c) => {
    const seen = new Set<string>();
    const dup: string[] = [];
    c.rows('Goods44AE').forEach((r) => {
      const reg = str(r, 'RegNo');
      if (reg === '') return;
      if (seen.has(reg)) dup.push(reg);
      seen.add(reg);
    });
    return dup.length ? ` Repeated: ${dup.join(', ')}.` : false;
  }),
  rule(
    133,
    'A',
    'PL',
    'Gross profit from speculative activity exceeds the turnover at item 65(i).',
    (c) => pos(c.N('PL.SpecTurnover')) && c.N('PL.SpecGP') > c.N('PL.SpecTurnover'),
  ),
  rule(
    134,
    'A',
    'PL',
    'Gross receipts under section 44ADA exceed ₹50,00,000 and cash receipts exceed five per cent, so audit under section 44AB is compulsory.',
    (c) =>
      c.N('PL.GR44ADA') > 5000000 &&
      c.V('GEN.CashReceiptPct') === 'More than 5%' &&
      !audited(c),
  ),
  rule(
    135,
    'A',
    'PL',
    'Turnover under section 44AD exceeds ₹2 crore and cash receipts exceed five per cent, so audit under section 44AB is compulsory.',
    (c) =>
      turnover44AD(c) > 20000000 && c.V('GEN.CashReceiptPct') === 'More than 5%' && !audited(c),
  ),
  rule(
    136,
    'A',
    'PL',
    'Gross receipts under section 44ADA at item 62(i) do not agree with the breakdown.',
    (c) =>
      pos(c.N('PL.GR44ADA')) &&
      pos(c.N('PL.PI44ADA')) &&
      c.N('PL.PI44ADA') > c.N('PL.GR44ADA'),
  ),
  rule(
    137,
    'A',
    'PL',
    'Gross receipts under section 44ADA exceed ₹75,00,000, so audit under section 44AB is compulsory.',
    (c) => c.N('PL.GR44ADA') > 7500000 && !audited(c),
  ),
  rule(
    138,
    'A',
    'PL',
    'Turnover under section 44AD exceeds ₹3 crore, so audit under section 44AB is compulsory.',
    (c) => turnover44AD(c) > 30000000 && !audited(c),
  ),
  rule(
    139,
    'A',
    'PL',
    'Total bad debts at item 47(i) do not equal the sum of the individual amounts.',
    (c) =>
      pos(c.N('PL.BadDebt')) &&
      c.rows('BadDebtors').length > 0 &&
      !eq(c.rows('BadDebtors').reduce((a, r) => a + num(r, 'Amt'), 0), c.N('PL.BadDebt')),
  ),
  rule(141, 'A', 'PL', 'Net profit at item 66(ii) exceeds the turnover at item 66(i).', (c) =>
    pos(c.N('PL.OthPresGR')) && c.N('PL.OthPresNP') > c.N('PL.OthPresGR'),
  ),
  ...(
    [
      ['44BBD', 0.25, 142],
      ['44B', 0.075, 143],
      ['44BB', 0.1, 144],
      ['44BBA', 0.05, 145],
      ['44BBC', 0.2, 146],
    ] as const
  ).map(([sec, rate, n]) =>
    rule(
      n,
      'A',
      'PL',
      `Net profit at item 66(ii) is below ${rate * 100} per cent of the gross receipts, the minimum prescribed under section ${sec}.`,
      (c) =>
        c.V('PL.OthPresSec').startsWith(`${sec} `) &&
        pos(c.N('PL.OthPresGR')) &&
        c.N('PL.OthPresNP') < rate * c.N('PL.OthPresGR') - VTOL,
    ),
  ),
  rule(
    147,
    'A',
    'PL',
    'The name and address of a bad debtor must be furnished where no number is available and the amount exceeds ₹1 lakh.',
    (c) =>
      c
        .rows('BadDebtors')
        .some(
          (r) =>
            str(r, 'DebtorPAN') === '' &&
            num(r, 'Amt') > 100000 &&
            (str(r, 'DebtorName') === '' || str(r, 'DebtorAddr') === ''),
        ),
  ),

  /* ── Block 5 · Schedule OI, rules 148–159 ──────────────────────────── */
  rule(
    150,
    'A',
    'OI',
    'The increase in profit on account of deviation from the income computation and disclosure standards does not agree with item XI(3) of Schedule ICDS.',
    (c) =>
      pos(c.N('OI.ICDSIncrease')) &&
      pos(c.N('ICDS.ICDS_XI')) &&
      c.N('OI.ICDSIncrease') > Math.abs(c.N('ICDS.ICDS_XI')) + VTOL,
  ),
  rule(157, 'A', 'OI', 'Amounts allowable under section 43B cannot be negative.', (c) =>
    c.N('OI.Allow43B') < 0,
  ),
  rule(158, 'A', 'OI', 'Amounts disallowable under section 43B cannot be negative.', (c) =>
    c.N('OI.Disallow43B') < 0,
  ),
  rule(159, 'A', 'OI', 'Outstanding tax, duty and cess at item 12(i) cannot be negative.', (c) =>
    c.N('OI.OutstandingTax12i') < 0,
  ),

  /* ── Block 6 · Schedule S, rules 160–209 ───────────────────────────── */
  rule(
    160,
    'A',
    'S',
    'Gross salary does not equal the sum of salary, perquisites, profit in lieu of salary and the section 89A amounts.',
    (c) =>
      pos(c.N('S.GrossSalary')) &&
      !eq(
        sum(
          c.N('S.Sal17_1'),
          c.N('S.Perq17_2'),
          c.N('S.Profit17_3'),
          c.N('S.Income89A_1d'),
          c.N('S.Income89A_1e'),
        ),
        c.N('S.GrossSalary'),
      ),
  ),
  rule(
    163,
    'A',
    'S',
    'Net salary does not equal gross salary less relief under section 89A and exempt allowances.',
    (c) =>
      pos(c.N('S.NetSalary')) &&
      !eq(c.N('S.GrossSalary') - c.N('S.Relief89A') - c.N('S.ExemptAllow'), c.N('S.NetSalary')),
  ),
  rule(
    164,
    'A',
    'S',
    'Deductions under section 16 do not equal the sum of items 5(a), 5(b) and 5(c).',
    (c) =>
      (pos(c.N('S.StdDeduction')) || pos(c.N('S.EntAllow')) || pos(c.N('S.ProfTax'))) &&
      pos(c.N('S.IncomeSalaries')) &&
      pos(c.N('S.NetSalary')) &&
      !eq(
        c.N('S.NetSalary') - sum(c.N('S.StdDeduction'), c.N('S.EntAllow'), c.N('S.ProfTax')),
        c.N('S.IncomeSalaries'),
      ),
  ),
  rule(
    165,
    'A',
    'S',
    'Income chargeable under Salaries does not equal net salary less deductions under section 16.',
    (c) =>
      pos(c.N('S.IncomeSalaries')) &&
      !eq(
        c.N('S.NetSalary') - sum(c.N('S.StdDeduction'), c.N('S.EntAllow'), c.N('S.ProfTax')),
        c.N('S.IncomeSalaries'),
      ),
  ),
  rule(
    167,
    'A',
    'S',
    'Exempt allowance under section 10(13A) exceeds the lowest of actual allowance received, rent paid less ten per cent of salary, and the metro or non-metro percentage of salary.',
    (c) => {
      if (!pos(c.N('S.HRAExempt'))) return false;
      const salary = c.N('S.HRABasicDA');
      if (!salary) return false;
      const pct = c.V('S.HRAMetro').startsWith('Metro') ? 0.5 : 0.4;
      const cap = Math.min(
        c.N('S.HRAReceived'),
        Math.max(0, c.N('S.HRARentPaid') - 0.1 * salary),
        pct * salary,
      );
      return c.N('S.HRAExempt') > cap + VTOL;
    },
  ),
  rule(
    172,
    'A',
    'S',
    'Entertainment allowance under section 16(ii) is available only to Central Government, State Government and public sector undertaking employees.',
    (c) =>
      pos(c.N('S.EntAllow')) &&
      !['Central Government', 'State Government', 'Public Sector Undertaking'].includes(
        c.V('S.EmployerCategory'),
      ),
  ),
  rule(
    173,
    'A',
    'S',
    'Entertainment allowance under section 16(ii) is limited to ₹5,000 or one-fifth of basic salary, whichever is lower.',
    (c) =>
      c.N('S.EntAllow') >
      Math.min(5000, c.N('S.Sal17_1') ? c.N('S.Sal17_1') / 5 : 5000) + VTOL,
  ),
  rule(174, 'A', 'S', 'Professional tax under section 16(iii) is limited to ₹5,000.', (c) =>
    c.N('S.ProfTax') > 5000,
  ),
  rule(
    177,
    'A',
    'S',
    'Standard deduction under section 16(ia) may not exceed ₹50,000 or the salary, whichever is less, under the old regime.',
    (c) =>
      isOld(c) &&
      c.N('S.StdDeduction') > Math.min(50000, c.N('S.GrossSalary') || 50000) + VTOL,
  ),
  rule(
    188,
    'A',
    'S',
    'Exempt allowance under section 10(13A) exceeds salary as per section 17(1).',
    (c) => pos(c.N('S.Sal17_1')) && c.N('S.HRAExempt') > c.N('S.Sal17_1'),
  ),
  rule(
    192,
    'A',
    'VIA',
    'Deduction under section 80GG cannot be claimed where exempt allowance under section 10(13A) is claimed.',
    (c) => pos(c.N('S.HRAExempt')) && pos(c.N('VIA.VIA_80GG')),
  ),
  rule(
    194,
    'A',
    'S',
    'Entertainment allowance under section 16(ii) cannot be claimed under the new tax regime.',
    (c) => isNew(c) && pos(c.N('S.EntAllow')),
  ),
  rule(
    195,
    'A',
    'S',
    'Professional tax under section 16(iii) cannot be claimed under the new tax regime.',
    (c) => isNew(c) && pos(c.N('S.ProfTax')),
  ),
  rule(
    198,
    'A',
    'S',
    'Exempt allowance under section 10(13A) cannot be claimed under the new tax regime.',
    (c) => isNew(c) && pos(c.N('S.HRAExempt')),
  ),
  rule(
    199,
    'A',
    'S',
    'Schedule S must be left blank where the status is Hindu Undivided Family.',
    (c) => c.isHUF && pos(c.N('S.GrossSalary')),
  ),
  rule(
    200,
    'A',
    'S',
    'Relief under section 89A cannot be claimed where item 1(d) of Schedule S is nil.',
    (c) => pos(c.N('S.Relief89A')) && !pos(c.N('S.Income89A_1d')),
  ),
  rule(
    204,
    'A',
    'S',
    'Exempt allowance under section 10(13A) exceeds the rent actually paid less ten per cent of basic salary and dearness allowance.',
    (c) =>
      pos(c.N('S.HRAExempt')) &&
      pos(c.N('S.HRABasicDA')) &&
      c.N('S.HRAExempt') > Math.max(0, c.N('S.HRARentPaid') - 0.1 * c.N('S.HRABasicDA')) + VTOL,
  ),
  rule(
    205,
    'A',
    'S',
    'Exempt allowance under section 10(13A) exceeds the percentage of basic salary and dearness allowance applicable to the place of residence.',
    (c) => {
      if (!pos(c.N('S.HRAExempt')) || !pos(c.N('S.HRABasicDA'))) return false;
      const pct = c.V('S.HRAMetro').startsWith('Metro') ? 0.5 : 0.4;
      return c.N('S.HRAExempt') > pct * c.N('S.HRABasicDA') + VTOL;
    },
  ),
  rule(
    207,
    'A',
    'S',
    'Table 10(13A) must be completed to claim exempt allowance under section 10(13A).',
    (c) =>
      pos(c.N('S.HRAExempt')) &&
      (!pos(c.N('S.HRABasicDA')) || !pos(c.N('S.HRAReceived')) || !pos(c.N('S.HRARentPaid'))),
  ),
  rule(
    208,
    'A',
    'S',
    'Basic salary and dearness allowance in Table 10(13A) exceed salary as per section 17(1).',
    (c) => pos(c.N('S.Sal17_1')) && c.N('S.HRABasicDA') > c.N('S.Sal17_1'),
  ),

  /* ── Block 7 · Schedule HP, rules 210–236 ──────────────────────────── */
  rowRule(
    210,
    'A',
    'HP',
    'HPRows',
    'Standard deduction on house property must be thirty per cent of the annual value.',
    property,
    (r) =>
      pos(num(r, 'StdDed30')) &&
      pos(num(r, 'AnnualValue')) &&
      !eq(num(r, 'StdDed30'), Math.round(0.3 * num(r, 'AnnualValue'))),
  ),
  rowRule(
    211,
    'A',
    'HP',
    'HPRows',
    'Where the property is co-owned, the assessee’s share and the co-owners’ shares must total 100 per cent.',
    property,
    (r) =>
      str(r, 'CoOwned') === 'Yes' &&
      num(r, 'OwnShare') !== 0 &&
      (num(r, 'OwnShare') <= 0 || num(r, 'OwnShare') >= 100),
  ),
  rowRule(
    213,
    'A',
    'HP',
    'HPRows',
    'Interest on borrowed capital cannot be claimed where the assessee’s share of a co-owned property is nil.',
    property,
    (r) => num(r, 'OwnShare') === 0 && pos(num(r, 'Interest24b')),
  ),
  rowRule(
    214,
    'A',
    'HP',
    'HPRows',
    'Municipal tax cannot be claimed where the gross rent or lettable value is nil.',
    property,
    (r) => pos(num(r, 'MunTax')) && !pos(num(r, 'GrossRent')),
  ),
  rowRule(
    215,
    'A',
    'HP',
    'HPRows',
    'Interest on borrowed capital for a self-occupied property is limited to ₹2,00,000.',
    property,
    (r) => str(r, 'Type').toLowerCase().startsWith('self') && num(r, 'Interest24b') > 200000,
  ),
  rule(
    216,
    'A',
    'HP',
    'Total income chargeable under House Property does not equal the sum of the property-wise amounts.',
    (c) =>
      pos(c.N('HP.TotalHP')) &&
      c.rows('HPRows').length > 0 &&
      !eq(c.rows('HPRows').reduce((a, r) => a + num(r, 'IncomeHP'), 0), c.N('HP.TotalHP')),
  ),
  rowRule(
    217,
    'A',
    'HP',
    'HPRows',
    'Gross rent received, receivable or lettable value must exceed nil for a let-out or deemed let-out property.',
    property,
    (r) =>
      !str(r, 'Type').toLowerCase().startsWith('self') &&
      str(r, 'Type') !== '' &&
      !pos(num(r, 'GrossRent')),
  ),
  rowRule(
    218,
    'A',
    'HP',
    'HPRows',
    'The annual value does not equal gross rent less unrealised rent and municipal taxes.',
    property,
    (r) =>
      pos(num(r, 'AnnualValue')) &&
      !eq(num(r, 'GrossRent') - num(r, 'MunTax') - num(r, 'UnrealRent'), num(r, 'AnnualValue')),
  ),
  rowRule(
    221,
    'A',
    'HP',
    'HPRows',
    'Income from the property does not equal annual value less standard deduction and interest, plus arrears.',
    property,
    (r) =>
      pos(num(r, 'IncomeHP')) &&
      !eq(
        num(r, 'AnnualValue') - num(r, 'StdDed30') - num(r, 'Interest24b') + num(r, 'ArrearsRent'),
        num(r, 'IncomeHP'),
      ),
  ),
  rule(
    223,
    'A',
    'HP',
    'Not more than two house properties may be claimed as self-occupied.',
    (c) =>
      c.rows('HPRows').filter((r) => str(r, 'Type').toLowerCase().startsWith('self')).length > 2,
  ),
  rowRule(
    224,
    'A',
    'HP',
    'HPRows',
    'Interest on borrowed capital cannot be claimed for a self-occupied property under the new tax regime.',
    property,
    (r, c) =>
      isNew(c) && str(r, 'Type').toLowerCase().startsWith('self') && pos(num(r, 'Interest24b')),
  ),
  rowRule(
    225,
    'A',
    'HP',
    'HPRows',
    'The co-owner’s Permanent Account Number cannot be the same as the assessee’s.',
    property,
    (r, c) => str(r, 'CoOwnerPAN') !== '' && str(r, 'CoOwnerPAN').toUpperCase() === pan(c),
  ),
  rowRule(
    226,
    'A',
    'HP',
    'HPRows',
    'Particulars of the loan must be furnished to claim interest under section 24(b).',
    property,
    (r) => pos(num(r, 'Interest24b')) && str(r, 'LenderDetail') === '',
  ),
  rowRule(
    234,
    'A',
    'HP',
    'HPRows',
    'The percentage share of the assessee must be stated for a co-owned property.',
    property,
    (r) => str(r, 'CoOwned') === 'Yes' && num(r, 'OwnShare') === 0,
  ),
  rowRule(
    235,
    'A',
    'HP',
    'HPRows',
    'Where the property is not co-owned, the assessee’s share must be 100 per cent.',
    property,
    (r) => str(r, 'CoOwned') !== 'Yes' && num(r, 'OwnShare') !== 0 && num(r, 'OwnShare') !== 100,
  ),
  rowRule(
    236,
    'A',
    'HP',
    'HPRows',
    'Rent which cannot be realised exceeds the gross rent for the year.',
    property,
    (r) => num(r, 'UnrealRent') > num(r, 'GrossRent') && pos(num(r, 'GrossRent')),
  ),
  /* ── Block 8 · Schedule BP, rules 237–303 ──────────────────────────── */
  rule(
    237,
    'A',
    'BP',
    'Profit before tax at item A1 does not agree with the profit and loss account, including presumptive and no-accounts income.',
    (c) =>
      pos(c.N('BP.A1_ProfitPL')) &&
      pos(c.N('PL.NPBT')) &&
      !eq(
        c.N('BP.A1_ProfitPL'),
        c.N('PL.NPBT') +
          c.N('PL.NA_Total') +
          c.N('PL.PI44ADBank') +
          c.N('PL.PI44ADCash') +
          c.N('PL.PI44ADA') +
          c.N('PL.PI44AE'),
      ),
  ),
  rule(
    240,
    'A',
    'BP',
    'Depreciation allowable under sections 32(1)(ii) and 32(1)(iia) does not agree with item 6 of Schedule DEP.',
    (c) =>
      pos(c.N('BP.A12i_DepIT')) &&
      pos(c.N('DEP.DEP_Total')) &&
      !eq(c.N('BP.A12i_DepIT'), c.N('DEP.DEP_Total')),
  ),
  rule(
    241,
    'A',
    'BP',
    'The amount reduced at item A3(b) exceeds the income offered in Schedule HP.',
    (c) => c.N('BP.A3b_HPInc') > Math.max(0, c.N('HP.TotalHP')) && pos(c.N('BP.A3b_HPInc')),
  ),
  rule(
    242,
    'A',
    'BP',
    'The amount reduced at item A3(c) exceeds the income offered in Schedule CG.',
    (c) => pos(c.N('BP.A3c_CGInc')) && c.N('BP.A3c_CGInc') > Math.max(0, c.N('CG.C3_Total')),
  ),
  rule(
    243,
    'A',
    'BP',
    'The amount reduced at item A3(d) exceeds the income offered in Schedule OS.',
    (c) => pos(c.N('BP.A3d_OSInc')) && c.N('BP.A3d_OSInc') > Math.max(0, c.N('OS.Total9')),
  ),
  rule(244, 'A', 'BP', 'Item A6 does not equal item A1 less the amounts at items A2 to A5.', (c) =>
    pos(c.N('BP.A6_Balance')) &&
    !eq(
      c.N('BP.A1_ProfitPL') -
        sum(
          c.N('BP.A2a_SpecProfit'),
          c.N('BP.A2b_SpecifiedProfit'),
          c.N('BP.A3a_SalaryInc'),
          c.N('BP.A3b_HPInc'),
          c.N('BP.A3c_CGInc'),
          c.N('BP.A3d_OSInc'),
          c.N('BP.A3e_115BBF'),
          c.N('BP.A3f_115BBG'),
          c.N('BP.A3g_115BBH'),
          c.N('BP.A4a_ExemptInc'),
          c.N('BP.A4b_Rule7'),
          c.N('BP.A5a_FirmShare'),
          c.N('BP.A5c_DividendRed'),
        ),
      c.N('BP.A6_Balance'),
    ),
  ),
  rule(246, 'A', 'BP', 'Item A10 does not equal item A6 plus item A9.', (c) =>
    pos(c.N('BP.A10')) && !eq(c.N('BP.A6_Balance') + c.N('BP.A9_Additions'), c.N('BP.A10')),
  ),
  rule(248, 'A', 'BP', 'Item A13 does not equal item A10 plus item A11 less item A12(iii).', (c) =>
    pos(c.N('BP.A13')) &&
    !eq(
      c.N('BP.A10') +
        c.N('BP.A11_Depreciation') -
        c.N('BP.A12i_DepIT') -
        c.N('BP.A12ii_Dep32_1i'),
      c.N('BP.A13'),
    ),
  ),
  rule(249, 'A', 'BP', 'Item A26 does not equal the sum of items A14 to A25.', (c) =>
    pos(c.N('BP.A26')) &&
    !eq(
      sum(
        c.N('BP.A14_Dis36'),
        c.N('BP.A15_Dis37'),
        c.N('BP.A16_Dis40'),
        c.N('BP.A17_Dis40A'),
        c.N('BP.A18_Dis43B'),
        c.N('BP.A22_Interest23'),
        c.N('BP.A24e_ESRNeg'),
        c.N('BP.A25_ICDSInc'),
      ),
      c.N('BP.A26'),
    ),
  ),
  rule(250, 'A', 'BP', 'Item A33 does not equal the sum of items A27 to A32.', (c) =>
    pos(c.N('BP.A33')) &&
    !eq(
      sum(c.N('BP.A27_43BAllow'), c.N('BP.A28_ESRDeduction'), c.N('BP.A32_ICDSDec')),
      c.N('BP.A33'),
    ),
  ),
  rule(251, 'A', 'BP', 'Item A14 does not agree with item 6(s) of Schedule OI.', (c) =>
    pos(c.N('BP.A14_Dis36')) && !eq(c.N('BP.A14_Dis36'), c.N('OI.Disallow36')),
  ),
  rule(252, 'A', 'BP', 'Item A15 does not agree with item 7(j) of Schedule OI.', (c) =>
    pos(c.N('BP.A15_Dis37')) && !eq(c.N('BP.A15_Dis37'), c.N('OI.Disallow37')),
  ),
  rule(253, 'A', 'BP', 'Item A16 does not agree with item 8A(j) of Schedule OI.', (c) =>
    pos(c.N('BP.A16_Dis40')) && !eq(c.N('BP.A16_Dis40'), c.N('OI.Disallow40')),
  ),
  rule(254, 'A', 'BP', 'Item A17 does not agree with item 9(f) of Schedule OI.', (c) =>
    pos(c.N('BP.A17_Dis40A')) && !eq(c.N('BP.A17_Dis40A'), c.N('OI.Disallow40A')),
  ),
  rule(255, 'A', 'BP', 'Item A18 does not agree with item 11(i) of Schedule OI.', (c) =>
    pos(c.N('BP.A18_Dis43B')) && !eq(c.N('BP.A18_Dis43B'), c.N('OI.Disallow43B')),
  ),
  rule(
    257,
    'A',
    'BP',
    'Item A25 does not agree with the increase in profit shown in Schedule OI and Schedule ICDS.',
    (c) => pos(c.N('BP.A25_ICDSInc')) && !eq(c.N('BP.A25_ICDSInc'), c.N('OI.ICDSIncrease')),
  ),
  rule(258, 'A', 'BP', 'Item A28 does not agree with item X(4) of Schedule ESR.', (c) =>
    pos(c.N('BP.A28_ESRDeduction')) && !eq(c.N('BP.A28_ESRDeduction'), c.N('ESR.ESR_Excess')),
  ),
  rule(259, 'A', 'BP', 'Item A29 does not agree with item 8B of Schedule OI.', (c) =>
    pos(c.N('BP.A27_43BAllow')) &&
    pos(c.N('OI.Allow40PY')) &&
    c.N('BP.A27_43BAllow') < c.N('OI.Allow40PY') - VTOL,
  ),
  rule(
    261,
    'A',
    'BP',
    'Item A32 does not agree with the decrease in profit shown in Schedule OI.',
    (c) => pos(c.N('BP.A32_ICDSDec')) && !eq(c.N('BP.A32_ICDSDec'), c.N('OI.ICDSDecrease')),
  ),
  rule(262, 'A', 'BP', 'Item A34 does not equal item A13 plus item A26 less item A33.', (c) =>
    pos(c.N('BP.A34_Income')) &&
    !eq(c.N('BP.A13') + c.N('BP.A26') - c.N('BP.A33'), c.N('BP.A34_Income')),
  ),
  rule(
    264,
    'A',
    'BP',
    'Item A36 does not equal item A34 plus the presumptive amounts at item A35.',
    (c) =>
      pos(c.N('BP.A36_NetPGBP')) &&
      !eq(
        c.N('BP.A34_Income') +
          sum(
            c.N('BP.A35i_44AD'),
            c.N('BP.A35ii_44ADA'),
            c.N('BP.A35iii_44AE'),
            c.N('BP.A35iv_vii'),
          ),
        c.N('BP.A36_NetPGBP'),
      ),
  ),
  rule(
    266,
    'A',
    'BP',
    'Income from speculative business at item B42 does not agree with item B39.',
    (c) => pos(c.N('BP.B42_SpecIncome')) && !eq(c.N('BP.B39_SpecPL'), c.N('BP.B42_SpecIncome')),
  ),
  rule(
    267,
    'A',
    'BP',
    'Profit or loss from specified business at item C47 does not agree with item C43.',
    (c) =>
      pos(c.N('BP.C48_SpecifiedIncome')) &&
      pos(c.N('BP.C43_SpecifiedPL')) &&
      c.N('BP.C48_SpecifiedIncome') > c.N('BP.C43_SpecifiedPL') + VTOL,
  ),
  rule(
    269,
    'A',
    'BP',
    'Income chargeable under Profits and gains from business or profession does not equal the sum of items A37, B42 and C48.',
    (c) =>
      pos(c.N('BP.D_TotalPGBP')) &&
      !eq(
        sum(c.N('BP.A37'), c.N('BP.B42_SpecIncome'), c.N('BP.C48_SpecifiedIncome')),
        c.N('BP.D_TotalPGBP'),
      ),
  ),
  rule(
    271,
    'A',
    'BP',
    'Depreciation debited to the profit and loss account does not agree with the manufacturing account and item 52 of the profit and loss account.',
    (c) =>
      pos(c.N('BP.A11_Depreciation')) &&
      !eq(c.N('MFG.FactoryDep') + c.N('PL.Depreciation52'), c.N('BP.A11_Depreciation')),
  ),
  rule(
    278,
    'A',
    'BP',
    'Depreciation under section 32(1)(i) may be claimed only where the assessee carries on a power sector business, business code 05001 or 06008.',
    (c) =>
      pos(c.N('BP.A12ii_Dep32_1i')) &&
      !c.rows('NOBRows').some((r) => ['05001', '06008'].includes(str(r, 'Code'))),
  ),
  rule(
    279,
    'A',
    'BP',
    'Income or loss from specified business is entered, so the nature of the specified business must be stated.',
    (c) =>
      (pos(c.N('BP.C43_SpecifiedPL')) || pos(c.N('BP.C48_SpecifiedIncome'))) &&
      c.V('BP.SpecifiedNature') === '',
  ),
  rule(280, 'A', 'BP', 'Item B39 does not agree with item A2(a).', (c) =>
    pos(c.N('BP.B39_SpecPL')) &&
    pos(c.N('BP.A2a_SpecProfit')) &&
    !eq(c.N('BP.B39_SpecPL'), c.N('BP.A2a_SpecProfit')),
  ),
  rule(
    282,
    'A',
    'BP',
    'The amount reduced at item A3(a) exceeds the income offered in Schedule S.',
    (c) =>
      pos(c.N('BP.A3a_SalaryInc')) &&
      c.N('BP.A3a_SalaryInc') > Math.max(0, c.N('S.IncomeSalaries')),
  ),
  rule(
    283,
    'A',
    'BP',
    'Presumptive income is declared at item A35, so either the regular balance sheet or the no-accounts particulars must be completed.',
    (c) =>
      pos(sum(c.N('BP.A35i_44AD'), c.N('BP.A35ii_44ADA'), c.N('BP.A35iii_44AE'))) &&
      !pos(c.N('BS.SourcesTotal')) &&
      !pos(c.N('BS.NoAccCashBal')) &&
      !pos(c.N('BS.NoAccDebtors')) &&
      !pos(c.N('BS.NoAccCreditors')) &&
      !pos(c.N('BS.NoAccStock')),
  ),
  rule(
    284,
    'A',
    'BP',
    'The turnover in the trading account and the profit and loss account is less than the presumptive income declared under section 44AD.',
    (c) =>
      pos(c.N('BP.A35i_44AD')) &&
      c.N('TRD.TotRevenueOps') +
        turnover44AD(c) +
        c.N('PL.GR44ADA') +
        c.N('PL.NA_BusGR') +
        c.N('PL.NA_ProfGR') <
        c.N('BP.A35i_44AD') - VTOL,
  ),
  rule(
    287,
    'A',
    'BP',
    'Deduction under section 35AD cannot be claimed under the new tax regime.',
    (c) => isNew(c) && pos(c.N('BP.C43_SpecifiedPL') - c.N('BP.C48_SpecifiedIncome')),
  ),
  rule(
    293,
    'A',
    'BP',
    'Item A35(iii) does not agree with the total presumptive income from goods carriages at item 63(ii).',
    (c) => pos(c.N('BP.A35iii_44AE')) && !eq(c.N('BP.A35iii_44AE'), c.N('PL.PI44AE')),
  ),
  rule(300, 'A', 'BP', 'The amount at item A3(g) does not agree with the total of Schedule VDA.', (c) =>
    pos(c.N('BP.A3g_115BBH')) &&
    !eq(
      c.N('BP.A3g_115BBH'),
      c.rows('VDARows').reduce((a, r) => a + num(r, 'Income'), 0),
    ),
  ),
  rule(301, 'A', 'BP', 'The dividend income reduced at item A5(c) cannot exceed nil.', (c) =>
    c.N('BP.A5c_DividendRed') > 0 && !pos(c.N('PL.DividendInc14iii')),
  ),
  rule(
    303,
    'A',
    'GEN',
    'ITR-3 should not be filed where there is no business income, unless one of the prescribed exceptions applies.',
    (c) =>
      !pos(c.N('BP.D_TotalPGBP')) &&
      !pos(turnover44AD(c)) &&
      !pos(c.N('PL.GR44ADA')) &&
      !pos(c.N('PL.PI44AE')) &&
      c.rows('IFRows').length === 0 &&
      c.V('GEN.Liable92E') !== 'Yes' &&
      c.rows('CFLRows').length === 0 &&
      c.rows('UDRows').length === 0 &&
      (pos(c.N('BTI.TI_Salary')) || pos(c.N('BTI.TI_HP')) || pos(c.N('BTI.TI_OS'))),
  ),

  /* ── Block 9 · Depreciation, rules 304–351 ─────────────────────────── */
  rule(
    304,
    'A',
    'DEP',
    'The amount on which depreciation at the full rate is allowable does not agree with the written down value plus additions less realisations.',
    (c) =>
      pos(c.N('DEP.PM15_Dep')) &&
      pos(c.N('DEP.PM15_WDV')) &&
      c.N('DEP.PM15_WDV') + c.N('DEP.PM15_Add') - c.N('DEP.PM15_Sale') < 0,
  ),
  rule(
    309,
    'A',
    'DEP',
    'Additional depreciation cannot be claimed under the new tax regime.',
    (c) => isNew(c) && pos(c.N('DEP.AddlDep')),
  ),
  rule(
    310,
    'A',
    'DEP',
    'Depreciation in the forty-five per cent block cannot be claimed under the new tax regime.',
    (c) => isNew(c) && pos(c.N('DEP.PM45_Dep')),
  ),
  rule(
    311,
    'A',
    'DEP',
    'Depreciation on the fifteen per cent block does not agree with the rate applicable to the block.',
    (c) => {
      const base = c.N('DEP.PM15_WDV') + c.N('DEP.PM15_Add') - c.N('DEP.PM15_Sale');
      return pos(c.N('DEP.PM15_Dep')) && base > 0 && c.N('DEP.PM15_Dep') > 0.15 * base + VTOL;
    },
  ),
  rule(
    325,
    'A',
    'DEP',
    'Total depreciation does not equal the sum of the plant and machinery, building, furniture, intangible asset and ship blocks.',
    (c) =>
      pos(c.N('DEP.DEP_Total')) &&
      !eq(
        sum(
          c.N('DEP.PM15_Dep'),
          c.N('DEP.PM30_Dep'),
          c.N('DEP.PM40_Dep'),
          c.N('DEP.PM45_Dep'),
          c.N('DEP.AddlDep'),
          c.N('DEP.Bld5_Dep'),
          c.N('DEP.Bld10_Dep'),
          c.N('DEP.Bld40_Dep'),
          c.N('DEP.Furn10_Dep'),
          c.N('DEP.Intang25_Dep'),
          c.N('DEP.Ships20_Dep'),
        ),
        c.N('DEP.DEP_Total'),
      ),
  ),
  rule(
    351,
    'A',
    'CG',
    'Short-term capital gain on depreciable assets at item A6(e) does not agree with item 6 of Schedule DCG.',
    (c) =>
      pos(c.N('DEP.DCG_Total')) &&
      pos(c.N('CG.STCG_A6_Other')) &&
      !eq(c.N('DEP.DCG_Total'), c.N('CG.STCG_A6_Other')),
  ),

  /* ── Block 10 · Schedule ESR, rules 352–354 ────────────────────────── */
  rule(
    353,
    'A',
    'ESR',
    'The excess deduction at item X(4) does not equal the sum of the section-wise amounts.',
    (c) =>
      pos(c.N('ESR.ESR_Excess')) &&
      !eq(
        sum(
          c.N('ESR.ESR_35_1_i'),
          c.N('ESR.ESR_35_1_ii'),
          c.N('ESR.ESR_35_1_iia'),
          c.N('ESR.ESR_35_1_iii'),
          c.N('ESR.ESR_35_1_iv'),
          c.N('ESR.ESR_35_2AA'),
          c.N('ESR.ESR_35_2AB'),
          c.N('ESR.ESR_35CCC'),
          c.N('ESR.ESR_35CCD'),
        ),
        c.N('ESR.ESR_Excess'),
      ),
  ),
  rule(
    354,
    'A',
    'ESR',
    'Deductions under sections 35(1)(ii), 35(1)(iia), 35(1)(iii), 35(2AA) and 35CCC cannot be claimed under the new tax regime.',
    (c) =>
      isNew(c) &&
      pos(
        sum(
          c.N('ESR.ESR_35_1_ii'),
          c.N('ESR.ESR_35_1_iia'),
          c.N('ESR.ESR_35_1_iii'),
          c.N('ESR.ESR_35_2AA'),
          c.N('ESR.ESR_35CCC'),
        ),
      ),
  ),

  /* ── Block 11 · Schedule CG, 112A and 115AD, rules 355–500 ─────────── */
  rule(
    355,
    'A',
    'CG',
    'Total short-term capital gain does not equal the sum of the individual short-term amounts.',
    (c) =>
      pos(c.N('CG.STCG_A9_Total')) &&
      !eq(
        sum(
          c.N('CG.STCG_A1e'),
          c.N('CG.STCG_A2'),
          c.N('CG.STCG_A3_111A'),
          c.N('CG.STCG_A5_NR'),
          c.N('CG.STCG_A6_Other'),
          c.N('CG.STCG_A7_PTI'),
          c.N('CG.STCG_A8_DTAA'),
        ),
        c.N('CG.STCG_A9_Total'),
      ),
  ),
  rule(
    356,
    'A',
    'CG',
    'Total long-term capital gain does not equal the sum of the individual long-term amounts.',
    (c) =>
      pos(c.N('CG.LTCG_B12_Total')) &&
      !eq(
        sum(
          c.N('CG.LTCG_B1e'),
          c.N('CG.LTCG_B2_SlumpSale'),
          c.N('CG.LTCG_B3_Bonds'),
          c.N('CG.LTCG_B4_112A') - c.N('CG.LTCG_B4_Exemption'),
          c.N('CG.LTCG_B5_ShareDeb'),
          c.N('CG.LTCG_B6_Other'),
          c.N('CG.LTCG_B7_115AD'),
          c.N('CG.LTCG_B9_Other'),
          c.N('CG.LTCG_B10_PTI'),
          c.N('CG.LTCG_B11_DTAA'),
        ),
        c.N('CG.LTCG_B12_Total'),
      ),
  ),
  rule(
    358,
    'A',
    'CG',
    'Expenses cannot be claimed at item A1(b) where the full value of consideration at item A1(a)(iii) is nil.',
    (c) =>
      !pos(c.N('CG.STCG_A1_LandBld')) &&
      pos(sum(c.N('CG.STCG_A1_Cost'), c.N('CG.STCG_A1_Improve'), c.N('CG.STCG_A1_Exp'))),
  ),
  rule(
    368,
    'A',
    'CG',
    'Short-term capital gain at item A1(e) does not equal consideration less the deductions under section 48.',
    (c) =>
      pos(c.N('CG.STCG_A1e')) &&
      !eq(
        c.N('CG.STCG_A1_LandBld') -
          sum(c.N('CG.STCG_A1_Cost'), c.N('CG.STCG_A1_Improve'), c.N('CG.STCG_A1_Exp')),
        c.N('CG.STCG_A1e'),
      ),
  ),
  rule(
    387,
    'A',
    'CG',
    'Long-term capital gain at item B1(e) does not equal consideration less the indexed cost of acquisition.',
    (c) =>
      pos(c.N('CG.LTCG_B1e')) &&
      !eq(c.N('CG.LTCG_B1_LandBld') - c.N('CG.LTCG_B1_IndexCost'), c.N('CG.LTCG_B1e')),
  ),
  rule(
    393,
    'A',
    'CG',
    'Long-term capital gain under section 112A at item B4(a) does not agree with the total of column 14 of Schedule 112A.',
    (c) =>
      pos(c.N('CG.LTCG_B4_112A')) &&
      c.rows('Sch112A').length > 0 &&
      !eq(
        c.rows('Sch112A').reduce((a, r) => a + num(r, 'Balance'), 0),
        c.N('CG.LTCG_B4_112A'),
      ),
  ),
  rule(394, 'A', 'CG', 'Item B4(c) does not equal item B4(a) less the exemption at item B4(b).', (c) =>
    pos(c.N('CG.LTCG_B4_112A')) && c.N('CG.LTCG_B4_Exemption') > c.N('CG.LTCG_B4_112A'),
  ),
  rule(
    435,
    'A',
    'CG',
    'The dates of purchase and of sale are compulsory where long-term capital gain on land or building is declared.',
    (c) =>
      pos(c.N('CG.LTCG_B1_LandBld')) &&
      (c.V('CG.LTCG_B1_SaleDate') === '' || c.V('CG.LTCG_B1_PurDate') === ''),
  ),
  rule(
    437,
    'A',
    'CG',
    'Income chargeable under Capital Gains at item C3 does not equal the sum of capital gain incomes and income from virtual digital assets.',
    (c) =>
      pos(c.N('CG.C3_Total')) &&
      !eq(c.N('CG.C1_TotalCG') + c.N('CG.C2_VDA_CG'), c.N('CG.C3_Total')),
  ),
  rule(
    438,
    'A',
    'CG',
    'Income from the transfer of virtual digital assets at item C2 does not agree with the total of Schedule VDA.',
    (c) =>
      pos(c.N('CG.C2_VDA_CG')) &&
      !eq(
        c.N('CG.C2_VDA_CG'),
        c
          .rows('VDARows')
          .reduce(
            (a, r) => a + (str(r, 'Head').toLowerCase().includes('capital') ? num(r, 'Income') : 0),
            0,
          ),
      ),
  ),
  rule(
    441,
    'A',
    'CG',
    'Where a cost of improvement is claimed, the cost, the indexed cost and the year of improvement must all be furnished.',
    (c) => pos(c.N('CG.STCG_A1_Improve')) && !pos(c.N('CG.STCG_A1_LandBld')),
  ),
  rule(
    444,
    'A',
    'CG',
    'The beneficial rate of long-term capital gain on land or building applies only where the acquisition was before 23 July 2024.',
    (c) =>
      c.V('CG.LTCG_B1_PurDate') !== '' &&
      c.V('CG.LTCG_B1_PurDate') >= '2024-07-23' &&
      pos(c.N('CG.LTCG_B1_IndexCost')),
  ),
  rule(445, 'A', 'CG', 'Indexation is not available to a non-resident.', (c) =>
    c.isNRI && pos(c.N('CG.LTCG_B1_IndexCost')),
  ),
  rule(471, 'A', 'CG', 'Investment under section 54EC may not exceed ₹50,00,000.', (c) =>
    c.N('CG.D_54EC') > 5000000,
  ),
  rule(480, 'A', 'CG', 'Deduction under section 54F may not exceed ₹10 crore.', (c) =>
    c.N('CG.D_54F') > 100000000,
  ),
  rule(
    483,
    'A',
    'CG',
    'The date of transfer of land or building must fall within the previous year.',
    (c) =>
      c.V('CG.LTCG_B1_SaleDate') !== '' &&
      (c.V('CG.LTCG_B1_SaleDate') < PREVIOUS_YEAR_START ||
        c.V('CG.LTCG_B1_SaleDate') > PREVIOUS_YEAR_END),
  ),
  rule(
    485,
    'A',
    'CG',
    'Total sale value at column 6 does not equal the number of units multiplied by the sale price per unit.',
    (c) =>
      c
        .rows('Sch112A')
        .some(
          (r) =>
            num(r, 'SaleValue') > 0 &&
            !eq(num(r, 'Qty') * num(r, 'SalePrice'), num(r, 'SaleValue')),
        ),
  ),
  rule(
    489,
    'A',
    'CG',
    'Total deductions at column 13 do not equal the cost of acquisition plus the expenditure on transfer.',
    (c) =>
      c
        .rows('Sch112A')
        .some(
          (r) =>
            num(r, 'Balance') !== 0 &&
            !eq(
              num(r, 'SaleValue') - num(r, 'CostNoIndex') - num(r, 'Expense'),
              num(r, 'Balance'),
            ),
        ),
  ),
  rule(
    490,
    'A',
    'CG',
    'Balance at column 14 does not equal the total sale value less total deductions.',
    (c) =>
      c.rows('Sch112A').some((r) => num(r, 'SaleValue') > 0 && num(r, 'Balance') > num(r, 'SaleValue')),
  ),

  /* ── Block 12 · Schedule VDA, rules 501–505 ────────────────────────── */
  rule(
    501,
    'A',
    'VDA',
    'Income at item 7 does not equal the consideration received less the cost of acquisition.',
    (c) =>
      c
        .rows('VDARows')
        .some(
          (r) =>
            (num(r, 'Consideration') !== 0 || num(r, 'CostAcq') !== 0) &&
            !eq(num(r, 'Consideration') - num(r, 'CostAcq'), num(r, 'Income')),
        ),
  ),
  rule(504, 'A', 'VDA', 'A date of acquisition or transfer falls outside the previous year.', (c) =>
    c
      .rows('VDARows')
      .some(
        (r) =>
          str(r, 'DateTrf') !== '' &&
          (str(r, 'DateTrf') < PREVIOUS_YEAR_START || str(r, 'DateTrf') > PREVIOUS_YEAR_END),
      ),
  ),

  /* ── Block 13 · Schedule OS, rules 506–549 ─────────────────────────── */
  rule(
    506,
    'A',
    'OS',
    'Gross amount chargeable at normal applicable rates does not equal the sum of items 1(a) to 1(e).',
    (c) =>
      pos(c.N('OS.Gross1')) &&
      !eq(
        sum(
          c.N('OS.Dividend1a'),
          c.N('OS.Interest1b'),
          c.N('OS.Rental1c'),
          c.N('OS.Income56_2x'),
          c.N('OS.FamilyPension'),
          c.N('OS.Income89A_OS'),
        ),
        c.N('OS.Gross1'),
      ),
  ),
  rule(
    507,
    'A',
    'OS',
    'Deduction under section 57 does not equal the sum of the individual deductions.',
    (c) =>
      pos(c.N('OS.Net6')) &&
      pos(c.N('OS.Gross1')) &&
      !eq(
        c.N('OS.Gross1') -
          sum(
            c.N('OS.Ded57Exp'),
            c.N('OS.Ded57iia'),
            c.N('OS.Ded57Int'),
            c.N('OS.Dep3b'),
            c.N('OS.Relief89A_5a'),
          ),
        c.N('OS.Net6'),
      ),
  ),
  rule(
    508,
    'A',
    'OS',
    'Depreciation may be claimed only where rental income from machinery, plant or buildings is offered.',
    (c) => pos(c.N('OS.Dep3b')) && !pos(c.N('OS.Rental1c')),
  ),
  rule(
    509,
    'A',
    'OS',
    'Income from other sources other than from owning race horses does not equal the normal-rate income plus special-rate income.',
    (c) =>
      pos(c.N('OS.Total7')) &&
      !eq(
        c.N('OS.Net6') +
          sum(
            c.N('OS.Lottery2ai'),
            c.N('OS.OnlineGames2aii'),
            c.N('OS.Unexplained2b'),
            c.N('OS.AccumPF2c'),
            c.N('OS.AnySpecial2d'),
            c.N('OS.PTISpecial2e'),
            c.N('OS.DTAA2f'),
          ),
        c.N('OS.Total7'),
      ),
  ),
  rule(
    511,
    'A',
    'OS',
    'Income under the head Income from Other Sources does not equal item 7 plus item 8(e).',
    (c) =>
      pos(c.N('OS.Total9')) && !eq(c.N('OS.Total7') + c.N('OS.RaceHorses8e'), c.N('OS.Total9')),
  ),
  rule(
    524,
    'A',
    'OS',
    'Deduction under section 57(iia) is available only where family pension is offered.',
    (c) => pos(c.N('OS.Ded57iia')) && !pos(c.N('OS.FamilyPension')),
  ),
  rule(525, 'A', 'OS', 'Interest at item 1(b) is less than the sum of the interest breakdown.', (c) =>
    pos(c.N('OS.Interest1b')) &&
    sum(c.N('OS.IntSavings'), c.N('OS.IntDeposits'), c.N('OS.IntITRefund')) >
      c.N('OS.Interest1b') + VTOL,
  ),
  rule(
    526,
    'A',
    'OS',
    'The quarterly breakdown of dividend income does not agree with the dividend income declared at item 1(a).',
    (c) => {
      const q = sum(
        c.N('OS.DivQ1'),
        c.N('OS.DivQ2'),
        c.N('OS.DivQ3'),
        c.N('OS.DivQ4'),
        c.N('OS.DivQ5'),
      );
      return pos(q) && pos(c.N('OS.Dividend1a')) && q > c.N('OS.Dividend1a') + VTOL;
    },
  ),
  rule(
    529,
    'A',
    'OS',
    'Interest expenditure on dividend under section 57(1) exceeds twenty per cent of the dividend income.',
    (c) => pos(c.N('OS.Ded57Int')) && c.N('OS.Ded57Int') > 0.2 * c.N('OS.Dividend1a') + VTOL,
  ),
  rule(
    530,
    'A',
    'OS',
    'Expenses under section 57 may be claimed only where income is offered at items 1(b) to 1(e).',
    (c) =>
      pos(c.N('OS.Ded57Exp')) &&
      !pos(sum(c.N('OS.Interest1b'), c.N('OS.Rental1c'), c.N('OS.Income56_2x'))),
  ),
  rule(
    531,
    'A',
    'OS',
    'Deduction under section 57(iia) is limited to one-third of the family pension or ₹15,000, whichever is lower, under the old regime.',
    (c) =>
      isOld(c) &&
      pos(c.N('OS.Ded57iia')) &&
      c.N('OS.Ded57iia') > Math.min(15000, c.N('OS.FamilyPension') / 3) + VTOL,
  ),
  rule(
    539,
    'A',
    'OS',
    'Income claimed for relief under section 89A exceeds the income offered at item 1(e).',
    (c) => pos(c.N('OS.Relief89A_5a')) && c.N('OS.Relief89A_5a') > c.N('OS.Income89A_OS'),
  ),
  rule(
    541,
    'A',
    'OS',
    'Relief under section 89A may be claimed only where income from a notified retirement benefit account is offered.',
    (c) => pos(c.N('OS.Relief89A_5a')) && !pos(c.N('OS.Income89A_OS')),
  ),
  rule(
    548,
    'A',
    'OS',
    'Under the new tax regime, deduction under section 57 for family pension may not exceed ₹25,000 or one-third of the pension, whichever is lower.',
    (c) =>
      isNew(c) &&
      pos(c.N('OS.Ded57iia')) &&
      c.N('OS.Ded57iia') > Math.min(25000, c.N('OS.FamilyPension') / 3) + VTOL,
  ),
  /* ── Block 14 · Schedule CYLA, rules 550–583 ───────────────────────── */
  rule(550, 'A', 'CYLA', 'Business and profession loss set off does not agree with Schedule BP.', (c) =>
    pos(c.N('CYLA.CYLA_BPLoss')) && c.N('BP.D_TotalPGBP') >= 0 && pos(c.N('CYLA.CYLA_BPLoss')),
  ),
  rule(551, 'A', 'CYLA', 'Set-off of loss from house property may not exceed ₹2,00,000.', (c) =>
    c.N('CYLA.CYLA_HPLoss') > 200000,
  ),
  rule(552, 'A', 'CYLA', 'House property income does not agree with item 3 of Schedule HP.', (c) =>
    pos(c.N('CYLA.CYLA_HPLoss')) && c.N('HP.TotalHP') >= 0 && pos(c.N('HP.TotalHP')),
  ),
  rule(
    554,
    'A',
    'CYLA',
    'Total losses set off do not equal the sum of the head-wise set-offs.',
    (c) =>
      pos(c.N('CYLA.CYLA_TotalSetoff')) &&
      !eq(
        sum(c.N('CYLA.CYLA_HPLoss'), c.N('CYLA.CYLA_BPLoss'), c.N('CYLA.CYLA_OSLoss')),
        c.N('CYLA.CYLA_TotalSetoff'),
      ),
  ),
  rule(
    572,
    'A',
    'CYLA',
    'Loss under house property cannot be set off under the new tax regime.',
    (c) => isNew(c) && pos(c.N('CYLA.CYLA_HPLoss')),
  ),
  rule(
    579,
    'A',
    'CYLA',
    'House property losses cannot be adjusted against any income under the new tax regime.',
    (c) => isNew(c) && pos(c.N('CYLA.CYLA_HPLoss')),
  ),

  /* ── Block 15 · BFLA, CFL and UD, rules 584–629 ────────────────────── */
  rule(
    592,
    'A',
    'CYLA',
    'Brought forward depreciation set off does not agree with Schedule UD.',
    (c) =>
      pos(c.N('CYLA.BFLA_UnabsDep')) &&
      c.rows('UDRows').length > 0 &&
      c.N('CYLA.BFLA_UnabsDep') >
        c.rows('UDRows').reduce((a, r) => a + num(r, 'SetOff'), 0) + VTOL,
  ),
  rule(
    608,
    'A',
    'CYLA',
    'Total brought forward losses set off cannot exceed the current year income after set-off in Schedule CYLA.',
    (c) =>
      pos(c.N('CYLA.BFLA_Total')) &&
      pos(c.N('CYLA.BFLA_BFLoss')) &&
      c.N('CYLA.BFLA_BFLoss') + c.N('CYLA.BFLA_UnabsDep') > c.N('CYLA.BFLA_Total') + VTOL,
  ),
  rule(
    620,
    'A',
    'CFL',
    'The amount adjusted on opting for taxation under section 115BAC cannot exceed nil where the new tax regime has not been selected.',
    (c) => isOld(c) && c.rows('UDRows').some((r) => num(r, 'Adj115BAC') > 0),
  ),
  rule(
    622,
    'A',
    'CFL',
    'The total of brought forward losses does not agree with the year-wise amounts.',
    (c) => {
      const total = c
        .rows('CFLRows')
        .reduce(
          (a, r) =>
            a +
            sum(
              num(r, 'HPLoss'),
              num(r, 'BPLoss'),
              num(r, 'SpecLoss'),
              num(r, 'SpecifiedLoss'),
              num(r, 'STCL'),
              num(r, 'LTCL'),
              num(r, 'RaceLoss'),
            ),
          0,
        );
      return pos(c.N('CYLA.BFLA_BFLoss')) && total > 0 && c.N('CYLA.BFLA_BFLoss') > total + VTOL;
    },
  ),
  rule(
    624,
    'A',
    'UD',
    'The adjustment on opting for taxation under section 115BAC cannot exceed nil where the new tax regime has not been selected.',
    (c) => isOld(c) && c.rows('UDRows').some((r) => num(r, 'Adj115BAC') > 0),
  ),
  rule(
    625,
    'A',
    'UD',
    'The amount set off during the year exceeds the depreciation brought forward less the adjustment under section 115BAC.',
    (c) =>
      c
        .rows('UDRows')
        .some((r) => num(r, 'SetOff') > num(r, 'DepBF') - num(r, 'Adj115BAC') + VTOL),
  ),
  rule(
    626,
    'A',
    'UD',
    'The balance carried forward does not equal the depreciation brought forward less the adjustment and the amount set off.',
    (c) =>
      c
        .rows('UDRows')
        .some(
          (r) =>
            (num(r, 'DepBF') !== 0 || num(r, 'DepCF') !== 0) &&
            !eq(num(r, 'DepBF') - num(r, 'Adj115BAC') - num(r, 'SetOff'), num(r, 'DepCF')),
        ),
  ),

  /* ── Block 16 · ICDS and Schedule 10AA, rules 630–633 ──────────────── */
  rule(630, 'A', 'ICDS', 'The total effect at item XI does not equal the sum of items I to X.', (c) =>
    pos(Math.abs(c.N('ICDS.ICDS_XI'))) &&
    !eq(
      sum(
        c.N('ICDS.ICDS_I'),
        c.N('ICDS.ICDS_II'),
        c.N('ICDS.ICDS_III'),
        c.N('ICDS.ICDS_IV'),
        c.N('ICDS.ICDS_V'),
        c.N('ICDS.ICDS_VI'),
        c.N('ICDS.ICDS_VII'),
        c.N('ICDS.ICDS_VIII'),
        c.N('ICDS.ICDS_IX'),
        c.N('ICDS.ICDS_X'),
      ),
      c.N('ICDS.ICDS_XI'),
    ),
  ),
  rule(
    632,
    'A',
    'S10AA',
    'Total deduction under section 10AA is claimed without the undertaking particulars.',
    (c) => pos(c.N('S10AA.Amt10AA')) && c.V('S10AA.UndertakingNo') === '',
  ),
  rule(633, 'A', 'S10AA', 'Schedule 10AA must be left blank under the new tax regime.', (c) =>
    isNew(c) && pos(c.N('S10AA.Amt10AA')),
  ),

  /* ── Block 17 · Sections 80G, 80GGA and 80GGC, rules 634–669 ───────── */
  rowRule(
    634,
    'A',
    'D80G',
    'Rows80G',
    'The amount of deduction computed exceeds the eligible amount.',
    donee,
    (r) => num(r, 'Eligible') > num(r, 'Total') + VTOL,
  ),
  rowRule(
    635,
    'A',
    'D80G',
    'Rows80G',
    'A donation in cash exceeding ₹2,000 does not qualify for deduction under section 80G.',
    donee,
    (r) => num(r, 'Cash') > 2000,
  ),
  rowRule(
    639,
    'A',
    'D80G',
    'Rows80G',
    'Total donation does not equal the donation in cash plus the donation in any other mode.',
    donee,
    (r) => pos(num(r, 'Total')) && !eq(num(r, 'Cash') + num(r, 'Other'), num(r, 'Total')),
  ),
  rule(
    644,
    'A',
    'D80G',
    'Deduction under section 80G is claimed in Schedule VI-A, so Schedule 80G must be completed.',
    (c) => pos(c.N('VIA.VIA_80G')) && c.rows('Rows80G').length === 0,
  ),
  rule(
    645,
    'A',
    'D80G',
    'The same donee Permanent Account Number appears in more than one block of Schedule 80G.',
    (c) => {
      const pans = c
        .rows('Rows80G')
        .map((r) => str(r, 'DoneePAN').toUpperCase())
        .filter((p) => p !== '');
      return new Set(pans).size !== pans.length;
    },
  ),
  rule(646, 'A', 'D80G', 'Schedule 80G must be left blank under the new tax regime.', (c) =>
    isNew(c) && c.rows('Rows80G').length > 0,
  ),
  rowRule(
    647,
    'A',
    'D80G',
    'Rows80G',
    'The transaction reference or the bank code is compulsory for a donation made otherwise than in cash.',
    donee,
    (r) => num(r, 'Other') > 0 && str(r, 'RefNo') === '',
  ),
  rowRule(
    648,
    'A',
    'D80G',
    'Rows80G',
    'The Permanent Account Number of the donee is compulsory where the donation exceeds nil.',
    donee,
    (r) => num(r, 'Total') > 0 && str(r, 'DoneePAN') === '',
  ),
  rowRule(
    649,
    'A',
    'D80GGA',
    'Rows80GGA',
    'Total donation under section 80GGA does not equal the cash and other-mode amounts.',
    donee,
    (r) => pos(num(r, 'Total')) && !eq(num(r, 'Cash') + num(r, 'Other'), num(r, 'Total')),
  ),
  rule(
    651,
    'A',
    'D80GGA',
    'Deduction under section 80GGA is claimed, so Schedule 80GGA must be completed.',
    (c) => isOld(c) && pos(c.N('VIA.VIA_80GGA')) && c.rows('Rows80GGA').length === 0,
  ),
  rule(652, 'A', 'D80GGA', 'Schedule 80GGA must be left blank under the new tax regime.', (c) =>
    isNew(c) && c.rows('Rows80GGA').length > 0,
  ),
  rowRule(
    653,
    'A',
    'D80GGA',
    'Rows80GGA',
    'The eligible amount donated in cash under section 80GGA may not exceed ₹2,000.',
    donee,
    (r) => num(r, 'Cash') > 2000,
  ),
  rowRule(
    655,
    'A',
    'D80GGA',
    'Rows80GGA',
    'The donee Permanent Account Number under section 80GGA is the same as that of the assessee or the verifier.',
    donee,
    (r, c) => {
      const p = str(r, 'DoneePAN').toUpperCase();
      return p !== '' && (p === pan(c) || p === verifierPan(c));
    },
  ),
  rule(
    659,
    'A',
    'D80GGC',
    'Where gross total income is negative, the eligible amount of contribution cannot exceed nil.',
    (c) =>
      !pos(c.N('BTI.TI_GTI')) && c.rows('Rows80GGC').some((r) => num(r, 'Eligible') > 0),
  ),
  rule(
    660,
    'A',
    'D80GGC',
    'Deduction under section 80GGC is claimed, so Schedule 80GGC must be completed.',
    (c) => pos(c.N('VIA.VIA_80GGC')) && c.rows('Rows80GGC').length === 0,
  ),
  rule(
    661,
    'A',
    'D80GGC',
    'Schedule 80GGC is not required to be filled under the new tax regime.',
    (c) => isNew(c) && c.rows('Rows80GGC').length > 0,
  ),
  rowRule(
    662,
    'A',
    'D80GGC',
    'Rows80GGC',
    'No deduction under section 80GGC is available for a contribution made in cash.',
    party,
    (r) => num(r, 'Cash') > 0,
  ),
  rowRule(
    664,
    'A',
    'D80GGC',
    'Rows80GGC',
    'Total contribution under section 80GGC does not equal the cash and other-mode amounts.',
    party,
    (r) => pos(num(r, 'Total')) && !eq(num(r, 'Cash') + num(r, 'Other'), num(r, 'Total')),
  ),
  rowRule(
    665,
    'A',
    'D80GGC',
    'Rows80GGC',
    'Particulars of the transaction are compulsory where the contribution is made otherwise than in cash.',
    party,
    (r) => num(r, 'Other') > 0 && str(r, 'RefNo') === '',
  ),
  rowRule(
    666,
    'A',
    'D80GGC',
    'Rows80GGC',
    'The deduction computed under section 80GGC exceeds the eligible amount.',
    party,
    (r) => num(r, 'Eligible') > num(r, 'Total') + VTOL,
  ),
  rowRule(
    668,
    'A',
    'D80GGC',
    'Rows80GGC',
    'A contribution under section 80GGC must fall between 1 April 2025 and 31 March 2026.',
    party,
    (r) =>
      str(r, 'Date') !== '' &&
      (str(r, 'Date') < PREVIOUS_YEAR_START || str(r, 'Date') > PREVIOUS_YEAR_END),
  ),
  rowRule(
    669,
    'A',
    'D80GGC',
    'Rows80GGC',
    'The name and Permanent Account Number of the political party are compulsory to claim deduction under section 80GGC.',
    party,
    (r) => str(r, 'PartyName') === '' || str(r, 'PartyPAN') === '',
  ),
  rule(
    760,
    'A',
    'D80G',
    'Deduction claimed under section 80G exceeds the eligible amount shown in Schedule 80G.',
    (c) =>
      pos(c.N('VIA.VIA_80G')) &&
      c.rows('Rows80G').length > 0 &&
      c.N('VIA.VIA_80G') >
        c.rows('Rows80G').reduce((a, r) => a + num(r, 'Eligible'), 0) + VTOL,
  ),

  /* ── Block 18 · Sections 80DD, 80U and 80RA, rules 670–692 ─────────── */
  rule(
    670,
    'A',
    'D80DD',
    'Deduction under section 80DD for a dependant with disability must be exactly ₹75,000.',
    (c) =>
      c.V('D80DD.DD_Category').startsWith('Dependant with disability') &&
      pos(c.N('VIA.VIA_80DD')) &&
      c.N('VIA.VIA_80DD') !== 75000,
  ),
  rule(
    671,
    'A',
    'D80DD',
    'Deduction under section 80DD for a dependant with severe disability must be exactly ₹1,25,000.',
    (c) =>
      c.V('D80DD.DD_Category').startsWith('Dependant with severe disability') &&
      pos(c.N('VIA.VIA_80DD')) &&
      c.N('VIA.VIA_80DD') !== 125000,
  ),
  rule(
    672,
    'A',
    'D80DD',
    'The amount in Schedule 80DD does not agree with the deduction claimed in Schedule VI-A.',
    (c) =>
      c.V('D80DD.DD_Category') !== '' &&
      c.V('D80DD.DD_Category') !== 'Not applicable' &&
      !pos(c.N('VIA.VIA_80DD')),
  ),
  rule(
    673,
    'A',
    'D80DD',
    'Where Schedule 80DD is filled, the nature of the disability, the relationship of the dependant and either the Permanent Account Number or the Aadhaar are compulsory.',
    (c) =>
      c.V('D80DD.DD_Category') !== '' &&
      c.V('D80DD.DD_Category') !== 'Not applicable' &&
      (c.V('D80DD.DD_NatureDisability') === '' ||
        c.V('D80DD.DD_DependentType') === '' ||
        (c.V('D80DD.DD_DependentPAN') === '' && c.V('D80DD.DD_Aadhaar') === '')),
  ),
  rule(
    675,
    'A',
    'D80DD',
    'A Hindu Undivided Family may claim deduction under section 80DD only where the dependant is a member of the family.',
    (c) =>
      c.isHUF &&
      pos(c.N('VIA.VIA_80DD')) &&
      !c.V('D80DD.DD_DependentType').toLowerCase().includes('member'),
  ),
  rule(
    676,
    'A',
    'D80DD',
    'Deduction under section 80U for self with disability must be exactly ₹75,000.',
    (c) =>
      c.V('D80DD.U_Category').startsWith('Self with disability') &&
      pos(c.N('VIA.VIA_80U')) &&
      c.N('VIA.VIA_80U') !== 75000,
  ),
  rule(
    677,
    'A',
    'D80DD',
    'Where deduction under section 80U is claimed, the nature of the disability is compulsory.',
    (c) => pos(c.N('VIA.VIA_80U')) && c.V('D80DD.U_NatureDisability') === '',
  ),
  rule(
    678,
    'A',
    'D80DD',
    'Deduction under section 80U for self with severe disability must be exactly ₹1,25,000.',
    (c) =>
      c.V('D80DD.U_Category').startsWith('Self with severe disability') &&
      pos(c.N('VIA.VIA_80U')) &&
      c.N('VIA.VIA_80U') !== 125000,
  ),
  rule(
    679,
    'A',
    'D80DD',
    'The amount in Schedule 80U does not agree with the deduction claimed in Schedule VI-A.',
    (c) =>
      c.V('D80DD.U_Category') !== '' &&
      c.V('D80DD.U_Category') !== 'Not applicable' &&
      !pos(c.N('VIA.VIA_80U')),
  ),
  rule(
    682,
    'A',
    'D80DD',
    'Form 10-IA particulars must be furnished separately to claim deduction under sections 80U and 80DD.',
    (c) =>
      (pos(c.N('VIA.VIA_80U')) && c.V('D80DD.U_Form10IA') === '') ||
      (pos(c.N('VIA.VIA_80DD')) && c.V('D80DD.DD_Form10IA') === ''),
  ),
  rule(
    683,
    'A',
    'RA',
    'Total donation in Schedule RA does not equal the donation in cash plus the donation in any other mode.',
    (c) =>
      c
        .rows('RARows')
        .some((r) => pos(num(r, 'Total')) && !eq(num(r, 'Cash') + num(r, 'Other'), num(r, 'Total'))),
  ),
  rule(687, 'A', 'RA', 'Schedule RA must be left blank under the new tax regime.', (c) =>
    isNew(c) && c.rows('RARows').length > 0,
  ),
  rule(
    688,
    'A',
    'VIA',
    'Deductions under sections 80-IA, 80-IB and 80-IE must be left blank under the new tax regime.',
    (c) =>
      isNew(c) && pos(sum(c.N('VIA.VIA_80IA'), c.N('VIA.VIA_80IB'), c.N('VIA.VIA_80IE'))),
  ),

  /* ── Block 19 · Sections 80C and 80D, rules 693–726 ────────────────── */
  rule(
    693,
    'A',
    'D80C',
    'Particulars of the investment or payment and the policy or document identification number are compulsory to claim deduction under section 80C.',
    (c) =>
      c
        .rows('Rows80C')
        .some((r) => num(r, 'Amount') > 0 && (str(r, 'Nature') === '' || str(r, 'PolicyNo') === '')),
  ),
  rule(
    694,
    'A',
    'D80C',
    'Deduction under section 80C in Chapter VI-A does not agree with the total in Schedule 80C.',
    (c) =>
      pos(c.N('VIA.VIA_80C')) &&
      c.rows('Rows80C').length > 0 &&
      !eq(c.rows('Rows80C').reduce((a, r) => a + num(r, 'Amount'), 0), c.N('VIA.VIA_80C')),
  ),
  rule(
    696,
    'A',
    'D80C',
    'An individual opting for the new tax regime has filled Schedule 80C, 80E, 80EE, 80EEA, 80EEB or Table 10(13A).',
    (c) =>
      c.isIndividual &&
      isNew(c) &&
      (c.rows('Rows80C').length > 0 ||
        pos(c.N('D80E.E_Interest')) ||
        pos(c.N('D80E.EE_Interest')) ||
        pos(c.N('D80E.EEA_Interest')) ||
        pos(c.N('D80E.EEB_Interest')) ||
        pos(c.N('S.HRAExempt'))),
  ),
  rule(697, 'A', 'D80D', 'Deduction for self and family under section 80D is limited to ₹25,000.', (c) =>
    isOld(c) &&
    c.V('D80D.SelfSenior') === 'No' &&
    c.N('D80D.SelfPremium') + c.N('D80D.SelfCheckup') > 25000,
  ),
  rule(699, 'A', 'D80D', 'Preventive health check-up under section 80D may not exceed ₹5,000.', (c) =>
    c.N('D80D.SelfCheckup') > 5000 || c.N('D80D.ParentCheckup') > 5000,
  ),
  rule(
    700,
    'A',
    'D80D',
    'Deduction for self and family including a senior citizen under section 80D is limited to ₹50,000.',
    (c) =>
      isOld(c) &&
      c.V('D80D.SelfSenior') === 'Yes' &&
      sum(c.N('D80D.SelfPremium'), c.N('D80D.SelfCheckup'), c.N('D80D.SelfMedExp')) > 50000,
  ),
  rule(702, 'A', 'D80D', 'Deduction for parents under section 80D is limited to ₹25,000.', (c) =>
    isOld(c) &&
    c.V('D80D.ParentSenior') === 'No' &&
    c.N('D80D.ParentPremium') + c.N('D80D.ParentCheckup') > 25000,
  ),
  rule(
    704,
    'A',
    'D80D',
    'Deduction for parents including a senior citizen under section 80D is limited to ₹50,000.',
    (c) =>
      isOld(c) &&
      c.V('D80D.ParentSenior') === 'Yes' &&
      sum(c.N('D80D.ParentPremium'), c.N('D80D.ParentCheckup'), c.N('D80D.ParentMedExp')) > 50000,
  ),
  rule(
    706,
    'A',
    'D80D',
    'The eligible amount of deduction under section 80D is limited to ₹1,00,000.',
    (c) => c.N('D80D.Total80D') > 100000,
  ),
  rule(
    707,
    'A',
    'D80D',
    'The eligible amount at item 3 does not equal the sum of items 1(a), 1(b), 2(a) and 2(b).',
    (c) =>
      pos(c.N('D80D.Total80D')) &&
      !eq(
        sum(
          c.N('D80D.SelfPremium'),
          c.N('D80D.SelfCheckup'),
          c.N('D80D.SelfMedExp'),
          c.N('D80D.ParentPremium'),
          c.N('D80D.ParentCheckup'),
          c.N('D80D.ParentMedExp'),
        ),
        c.N('D80D.Total80D'),
      ),
  ),
  rule(
    708,
    'A',
    'D80D',
    'Deduction under section 80D is claimed in Schedule VI-A, so Schedule 80D must be completed.',
    (c) => pos(c.N('VIA.VIA_80D')) && !pos(c.N('D80D.Total80D')),
  ),
  rule(
    709,
    'A',
    'VIA',
    'Deduction claimed under section 80D does not agree with the eligible amount in Schedule 80D.',
    (c) =>
      pos(c.N('VIA.VIA_80D')) &&
      pos(c.N('D80D.Total80D')) &&
      c.N('VIA.VIA_80D') > c.N('D80D.Total80D') + VTOL,
  ),
  rule(710, 'A', 'D80D', 'Schedule 80D must be left blank under the new tax regime.', (c) =>
    isNew(c) && pos(c.N('D80D.Total80D')),
  ),
  rule(
    711,
    'A',
    'D80D',
    'Deduction for self and family may be claimed only where the senior citizen question is answered No.',
    (c) =>
      c.V('D80D.SelfSenior') === 'Yes' && pos(c.N('D80D.SelfPremium')) && pos(c.N('D80D.SelfMedExp')),
  ),
  rule(
    715,
    'A',
    'D80D',
    'No deduction may be claimed for self and family where the answer is that no claim is being made.',
    (c) =>
      c.V('D80D.SelfSenior') === 'Not claiming for self or family' &&
      pos(sum(c.N('D80D.SelfPremium'), c.N('D80D.SelfCheckup'), c.N('D80D.SelfMedExp'))),
  ),
  rule(
    716,
    'A',
    'D80D',
    'No deduction may be claimed for parents where the answer is that no claim is being made.',
    (c) =>
      c.V('D80D.ParentSenior') === 'Not claiming for parents' &&
      pos(sum(c.N('D80D.ParentPremium'), c.N('D80D.ParentCheckup'), c.N('D80D.ParentMedExp'))),
  ),
  rule(
    717,
    'A',
    'D80D',
    'A Hindu Undivided Family is not eligible to claim deduction in respect of parents under section 80D.',
    (c) =>
      c.isHUF &&
      pos(sum(c.N('D80D.ParentPremium'), c.N('D80D.ParentCheckup'), c.N('D80D.ParentMedExp'))),
  ),
  rule(
    718,
    'A',
    'D80D',
    'The senior citizen questions in Schedule 80D must be answered to claim the deduction.',
    (c) =>
      pos(c.N('D80D.Total80D')) &&
      c.V('D80D.SelfSenior') === '' &&
      c.V('D80D.ParentSenior') === '',
  ),
  rule(
    723,
    'A',
    'D80D',
    'The name of the insurer and the policy number are compulsory to claim deduction for health insurance.',
    (c) => pos(c.N('D80D.SelfPremium')) && c.V('D80D.SelfInsurer') === '',
  ),
  rule(
    725,
    'A',
    'D80D',
    'The name of the insurer and the policy number are compulsory to claim deduction for health insurance for parents.',
    (c) => pos(c.N('D80D.ParentPremium')) && c.V('D80D.ParentInsurer') === '',
  ),

  /* ── Block 20 · Sections 80E, 80EE, 80EEA and 80EEB, rules 727–744 ── */
  rule(
    727,
    'A',
    'D80E',
    'Particulars of the loan are compulsory to claim deduction under section 80E.',
    (c) => pos(c.N('D80E.E_Interest')) && c.V('D80E.E_LoanBank') === '',
  ),
  rule(
    728,
    'A',
    'VIA',
    'Deduction under section 80E does not agree with the total interest in Schedule 80E.',
    (c) =>
      pos(c.N('VIA.VIA_80E')) &&
      pos(c.N('D80E.E_Interest')) &&
      !eq(c.N('VIA.VIA_80E'), c.N('D80E.E_Interest')),
  ),
  rule(
    730,
    'A',
    'D80E',
    'A Hindu Undivided Family is not eligible to fill Schedule 80E, 80EE, 80EEA or 80EEB, or Table 10(13A).',
    (c) =>
      c.isHUF &&
      pos(
        sum(
          c.N('D80E.E_Interest'),
          c.N('D80E.EE_Interest'),
          c.N('D80E.EEA_Interest'),
          c.N('D80E.EEB_Interest'),
          c.N('S.HRAExempt'),
        ),
      ),
  ),
  rule(
    731,
    'A',
    'D80E',
    'Particulars of the loan are compulsory to claim deduction under section 80EE.',
    (c) => pos(c.N('D80E.EE_Interest')) && c.V('D80E.EE_LoanDetail') === '',
  ),
  rule(
    733,
    'A',
    'VIA',
    'Deduction under section 80EE does not agree with the total interest in Schedule 80EE.',
    (c) =>
      pos(c.N('VIA.VIA_80EE')) &&
      pos(c.N('D80E.EE_Interest')) &&
      !eq(c.N('VIA.VIA_80EE'), c.N('D80E.EE_Interest')),
  ),
  rule(
    736,
    'A',
    'D80E',
    'Particulars of the bank from which the loan was taken are compulsory to claim deduction under section 80EEA.',
    (c) => pos(c.N('D80E.EEA_Interest')) && c.V('D80E.EEA_LoanDetail') === '',
  ),
  rule(
    739,
    'A',
    'VIA',
    'Deduction under section 80EEA does not agree with the total interest in Schedule 80EEA.',
    (c) =>
      pos(c.N('VIA.VIA_80EEA')) &&
      pos(c.N('D80E.EEA_Interest')) &&
      !eq(c.N('VIA.VIA_80EEA'), c.N('D80E.EEA_Interest')),
  ),
  rule(
    741,
    'A',
    'D80E',
    'Particulars of the loan are compulsory to claim deduction under section 80EEB.',
    (c) => pos(c.N('D80E.EEB_Interest')) && c.V('D80E.EEB_LoanDetail') === '',
  ),
  rule(
    743,
    'A',
    'VIA',
    'Deduction under section 80EEB does not agree with the total interest in Schedule 80EEB.',
    (c) =>
      pos(c.N('VIA.VIA_80EEB')) &&
      pos(c.N('D80E.EEB_Interest')) &&
      !eq(c.N('VIA.VIA_80EEB'), c.N('D80E.EEB_Interest')),
  ),
  /* ── Block 21 · Chapter VI-A, rules 745–828 ────────────────────────── */
  rule(
    750,
    'A',
    'VIA',
    'The aggregate of sections 80C, 80CCC and 80CCD(1) may not exceed ₹1,50,000.',
    (c) => sum(c.N('VIA.VIA_80C'), c.N('VIA.VIA_80CCC'), c.N('VIA.VIA_80CCD1')) > 150000,
  ),
  rule(
    751,
    'A',
    'VIA',
    'For a pensioner, deduction under section 80CCD(1) may not exceed twenty per cent of gross total income.',
    (c) =>
      isOld(c) &&
      c.V('S.EmployerCategory').startsWith('Pensioners') &&
      pos(c.N('BTI.TI_GTI')) &&
      c.N('VIA.VIA_80CCD1') > 0.2 * c.N('BTI.TI_GTI') + VTOL,
  ),
  rule(
    752,
    'A',
    'VIA',
    'An assessee other than an individual cannot claim deduction under section 80CCD(1).',
    (c) => !c.isIndividual && pos(c.N('VIA.VIA_80CCD1')),
  ),
  rule(
    753,
    'A',
    'VIA',
    'An assessee other than an individual cannot claim deduction under section 80CCD(1B).',
    (c) => !c.isIndividual && pos(c.N('VIA.VIA_80CCD1B')),
  ),
  rule(
    754,
    'A',
    'VIA',
    'Deduction under section 80CCD(2) may not exceed ten per cent of salary for a public sector undertaking or other employer under the old regime.',
    (c) =>
      isOld(c) &&
      ['Public Sector Undertaking', 'Others'].includes(c.V('S.EmployerCategory')) &&
      pos(c.N('S.Sal17_1')) &&
      c.N('VIA.VIA_80CCD2') > 0.1 * c.N('S.Sal17_1') + VTOL,
  ),
  rule(
    755,
    'A',
    'VIA',
    'Deduction under section 80CCD(2) cannot be claimed by a Hindu Undivided Family.',
    (c) => c.isHUF && pos(c.N('VIA.VIA_80CCD2')),
  ),
  rule(
    756,
    'A',
    'VIA',
    'Particulars of the specified disease are compulsory to claim deduction under section 80DDB.',
    (c) => pos(c.N('VIA.VIA_80DDB')) && c.V('VIA.VIA_80DDB_Disease') === '',
  ),
  rule(
    757,
    'A',
    'VIA',
    'Deduction under section 80E cannot be claimed by a Hindu Undivided Family.',
    (c) => c.isHUF && pos(c.N('VIA.VIA_80E')),
  ),
  rule(
    758,
    'A',
    'VIA',
    'Deduction under section 80EE cannot be claimed by a Hindu Undivided Family.',
    (c) => c.isHUF && pos(c.N('VIA.VIA_80EE')),
  ),
  rule(
    761,
    'A',
    'VIA',
    'Deduction under section 80GG is limited to the lower of twenty-five per cent of adjusted gross total income and ₹60,000.',
    (c) => c.N('VIA.VIA_80GG') > 60000,
  ),
  rule(
    762,
    'A',
    'VIA',
    'Deduction under section 80TTA is restricted to the interest income from savings accounts.',
    (c) =>
      pos(c.N('VIA.VIA_80TTA')) &&
      pos(c.N('OS.IntSavings')) &&
      c.N('VIA.VIA_80TTA') > c.N('OS.IntSavings') + VTOL,
  ),
  rule(
    763,
    'A',
    'VIA',
    'Deduction under section 80TTA cannot be claimed by a resident senior citizen.',
    (c) => pos(c.N('VIA.VIA_80TTA')) && pos(c.N('VIA.VIA_80TTB')),
  ),
  rule(
    764,
    'A',
    'VIA',
    'Deduction under section 80TTB is available only to a resident senior citizen.',
    (c) => pos(c.N('VIA.VIA_80TTB')) && c.isNRI,
  ),
  rule(
    765,
    'A',
    'VIA',
    'Deduction under section 80TTB is restricted to the interest income from savings accounts and deposits.',
    (c) =>
      pos(c.N('VIA.VIA_80TTB')) &&
      pos(c.N('OS.Interest1b')) &&
      c.N('VIA.VIA_80TTB') > c.N('OS.IntSavings') + c.N('OS.IntDeposits') + VTOL,
  ),
  rule(
    766,
    'A',
    'VIA',
    'Deduction under section 80U cannot be claimed by a Hindu Undivided Family.',
    (c) => c.isHUF && pos(c.N('VIA.VIA_80U')),
  ),
  rule(767, 'A', 'VIA', 'The maximum deduction under section 80CCD(1B) is ₹50,000.', (c) =>
    c.N('VIA.VIA_80CCD1B') > 50000,
  ),
  rule(
    768,
    'A',
    'VIA',
    'Deduction under section 80DDB for self and dependant is limited to ₹40,000.',
    (c) => isOld(c) && c.N('VIA.VIA_80DDB') > 40000 && !pos(c.N('VIA.VIA_80TTB')),
  ),
  rule(
    769,
    'A',
    'VIA',
    'Deduction under section 80DDB for a senior citizen is limited to ₹1,00,000.',
    (c) => isOld(c) && c.N('VIA.VIA_80DDB') > 100000,
  ),
  rule(770, 'A', 'VIA', 'Deduction under section 80EE may not exceed ₹50,000.', (c) =>
    c.N('VIA.VIA_80EE') > 50000,
  ),
  rule(771, 'A', 'VIA', 'The maximum deduction under section 80TTA is ₹10,000.', (c) =>
    c.N('VIA.VIA_80TTA') > 10000,
  ),
  rule(772, 'A', 'VIA', 'The maximum deduction under section 80TTB is ₹50,000.', (c) =>
    c.N('VIA.VIA_80TTB') > 50000,
  ),
  rule(
    773,
    'A',
    'VIA',
    'Where no employer category is a pensioner, deduction under section 80CCD(1) may not exceed ten per cent of salary.',
    (c) =>
      isOld(c) &&
      c.V('S.EmployerCategory') !== '' &&
      !c.V('S.EmployerCategory').includes('Pensioners') &&
      pos(c.N('S.Sal17_1')) &&
      c.N('VIA.VIA_80CCD1') > 0.1 * c.N('S.Sal17_1') + VTOL,
  ),
  rule(774, 'A', 'VIA', 'Deduction under section 80EEA may not exceed ₹1,50,000.', (c) =>
    c.N('VIA.VIA_80EEA') > 150000,
  ),
  rule(
    775,
    'A',
    'VIA',
    'Deduction under section 80EEA cannot be claimed where deduction under section 80EE is claimed.',
    (c) => pos(c.N('VIA.VIA_80EEA')) && pos(c.N('VIA.VIA_80EE')),
  ),
  rule(776, 'A', 'VIA', 'Deduction under section 80EEB may not exceed ₹1,50,000.', (c) =>
    c.N('VIA.VIA_80EEB') > 150000,
  ),
  rule(
    777,
    'A',
    'VIA',
    'Deduction under section 80CCD(2) cannot be claimed where every employer category is a pensioner.',
    (c) => c.V('S.EmployerCategory').startsWith('Pensioners') && pos(c.N('VIA.VIA_80CCD2')),
  ),
  rule(
    778,
    'A',
    'VIA',
    'Deduction under section 80EEA cannot be claimed by a Hindu Undivided Family.',
    (c) => c.isHUF && pos(c.N('VIA.VIA_80EEA')),
  ),
  rule(
    779,
    'A',
    'VIA',
    'Deduction under section 80EEB cannot be claimed by a Hindu Undivided Family.',
    (c) => c.isHUF && pos(c.N('VIA.VIA_80EEB')),
  ),
  rule(
    780,
    'A',
    'VIA',
    'Deduction under section 80DD is available only to a resident or a resident but not ordinarily resident assessee.',
    (c) => c.isNRI && pos(c.N('VIA.VIA_80DD')),
  ),
  rule(
    781,
    'A',
    'VIA',
    'Deduction under section 80DDB is available only to a resident or a resident but not ordinarily resident assessee.',
    (c) => c.isNRI && pos(c.N('VIA.VIA_80DDB')),
  ),
  rule(
    782,
    'A',
    'VIA',
    'Deduction under section 80U is available only to a resident or a resident but not ordinarily resident assessee.',
    (c) => c.isNRI && pos(c.N('VIA.VIA_80U')),
  ),
  rule(
    783,
    'A',
    'VIA',
    'Deduction under section 80CCD(2) may not exceed fourteen per cent of salary for a Central or State Government employee, or ten per cent otherwise, under the old regime.',
    (c) => {
      if (!isOld(c) || !pos(c.N('S.Sal17_1'))) return false;
      const gov = ['Central Government', 'State Government'].includes(c.V('S.EmployerCategory'));
      return c.N('VIA.VIA_80CCD2') > (gov ? 0.14 : 0.1) * c.N('S.Sal17_1') + VTOL;
    },
  ),
  rule(
    784,
    'A',
    'VIA',
    'Deduction under section 80QQB is available only to a resident or a resident but not ordinarily resident assessee.',
    (c) => c.isNRI && pos(c.N('VIA.VIA_80QQB')),
  ),
  rule(785, 'A', 'VIA', 'Deduction under section 80QQB is available only to an individual.', (c) =>
    !c.isIndividual && pos(c.N('VIA.VIA_80QQB')),
  ),
  rule(
    786,
    'A',
    'VIA',
    'Deduction under section 80RRB is available only to a resident or a resident but not ordinarily resident assessee.',
    (c) => c.isNRI && pos(c.N('VIA.VIA_80RRB')),
  ),
  rule(787, 'A', 'VIA', 'Deduction under section 80RRB is available only to an individual.', (c) =>
    !c.isIndividual && pos(c.N('VIA.VIA_80RRB')),
  ),
  rule(
    789,
    'A',
    'VIA',
    'Total deductions under Chapter VI-A do not equal the sum of the individual deductions.',
    (c) =>
      pos(c.N('VIA.VIA_Total')) &&
      !eq(c.N('VIA.VIA_PartB') + c.N('VIA.VIA_PartC'), c.N('VIA.VIA_Total')),
  ),
  rule(
    790,
    'A',
    'VIA',
    'The total of Part B of Chapter VI-A does not equal the individual deductions in respect of certain payments.',
    (c) =>
      pos(c.N('VIA.VIA_PartB')) &&
      !eq(
        sum(
          c.N('VIA.VIA_80C'),
          c.N('VIA.VIA_80CCC'),
          c.N('VIA.VIA_80CCD1'),
          c.N('VIA.VIA_80CCD1B'),
          c.N('VIA.VIA_80CCD2'),
          c.N('VIA.VIA_80CCH'),
          c.N('VIA.VIA_80D'),
          c.N('VIA.VIA_80DD'),
          c.N('VIA.VIA_80DDB'),
          c.N('VIA.VIA_80E'),
          c.N('VIA.VIA_80EE'),
          c.N('VIA.VIA_80EEA'),
          c.N('VIA.VIA_80EEB'),
          c.N('VIA.VIA_80G'),
          c.N('VIA.VIA_80GG'),
          c.N('VIA.VIA_80GGA'),
          c.N('VIA.VIA_80GGC'),
        ),
        c.N('VIA.VIA_PartB'),
      ),
  ),
  rule(792, 'A', 'VIA', 'The deduction listed is not available under the new tax regime.', (c) => {
    if (!isNew(c)) return false;
    const barred: Array<[string, string]> = [
      ['VIA_80C', '80C'],
      ['VIA_80CCC', '80CCC'],
      ['VIA_80CCD1', '80CCD(1)'],
      ['VIA_80CCD1B', '80CCD(1B)'],
      ['VIA_80D', '80D'],
      ['VIA_80DD', '80DD'],
      ['VIA_80DDB', '80DDB'],
      ['VIA_80E', '80E'],
      ['VIA_80EE', '80EE'],
      ['VIA_80EEA', '80EEA'],
      ['VIA_80EEB', '80EEB'],
      ['VIA_80G', '80G'],
      ['VIA_80GG', '80GG'],
      ['VIA_80GGA', '80GGA'],
      ['VIA_80GGC', '80GGC'],
      ['VIA_80IA', '80IA'],
      ['VIA_80IB', '80IB'],
      ['VIA_80IE', '80IC/IE'],
      ['VIA_80QQB', '80QQB'],
      ['VIA_80RRB', '80RRB'],
      ['VIA_80TTA', '80TTA'],
      ['VIA_80TTB', '80TTB'],
      ['VIA_80U', '80U'],
    ];
    const claimed = barred.filter(([k]) => pos(c.N(`VIA.${k}`)));
    return claimed.length ? ` Sections claimed: ${claimed.map(([, s]) => s).join(', ')}.` : false;
  }),
  rule(
    793,
    'A',
    'VIA',
    'The total of Part C of Chapter VI-A does not equal the sum of the deductions in respect of certain incomes.',
    (c) =>
      pos(c.N('VIA.VIA_PartC')) &&
      !eq(
        sum(
          c.N('VIA.VIA_80IA'),
          c.N('VIA.VIA_80IB'),
          c.N('VIA.VIA_80IE'),
          c.N('VIA.VIA_80JJAA'),
          c.N('VIA.VIA_80QQB'),
          c.N('VIA.VIA_80RRB'),
        ),
        c.N('VIA.VIA_PartC'),
      ),
  ),
  rule(
    796,
    'A',
    'VIA',
    'Deduction under section 80CCH is limited to sixty per cent of salary and to ₹2,88,000.',
    (c) =>
      c.N('VIA.VIA_80CCH') > 288000 ||
      (pos(c.N('S.Sal17_1')) && c.N('VIA.VIA_80CCH') > 0.6 * c.N('S.Sal17_1') + VTOL),
  ),
  rule(
    797,
    'A',
    'VIA',
    'Under the new tax regime, deduction under section 80CCD(2) may not exceed fourteen per cent of basic salary and dearness allowance.',
    (c) =>
      isNew(c) &&
      pos(c.N('S.Sal17_1')) &&
      c.N('VIA.VIA_80CCD2') > 0.14 * c.N('S.Sal17_1') + VTOL,
  ),
  rule(
    798,
    'A',
    'VIA',
    'The Permanent Retirement Account Number is compulsory to claim deduction under section 80CCD(1) or 80CCD(1B).',
    (c) =>
      (pos(c.N('VIA.VIA_80CCD1')) || pos(c.N('VIA.VIA_80CCD1B'))) && c.V('VIA.VIA_PRAN') === '',
  ),
  rule(
    828,
    'A',
    'VIA',
    'Deductions under sections 80EEA and 80EE cannot be claimed simultaneously.',
    (c) => isOld(c) && pos(c.N('VIA.VIA_80EEA')) && pos(c.N('VIA.VIA_80EE')),
  ),

  /* ── Block 22 · AMT and AMTC, rules 829–848 ────────────────────────── */
  rule(
    830,
    'A',
    'AMT',
    'Tax payable under section 115JC does not agree with eighteen and one-half per cent of the adjusted total income.',
    (c) =>
      pos(c.N('AMT.AMT_Tax')) &&
      pos(c.N('AMT.AMT_AdjTotal')) &&
      Math.abs(c.N('AMT.AMT_Tax') - 0.185 * c.N('AMT.AMT_AdjTotal')) > 2 &&
      Math.abs(c.N('AMT.AMT_Tax') - 0.09 * c.N('AMT.AMT_AdjTotal')) > 2,
  ),
  rule(831, 'A', 'AMT', 'Total income in Schedule AMT does not agree with item 14 of Part B-TI.', (c) =>
    pos(c.N('AMT.AMT_TotalIncome')) &&
    pos(c.N('BTI.TI_TotalIncome')) &&
    !eq(c.N('AMT.AMT_TotalIncome'), c.N('BTI.TI_TotalIncome')),
  ),
  rule(
    833,
    'A',
    'AMT',
    'The adjustment under section 115JC(2) does not equal the sum of items 2(a), 2(b) and 2(c).',
    (c) =>
      pos(c.N('AMT.AMT_AdjTotal')) &&
      pos(c.N('AMT.AMT_TotalIncome')) &&
      !eq(
        c.N('AMT.AMT_TotalIncome') +
          sum(c.N('AMT.AMT_PartCDed'), c.N('AMT.AMT_10AA'), c.N('AMT.AMT_35AD')),
        c.N('AMT.AMT_AdjTotal'),
      ),
  ),
  rule(
    834,
    'A',
    'AMT',
    'Adjusted total income under section 115JC does not equal total income plus the adjustment.',
    (c) => pos(c.N('AMT.AMT_AdjTotal')) && c.N('AMT.AMT_AdjTotal') < c.N('AMT.AMT_TotalIncome'),
  ),
  rule(
    835,
    'A',
    'AMT',
    'Tax under section 115JC is computed although adjusted total income does not exceed ₹20 lakh or there is no adjustment.',
    (c) =>
      pos(c.N('AMT.AMT_Tax')) &&
      (c.N('AMT.AMT_AdjTotal') <= 2000000 ||
        !pos(sum(c.N('AMT.AMT_PartCDed'), c.N('AMT.AMT_10AA'), c.N('AMT.AMT_35AD')))),
  ),
  rule(836, 'A', 'AMT', 'Schedule AMT must be left blank under the new tax regime.', (c) =>
    isNew(c) && (pos(c.N('AMT.AMT_Tax')) || pos(c.N('AMT.AMT_AdjTotal'))),
  ),
  rule(
    839,
    'A',
    'AMT',
    'Item 2(b) of Schedule AMT does not agree with the total deduction under section 10AA.',
    (c) => pos(c.N('AMT.AMT_10AA')) && !eq(c.N('AMT.AMT_10AA'), c.N('S10AA.Amt10AA')),
  ),
  rule(
    842,
    'A',
    'AMT',
    'The credit available does not equal the excess of tax under other provisions over tax under section 115JC.',
    (c) =>
      pos(c.N('AMT.AMTC_BF')) &&
      pos(c.N('AMT.AMT_Tax')) &&
      pos(c.N('BTTI.TTI_TaxPayable1d')) &&
      c.N('BTTI.TTI_TaxPayable1d') > c.N('AMT.AMT_Tax') &&
      pos(c.N('AMT.AMTC_Utilized')) &&
      c.N('AMT.AMTC_Utilized') > c.N('AMT.AMTC_BF') + VTOL,
  ),
  rule(
    847,
    'A',
    'BTTI',
    'Credit under section 115JD claimed in Part B-TTI does not agree with Schedule AMTC.',
    (c) => pos(c.N('BTTI.TTI_AMTCredit')) && !eq(c.N('BTTI.TTI_AMTCredit'), c.N('AMT.AMTC_Utilized')),
  ),
  rule(848, 'A', 'AMT', 'Schedule AMTC must show no amounts under the new tax regime.', (c) =>
    isNew(c) &&
    pos(sum(c.N('AMT.AMTC_BF'), c.N('AMT.AMTC_Utilized'), c.N('AMT.AMTC_CF'))),
  ),

  /* ── Block 23 · Schedule SI, rules 849–873 ─────────────────────────── */
  rule(
    851,
    'A',
    'SPI',
    'Income under section 115BB in Schedule SI does not agree with item 2(a)(i) of Schedule OS.',
    (c) => pos(c.N('SPI.SI_115BB')) && !eq(c.N('SPI.SI_115BB'), c.N('OS.Lottery2ai')),
  ),
  rule(
    852,
    'A',
    'SPI',
    'Income under section 115BBE in Schedule SI does not agree with item 2(b) of Schedule OS.',
    (c) => pos(c.N('SPI.SI_115BBE')) && !eq(c.N('SPI.SI_115BBE'), c.N('OS.Unexplained2b')),
  ),
  rule(
    860,
    'A',
    'SPI',
    'The total of special-rate income does not equal the sum of the individual line items.',
    (c) =>
      pos(c.N('SPI.SI_Total')) &&
      !eq(
        sum(
          c.N('SPI.SI_111A'),
          c.N('SPI.SI_112A'),
          c.N('SPI.SI_115BB'),
          c.N('SPI.SI_115BBJ'),
          c.N('SPI.SI_115BBE'),
          c.N('SPI.SI_115BBH'),
        ),
        c.N('SPI.SI_Total'),
      ),
  ),
  rule(
    867,
    'A',
    'BTI',
    'Income chargeable at special rates at item 11 of Part B-TI does not agree with the total of Schedule SI.',
    (c) =>
      pos(c.N('BTI.TI_SpecialInGTI')) &&
      pos(c.N('SPI.SI_Total')) &&
      !eq(c.N('BTI.TI_SpecialInGTI'), c.N('SPI.SI_Total')),
  ),
  rule(
    869,
    'A',
    'SPI',
    'Income under section 115BBJ in Schedule SI does not agree with item 2(a)(ii) of Schedule OS.',
    (c) => pos(c.N('SPI.SI_115BBJ')) && !eq(c.N('SPI.SI_115BBJ'), c.N('OS.OnlineGames2aii')),
  ),
  rule(
    1000.2,
    'A',
    'SPI',
    'Income under section 115BBH in Schedule SI does not agree with item C2 of Schedule CG.',
    (c) =>
      pos(c.N('SPI.SI_115BBH')) &&
      pos(c.N('CG.C2_VDA_CG')) &&
      !eq(c.N('SPI.SI_115BBH'), c.N('CG.C2_VDA_CG')),
  ),

  /* ── Block 24 · PTI, TPSA, FSI, TR, FA, 5A, AL, ESOP and IF, rules 874–911 ── */
  rule(
    879,
    'A',
    'TPSA',
    'Additional income-tax payable does not equal eighteen per cent of the primary adjustment.',
    (c) =>
      pos(c.N('TPSA.TPSA_Tax18')) &&
      !eq(Math.round(0.18 * c.N('TPSA.TPSA_Primary')), c.N('TPSA.TPSA_Tax18')),
  ),
  rule(
    880,
    'A',
    'TPSA',
    'Surcharge does not equal twelve per cent of the additional income-tax payable.',
    (c) =>
      pos(c.N('TPSA.TPSA_Surch')) &&
      !eq(Math.round(0.12 * c.N('TPSA.TPSA_Tax18')), c.N('TPSA.TPSA_Surch')),
  ),
  rule(
    881,
    'A',
    'TPSA',
    'Health and education cess does not equal four per cent of the additional tax and surcharge.',
    (c) =>
      pos(c.N('TPSA.TPSA_Cess')) &&
      !eq(
        Math.round(0.04 * (c.N('TPSA.TPSA_Tax18') + c.N('TPSA.TPSA_Surch'))),
        c.N('TPSA.TPSA_Cess'),
      ),
  ),
  rule(
    882,
    'A',
    'TPSA',
    'Total additional tax payable does not equal the additional tax, surcharge and cess.',
    (c) =>
      pos(c.N('TPSA.TPSA_TotalTax')) &&
      !eq(
        sum(c.N('TPSA.TPSA_Tax18'), c.N('TPSA.TPSA_Surch'), c.N('TPSA.TPSA_Cess')),
        c.N('TPSA.TPSA_TotalTax'),
      ),
  ),
  rule(
    884,
    'A',
    'TPSA',
    'Net tax payable does not equal the total additional tax payable less taxes paid.',
    (c) =>
      pos(c.N('TPSA.TPSA_Net')) &&
      !eq(c.N('TPSA.TPSA_TotalTax') - c.N('TPSA.TPSA_Paid'), c.N('TPSA.TPSA_Net')),
  ),
  rule(
    885,
    'A',
    'TPSA',
    'The option under sub-section (2A) of section 92CE is answered Yes, so Schedule TPSA must be completed.',
    (c) => c.V('OI.Sec92CE2A') === 'Yes' && !pos(c.N('TPSA.TPSA_Primary')),
  ),
  rule(
    887,
    'A',
    'FSI',
    'Relief available must be the lower of the tax paid outside India and the tax payable in India.',
    (c) =>
      c
        .rows('FSIRows')
        .some(
          (r) =>
            num(r, 'ReliefE') > Math.min(num(r, 'TaxPaidFrgn'), num(r, 'TaxPayableIN')) + VTOL,
        ),
  ),
  rule(
    888,
    'A',
    'FSI',
    'Schedule FSI is not applicable where the residential status is non-resident.',
    (c) => c.isNRI && c.rows('FSIRows').length > 0,
  ),
  rule(
    890,
    'A',
    'FSI',
    'Relief is claimed against salary income exceeding the gross salary declared in Schedule S.',
    (c) =>
      c
        .rows('FSIRows')
        .some(
          (r) =>
            str(r, 'Head').toLowerCase().includes('salar') &&
            num(r, 'IncomeFrgn') > c.N('S.GrossSalary'),
        ),
  ),
  rule(
    898,
    'A',
    'FSI',
    'Schedule TR is not applicable where the residential status is non-resident.',
    (c) => c.isNRI && c.rows('FSIRows').some((r) => str(r, 'Section') !== ''),
  ),
  rule(
    901,
    'A',
    'FA',
    'Foreign assets or income are declared at item 14 of Part B-TTI, so Schedule FA must be completed.',
    (c) => c.V('BTTI.TTI_FAFlag') === 'Yes' && c.rows('FARows').length === 0,
  ),
  rule(902, 'A', 'FA', 'Complete particulars of the foreign asset must be furnished.', (c) =>
    c
      .rows('FARows')
      .some(
        (r) =>
          str(r, 'Country') === '' || str(r, 'Institution') === '' || str(r, 'AccountNo') === '',
      ),
  ),
  rule(
    903,
    'A',
    'S5A',
    'Where the assessee is governed by the Portuguese Civil Code, the Permanent Account Number of the spouse must be furnished.',
    (c) =>
      c.V('GEN.PortugueseCC') === 'Yes' &&
      c.V('S5A.SpousePAN5A') === '' &&
      c.V('GEN.SpousePAN') === '',
  ),
  rule(
    904,
    'A',
    'S5A',
    'The total in Schedule 5A does not equal the sum of the head-wise apportionments.',
    (c) =>
      pos(c.N('S5A.Tot5A')) &&
      !eq(
        sum(c.N('S5A.HP5A'), c.N('S5A.BP5A'), c.N('S5A.CG5A'), c.N('S5A.OS5A')),
        c.N('S5A.Tot5A'),
      ),
  ),
  rule(905, 'A', 'AL', 'Total income exceeds ₹1 crore, so Schedule AL must be completed.', (c) =>
    c.N('BTI.TI_TotalIncome') > 10000000 &&
    !pos(
      sum(
        c.N('AL.AL_Immovable'),
        c.N('AL.AL_Bank'),
        c.N('AL.AL_Cash'),
        c.N('AL.AL_Shares'),
        c.N('AL.AL_Jewellery'),
      ),
    ),
  ),
  rule(
    906,
    'A',
    'ESOP',
    'The balance amount of tax deferred to be carried forward does not equal the amount brought forward less the amount payable in the current year.',
    (c) =>
      pos(c.N('ESOP.ESOP_TaxCF')) &&
      !eq(
        c.N('ESOP.ESOP_TaxDeferredBF') - c.N('ESOP.ESOP_TaxPayableCY'),
        c.N('ESOP.ESOP_TaxCF'),
      ),
  ),
  rule(
    908,
    'A',
    'ESOP',
    'Where the securities have not been sold and employment has not ceased, the tax payable in the current year must be nil.',
    (c) => c.V('ESOP.ESOP_Sold') === 'Not sold' && pos(c.N('ESOP.ESOP_TaxPayableCY')),
  ),
  rule(
    910,
    'A',
    'SPI',
    'The total share in the profit does not agree with the sum of the firm-wise amounts.',
    (c) =>
      pos(c.N('BP.A5a_FirmShare')) &&
      c.rows('IFRows').length > 0 &&
      c.N('BP.A5a_FirmShare') >
        c.rows('IFRows').reduce((a, r) => a + num(r, 'ShareAmt'), 0) + VTOL,
  ),
  rule(
    911,
    'A',
    'BP',
    'The share of income from firms at item A5(a) exceeds the amount shown in Schedule IF.',
    (c) =>
      pos(c.N('BP.A5a_FirmShare')) &&
      c.rows('IFRows').length > 0 &&
      c.N('BP.A5a_FirmShare') >
        c.rows('IFRows').reduce((a, r) => a + num(r, 'ShareAmt'), 0) + VTOL,
  ),
  /* ── Block 25 · Part B-TI, rules 912–959 ───────────────────────────── */
  rule(913, 'A', 'BTI', 'Tax is computed, so gross total income must be disclosed.', (c) =>
    pos(c.N('BTTI.TTI_GrossLiab')) && !pos(c.N('BTI.TI_GTI')),
  ),
  rule(
    914,
    'A',
    'BTI',
    'Total profits and gains from business or profession do not agree with Schedule BP.',
    (c) =>
      pos(c.N('BTI.TI_PGBP')) &&
      pos(c.N('BP.D_TotalPGBP')) &&
      !eq(c.N('BTI.TI_PGBP'), c.N('BP.D_TotalPGBP')),
  ),
  rule(
    917,
    'A',
    'BTI',
    'Total capital gains do not equal the sum of short-term and long-term capital gains.',
    (c) => pos(c.N('BTI.TI_CG')) && !eq(c.N('BTI.TI_STCG') + c.N('BTI.TI_LTCG'), c.N('BTI.TI_CG')),
  ),
  rule(
    919,
    'A',
    'BTI',
    'The total of head-wise income at item 6 does not equal the sum of the heads.',
    (c) =>
      pos(c.N('BTI.TI_Total6')) &&
      !eq(
        sum(
          c.N('BTI.TI_Salary'),
          c.N('BTI.TI_HP'),
          c.N('BTI.TI_PGBP'),
          c.N('BTI.TI_CG'),
          c.N('BTI.TI_OS'),
        ),
        c.N('BTI.TI_Total6'),
      ),
  ),
  rule(920, 'A', 'BTI', 'Income under the head Salaries does not agree with Schedule S.', (c) =>
    pos(c.N('BTI.TI_Salary')) &&
    pos(c.N('S.IncomeSalaries')) &&
    !eq(c.N('BTI.TI_Salary'), c.N('S.IncomeSalaries')),
  ),
  rule(
    921,
    'A',
    'BTI',
    'Income under the head House Property does not agree with Schedule HP.',
    (c) =>
      (pos(c.N('BTI.TI_HP')) || pos(c.N('HP.TotalHP'))) && !eq(c.N('BTI.TI_HP'), c.N('HP.TotalHP')),
  ),
  rule(
    922,
    'A',
    'BTI',
    'Income under the head Profits and gains from business or profession does not agree with Schedule BP.',
    (c) =>
      pos(c.N('BTI.TI_PGBP')) &&
      pos(c.N('BP.D_TotalPGBP')) &&
      !eq(c.N('BTI.TI_PGBP'), c.N('BP.D_TotalPGBP')),
  ),
  rule(927, 'A', 'BTI', 'Income from other sources does not agree with Schedule OS.', (c) =>
    pos(c.N('BTI.TI_OS')) && pos(c.N('OS.Total9')) && !eq(c.N('BTI.TI_OS'), c.N('OS.Total9')),
  ),
  rule(
    930,
    'A',
    'BTI',
    'Losses of the current year set off do not agree with the total losses set off in Schedule CYLA.',
    (c) =>
      pos(c.N('BTI.TI_CYLA')) &&
      pos(c.N('CYLA.CYLA_TotalSetoff')) &&
      !eq(c.N('BTI.TI_CYLA'), c.N('CYLA.CYLA_TotalSetoff')),
  ),
  rule(931, 'A', 'BTI', 'Brought forward losses set off do not agree with Schedule BFLA.', (c) =>
    pos(c.N('BTI.TI_BFLA')) &&
    !eq(c.N('BTI.TI_BFLA'), c.N('CYLA.BFLA_BFLoss') + c.N('CYLA.BFLA_UnabsDep')),
  ),
  rule(
    932,
    'A',
    'BTI',
    'Gross total income does not equal the balance after set-off less brought forward losses.',
    (c) =>
      pos(c.N('BTI.TI_GTI')) &&
      !eq(c.N('BTI.TI_Total6') - c.N('BTI.TI_CYLA') - c.N('BTI.TI_BFLA'), c.N('BTI.TI_GTI')),
  ),
  rule(
    933,
    'A',
    'S10AA',
    'Deduction under section 10AA is claimed in Part B-TI, so Schedule 10AA must be completed.',
    (c) => pos(c.N('BTI.TI_10AA')) && !pos(c.N('S10AA.Amt10AA')),
  ),
  rule(
    934,
    'A',
    'BTI',
    'Losses of the current year to be carried forward do not agree with Schedule CFL.',
    (c) =>
      pos(c.N('BTI.TI_CFLosses')) &&
      c.rows('CFLRows').length > 0 &&
      c.N('BTI.TI_CFLosses') >
        c
          .rows('CFLRows')
          .reduce(
            (a, r) =>
              a +
              sum(
                num(r, 'HPLoss'),
                num(r, 'BPLoss'),
                num(r, 'SpecLoss'),
                num(r, 'SpecifiedLoss'),
                num(r, 'STCL'),
                num(r, 'LTCL'),
                num(r, 'RaceLoss'),
              ),
            0,
          ) +
          VTOL,
  ),
  rule(
    935,
    'A',
    'BTI',
    'Total income does not equal gross total income less deductions under Chapter VI-A and section 10AA.',
    (c) =>
      pos(c.N('BTI.TI_TotalIncome')) &&
      Math.abs(
        c.N('BTI.TI_GTI') -
          c.N('BTI.TI_VIA_a') -
          c.N('BTI.TI_VIA_b') -
          c.N('BTI.TI_10AA') -
          c.N('BTI.TI_TotalIncome'),
      ) > 5,
  ),
  rule(
    937,
    'A',
    'BTI',
    'Deductions are claimed at item 12(a), so Parts B, CA and D of Chapter VI-A must be completed.',
    (c) => pos(c.N('BTI.TI_VIA_a')) && !pos(c.N('VIA.VIA_PartB')),
  ),
  rule(
    938,
    'A',
    'BTI',
    'Deductions are claimed at item 12(b), so Part C of Chapter VI-A must be completed.',
    (c) => pos(c.N('BTI.TI_VIA_b')) && !pos(c.N('VIA.VIA_PartC')),
  ),
  rule(
    940,
    'A',
    'BTI',
    'Net agricultural income for rate purposes does not agree with item 2 of Schedule EI.',
    (c) => pos(c.N('BTI.TI_NetAgri')) && !eq(c.N('BTI.TI_NetAgri'), c.N('EI.EI_AgriNet')),
  ),
  rule(
    941,
    'A',
    'BTI',
    'Income chargeable at special rates at item 10 is not consistent with the total of Schedule SI.',
    (c) =>
      pos(c.N('BTI.TI_SpecialIncome')) &&
      pos(c.N('SPI.SI_Total')) &&
      !eq(c.N('BTI.TI_SpecialIncome'), c.N('SPI.SI_Total')),
  ),
  rule(942, 'A', 'BTI', 'The deduction at item 12(a) does not agree with Schedule VI-A.', (c) =>
    pos(c.N('BTI.TI_VIA_a')) && !eq(c.N('BTI.TI_VIA_a'), c.N('VIA.VIA_PartB')),
  ),
  rule(
    943,
    'A',
    'BTI',
    'The deduction at item 12(b) does not agree with Part C of Schedule VI-A.',
    (c) => pos(c.N('BTI.TI_VIA_b')) && !eq(c.N('BTI.TI_VIA_b'), c.N('VIA.VIA_PartC')),
  ),
  rule(
    946,
    'A',
    'BTI',
    'Aggregate income at item 17 does not equal total income less special-rate income plus net agricultural income.',
    (c) =>
      pos(c.N('BTI.TI_AggIncome')) &&
      !eq(
        c.N('BTI.TI_TotalIncome') - c.N('BTI.TI_SpecialIncome') + c.N('BTI.TI_NetAgri'),
        c.N('BTI.TI_AggIncome'),
      ),
  ),
  rule(
    947,
    'A',
    'BTI',
    'Income chargeable at special rates is shown, so the particulars must appear in Schedule CG, Schedule OS and Schedule SI.',
    (c) =>
      pos(c.N('BTI.TI_SpecialIncome')) &&
      !pos(c.N('SPI.SI_Total')) &&
      !pos(c.N('CG.C3_Total')) &&
      !pos(c.N('OS.Total9')),
  ),
  rule(
    955,
    'A',
    'BTI',
    'Capital gain chargeable at thirty per cent under section 115BBH does not agree with item C2 of Schedule CG.',
    (c) =>
      pos(c.N('SPI.SI_115BBH')) &&
      pos(c.N('CG.C2_VDA_CG')) &&
      !eq(c.N('SPI.SI_115BBH'), c.N('CG.C2_VDA_CG')),
  ),
  rule(956, 'A', 'BTI', 'Total capital gains do not agree with Schedule CG.', (c) =>
    pos(c.N('BTI.TI_CG')) && pos(c.N('CG.C3_Total')) && !eq(c.N('BTI.TI_CG'), c.N('CG.C3_Total')),
  ),
  rule(957, 'A', 'BTTI', 'Rebate under section 87A may not exceed ₹12,500 under the old regime.', (c) =>
    isOld(c) && c.N('BTTI.TTI_Rebate87A') > 12500,
  ),
  rule(
    978,
    'A',
    'BTI',
    'Deemed income under section 115JC does not agree with item 3 of Schedule AMT.',
    (c) => pos(c.N('BTI.TI_DeemedAMT')) && !eq(c.N('BTI.TI_DeemedAMT'), c.N('AMT.AMT_AdjTotal')),
  ),

  /* ── Block 26 · Part B-TTI, rules 960–991 ──────────────────────────── */
  rule(
    960,
    'A',
    'BTTI',
    'Tax payable on the deemed total income under section 115JC does not agree with Schedule AMT.',
    (c) =>
      pos(c.N('BTTI.TTI_TaxAMT')) &&
      pos(c.N('AMT.AMT_Tax')) &&
      c.N('BTTI.TTI_TaxAMT') < c.N('AMT.AMT_Tax') - VTOL,
  ),
  rule(
    961,
    'A',
    'BTTI',
    'Tax payments claimed do not agree with the claims made in Schedules TDS, TCS and IT.',
    (c) => {
      const claimed =
        c.rows('TDS1Rows').reduce((a, r) => a + num(r, 'TaxDeducted'), 0) +
        c.rows('TDS2Rows').reduce((a, r) => a + num(r, 'TDSClaimed'), 0) +
        c.rows('TDS3Rows').reduce((a, r) => a + num(r, 'TDSClm3'), 0) +
        c.rows('TCSRows').reduce((a, r) => a + num(r, 'TCSClaimed'), 0) +
        c.rows('ITRows').reduce((a, r) => a + num(r, 'TaxAmt'), 0);
      return pos(c.N('BTTI.TTI_TotalPaid')) && pos(claimed) && !eq(c.N('BTTI.TTI_TotalPaid'), claimed);
    },
  ),
  rule(
    963,
    'A',
    'BTTI',
    'Tax payable on total income does not equal normal tax plus special tax less the rebate on agricultural income.',
    (c) =>
      pos(c.N('BTTI.TTI_TaxPayable1d')) &&
      !eq(
        c.N('BTTI.TTI_TaxNormal') + c.N('BTTI.TTI_TaxSpecial') - c.N('BTTI.TTI_AgriRebate'),
        c.N('BTTI.TTI_TaxPayable1d'),
      ),
  ),
  rule(
    965,
    'A',
    'BTTI',
    'Gross tax liability does not equal tax payable plus surcharge and cess.',
    (c) =>
      pos(c.N('BTTI.TTI_GrossLiab')) &&
      !eq(
        sum(
          c.N('BTTI.TTI_GrossTax') - c.N('BTTI.TTI_Rebate87A'),
          c.N('BTTI.TTI_Surcharge'),
          c.N('BTTI.TTI_Cess'),
        ),
        c.N('BTTI.TTI_GrossLiab'),
      ),
  ),
  rule(
    968,
    'A',
    'BTTI',
    'Total tax relief does not equal the sum of the reliefs under sections 89, 90 or 90A and 91.',
    (c) =>
      (pos(c.N('BTTI.TTI_Relief89')) ||
        pos(c.N('BTTI.TTI_Relief90')) ||
        pos(c.N('BTTI.TTI_Relief91'))) &&
      pos(c.N('BTTI.TTI_NetLiab')) &&
      pos(c.N('BTTI.TTI_GrossLiab')) &&
      !eq(
        c.N('BTTI.TTI_GrossLiab') -
          sum(c.N('BTTI.TTI_Relief89'), c.N('BTTI.TTI_Relief90'), c.N('BTTI.TTI_Relief91')),
        c.N('BTTI.TTI_NetLiab'),
      ),
  ),
  rule(
    969,
    'A',
    'BTTI',
    'Total interest and fee payable does not equal the sum of the amounts under sections 234A, 234B, 234C, 234F and 234-I.',
    (c) => {
      const interest = sum(
        c.N('BTTI.TTI_234A'),
        c.N('BTTI.TTI_234B'),
        c.N('BTTI.TTI_234C'),
        c.N('BTTI.TTI_234F'),
        c.N('BTTI.TTI_234I'),
      );
      return (
        pos(c.N('BTTI.TTI_AggLiab')) &&
        pos(c.N('BTTI.TTI_NetLiab')) &&
        !eq(c.N('BTTI.TTI_NetLiab') + interest, c.N('BTTI.TTI_AggLiab'))
      );
    },
  ),
  rule(
    970,
    'A',
    'BTTI',
    'Aggregate liability does not equal net tax liability plus total interest and fee payable.',
    (c) =>
      pos(c.N('BTTI.TTI_AggLiab')) &&
      pos(c.N('BTTI.TTI_NetLiab')) &&
      c.N('BTTI.TTI_AggLiab') < c.N('BTTI.TTI_NetLiab') - VTOL,
  ),
  rule(972, 'A', 'BTTI', 'The Indian Financial System Code is not in a valid format.', (c) => {
    const bad = c
      .rows('BankRows')
      .filter((r) => str(r, 'IFSC') !== '' && !RX.ifsc.test(str(r, 'IFSC').toUpperCase()));
    return bad.length ? ` Code: ${bad.map((r) => str(r, 'IFSC')).join(', ')}.` : false;
  }),
  rule(
    973,
    'A',
    'BTTI',
    'Rebate under section 87A is available only to a resident or a resident but not ordinarily resident.',
    (c) => pos(c.N('BTTI.TTI_Rebate87A')) && c.isNRI,
  ),
  rule(974, 'A', 'BTTI', 'Rebate under section 87A is available only to an individual.', (c) =>
    pos(c.N('BTTI.TTI_Rebate87A')) && !c.isIndividual,
  ),
  rule(
    975,
    'A',
    'BTTI',
    'Rebate under section 87A cannot be claimed where total income exceeds ₹5 lakh under the old regime.',
    (c) =>
      isOld(c) &&
      pos(c.N('BTTI.TTI_Rebate87A')) &&
      c.N('BTTI.TTI_TaxPayable1d') > 0 &&
      c.N('BTI.TI_TotalIncome') > 500000,
  ),
  rule(
    976,
    'A',
    'BTTI',
    'The refund claimed does not equal total taxes paid less the aggregate liability.',
    (c) => {
      if (!pos(c.N('BTTI.TTI_TotalPaid')) || !pos(c.N('BTTI.TTI_AggLiab'))) return false;
      const d = c.N('BTTI.TTI_TotalPaid') - c.N('BTTI.TTI_AggLiab');
      return d > 0 && !eq(c.N('BTTI.TTI_Refund'), d);
    },
  ),
  rule(
    977,
    'A',
    'BTTI',
    'The amount payable does not equal the aggregate liability less total taxes paid.',
    (c) => {
      if (!pos(c.N('BTTI.TTI_TotalPaid')) || !pos(c.N('BTTI.TTI_AggLiab'))) return false;
      const d = c.N('BTTI.TTI_AggLiab') - c.N('BTTI.TTI_TotalPaid');
      return d > 0 && !eq(c.N('BTTI.TTI_Payable'), d);
    },
  ),
  rule(
    979,
    'A',
    'BTTI',
    'Gross tax payable must be the higher of the tax on total income and the tax on the deemed total income.',
    (c) =>
      pos(c.N('BTTI.TTI_GrossTax')) &&
      c.N('BTTI.TTI_GrossTax') <
        Math.max(c.N('BTTI.TTI_TaxPayable1d'), c.N('BTTI.TTI_TaxAMT')) - VTOL,
  ),
  rule(
    983,
    'A',
    'BTTI',
    'Tax on the deemed total income under section 115JC must be nil under the new tax regime.',
    (c) => isNew(c) && pos(c.N('BTTI.TTI_TaxAMT')),
  ),
  rule(
    988,
    'A',
    'BTTI',
    'Rebate under section 87A cannot be claimed where total income exceeds ₹12,00,000.',
    (c) => pos(c.N('BTTI.TTI_Rebate87A')) && c.N('BTI.TI_TotalIncome') > 1200000,
  ),
  rule(
    990,
    'A',
    'BTTI',
    'The fee under section 234-I for a revised return filed after 31 December 2026 must be ₹1,000 where total income does not exceed ₹5 lakh.',
    (c) =>
      filedUnder(c, '139(5)') &&
      asOn(c) > '2026-12-31' &&
      c.N('BTI.TI_TotalIncome') <= 500000 &&
      pos(c.N('BTTI.TTI_234I')) &&
      c.N('BTTI.TTI_234I') !== 1000,
  ),
  rule(
    991,
    'A',
    'BTTI',
    'The fee under section 234-I for a revised return filed after 31 December 2026 must be ₹5,000 where total income exceeds ₹5 lakh.',
    (c) =>
      filedUnder(c, '139(5)') &&
      asOn(c) > '2026-12-31' &&
      c.N('BTI.TI_TotalIncome') > 500000 &&
      pos(c.N('BTTI.TTI_234I')) &&
      c.N('BTTI.TTI_234I') !== 5000,
  ),
  rule(
    1000.3,
    'A',
    'BTTI',
    'Particulars of at least one bank account held in India must be furnished.',
    (c) => c.rows('BankRows').length === 0,
  ),

  /* ── Block 27 · Schedule EI, rules 992–1001 ────────────────────────── */
  rule(993, 'A', 'EI', 'Total exempt income does not equal the sum of the individual amounts.', (c) =>
    pos(c.N('EI.EI_Total')) &&
    !eq(
      sum(
        c.N('EI.EI_Interest'),
        c.N('EI.EI_AgriNet'),
        c.N('EI.EI_Other'),
        c.N('EI.EI_DTAA'),
        c.N('EI.EI_PTI'),
        c.N('EI.EI_FirmShare'),
      ),
      c.N('EI.EI_Total'),
    ),
  ),
  rule(
    994,
    'A',
    'EI',
    'Net agricultural income does not equal gross receipts less expenditure and unabsorbed loss, plus the amount relating to the specified rules.',
    (c) =>
      pos(c.N('EI.EI_AgriNet')) &&
      !eq(
        c.N('EI.EI_AgriGross') -
          c.N('EI.EI_AgriExp') -
          c.N('EI.EI_AgriLossBF') +
          c.N('EI.EI_AgriRule'),
        c.N('EI.EI_AgriNet'),
      ),
  ),
  rule(
    995,
    'A',
    'EI',
    'The agricultural income relating to Rules 7, 7A, 7B and 8 does not agree with item A38 of Schedule BP.',
    (c) => pos(c.N('EI.EI_AgriRule')) && !eq(c.N('EI.EI_AgriRule'), c.N('BP.A38_AgriDeemed')),
  ),
  rule(
    996,
    'A',
    'EI',
    'Net agricultural income exceeds ₹5 lakh, so particulars of each agricultural land must be furnished.',
    (c) => c.N('EI.EI_AgriNet') > 500000 && c.V('EI.EI_AgriLandDetail') === '',
  ),
  rule(1000, 'A', 'EI', 'The exempt income sections listed cannot be reported by a resident.', (c) =>
    isRES(c) && pos(c.N('EI.EI_DTAA')) && !isNOR(c),
  ),

  /* ── Block 28 · TDS, TCS and IT, rules 1002–1029 ───────────────────── */
  rule(
    1002,
    'A',
    'TDS2',
    'Where credit brought forward is claimed, the year of deduction must be stated.',
    (c) =>
      c
        .rows('TDS2Rows')
        .some((r) => num(r, 'TDSClaimed') > num(r, 'TDSDeducted') && str(r, 'BFFlag') === ''),
  ),
  rule(
    1003,
    'A',
    'TDS1',
    'The total tax deducted does not equal the sum of the individual amounts.',
    (c) =>
      c.rows('TDS1Rows').length > 0 &&
      pos(c.N('BTTI.TTI_TotalPaid')) &&
      c.rows('TDS1Rows').some((r) => num(r, 'TaxDeducted') < 0),
  ),
  rule(1007, 'A', 'TDS2', 'Credit claimed exceeds the gross income disclosed.', (c) =>
    c.rows('TDS2Rows').some((r) => num(r, 'GrossAmt') > 0 && num(r, 'TDSClaimed') > num(r, 'GrossAmt')),
  ),
  rule(
    1009,
    'A',
    'TDS2',
    'Where credit is claimed, the corresponding gross amount and the head of income are compulsory.',
    (c) =>
      c
        .rows('TDS2Rows')
        .some((r) => num(r, 'TDSClaimed') > 0 && (num(r, 'GrossAmt') === 0 || str(r, 'HeadIncome') === '')),
  ),
  rule(1011, 'A', 'TDS2', 'Credit claimed exceeds the tax deducted.', (c) => {
    const bad = c.rows('TDS2Rows').filter((r) => num(r, 'TDSClaimed') > num(r, 'TDSDeducted'));
    return bad.length
      ? ` Deductor: ${bad.map((r) => str(r, 'DeductorName') || str(r, 'TAN2') || '(unnamed)').join(', ')}.`
      : false;
  }),
  rule(1012, 'A', 'TDS3', 'Credit claimed exceeds the tax deducted.', (c) =>
    c.rows('TDS3Rows').some((r) => num(r, 'TDSClm3') > num(r, 'TDSDed3')),
  ),
  rule(
    1013,
    'A',
    'TDS1',
    'Schedule TDS-1 is not applicable where the status is Hindu Undivided Family.',
    (c) => c.isHUF && c.rows('TDS1Rows').length > 0,
  ),
  rule(
    1014,
    'A',
    'S',
    'Schedule Salary is not applicable where the status is Hindu Undivided Family.',
    (c) => c.isHUF && pos(c.N('S.GrossSalary')),
  ),
  rule(
    1016,
    'A',
    'TDS2',
    'The Tax Deduction Account Number of the deductor, or the Permanent Account Number of the tenant or buyer, must be furnished.',
    (c) => c.rows('TDS2Rows').some((r) => num(r, 'TDSClaimed') > 0 && str(r, 'TAN2') === ''),
  ),
  rule(
    1017,
    'A',
    'TDS1',
    'Total tax deducted cannot exceed income chargeable under the head Salary.',
    (c) =>
      c.rows('TDS1Rows').some((r) => num(r, 'IncomeSal') > 0 && num(r, 'TaxDeducted') > num(r, 'IncomeSal')),
  ),
  rule(
    1018,
    'A',
    'S',
    'Tax has been deducted in Schedule TDS-1, so total gross salary must exceed nil.',
    (c) =>
      c.rows('TDS1Rows').reduce((a, r) => a + num(r, 'TaxDeducted'), 0) > 0 &&
      !pos(c.N('S.GrossSalary')),
  ),
  rule(
    1019,
    'A',
    'S',
    'Total gross salary must exceed the tax deducted shown in Schedule TDS-1.',
    (c) => {
      const deducted = c.rows('TDS1Rows').reduce((a, r) => a + num(r, 'TaxDeducted'), 0);
      return deducted > 0 && pos(c.N('S.GrossSalary')) && c.N('S.GrossSalary') < deducted;
    },
  ),
  rule(1022, 'A', 'TCS', 'The amount of credit claimed exceeds the tax collected.', (c) => {
    const bad = c.rows('TCSRows').filter((r) => num(r, 'TCSClaimed') > num(r, 'TCSCollected'));
    return bad.length
      ? ` Collector: ${bad
          .map((r) => str(r, 'CollectorName') || str(r, 'CollectorTAN') || '(unnamed)')
          .join(', ')}.`
      : false;
  }),
  rule(
    1028,
    'A',
    'TCS',
    'The Tax Deduction and Collection Account Number of the collector must be furnished.',
    (c) => c.rows('TCSRows').some((r) => num(r, 'TCSClaimed') > 0 && str(r, 'CollectorTAN') === ''),
  ),
  rule(
    1029,
    'A',
    'TCS',
    'Credit carried forward does not equal the amount brought forward plus the amount collected less the amount claimed.',
    (c) =>
      c
        .rows('TCSRows')
        .some(
          (r) =>
            num(r, 'TCSCF') > 0 &&
            !eq(num(r, 'TCSCollected') - num(r, 'TCSClaimed'), num(r, 'TCSCF')),
        ),
  ),

  /* ── Block 29 · Category B and Category D subset ───────────────────── */
  rule(
    2,
    'B',
    'BTI',
    'Current year losses other than house property loss and specified business loss cannot be carried forward in a belated return.',
    (c) => filedUnder(c, '139(4)') && pos(c.N('BTI.TI_CFLosses')),
  ),
  rule(
    3,
    'B',
    'BS',
    'Income from business or profession exceeds ₹2,50,000, so the balance sheet must be completed.',
    (c) => c.N('BP.D_TotalPGBP') > 250000 && !pos(c.N('BS.SourcesTotal')),
  ),
  rule(
    4,
    'B',
    'BS',
    'The assessee is liable to audit under section 92E, so the balance sheet and the profit and loss account must be completed.',
    (c) => c.V('GEN.Liable92E') === 'Yes' && !pos(c.N('BS.SourcesTotal')),
  ),
  rule(
    6,
    'B',
    'TRD',
    'Turnover exceeds ₹10 crore or receipts from a profession exceed the prescribed limit, so the accounts must be audited under section 44AB.',
    (c) =>
      (c.N('TRD.TotRevenueOps') > 100000000 || c.N('PL.GR44ADA') > 7500000) && !audited(c),
  ),
  rule(
    7,
    'B',
    'PL',
    'Income is claimed at less than eight per cent of gross turnover, so the liability to audit under section 44AB or 44AD(5) must be examined.',
    (c) =>
      pos(turnover44AD(c)) &&
      c.N('PL.PI44ADBank') + c.N('PL.PI44ADCash') < 0.08 * turnover44AD(c) &&
      !audited(c),
  ),
  rule(
    8,
    'B',
    'PL',
    'Turnover from a profession is below the prescribed limit and profit offered is below fifty per cent, so audit particulars under section 44AB are compulsory.',
    (c) =>
      pos(c.N('PL.GR44ADA')) &&
      c.N('PL.GR44ADA') <= 7500000 &&
      c.N('PL.PI44ADA') < 0.5 * c.N('PL.GR44ADA') &&
      !audited(c),
  ),
  rule(
    21,
    'B',
    'OS',
    'The dividend income in Schedule OS exceeds the dividend income reduced in Schedule BP.',
    (c) =>
      pos(c.N('BP.A5c_DividendRed')) &&
      pos(c.N('OS.Dividend1a')) &&
      c.N('OS.Dividend1a') >
        c.N('BP.A5c_DividendRed') + c.N('PL.DividendInc14iii') + VTOL,
  ),
  rule(
    23,
    'B',
    'GEN',
    'The Aadhaar number should be quoted as required by section 139AA.',
    (c) =>
      c.V('GEN.AadhaarCardNo') === '' && c.V('GEN.AadhaarEnrolmentId') === '' && c.isIndividual,
  ),
  rule(
    25,
    'B',
    'VIA',
    'Deduction under section 80GG is limited to ₹5,000 for each month of the period of stay for which rent was actually paid.',
    (c) => c.N('VIA.VIA_80GG') > 60000,
  ),
  rule(
    34,
    'B',
    'BTI',
    'Current year losses must be nil where the return is filed under section 139(4).',
    (c) => filedUnder(c, '139(4)') && pos(c.N('BTI.TI_CFLosses')),
  ),
  rule(
    39,
    'B',
    'SPI',
    'The total interest due or received in Schedule IF does not agree with item 14(xi)(b) of the profit and loss account.',
    (c) =>
      c.rows('IFRows').length > 0 &&
      pos(c.N('PL.OtherIncTotal')) &&
      c.rows('IFRows').reduce((a, r) => a + num(r, 'InterestRecd'), 0) >
        c.N('PL.OtherIncTotal') + VTOL,
  ),
  rule(
    2,
    'D',
    'BTTI',
    'Surcharge cannot be entered where total income under section 115JC does not exceed ₹50,00,000.',
    (c) =>
      pos(c.N('BTTI.TTI_Surcharge')) &&
      pos(c.N('AMT.AMT_AdjTotal')) &&
      c.N('AMT.AMT_AdjTotal') <= 5000000 &&
      !pos(c.N('BTI.TI_TotalIncome')),
  ),
  rule(
    4,
    'D',
    'VIA',
    'A deduction under Part C of Chapter VI-A is allowed only where the return is filed on or before the due date specified in section 139(1).',
    (c) => pos(c.N('VIA.VIA_PartC')) && filedUnder(c, '139(4)'),
  ),
  rule(
    7,
    'D',
    'S10AA',
    'Deduction under section 10AA is allowed only where the return is filed within the due date allowed under section 139(1).',
    (c) => pos(c.N('S10AA.Amt10AA')) && filedUnder(c, '139(4)'),
  ),
  rule(8, 'D', 'PL', 'The tonnage of a goods carriage cannot exceed 100 metric tonnes.', (c) => {
    const bad = c.rows('Goods44AE').filter((r) => num(r, 'Tonnage') > 100);
    return bad.length
      ? ` Carriage: ${bad.map((r) => str(r, 'RegNo') || '(unnumbered)').join(', ')}.`
      : false;
  }),
  rule(
    9,
    'D',
    'BS',
    'Where there is income under the head Profits and gains of business or profession, the balance sheet and the profit and loss account must be completed as required by section 139(9).',
    (c) =>
      pos(c.N('BP.D_TotalPGBP')) &&
      !pos(c.N('BS.SourcesTotal')) &&
      !pos(c.N('BS.NoAccCashBal')) &&
      !pos(turnover44AD(c)) &&
      !pos(c.N('PL.GR44ADA')),
  ),
  rule(
    15,
    'D',
    'GEN',
    'Total sales, turnover or gross receipts exceed ₹50 crore, so the prescribed payment modes under section 269SU must be reported in the compliance module of the portal.',
    (c) => c.N('TRD.TotRevenueOps') + turnover44AD(c) > 500000000,
  ),
  rule(
    16,
    'D',
    'BP',
    'An amount may be reduced at item A4(b) only where the business code is 1001, 1002 or 1003.',
    (c) =>
      pos(c.N('BP.A4b_Rule7')) &&
      !c.rows('NOBRows').some((r) => ['1001', '1002', '1003'].includes(str(r, 'Code'))),
  ),
  rule(17, 'D', 'GEN', 'For a resident taxpayer, relief at treaty rates is not available.', (c) =>
    isRES(c) &&
    pos(sum(c.N('CG.LTCG_B11_DTAA'), c.N('CG.STCG_A8_DTAA'), c.N('OS.DTAA2f'))),
  ),
];

/* ─────────────────────────── Not checkable here ─────────────────────────── */

/**
 * Published rules that need a departmental database, a separately filed form,
 * or particulars this return aggregates into a single control. They are
 * reported alongside the findings so nothing is passed over in silence.
 */
export const ITR3_UNCHECKABLE: { rules: string; reason: string }[] = [
  {
    rules: 'A 3, 4, 31, 32',
    reason:
      'Name, date of birth and Aadhaar must match the Permanent Account Number database and the e-Filing profile. Requires a departmental lookup.',
  },
  {
    rules: 'A 6, 11',
    reason:
      'Whether unlisted equity shares were held, or a directorship was held, is a Yes/No question in Part A General. The particulars tables exist but there is no answer control, so the flag is derived from whether any row is present. Add the control to make the check independent.',
  },
  {
    rules: 'A 8',
    reason:
      'The Permanent Account Number in the verification must match the account uploading the return. Known only at upload.',
  },
  {
    rules: 'A 18',
    reason:
      'Validity of a Tax Deduction Account Number. Format is checked here; existence requires the TRACES database.',
  },
  {
    rules: 'A 19',
    reason:
      'Whether a proceeding has been initiated under section 148, 153A or 153C. Departmental record.',
  },
  {
    rules: 'A 35, 36',
    reason:
      'Consistency of the tax regime with the return to which the defective notice relates, and with the original return. Requires the prior return.',
  },
  {
    rules: 'A 41 to 43',
    reason:
      'Whether Form 10-IEA was filed within the due date for an earlier year. Requires the filed-forms database.',
  },
  {
    rules: 'A 47',
    reason:
      'Whether the representative’s email and contact number differ from the taxpayer’s primary contacts held in the profile.',
  },
  {
    rules: 'A 484',
    reason:
      'Whether the investment under section 115F was made within six months of transfer. Requires the investment date, which this return does not capture.',
  },
  {
    rules: 'A 682, 799 to 802',
    reason:
      'Acknowledgement numbers of Forms 10-IA, 10BA, 10CCD and 10CCE are captured here but their existence and timeliness are verified against the filed-forms database.',
  },
  {
    rules: 'A 912',
    reason:
      'Reconciliation of receipts and credits with Form 26AS and the Annual Information Statement.',
  },
  {
    rules: 'A 972',
    reason:
      'Existence of the Indian Financial System Code in the Reserve Bank database. Format is checked here.',
  },
  {
    rules: 'A 989',
    reason:
      'The maximum rebate under section 87A, including marginal relief, is computed by the portal from the full tax computation.',
  },
  {
    rules: 'B 1, 5, 9 to 20, 32, 33, 36, 37',
    reason:
      'Whether Forms 10CCB, 3CLA, 3CA-3CD or 3CB-3CD, 3CFA, 29C, 3CE, 56F, 10DA, 10EE, 10F, 10BA and 10-IEA were filed, and whether the amounts agree with those forms.',
  },
  {
    rules: 'B 24, 28 to 31',
    reason:
      'Whether income against which tax was deducted has been offered in full. Requires Form 26AS and the Annual Information Statement.',
  },
  {
    rules: 'B 26, 27',
    reason:
      'Recomputation of the indexed cost of acquisition and improvement against the notified cost inflation index for each year.',
  },
  {
    rules: 'D 1, 3, 5, 6, 10 to 14',
    reason:
      'Whether Forms 29C, 10DA, 67, 56F, 3CE, 3CEB, 3CFA and 10E were filed within the time allowed.',
  },
  {
    rules: 'Schedule-level breakdowns',
    reason:
      'Rules 62, 63, 65, 69, 71, 73, 74, 80, 81, 83 to 91, 93, 98, 126, 127, 139, 140, 148 to 156, 161, 162, 166, 168 to 171, 175, 176, 178 to 187, 189 to 191, 193, 196, 197, 201 to 203, 206, 209, 219, 220, 222, 227 to 233, 238, 239, 245, 247, 256, 260, 263, 265, 268, 270, 272 to 277, 281, 285, 286, 288 to 299, 302, 305 to 308, 312 to 324, 326 to 350, 352, 357, 359 to 367, 369 to 386, 388 to 392, 395 to 434, 436, 439, 440, 442, 443, 446 to 470, 472 to 479, 481, 482, 486 to 488, 491 to 500, 502, 503, 505, 510, 512 to 523, 527, 528, 532 to 538, 540, 542 to 547, 549, 553 to 571, 573 to 578, 580 to 591, 593 to 607, 609 to 619, 621, 623, 627 to 629, 631, 636 to 638, 640 to 643, 650, 654, 656 to 658, 663, 667, 674, 680, 681, 684 to 686, 689 to 692, 695, 698, 701, 703, 705, 712 to 714, 719 to 722, 724, 726, 729, 732, 734, 735, 737, 738, 740, 742, 744 to 749, 759, 788, 791, 794, 795, 803 to 827, 829, 832, 837, 838, 840, 841, 843 to 846, 849, 850, 853 to 859, 861 to 866, 868, 870 to 878, 883, 886, 889, 891 to 897, 899, 900, 907, 909, 915, 916, 918, 923 to 926, 928, 929, 936, 939, 944, 945, 948 to 954, 958, 959, 962, 964, 966, 967, 971, 980 to 982, 984 to 987, 992, 997 to 999, 1001, 1004 to 1006, 1008, 1010, 1015, 1020, 1021, 1023 to 1027 test breakdowns, quarter-wise splits, block-wise depreciation columns, set-off matrices and dropdown-level detail that the return aggregates into single controls. They become checkable once the corresponding controls are added.',
  },
];

/* ─────────────────────────── Field coverage ─────────────────────────── */

/**
 * Every fully qualified field key the rules above read. The wizard uses it to
 * decide which schedules to keep in play, and the test uses it to catch a key
 * that has drifted from the schema.
 */
export const ITR3_RULE_FIELD_KEYS: readonly string[] = [
  'AL.AL_Bank', 'AL.AL_Cash', 'AL.AL_Immovable', 'AL.AL_Jewellery', 'AL.AL_Shares',
  'AMT.AMTC_BF', 'AMT.AMTC_CF', 'AMT.AMTC_Utilized', 'AMT.AMT_10AA', 'AMT.AMT_35AD',
  'AMT.AMT_AdjTotal', 'AMT.AMT_PartCDed', 'AMT.AMT_Tax', 'AMT.AMT_TotalIncome', 'BP.A10',
  'BP.A11_Depreciation', 'BP.A12i_DepIT', 'BP.A12ii_Dep32_1i', 'BP.A13', 'BP.A14_Dis36',
  'BP.A15_Dis37', 'BP.A16_Dis40', 'BP.A17_Dis40A', 'BP.A18_Dis43B', 'BP.A1_ProfitPL',
  'BP.A22_Interest23', 'BP.A24e_ESRNeg', 'BP.A25_ICDSInc', 'BP.A26', 'BP.A27_43BAllow',
  'BP.A28_ESRDeduction', 'BP.A2a_SpecProfit', 'BP.A2b_SpecifiedProfit', 'BP.A32_ICDSDec',
  'BP.A33', 'BP.A34_Income', 'BP.A35i_44AD', 'BP.A35ii_44ADA', 'BP.A35iii_44AE', 'BP.A35iv_vii',
  'BP.A36_NetPGBP', 'BP.A37', 'BP.A38_AgriDeemed', 'BP.A3a_SalaryInc', 'BP.A3b_HPInc',
  'BP.A3c_CGInc', 'BP.A3d_OSInc', 'BP.A3e_115BBF', 'BP.A3f_115BBG', 'BP.A3g_115BBH',
  'BP.A4a_ExemptInc', 'BP.A4b_Rule7', 'BP.A5a_FirmShare', 'BP.A5c_DividendRed', 'BP.A6_Balance',
  'BP.A9_Additions', 'BP.B39_SpecPL', 'BP.B42_SpecIncome', 'BP.C43_SpecifiedPL',
  'BP.C48_SpecifiedIncome', 'BP.D_TotalPGBP', 'BP.SpecifiedNature', 'BS.AdvFrom40A2b',
  'BS.AdvFromOthers', 'BS.ApplicationTotal', 'BS.CashBank', 'BS.CurrLiab', 'BS.DefTaxLiab',
  'BS.FixedAssetsNet', 'BS.Inventories', 'BS.LTInvest', 'BS.LoansAdvGiven', 'BS.MiscExp',
  'BS.NetCurrAssets', 'BS.NoAccCashBal', 'BS.NoAccCreditors', 'BS.NoAccDebtors',
  'BS.NoAccStock', 'BS.OthCurrAssets', 'BS.PropCapital', 'BS.Provisions', 'BS.STInvest',
  'BS.SecuredLoansFin', 'BS.SecuredLoansOth', 'BS.SourcesTotal', 'BS.SundryDebtors',
  'BS.TotAdvances', 'BS.TotCurrAssets', 'BS.TotCurrLiab', 'BS.TotInvest', 'BS.TotLoanFunds',
  'BS.TotPropFund', 'BS.TotReserve', 'BS.UnsecuredLoans', 'BTI.TI_10AA', 'BTI.TI_AggIncome',
  'BTI.TI_BFLA', 'BTI.TI_CFLosses', 'BTI.TI_CG', 'BTI.TI_CYLA', 'BTI.TI_DeemedAMT',
  'BTI.TI_GTI', 'BTI.TI_HP', 'BTI.TI_LTCG', 'BTI.TI_NetAgri', 'BTI.TI_OS', 'BTI.TI_PGBP',
  'BTI.TI_STCG', 'BTI.TI_Salary', 'BTI.TI_SpecialInGTI', 'BTI.TI_SpecialIncome',
  'BTI.TI_Total6', 'BTI.TI_TotalIncome', 'BTI.TI_VIA_a', 'BTI.TI_VIA_b', 'BTTI.TTI_234A',
  'BTTI.TTI_234B', 'BTTI.TTI_234C', 'BTTI.TTI_234F', 'BTTI.TTI_234I', 'BTTI.TTI_AMTCredit',
  'BTTI.TTI_AggLiab', 'BTTI.TTI_AgriRebate', 'BTTI.TTI_Cess', 'BTTI.TTI_FAFlag',
  'BTTI.TTI_GrossLiab', 'BTTI.TTI_GrossTax', 'BTTI.TTI_NetLiab', 'BTTI.TTI_Payable',
  'BTTI.TTI_Rebate87A', 'BTTI.TTI_Refund', 'BTTI.TTI_Relief89', 'BTTI.TTI_Relief90',
  'BTTI.TTI_Relief91', 'BTTI.TTI_Surcharge', 'BTTI.TTI_TaxAMT', 'BTTI.TTI_TaxNormal',
  'BTTI.TTI_TaxPayable1d', 'BTTI.TTI_TaxSpecial', 'BTTI.TTI_TotalPaid', 'CG.C1_TotalCG',
  'CG.C2_VDA_CG', 'CG.C3_Total', 'CG.D_54EC', 'CG.D_54F', 'CG.LTCG_B10_PTI', 'CG.LTCG_B11_DTAA',
  'CG.LTCG_B12_Total', 'CG.LTCG_B1_IndexCost', 'CG.LTCG_B1_LandBld', 'CG.LTCG_B1_PurDate',
  'CG.LTCG_B1_SaleDate', 'CG.LTCG_B1e', 'CG.LTCG_B2_SlumpSale', 'CG.LTCG_B3_Bonds',
  'CG.LTCG_B4_112A', 'CG.LTCG_B4_Exemption', 'CG.LTCG_B5_ShareDeb', 'CG.LTCG_B6_Other',
  'CG.LTCG_B7_115AD', 'CG.LTCG_B9_Other', 'CG.STCG_A1_Cost', 'CG.STCG_A1_Exp',
  'CG.STCG_A1_Improve', 'CG.STCG_A1_LandBld', 'CG.STCG_A1e', 'CG.STCG_A2', 'CG.STCG_A3_111A',
  'CG.STCG_A5_NR', 'CG.STCG_A6_Other', 'CG.STCG_A7_PTI', 'CG.STCG_A8_DTAA', 'CG.STCG_A9_Total',
  'CYLA.BFLA_BFLoss', 'CYLA.BFLA_Total', 'CYLA.BFLA_UnabsDep', 'CYLA.CYLA_BPLoss',
  'CYLA.CYLA_HPLoss', 'CYLA.CYLA_OSLoss', 'CYLA.CYLA_TotalSetoff', 'D80D.ParentCheckup',
  'D80D.ParentInsurer', 'D80D.ParentMedExp', 'D80D.ParentPremium', 'D80D.ParentSenior',
  'D80D.SelfCheckup', 'D80D.SelfInsurer', 'D80D.SelfMedExp', 'D80D.SelfPremium',
  'D80D.SelfSenior', 'D80D.Total80D', 'D80DD.DD_Aadhaar', 'D80DD.DD_Category',
  'D80DD.DD_DependentPAN', 'D80DD.DD_DependentType', 'D80DD.DD_Form10IA',
  'D80DD.DD_NatureDisability', 'D80DD.U_Category', 'D80DD.U_Form10IA',
  'D80DD.U_NatureDisability', 'D80E.EEA_Interest', 'D80E.EEA_LoanDetail', 'D80E.EEB_Interest',
  'D80E.EEB_LoanDetail', 'D80E.EE_Interest', 'D80E.EE_LoanDetail', 'D80E.E_Interest',
  'D80E.E_LoanBank', 'DEP.AddlDep', 'DEP.Bld10_Dep', 'DEP.Bld40_Dep', 'DEP.Bld5_Dep',
  'DEP.DCG_Total', 'DEP.DEP_Total', 'DEP.Furn10_Dep', 'DEP.Intang25_Dep', 'DEP.PM15_Add',
  'DEP.PM15_Dep', 'DEP.PM15_Sale', 'DEP.PM15_WDV', 'DEP.PM30_Dep', 'DEP.PM40_Dep',
  'DEP.PM45_Dep', 'DEP.Ships20_Dep', 'EI.EI_AgriExp', 'EI.EI_AgriGross', 'EI.EI_AgriLandDetail',
  'EI.EI_AgriLossBF', 'EI.EI_AgriNet', 'EI.EI_AgriRule', 'EI.EI_DTAA', 'EI.EI_FirmShare',
  'EI.EI_Interest', 'EI.EI_Other', 'EI.EI_PTI', 'EI.EI_Total', 'ESOP.ESOP_Sold',
  'ESOP.ESOP_TaxCF', 'ESOP.ESOP_TaxDeferredBF', 'ESOP.ESOP_TaxPayableCY', 'ESR.ESR_35CCC',
  'ESR.ESR_35CCD', 'ESR.ESR_35_1_i', 'ESR.ESR_35_1_ii', 'ESR.ESR_35_1_iia', 'ESR.ESR_35_1_iii',
  'ESR.ESR_35_1_iv', 'ESR.ESR_35_2AA', 'ESR.ESR_35_2AB', 'ESR.ESR_Excess', 'GEN.AadhaarCardNo',
  'GEN.AadhaarEnrolmentId', 'GEN.Audit44ABCondition', 'GEN.AuditFirmName', 'GEN.AuditFirmPAN',
  'GEN.AuditReportDate', 'GEN.AuditedFlag', 'GEN.BusIncomeFlag', 'GEN.CashPaymentPct',
  'GEN.CashReceiptPct', 'GEN.DOB', 'GEN.DueDate', 'GEN.FPIFlag', 'GEN.FlatDoorNo',
  'GEN.Form10IEAAckNo', 'GEN.Form10IEADate', 'GEN.Liable92E', 'GEN.LiableAudit44AB',
  'GEN.MobileNo', 'GEN.NoticeDIN', 'GEN.NoticeDate', 'GEN.OptOutNewTaxRegime',
  'GEN.OrigRetAckNo', 'GEN.PAN', 'GEN.PortugueseCC', 'GEN.PremiseName', 'GEN.PresumptiveOnly',
  'GEN.RepAssesseeFlag', 'GEN.RepName', 'GEN.ResidentialStatus', 'GEN.ReturnFileSec',
  'GEN.RoadStreet', 'GEN.SecAddSame', 'GEN.SecAddress', 'GEN.SeventhProviso139',
  'GEN.SpousePAN', 'GEN.Status', 'GEN.TurnoverRange', 'HP.TotalHP', 'ICDS.ICDS_I',
  'ICDS.ICDS_II', 'ICDS.ICDS_III', 'ICDS.ICDS_IV', 'ICDS.ICDS_IX', 'ICDS.ICDS_V',
  'ICDS.ICDS_VI', 'ICDS.ICDS_VII', 'ICDS.ICDS_VIII', 'ICDS.ICDS_X', 'ICDS.ICDS_XI',
  'MFG.ClosingStock', 'MFG.CostGoodsProduced', 'MFG.DirectExpTotal', 'MFG.DirectWages',
  'MFG.FactoryDep', 'MFG.FactoryOverheads', 'MFG.OpRawMat', 'MFG.OpTotal', 'MFG.OpWIP',
  'MFG.Purchases', 'MFG.TotalDebits', 'OI.Allow40PY', 'OI.Allow43B', 'OI.Disallow36',
  'OI.Disallow37', 'OI.Disallow40', 'OI.Disallow40A', 'OI.Disallow43B', 'OI.ICDSDecrease',
  'OI.ICDSIncrease', 'OI.OutstandingTax12i', 'OI.Sec92CE2A', 'OS.AccumPF2c', 'OS.AnySpecial2d',
  'OS.DTAA2f', 'OS.Ded57Exp', 'OS.Ded57Int', 'OS.Ded57iia', 'OS.Dep3b', 'OS.DivQ1', 'OS.DivQ2',
  'OS.DivQ3', 'OS.DivQ4', 'OS.DivQ5', 'OS.Dividend1a', 'OS.FamilyPension', 'OS.Gross1',
  'OS.Income56_2x', 'OS.Income89A_OS', 'OS.IntDeposits', 'OS.IntITRefund', 'OS.IntSavings',
  'OS.Interest1b', 'OS.Lottery2ai', 'OS.Net6', 'OS.OnlineGames2aii', 'OS.PTISpecial2e',
  'OS.RaceHorses8e', 'OS.Relief89A_5a', 'OS.Rental1c', 'OS.Total7', 'OS.Total9',
  'OS.Unexplained2b', 'PL.AmtAvailAppr', 'PL.Appropriations', 'PL.BadDebt', 'PL.BalBroughtFwd',
  'PL.BalCarriedBS', 'PL.CommissionTot', 'PL.Depreciation52', 'PL.DividendInc14iii',
  'PL.EmpComp', 'PL.GR44ADA', 'PL.GT44ADBank', 'PL.GT44ADCash', 'PL.GT44ADOther',
  'PL.GrossProfitTrf', 'PL.Insurance', 'PL.InterestTot', 'PL.NA_BusExp', 'PL.NA_BusGP',
  'PL.NA_BusGR', 'PL.NA_BusNP', 'PL.NA_ProfExp', 'PL.NA_ProfGP', 'PL.NA_ProfGR', 'PL.NA_ProfNP',
  'PL.NA_Total', 'PL.NPBT', 'PL.OpeningStockPL', 'PL.OthPresGR', 'PL.OthPresNP',
  'PL.OthPresSec', 'PL.OtherExp', 'PL.OtherIncTotal', 'PL.OtherProv', 'PL.PAT', 'PL.PBIDT',
  'PL.PI44ADA', 'PL.PI44ADBank', 'PL.PI44ADCash', 'PL.PI44AE', 'PL.ProfFees', 'PL.ProvBadDebt',
  'PL.ProvCurrTax', 'PL.ProvDefTax', 'PL.RoyaltyTot', 'PL.SpecExp', 'PL.SpecGP', 'PL.SpecNet',
  'PL.SpecTurnover', 'PL.TotalCredits', 'S.EmployerCategory', 'S.EntAllow', 'S.ExemptAllow',
  'S.GrossSalary', 'S.HRABasicDA', 'S.HRAExempt', 'S.HRAMetro', 'S.HRAReceived',
  'S.HRARentPaid', 'S.Income89A_1d', 'S.Income89A_1e', 'S.IncomeSalaries', 'S.NetSalary',
  'S.Perq17_2', 'S.ProfTax', 'S.Profit17_3', 'S.Relief89A', 'S.Sal17_1', 'S.StdDeduction',
  'S10AA.Amt10AA', 'S10AA.UndertakingNo', 'S5A.BP5A', 'S5A.CG5A', 'S5A.HP5A', 'S5A.OS5A',
  'S5A.SpousePAN5A', 'S5A.Tot5A', 'SPI.SI_111A', 'SPI.SI_112A', 'SPI.SI_115BB', 'SPI.SI_115BBE',
  'SPI.SI_115BBH', 'SPI.SI_115BBJ', 'SPI.SI_Total', 'TPSA.TPSA_Cess', 'TPSA.TPSA_Net',
  'TPSA.TPSA_Paid', 'TPSA.TPSA_Primary', 'TPSA.TPSA_Surch', 'TPSA.TPSA_Tax18',
  'TPSA.TPSA_TotalTax', 'TRD.CostGoodsFromMfg', 'TRD.DirectExpTrd', 'TRD.DutiesTaxesPaid',
  'TRD.DutiesTotal', 'TRD.FOIncome', 'TRD.FOTurnover', 'TRD.GrossProfit', 'TRD.GrossReceipts',
  'TRD.GrossReceiptsGST', 'TRD.IntradayIncome', 'TRD.IntradayTurnover', 'TRD.OpStockFG',
  'TRD.OtherOpRevenue', 'TRD.PurchasesTrd', 'TRD.SaleGoods', 'TRD.SaleServices',
  'TRD.TotRevenueOps', 'TRD.TotalOfCredits', 'VER.VerCapacity', 'VER.VerPAN', 'VIA.VIA_80C',
  'VIA.VIA_80CCC', 'VIA.VIA_80CCD1', 'VIA.VIA_80CCD1B', 'VIA.VIA_80CCD2', 'VIA.VIA_80CCH',
  'VIA.VIA_80D', 'VIA.VIA_80DD', 'VIA.VIA_80DDB', 'VIA.VIA_80DDB_Disease', 'VIA.VIA_80E',
  'VIA.VIA_80EE', 'VIA.VIA_80EEA', 'VIA.VIA_80EEB', 'VIA.VIA_80G', 'VIA.VIA_80GG',
  'VIA.VIA_80GGA', 'VIA.VIA_80GGC', 'VIA.VIA_80IA', 'VIA.VIA_80IB', 'VIA.VIA_80IE',
  'VIA.VIA_80JJAA', 'VIA.VIA_80QQB', 'VIA.VIA_80RRB', 'VIA.VIA_80TTA', 'VIA.VIA_80TTB',
  'VIA.VIA_80U', 'VIA.VIA_PRAN', 'VIA.VIA_PartB', 'VIA.VIA_PartC', 'VIA.VIA_Total',
];
