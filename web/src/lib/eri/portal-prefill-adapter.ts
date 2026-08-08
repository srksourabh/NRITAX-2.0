/**
 * Maps Income Tax portal `getPrefillCurrentYr` JSON (camelCase insights blob)
 * into PrefillPayload for applyPrefill(). This is not Form_ITR3 / PartA_GEN1.
 */

import type {
  PrefillBankAccount,
  PrefillChallan,
  PrefillPayload,
  PrefillPersonal,
  PrefillSalary,
  PrefillTdsEntry,
} from '@/lib/eri/types';
import { ASSESSMENT_YEAR } from '@/lib/itr/types';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

function asObject(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function str(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/[,\s₹]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function boolish(value: unknown): boolean {
  if (value === true || value === 'true' || value === 'Y' || value === 'yes') return true;
  return false;
}

/** Portal section codes are often shortened (94A → 194A). */
export function normalizeTdsSection(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (!cleaned) return undefined;
  if (/^94[A-Z]?$/.test(cleaned)) return `1${cleaned}`;
  if (/^93$/.test(cleaned)) return '193';
  return cleaned;
}

/**
 * True when JSON looks like portal getPrefillCurrentYr / insights prefill,
 * not a departmental Form_ITR* offline file.
 */
export function isPortalPrefillShape(raw: unknown): boolean {
  const root = asObject(raw);
  if (!root) return false;
  if ('Form_ITR2' in root || 'Form_ITR3' in root) return false;
  const itr = asObject(root.ITR);
  if (itr && ('ITR2' in itr || 'ITR3' in itr)) return false;
  return (
    'personalInfo' in root ||
    'form26as' in root ||
    'bankAccountDtls' in root ||
    'insights' in root
  );
}

export type PortalPrefillInventory = {
  identity: boolean;
  salary: boolean;
  tds: boolean;
  banks: boolean;
  interestOrDividend: boolean;
  challans: boolean;
  emptyBusiness: boolean;
};

export function inventoryPortalPrefill(payload: PrefillPayload): PortalPrefillInventory {
  return {
    identity: Boolean(payload.personal.pan || payload.personal.firstName),
    salary: payload.salaries.length > 0,
    tds: payload.tds.length > 0,
    banks: payload.bankAccounts.length > 0,
    interestOrDividend: Boolean(
      payload.dividend ||
        payload.interest.savingsBank ||
        payload.interest.termDeposits ||
        payload.interest.incomeTaxRefund ||
        payload.interest.others,
    ),
    challans: payload.challans.length > 0,
    emptyBusiness: true,
  };
}

export function describePortalPrefillInventory(inv: PortalPrefillInventory): string {
  const filled: string[] = [];
  if (inv.identity) filled.push('identity');
  if (inv.salary) filled.push('salary');
  if (inv.tds) filled.push('TDS');
  if (inv.banks) filled.push('banks');
  if (inv.interestOrDividend) filled.push('interest/dividend');
  if (inv.challans) filled.push('tax payments');
  const head = filled.length
    ? `Filled from portal prefill: ${filled.join(', ')}.`
    : 'Portal prefill had little usable identity data.';
  return `${head} Business / capital gains / HP schedules stay empty for you to complete.`;
}

export function portalPrefillToPayload(
  raw: unknown,
  options: { assessmentYear?: string; expectPan?: string } = {},
): PrefillPayload {
  const root = asObject(raw) ?? {};
  const personalInfo = asObject(root.personalInfo) ?? {};
  const address = asObject(personalInfo.address) ?? {};
  const assesseeName = asObject(personalInfo.assesseeName) ?? {};
  const form26as = asObject(root.form26as) ?? {};
  const insights = asObject(root.insights) ?? {};
  const form24q = asObject(root.form24q) ?? {};

  const pan =
    str(options.expectPan)?.toUpperCase() ||
    str(personalInfo.pan)?.toUpperCase() ||
    str(personalInfo.assesseVerPan)?.toUpperCase() ||
    '';

  const personal: PrefillPersonal = {
    firstName: str(assesseeName.firstName),
    surname:
      str(assesseeName.surNameOrOrgName) ||
      str(asObject(asObject(personalInfo.orgFirmInfo)?.AssesseeName)?.SurNameOrOrgName),
    pan,
    dateOfBirth: str(personalInfo.dob),
    aadhaar: str(personalInfo.aadhaarCardNo),
    status: str(personalInfo.status),
    email: str(address.emailAddress),
    mobile: str(address.mobileNo),
    address: {
      flatNo: str(address.residenceNo),
      premises: str(address.residenceName),
      road: str(address.roadOrStreet),
      locality: str(address.localityOrArea),
      city: str(address.cityOrTownOrDistrict),
      stateCode: str(address.stateCode),
      countryCode: str(address.countryCode) || str(address.countryCodeMobile),
      pinCode: str(address.pinCode),
    },
  };

  const bankAccounts: PrefillBankAccount[] = [];
  const bankWrap = Array.isArray(root.bankAccountDtls)
    ? root.bankAccountDtls
    : root.bankAccountDtls
      ? [root.bankAccountDtls]
      : [];
  for (const wrap of bankWrap) {
    const obj = asObject(wrap);
    const rows = obj?.addtnlBankDetails;
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    for (const row of list) {
      const b = asObject(row);
      if (!b) continue;
      const ifsc = str(b.ifsccode) || str(b.ifsc) || '';
      const accountNumber = str(b.bankAccountNo) || str(b.accountNumber) || '';
      if (!ifsc || !accountNumber) continue;
      bankAccounts.push({
        ifsc,
        bankName: str(b.bankName) || 'Bank',
        accountNumber,
        accountType: str(b.AccountType) || str(b.accountType),
        nominatedForRefund: boolish(b.useForRefund),
      });
    }
  }

  const salaries: PrefillSalary[] = [];
  const insightSalaries = asObject(insights.salaries)?.salary;
  const f24Salaries = asObject(form24q.salaries)?.salary;
  const salaryRows = Array.isArray(insightSalaries)
    ? insightSalaries
    : Array.isArray(f24Salaries)
      ? f24Salaries
      : [];

  for (const row of salaryRows) {
    const s = asObject(row);
    if (!s) continue;
    const salarys = asObject(s.salarys) ?? {};
    const employerName = str(s.nameOfEmployer);
    if (!employerName) continue;
    salaries.push({
      employerName,
      employerTan: str(s.tanOfEmployer),
      employerCategory: 'OTH',
      salary17_1: num(salarys.salary) ?? num(asObject(insights.cumulativeSalary)?.salary),
      perquisites17_2: num(salarys.valueOfPerquisites) ?? 0,
      profitInLieu17_3: num(salarys.profitsinLieuOfSalary) ?? 0,
    });
  }

  // Fallback: form26as salary TDS row when insights missing employer detail.
  if (salaries.length === 0) {
    const tdsSal = asObject(form26as.tdsOnSalaries)?.tdsOnSalary;
    const list = Array.isArray(tdsSal) ? tdsSal : tdsSal ? [tdsSal] : [];
    for (const row of list) {
      const s = asObject(row);
      if (!s) continue;
      const emp = asObject(s.employerOrDeductorOrCollectDetl) ?? {};
      const name = str(emp.employerOrDeductorOrCollecterName);
      if (!name) continue;
      salaries.push({
        employerName: name,
        employerTan: str(emp.tan),
        employerCategory: 'OTH',
        salary17_1: num(s.incChrgSal),
        taxDeducted: num(s.totalTDSSal),
      });
    }
  }

  const tds: PrefillTdsEntry[] = [];

  const tdsSal = asObject(form26as.tdsOnSalaries)?.tdsOnSalary;
  for (const row of Array.isArray(tdsSal) ? tdsSal : tdsSal ? [tdsSal] : []) {
    const s = asObject(row);
    if (!s) continue;
    const emp = asObject(s.employerOrDeductorOrCollectDetl) ?? {};
    tds.push({
      kind: 'salary',
      deductorTan: str(emp.tan),
      deductorName: str(emp.employerOrDeductorOrCollecterName),
      grossAmount: num(s.incChrgSal),
      taxDeducted: num(s.totalTDSSal),
    });
  }

  const tdsOther = asObject(form26as.tdsOnOthThanSals)?.tdSonOthThanSal;
  for (const row of Array.isArray(tdsOther) ? tdsOther : tdsOther ? [tdsOther] : []) {
    const s = asObject(row);
    if (!s) continue;
    const emp = asObject(s.employerOrDeductorOrCollectDetl) ?? {};
    const credit = asObject(s.taxDeductCreditDtls) ?? {};
    const section = normalizeTdsSection(str(s.sectionCode));
    tds.push({
      kind: 'other',
      deductorTan: str(emp.tan),
      deductorName: str(emp.employerOrDeductorOrCollecterName),
      section,
      grossAmount: num(s.grossAmount),
      taxDeducted: num(credit.taxDeductedOwnHands) ?? num(credit.taxClaimedOwnHands),
    });
  }

  const challans: PrefillChallan[] = [];
  const taxPay = asObject(form26as.taxPayments)?.taxPayment;
  for (const row of Array.isArray(taxPay) ? taxPay : taxPay ? [taxPay] : []) {
    const c = asObject(row);
    if (!c) continue;
    const bsrCode = str(c.bsrCode) || '';
    const depositDate = str(c.dateDep) || '';
    const serialNumber = str(c.srlNoOfChaln) || '';
    const amount = num(c.amt);
    if (!bsrCode || !depositDate || !serialNumber || amount === undefined) continue;
    challans.push({ bsrCode, depositDate, serialNumber, amount });
  }

  const scheduleOS =
    asObject(form26as.scheduleOS) ??
    asObject(insights.scheduleOS) ??
    {};
  const incOth = asObject(scheduleOS.incOthThanOwnRaceHorse) ?? {};
  const dividend =
    num(incOth.dividendGross) ??
    num(incOth.DividendOthThan22e) ??
    num(incOth.DividendOthThan22E);

  let savingsBank =
    num(insights.intrstFrmSavingBank) ??
    num(form26as.intrstFrmSavingBank) ??
    num(form24q.intrstFrmSavingBank);
  let termDeposits =
    num(insights.intrstFrmTermDeposit) ?? num(form26as.intrstFrmTermDeposit);

  // Prefer explicit nature lines when present.
  const otherLines =
    (Array.isArray(form26as.incomeDeductionsOthersInc)
      ? form26as.incomeDeductionsOthersInc
      : null) ??
    (Array.isArray(insights.incomeDeductionsOthersInc)
      ? insights.incomeDeductionsOthersInc
      : null) ??
    [];
  for (const line of otherLines) {
    const o = asObject(line);
    if (!o) continue;
    const nature = str(o.othSrcNatureDesc)?.toUpperCase();
    const amt = num(o.othSrcOthAmount);
    if (nature === 'SAV' && amt !== undefined) savingsBank = amt;
    if ((nature === 'IFD' || nature === 'INT') && amt !== undefined) termDeposits = amt;
    if (nature === 'DIV' && amt !== undefined && dividend === undefined) {
      /* dividend already preferred from scheduleOS */
    }
  }

  const ay =
    options.assessmentYear?.trim() ||
    str(asObject(root.filingStatus)?.assessmentYear) ||
    ASSESSMENT_YEAR;

  return {
    source: 'mock',
    fetchedAt: new Date().toISOString(),
    assessmentYear: /^\d{4}-\d{2}$/.test(ay) ? ay : ASSESSMENT_YEAR,
    pan,
    personal,
    bankAccounts,
    salaries,
    tds,
    challans,
    interest: {
      savingsBank,
      termDeposits,
    },
    dividend,
    raw: root as Record<string, unknown>,
  };
}
