/**
 * NRITAX — the ITR-2 form schema for assessment year 2026-27.
 *
 * Ported from docs/reference/ITR2-source.html. Field keys, calculation ids and
 * departmental JSON paths follow the prototype; the prototype's dot-delimited
 * paths are normalised to "/" as docs/CONTRACTS.md requires. Schedules the
 * prototype omits — FSI, SI, 5A, the 80G donee blocks, 80D and the unlisted
 * share and directorship tables — are modelled on the equivalent definitions in
 * docs/reference/ITR3-source.html, since ITR-2 requires all of them.
 */

import type {
  ColumnDef,
  FieldDef,
  ScheduleDef,
  SectionDef,
  SelectOption,
  SourceKey,
} from '@/lib/itr/types';

/* ─────────────────────────── Published option lists ───────────────────────────
   The raw entries are the departmental strings exactly as the prototype holds
   them, so nothing is lost in transcription. `coded` splits them into an enum
   value and a human label at module load.                                     */

const STATE_RAW = [
  '01-ANDAMAN AND NICOBAR ISLANDS', '02-ANDHRA PRADESH', '03-ARUNACHAL PRADESH', '04-ASSAM', '05-BIHAR',
  '06-CHANDIGARH', '07-Dadra Nagar and Haveli', '08-Daman and Diu', '09-DELHI', '10-GOA', '11-GUJARAT',
  '12-HARYANA', '13-HIMACHAL PRADESH', '14-JAMMU AND KASHMIR', '15-KARNATAKA', '16-KERALA',
  '17-LAKHSWADEEP', '18-MADHYA PRADESH', '19-MAHARASHTRA', '20-MANIPUR', '21-MEGHALAYA', '22-MIZORAM',
  '23-NAGALAND', '24-ODISHA', '25-PUDUCHERRY', '26-PUNJAB', '27-RAJASTHAN', '28-SIKKIM', '29-TAMIL NADU',
  '30-TRIPURA', '31-UTTAR PRADESH', '32-WEST BENGAL', '33-CHHATTISGARH', '34-UTTARAKHAND', '35-JHARKHAND',
  '36-TELANGANA', '37-LADAKH', '99-Foreign',
];

const COUNTRY_RAW = [
  '93-AFGHANISTAN', '1001-ÅLAND ISLANDS', '355-ALBANIA', '213-ALGERIA', '684-AMERICAN SAMOA',
  '376-ANDORRA', '244-ANGOLA', '1264-ANGUILLA', '1010-ANTARCTICA', '1268-ANTIGUA AND BARBUDA',
  '54-ARGENTINA', '374-ARMENIA', '297-ARUBA', '61-AUSTRALIA', '43-AUSTRIA', '994-AZERBAIJAN',
  '1242-BAHAMAS', '973-BAHRAIN', '880-BANGLADESH', '1246-BARBADOS', '375-BELARUS', '32-BELGIUM',
  '501-BELIZE', '229-BENIN', '1441-BERMUDA', '975-BHUTAN', '591-BOLIVIA (PLURINATIONAL STATE OF)',
  '1002-BONAIRE, SINT EUSTATIUS AND SABA', '387-BOSNIA AND HERZEGOVINA', '267-BOTSWANA',
  '1003-BOUVET ISLAND', '55-BRAZIL', '1014-BRITISH INDIAN OCEAN TERRITORY', '673-BRUNEI DARUSSALAM',
  '359-BULGARIA', '226-BURKINA FASO', '257-BURUNDI', '238-CABO VERDE', '855-CAMBODIA', '237-CAMEROON',
  '1-CANADA', '1345-CAYMAN ISLANDS', '236-CENTRAL AFRICAN REPUBLIC', '235-CHAD', '56-CHILE', '86-CHINA',
  '9-CHRISTMAS ISLAND', '672-COCOS (KEELING) ISLANDS', '57-COLOMBIA', '270-COMOROS', '242-CONGO',
  '243-CONGO (DEMOCRATIC REPUBLIC OF THE)', '682-COOK ISLANDS', '506-COSTA RICA', "225-CÔTE D'IVOIRE",
  '385-CROATIA', '53-CUBA', '1015-CURAÇAO', '357-CYPRUS', '420-CZECHIA', '45-DENMARK', '253-DJIBOUTI',
  '1767-DOMINICA', '1809-DOMINICAN REPUBLIC', '593-ECUADOR', '20-EGYPT', '503-EL SALVADOR',
  '240-EQUATORIAL GUINEA', '291-ERITREA', '372-ESTONIA', '251-ETHIOPIA',
  '500-FALKLAND ISLANDS (MALVINAS)', '298-FAROE ISLANDS', '679-FIJI', '358-FINLAND', '33-FRANCE',
  '594-FRENCH GUIANA', '689-FRENCH POLYNESIA', '1004-FRENCH SOUTHERN TERRITORIES', '241-GABON',
  '220-GAMBIA', '995-GEORGIA', '49-GERMANY', '233-GHANA', '350-GIBRALTAR', '30-GREECE', '299-GREENLAND',
  '1473-GRENADA', '590-GUADELOUPE', '1671-GUAM', '502-GUATEMALA', '1481-GUERNSEY', '224-GUINEA',
  '245-GUINEA-BISSAU', '592-GUYANA', '509-HAITI', '1005-HEARD ISLAND AND MCDONALD ISLANDS', '6-HOLY SEE',
  '504-HONDURAS', '852-HONG KONG', '36-HUNGARY', '354-ICELAND', '91-INDIA', '62-INDONESIA',
  '98-IRAN (ISLAMIC REPUBLIC OF)', '964-IRAQ', '353-IRELAND', '1624-ISLE OF MAN', '972-ISRAEL', '5-ITALY',
  '1876-JAMAICA', '81-JAPAN', '1534-JERSEY', '962-JORDAN', '7-KAZAKHSTAN', '254-KENYA', '686-KIRIBATI',
  "850-KOREA (DEMOCRATIC PEOPLE'S REPUBLIC OF)", '82-KOREA (REPUBLIC OF)', '965-KUWAIT',
  '996-KYRGYZSTAN', "856-LAO PEOPLE'S DEMOCRATIC REPUBLIC", '371-LATVIA', '961-LEBANON', '266-LESOTHO',
  '231-LIBERIA', '218-LIBYA', '423-LIECHTENSTEIN', '370-LITHUANIA', '352-LUXEMBOURG', '853-MACAO',
  '389-MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)', '261-MADAGASCAR', '265-MALAWI', '60-MALAYSIA',
  '960-MALDIVES', '223-MALI', '356-MALTA', '692-MARSHALL ISLANDS', '596-MARTINIQUE', '222-MAURITANIA',
  '230-MAURITIUS', '269-MAYOTTE', '52-MEXICO', '691-MICRONESIA (FEDERATED STATES OF)',
  '373-MOLDOVA (REPUBLIC OF)', '377-MONACO', '976-MONGOLIA', '382-MONTENEGRO', '1664-MONTSERRAT',
  '212-MOROCCO', '258-MOZAMBIQUE', '95-MYANMAR', '264-NAMIBIA', '674-NAURU', '977-NEPAL',
  '31-NETHERLANDS', '687-NEW CALEDONIA', '64-NEW ZEALAND', '505-NICARAGUA', '227-NIGER', '234-NIGERIA',
  '683-NIUE', '15-NORFOLK ISLAND', '1670-NORTHERN MARIANA ISLANDS', '47-NORWAY', '968-OMAN',
  '92-PAKISTAN', '680-PALAU', '970-PALESTINE, STATE OF', '507-PANAMA', '675-PAPUA NEW GUINEA',
  '595-PARAGUAY', '51-PERU', '63-PHILIPPINES', '1011-PITCAIRN', '48-POLAND', '14-PORTUGAL',
  '1787-PUERTO RICO', '974-QATAR', '262-RÉUNION', '40-ROMANIA', '8-RUSSIAN FEDERATION', '250-RWANDA',
  '1006-SAINT BARTHÉLEMY', '290-SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA',
  '1869-SAINT KITTS AND NEVIS', '1758-SAINT LUCIA', '1007-SAINT MARTIN (FRENCH PART)',
  '508-SAINT PIERRE AND MIQUELON', '1784-SAINT VINCENT AND THE GRENADINES', '685-SAMOA', '378-SAN MARINO',
  '239-SAO TOME AND PRINCIPE', '966-SAUDI ARABIA', '221-SENEGAL', '381-SERBIA', '248-SEYCHELLES',
  '232-SIERRA LEONE', '65-SINGAPORE', '1721-SINT MAARTEN (DUTCH PART)', '421-SLOVAKIA', '386-SLOVENIA',
  '677-SOLOMON ISLANDS', '252-SOMALIA', '28-SOUTH AFRICA',
  '1008-SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS', '211-SOUTH SUDAN', '35-SPAIN', '94-SRI LANKA',
  '249-SUDAN', '597-SURINAME', '1012-SVALBARD AND JAN MAYEN', '268-SWAZILAND', '46-SWEDEN',
  '41-SWITZERLAND', '963-SYRIAN ARAB REPUBLIC', '886-TAIWAN, PROVINCE OF CHINA[A]', '992-TAJIKISTAN',
  '255-TANZANIA, UNITED REPUBLIC OF', '66-THAILAND', '670-TIMOR-LESTE (EAST TIMOR)', '228-TOGO',
  '690-TOKELAU', '676-TONGA', '1868-TRINIDAD AND TOBAGO', '216-TUNISIA', '90-TURKEY', '993-TURKMENISTAN',
  '1649-TURKS AND CAICOS ISLANDS', '688-TUVALU', '256-UGANDA', '380-UKRAINE', '971-UNITED ARAB EMIRATES',
  '44-UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND', '2-UNITED STATES OF AMERICA',
  '1009-UNITED STATES MINOR OUTLYING ISLANDS', '598-URUGUAY', '998-UZBEKISTAN', '678-VANUATU',
  '58-VENEZUELA (BOLIVARIAN REPUBLIC OF)', '84-VIET NAM', '1284-VIRGIN ISLANDS (BRITISH)',
  '1340-VIRGIN ISLANDS (U.S.)', '681-WALLIS AND FUTUNA', '1013-WESTERN SAHARA', '967-YEMEN', '260-ZAMBIA',
  '263-ZIMBABWE', '9999-OTHERS',
];

const TDSSEC_RAW = [
  '192-Salary-Payment to Government employees other than Indian Government employees',
  '192-Salary-Payment to employees other than Government employees',
  '192-Salary-Payment to Indian Government employees', '192A-TDS on PF withdrawal',
  '193-Interest on Securities', '194-Dividends', "194A-Interest other than 'Interest on securities'",
  '194B-Winning from lottery or crossword puzzle', '194BA-Winnings from online games',
  '194BB-Winning from horse race', '194C-Payments to contractors and sub-contractors',
  '194D-Insurance commission', '194DA-Payment in respect of life insurance policy',
  '194E-Payments to non-resident sportsmen or sports associations',
  '194EE-Payments in respect of deposits under National Savings',
  '194F-Payments on account of repurchase of units by Mutual Fund or Unit Trust of India',
  '194G-Commission, price, etc. on sale of lottery tickets', '194H-Commission or brokerage',
  '194I(a)-Rent on hiring of plant and machinery', '194I(b)-Rent on other than plant and machinery',
  '194IA-TDS on Sale of immovable property',
  '194IB-Payment of rent by certain individuals or Hindu undivided',
  '194IC-Payment under specified agreement', '194J(a)-Fees for technical services',
  '194J(b)-Fees for professional  services or royalty etc',
  '194K-Income payable to a resident assessee in respect of units of a specified mutual fund or of the units of the Unit Trust of India',
  '194LA-Payment of compensation on acquisition of certain immovable',
  '194LB-Income by way of Interest from Infrastructure Debt fund',
  '194LC-194LC (2)(i) and (ia) Income under clause (i) and (ia) of sub-section (2) of section 194LC',
  '194LC-194LC (2)(ib) Income under clause (ib) of sub-section (2) of section 194LC',
  '194LC-194LC (2)(ic) Income under clause (ic) of sub-section (2) of section 194LC',
  '194LBA(a)-Certain income in the form of interest from units of a business trust to a resident unit holder',
  '194LBA(b)-Certain income in the form of dividend from units of a business trust to a resident unit holder',
  '194LBA(a)-194LBA(a) income referred to in section 10(23FC)(a) from units of a business trust-NR',
  '194LBA(b)-194LBA(b) Income referred to in section 10(23FC)(b) from units of a business trust-NR',
  '194LBA(c)-194LBA(c) Income referred to in section 10(23FCA) from units of a business trust-NR',
  '194LBB-Income in respect of units of investment fund',
  '194R-Benefits or perquisites of business or profession',
  '194S-Payment of consideration for transfer of virtual digital asset by persons other than specified persons',
  'Proviso to section 194B-Winnings from lotteries and crossword puzzles where consideration is made in kind or cash is not sufficient to meet the tax liability and tax has been paid before such winnings are released',
  'First Proviso to sub-section(1) of section 194R-Benefits or perquisites of business or profession where such benefit is provided in kind or where part in cash is not sufficient to meet tax liability and tax required to be deducted is paid before such benefit is released',
  'Proviso to sub- section(1) of section 194S-Payment for transfer of virtual digital asset where payment is in kind or in exchange of another virtual digital asset and tax required to be deducted is paid before such payment is released',
  '194LBC-Income in respect of investment in securitization trust',
  '194LD-TDS on interest on bonds / government securities',
  '194M-Payment of certain sums by certain individuals or HUF',
  '194N-Payment of certain amounts in cash other than cases covered by first proviso or third proviso',
  '194N -First Proviso Payment of certain amounts in cash to non-filers except in case of co-operativesocieties',
  '194N -Third Proviso Payment of certain amounts in cash to co-operative societies not covered by first proviso',
  '194N-First Proviso read with Third Proviso Payment of certain amount in cash to non-filers being co-operative societies',
  '194O-Payment of certain sums by e-commerce operator to e-commerce participant.',
  '194P-Deduction of tax in case of specified senior citizen',
  '194Q-Deduction of tax at source on payment of certain sum for purchase of goods',
  '195-Other sums payable to a non-resident', '196A-Income in respect of units of non-residents',
  '196B-Payments in respect of units to an offshore fund',
  '196C-Income from foreign currency bonds or shares of Indian',
  '196D-Income of foreign institutional investors from securities',
  '196D(1A)-Income of specified fund from securities',
  '194BA(2)-Sub-section (2) of section 194BA Net Winnings from online games where the net winnings are made in kind or cash is not sufficient to meet the tax liability and tax has been paid before such net winnings are released',
];

const FY_RAW = [
  '2008-09', '2009-10', '2010-11', '2011-12', '2012-13', '2013-14', '2014-15', '2015-16', '2016-17',
  '2017-18', '2018-19', '2019-20', '2020-21', '2021-22', '2022-23', '2023-24', '2024-25',
];

const HPOWNER_RAW = ['Self', 'Minor', 'Spouse', 'Others'];

const RESI_RAW = ['RES - Resident', 'NRI - Non Resident', 'NOR - Resident but not Ordinarily Resident'];

const RESCOND_RAW = [
  'You were in India for 182 days or more during the previous year [section 6(1)(a)]',
  'You were in India for 60 days or more during the previous year, and have been in India for 365 days or more within the 4 preceding years [section (6)(1)(c)] [where Explanation 1 is not applicable]',
  'You are a citizen of India, who left India, for the purpose of employment, as a member of the crew of an Indian ship and were in India for 182 days or more during the previous year and 365 days or more within the preceding 4 years [Explanation 1(a) of section (6)(1)(c)]',
  'You are a citizen of India or a person of Indian origin and have come on a visit to India during the previous year and were in India for a) 182 days or more during the previous year and 365 days or more within the preceding 4 years; or b) 120 days or more during the previous year and 365 days or more within the preceding 4 years if the total income, other than income from foreign sources, exceeds Rs. 15 lakh. [Explanation 1(b) of section (6)(1)(c)]',
];

const NORCOND_RAW = [
  'You have been a non-resident in India in 9 out of 10 preceding years [section 6(6)(a)]',
  'You have been in India for 729 days or less during the 7 preceding years [section 6(6)(a)]',
  'You are a citizen of India or person of Indian origin, who comes on a visit to India, having total income, other than the income from foreign sources, exceeding Rs. 15 lakh and have been in India for 120 days or more but less than 182 days during the previous year [section 6(6)(c)]',
  'You are a citizen of India having total income, other than the income from foreign sources, exceeding Rs. 15 lakh during the previous year and not liable to tax in any other country or territory by reason of your domicile or residence or any other criteria of similar nature [section 6(6)(d) rws 6(1A)]',
];

const NRICOND_RAW = ['You were a non-resident during the previous year.'];

const YN_RAW = ['Y - Yes', 'N -No'];

const EMPCAT_RAW = [
  'Central Government', 'State Government', 'Public Sector Undertaking', 'CG-Pensioners', 'SG-Pensioners',
  'PSU-Pensioners', 'Others-Pensioners', 'OTHERS',
];

const SAL1_RAW = [
  'Basic Salary', 'Dearness Allowance', 'Conveyance Allowance', 'House Rent Allowance',
  'Leave Travel Allowance', 'Children Education Allowance', 'Other Allowance',
  'The contribution made  by the Employer  towards  pension scheme as referred u/s 80CCD',
  'Amount deemed to be income under rule 11(4) of Part-A of Fourth Schedule',
  'Amount deemed to be income under rule 6 of Part-A of Fourth Schedule', 'Annuity or pension',
  'Commuted Pension', 'Gratuity', 'Fees/ commission', 'Advance of salary', 'Leave Encashment',
  'Contribution made by the central government towards Agnipath scheme as referred  under section 80CCH',
  'Others',
];

const SAL2_RAW = [
  'Accommodation', 'Cars / Other Automotive', 'Sweeper, gardener, watchman or personal attendant',
  'Gas, electricity, water', 'Interest free or concessional loans', 'Holiday expenses',
  'Free or concessional travel', 'Free meals', 'Free education', 'Gifts, vouchers, etc.',
  'Credit card expenses', 'Club expenses', 'Use of movable assets by employees',
  'Transfer of assets to employee', 'Value of any other benefit/amenity/service/privilege',
  'Stock options allotted or transferred by employer being an eligible start-up referred to in section 80-IAC-Tax to be deferred',
  'Stock options (non-qualified options) other than ESOP in col 16 above.',
  'Contribution by employer to fund and scheme taxable under section 17(2)(vii)',
  'Annual accretion by way of interest, dividend etc. to the balance at the credit of fund and scheme referred to in section 17(2)(vii) and taxable under section 17(2)(viia)',
  'Other benefits or amenities',
  'Stock options allotted or transferred by employer being an eligible start-up referred to in section 80-IAC-Tax not to be deferred',
];

const SAL3_RAW = [
  'Any compensation due or received by an assessee from an employer or former employer in connection with the termination of his employment or modification thereto.',
  'Any payment due/received by an assessee from his employer or a former employer or from a provident or other fund, sum received under Keyman Insurance Policy including Bonus thereto',
  'Any amount due/received by assessee from any person before joining or after cessation of employment with that person',
  'Any Other',
];

const ALLOW_RAW = [
  'Sec 10(6)-Remuneration received as an official, by whatever name called, of an embassy, high commission etc.',
  'Sec 10(7)-Allowances or perquisites paid or allowed as such outside India by the Government to a citizen of India for rendering service outside India',
  'Sec 10(10)-Death-cum-retirement gratuity received', 'Sec 10(10A)-Commuted value of pension received',
  'Sec 10(10AA)-Earned leave encashment on Retirement',
  'Sec 10(10B) First proviso - Compensation limit notified by CG in the Official Gazette',
  'Sec 10(10B) Second proviso - Compensation under scheme approved by the Central Government',
  'Sec 10(10C)-Amount received/receivable on voluntary retirement or termination of service',
  'Sec 10(10CC)-Tax paid by employer on non-monetary perquisite',
  'Sec 10(14)(i)-Allowances referred in sub-clauses (a) to (c) of sub-rule (1) in Rule 2BB',
  'Sec 10(14)(ii)-Transport allowance granted to certain physically handicapped assessee',
];

const S80D_RAW = [
  '1-Self and Family (Non Senior citizen)', '2-Self and Family (Including Senior citizen)', '3-Parents',
  '4-Parents(Senior citizen)', '5-Self and Family including parents',
  '6-Self and Family including senior citizen parents',
  '7-Self(Senior citizen) & family including senior citizen parents',
];

const S80DC_RAW = ['1-Self and family', '2-Parent', '3-Self and family and Parents'];

const EXEMPTNAT_RAW = [
  'Agricultural  & related incomes',
  'Compensation/other sums received by government or other approved entities',
  'Income from specified Investments', 'Specified sums received by armed forces personnel',
  'Sums received by Senior Citizens/Minors', 'Sums received by specified Category of Taxpayers',
  'Sums received from policies/contributions such as LIC/NPS/PF/Sukanya Samriddhi Yojana',
  'Other Incomes',
];

const EXEMPTOTH_RAW = [
  '10(2)-Member’s share from HUF', '10(16)-Scholarships for education', '10(4)(ii)-NRE account interest',
  '10(8)-Income of individuals on cooperative technical assistance programmes',
  '10(8A)-Remuneration or any other income of Consultant',
  '10(8B)-Income from tech assistance programme in accordance with an agreement entered into by the Central Government and the agency',
  '10(9)-Income of any family member of any individual accompanying him to India, which accrues or arises outside India',
  'Income exempt as per CBDT Circular', 'Income exempt as per CBDT Notification',
  'Receipts not in the nature of income',
];

const BACYES_RAW = ['Continue to opt', 'Opt out'];

const BACNO_RAW = ['Opting in now', 'Not opting'];

/* ─────────────────────────── Option helpers ─────────────────────────── */

const SMALL_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
]);

/**
 * "ANDAMAN AND NICOBAR ISLANDS" becomes "Andaman and Nicobar Islands". Text that
 * already carries lower case is published in mixed case and is left untouched.
 */
function titleCase(text: string): string {
  if (/[a-z]/.test(text)) return text;
  let first = true;
  return text.toLowerCase().replace(/[a-zà-ÿ]+(?:['’][a-zà-ÿ]+)?/g, (word) => {
    const keepLower = !first && SMALL_WORDS.has(word);
    first = false;
    return keepLower ? word : word.charAt(0).toUpperCase() + word.slice(1);
  });
}

/**
 * Position of the hyphen that separates the departmental code from its wording.
 * A hyphen inside a word — "sub-section", "co-operative" — is not a separator,
 * so one flanked by lower case on the left and lower case or a space on the
 * right is skipped. Returns -1 when the entry carries no code.
 */
function codeCut(entry: string): number {
  for (let i = 1; i < entry.length - 1; i += 1) {
    if (entry.charAt(i) !== '-') continue;
    const before = entry.charAt(i - 1);
    const after = entry.charAt(i + 1);
    if (/[a-z]/.test(before) && /[a-z ]/.test(after)) continue;
    return i;
  }
  return -1;
}

/** Splits "01-ANDAMAN AND NICOBAR ISLANDS" into value "01" and label "Andaman and Nicobar Islands". */
function coded(entries: readonly string[]): SelectOption[] {
  return entries.map((entry) => {
    const cut = codeCut(entry);
    if (cut < 0) return { value: entry, label: entry };
    return {
      value: entry.slice(0, cut).trim().replace(/^Sec\s+/, ''),
      label: titleCase(entry.slice(cut + 1).trim()),
    };
  });
}

/** For lists the department publishes without a code; the wording is the value. */
function plain(entries: readonly string[]): SelectOption[] {
  return entries.map((entry) => ({ value: entry, label: entry }));
}

/** For lists the department indexes by position, such as the residency conditions. */
function numbered(entries: readonly string[]): SelectOption[] {
  return entries.map((entry, i) => ({ value: String(i + 1), label: entry }));
}

/** Every option list the ITR-2 schema draws on, keyed as in the prototype's OPT object. */
export const ITR2_OPTIONS = {
  STATE: coded(STATE_RAW),
  COUNTRY: coded(COUNTRY_RAW),
  HPOWNER: plain(HPOWNER_RAW),
  TDSSEC: coded(TDSSEC_RAW),
  FY: plain(FY_RAW),
  FILEDUS: [
    { value: '11', label: '139(1) — on or before the due date' },
    { value: '12', label: '139(4) — after the due date' },
    { value: '13', label: '139(5) — revised return' },
    { value: '14', label: '92CD — modified return' },
    { value: '15', label: '119(2)(b) — after condonation of delay' },
    { value: '20', label: '139(8A) — updated return' },
  ],
  RESI: coded(RESI_RAW),
  RESCOND: numbered(RESCOND_RAW),
  NORCOND: numbered(NORCOND_RAW),
  NRICOND: numbered(NRICOND_RAW),
  YN: coded(YN_RAW),
  EMPCAT: plain(EMPCAT_RAW),
  SAL1: plain(SAL1_RAW),
  SAL2: plain(SAL2_RAW),
  SAL3: plain(SAL3_RAW),
  ALLOW: coded(ALLOW_RAW),
  S80D: coded(S80D_RAW),
  S80DC: coded(S80DC_RAW),
  EXEMPTNAT: plain(EXEMPTNAT_RAW),
  EXEMPTOTH: coded(EXEMPTOTH_RAW),
  BACYES: plain(BACYES_RAW),
  BACNO: plain(BACNO_RAW),
} satisfies Record<string, SelectOption[]>;

const STATE = ITR2_OPTIONS.STATE;
const COUNTRY = ITR2_OPTIONS.COUNTRY;

const YESNO: SelectOption[] = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' },
];

/* ─────────────────────────── Shared builders ─────────────────────────── */

interface CgBlockOptions {
  /** Departmental node the block writes into, without a trailing slash. */
  path?: string;
  source?: SourceKey;
  /** Adds the stamp duty value and the section 50C substitution. */
  stamp?: boolean;
  /** Adds the loss disallowed under section 94(7) or 94(8). */
  loss94?: boolean;
  /** Sections whose deduction may be claimed against this block. */
  ded?: string;
}

/**
 * The section 48 deduction block that repeats across the capital gain sub-items:
 * consideration, cost, improvement, transfer expenditure, then the net gain.
 */
function cgBlock(k: string, title: string, opts: CgBlockOptions = {}): SectionDef {
  const at = (leaf: string): string | undefined => (opts.path ? `${opts.path}/${leaf}` : undefined);
  const fields: FieldDef[] = [
    {
      key: `${k}Fvc`,
      label: 'Full value of consideration received or receivable',
      type: 'num',
      span: 6,
      source: opts.source ?? 'broker',
      path: at('FullConsideration'),
    },
  ];
  if (opts.stamp) {
    fields.push({
      key: `${k}Stamp`,
      label: 'Value adopted by the stamp valuation authority',
      type: 'num',
      span: 6,
      path: at('ValueOfProp'),
    });
    fields.push({
      key: `${k}Fvc50c`,
      label: 'Full value adopted u/s 50C',
      type: 'num',
      span: 6,
      readOnly: true,
      hint: 'Rule 175/176: if the stamp value does not exceed 110% of the consideration, the consideration is used',
      path: at('FullConsideration50C'),
    });
  }
  fields.push(
    {
      key: `${k}Cost`,
      label: 'Cost of acquisition without indexation',
      type: 'num',
      span: 4,
      path: at('DeductSec48/AquisitCost'),
    },
    {
      key: `${k}Imp`,
      label: 'Cost of improvement without indexation',
      type: 'num',
      span: 4,
      path: at('DeductSec48/ImproveCost'),
    },
    {
      key: `${k}Exp`,
      label: 'Expenditure wholly and exclusively in connection with the transfer',
      type: 'num',
      span: 4,
      path: at('DeductSec48/ExpOnTrans'),
    },
  );
  if (opts.loss94) {
    fields.push({
      key: `${k}L94`,
      label: 'Loss to be disallowed u/s 94(7) or 94(8)',
      type: 'num',
      span: 6,
      hint: 'Where the asset was bought within 3 months of the record date and income or bonus units were received',
    });
  }
  if (opts.ded) {
    fields.push({
      key: `${k}Ded`,
      label: `Deduction u/s ${opts.ded} (give details in the exemption table below)`,
      type: 'num',
      span: 6,
    });
  }
  const base = `CG.${k}Fvc-(CG.${k}Cost+CG.${k}Imp+CG.${k}Exp)`;
  const balance = opts.loss94 ? `(${base})-CG.${k}L94` : `(${base})`;
  const net = opts.ded ? `${balance}-CG.${k}Ded` : balance;
  return {
    key: k,
    title,
    fields,
    calcs: [
      {
        key: `${k}TotDed`,
        label: 'Total deductions u/s 48',
        expr: `CG.${k}Cost+CG.${k}Imp+CG.${k}Exp`,
        path: at('DeductSec48/TotalDedn'),
      },
      {
        key: `${k}Net`,
        label: `${title.replace(/^A\d+ · |^B\d+ · /, '')} — net gain or loss`,
        expr: net,
        path: at('BalanceCG'),
      },
    ],
  };
}

/** The five instalment windows of Schedule CG table F, and the node each writes into. */
const CG_QUARTERS = [
  { node: 'Upto15Of6', label: 'Upto 15/6' },
  { node: 'Up16Of6To15Of9', label: '16/6 to 15/9' },
  { node: 'Up16Of9To15Of12', label: '16/9 to 15/12' },
  { node: 'Up16Of12To15Of3', label: '16/12 to 15/3' },
  { node: 'Up16Of3To31Of3', label: '16/3 to 31/3' },
] as const;

/** One row of Schedule CG table F, spread across the five instalment windows. */
function quarterlyRow(key: string, label: string, node: string): FieldDef[] {
  return CG_QUARTERS.map((q) => ({
    key: `${key}_${q.node}`,
    label: `${label} — ${q.label}`,
    type: 'num' as const,
    span: 2,
    source: 'broker' as const,
    path: `${node}/DateRange/${q.node}`,
  }));
}

/* Columns Schedule FA repeats across its tables. */

const FA_COUNTRY: ColumnDef = {
  key: 'faCountry',
  label: 'Country name and code',
  type: 'sel',
  required: true,
  options: COUNTRY,
  width: '11%',
  path: 'CountryName',
};

const FA_ZIP: ColumnDef = {
  key: 'faZip',
  label: 'ZIP code',
  type: 'text',
  required: true,
  maxLen: 12,
  width: '7%',
  path: 'ZipCode',
};

const FA_SCHEDULE: ColumnDef = {
  key: 'faSchOff',
  label: 'Schedule where offered',
  type: 'sel',
  width: '10%',
  options: [
    { value: 'S', label: 'Schedule S' },
    { value: 'HP', label: 'Schedule HP' },
    { value: 'CG', label: 'Schedule CG' },
    { value: 'OS', label: 'Schedule OS' },
    { value: 'EI', label: 'Schedule EI' },
  ],
  path: 'ScheduleWhereOffered',
};

const FA_ITEM: ColumnDef = {
  key: 'faItem',
  label: 'Item number of that schedule',
  type: 'text',
  maxLen: 12,
  width: '9%',
  path: 'ItemNumber',
};

const FA_STATUS: SelectOption[] = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Beneficial owner', label: 'Beneficial owner' },
  { value: 'Beneficiary', label: 'Beneficiary' },
];

const FA_OWNERSHIP: SelectOption[] = [
  { value: 'Direct', label: 'Direct' },
  { value: 'Beneficial owner', label: 'Beneficial owner' },
  { value: 'Beneficiary', label: 'Beneficiary' },
];

/* ─────────────────────────── 1 · Part A General ─────────────────────────── */

const GEN: ScheduleDef = {
  id: 'GEN',
  code: 'PartA_GEN1',
  no: 'A',
  name: 'Part A · General',
  sub: 'Personal information, filing status, residency',
  part: 'Part A — General',
  forms: ['ITR2'],
  sections: [
    {
      key: 'personal',
      title: 'Personal information',
      fields: [
        { key: 'firstName', label: 'First name', type: 'text', required: true, span: 4, maxLen: 25, source: 'eri', path: 'PartA_GEN1/PersonalInfo/AssesseeName/FirstName' },
        { key: 'middleName', label: 'Middle name', type: 'text', span: 4, maxLen: 25, source: 'eri', path: 'PartA_GEN1/PersonalInfo/AssesseeName/MiddleName' },
        { key: 'surname', label: 'Last name / surname', type: 'text', required: true, span: 4, maxLen: 75, source: 'eri', path: 'PartA_GEN1/PersonalInfo/AssesseeName/SurNameOrOrgName' },
        { key: 'pan', label: 'PAN', type: 'pan', required: true, span: 3, maxLen: 10, source: 'eri', hint: 'AAAAA9999A', path: 'PartA_GEN1/PersonalInfo/PAN' },
        { key: 'status', label: 'Status', type: 'sel', required: true, span: 3, source: 'eri', options: [{ value: 'I', label: 'I - Individual' }, { value: 'H', label: 'H - HUF' }], path: 'PartA_GEN1/PersonalInfo/Status' },
        { key: 'dob', label: 'Date of birth / formation', type: 'date', required: true, span: 3, source: 'eri', path: 'PartA_GEN1/PersonalInfo/DOB' },
        { key: 'gender', label: 'Gender', type: 'sel', span: 3, options: [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'T', label: 'Transgender' }], path: 'PartA_GEN1/PersonalInfo/Gender' },
        { key: 'aadhaar', label: 'Aadhaar number', type: 'aadhaar', required: true, span: 4, maxLen: 12, source: 'eri', hint: '12 digits, no spaces', path: 'PartA_GEN1/PersonalInfo/AadhaarCardNo' },
        { key: 'aadhaarEnrol', label: 'Aadhaar enrolment id (if not yet allotted)', type: 'text', span: 4, maxLen: 28, source: 'eri', path: 'PartA_GEN1/PersonalInfo/AadhaarEnrolmentId' },
        { key: 'passport', label: 'Passport number', type: 'text', span: 4, maxLen: 17, source: 'user', path: 'PartA_GEN1/PersonalInfo/PassportNo' },
      ],
    },
    {
      key: 'address',
      title: 'Primary address for communication',
      fields: [
        { key: 'flatNo', label: 'Flat / door / block no.', type: 'text', required: true, span: 4, maxLen: 50, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/ResidenceNo' },
        { key: 'premises', label: 'Name of premises / building / village', type: 'text', span: 4, maxLen: 50, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/ResidenceName' },
        { key: 'road', label: 'Road / street / post office', type: 'text', span: 4, maxLen: 50, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/RoadOrStreet' },
        { key: 'locality', label: 'Area / locality', type: 'text', required: true, span: 4, maxLen: 50, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/LocalityOrArea' },
        { key: 'city', label: 'Town / city / district', type: 'text', required: true, span: 4, maxLen: 25, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/CityOrTownOrDistrict' },
        { key: 'state', label: 'State', type: 'sel', required: true, span: 4, options: STATE, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/StateCode' },
        { key: 'country', label: 'Country / region', type: 'sel', required: true, span: 4, options: COUNTRY, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/CountryCode' },
        { key: 'pin', label: 'PIN code', type: 'pin', required: true, span: 4, maxLen: 6, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/PinCode' },
        { key: 'zip', label: 'ZIP code (if outside India)', type: 'text', span: 4, maxLen: 12, path: 'PartA_GEN1/PersonalInfo/Address/ZipCode' },
      ],
    },
    {
      key: 'contact',
      title: 'Contact details',
      fields: [
        { key: 'email', label: 'Primary email id', type: 'email', required: true, span: 6, maxLen: 125, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/EmailAddress' },
        { key: 'email2', label: 'Secondary email id', type: 'email', span: 6, maxLen: 125, path: 'PartA_GEN1/PersonalInfo/Address/EmailAddressSec' },
        { key: 'mobStd', label: 'Country code', type: 'text', required: true, span: 2, maxLen: 4, hint: '91', path: 'PartA_GEN1/PersonalInfo/Address/CountryCodeMobile' },
        { key: 'mobile', label: 'Primary mobile no.', type: 'mobile', required: true, span: 4, maxLen: 10, source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/MobileNo' },
        { key: 'mobStd2', label: 'Country code (secondary)', type: 'text', span: 2, maxLen: 4, path: 'PartA_GEN1/PersonalInfo/Address/CountryCodeMobileSec' },
        { key: 'mobile2', label: 'Secondary mobile no.', type: 'mobile', span: 4, maxLen: 10, path: 'PartA_GEN1/PersonalInfo/Address/MobileNoSec' },
        { key: 'stdCode', label: 'STD / ISD code', type: 'text', span: 3, maxLen: 5, path: 'PartA_GEN1/PersonalInfo/Address/STDcode' },
        { key: 'landline', label: 'Residence / office phone', type: 'text', span: 4, maxLen: 10, path: 'PartA_GEN1/PersonalInfo/Address/PhoneNo' },
      ],
    },
    {
      key: 'filing',
      title: 'Filing status',
      fields: [
        { key: 'filedUs', label: 'Return filed under section', type: 'sel', required: true, span: 6, options: ITR2_OPTIONS.FILEDUS, path: 'PartA_GEN1/FilingStatus/ReturnFileSec' },
        { key: 'noticeUs', label: 'Filed in response to notice u/s', type: 'sel', span: 6, options: [{ value: '11', label: 'Not applicable' }, { value: '1', label: '139(9)' }, { value: '2', label: '142(1)' }, { value: '3', label: '148' }, { value: '4', label: '153A/153C' }], path: 'PartA_GEN1/FilingStatus/NoticeSec' },
        { key: 'origReceipt', label: 'If revised / defective / modified, receipt no. of original', type: 'text', span: 6, maxLen: 15, path: 'PartA_GEN1/FilingStatus/ReceiptNo' },
        { key: 'origDate', label: 'Date of filing of original return', type: 'date', span: 6, path: 'PartA_GEN1/FilingStatus/OrigRetFiledDate' },
        { key: 'din', label: 'Unique number / DIN of notice or order', type: 'text', span: 6, maxLen: 23, path: 'PartA_GEN1/FilingStatus/NoticeNo' },
        { key: 'dinDate', label: 'Date of notice / order / APA', type: 'date', span: 6, path: 'PartA_GEN1/FilingStatus/NoticeDate' },
      ],
    },
    {
      key: 'residence',
      title: 'Residential status',
      fields: [
        { key: 'resStatus', label: 'Residential status in India', type: 'sel', required: true, span: 6, options: ITR2_OPTIONS.RESI, path: 'PartA_GEN1/FilingStatus/ResidentialStatus' },
        { key: 'resCond', label: 'Condition satisfied for residential status', type: 'sel', span: 6, options: ITR2_OPTIONS.RESCOND, showIf: { field: 'GEN.resStatus', equals: 'RES' }, path: 'PartA_GEN1/FilingStatus/ResidentialStatusCond' },
        { key: 'norCond', label: 'Condition satisfied for not ordinarily resident status', type: 'sel', span: 6, options: ITR2_OPTIONS.NORCOND, showIf: { field: 'GEN.resStatus', equals: 'NOR' }, path: 'PartA_GEN1/FilingStatus/ResidentialStatusNORCond' },
        { key: 'stayPY', label: 'Total stay in India during the previous year (days)', type: 'num', span: 6, min: 0, max: 366, source: 'user', path: 'PartA_GEN1/FilingStatus/NRIStayPrevYear' },
        { key: 'stay4Y', label: 'Total stay in India during the 4 preceding years (days)', type: 'num', span: 6, min: 0, max: 1461, source: 'user', path: 'PartA_GEN1/FilingStatus/NRIStayPrecYears' },
      ],
      tables: [
        {
          key: 'juris',
          title: 'Jurisdiction(s) of residence outside India',
          initialRows: 2,
          maxRows: 10,
          path: 'PartA_GEN1/FilingStatus/JurisdictionResPrevYr/JurisdictionResPrevYrDtls',
          columns: [
            { key: 'jCountry', label: 'Jurisdiction of residence', type: 'sel', options: COUNTRY, width: '46%', path: 'JurisdictionResidence' },
            { key: 'jTin', label: 'Taxpayer identification number', type: 'text', maxLen: 25, width: '46%', path: 'TIN' },
          ],
        },
      ],
    },
    {
      key: 'regime',
      title: 'Tax regime · section 115BAC',
      fields: [
        { key: 'optOut115', label: 'Do you wish to exercise the option u/s 115BAC(6) of opting out of the new tax regime?', type: 'sel', required: true, span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/OptOutNewTaxRegime' },
        { key: 'regimeOpt', label: 'Option for the current assessment year', type: 'sel', required: true, span: 6, options: ITR2_OPTIONS.BACNO, path: 'PartA_GEN1/FilingStatus/NewTaxRegime' },
        { key: 'f10ieDate', label: 'Date of filing Form 10-IEA', type: 'date', span: 6, source: 'forms', path: 'PartA_GEN1/FilingStatus/Form10IEDate' },
        { key: 'f10ieAck', label: 'Acknowledgement number of Form 10-IEA', type: 'text', span: 6, maxLen: 15, source: 'forms', path: 'PartA_GEN1/FilingStatus/Form10IEAckNo' },
      ],
    },
    {
      key: 'declarations',
      title: 'Seventh proviso and other declarations',
      fields: [
        { key: 'seventh', label: 'Filing under seventh proviso to section 139(1) though total income is below the exemption limit?', type: 'sel', required: true, span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/SeventhProvisio139' },
        { key: 'cash1cr', label: 'Deposited more than ₹1 crore in one or more current accounts?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/depCurrCont' },
        { key: 'travel2l', label: 'Spent more than ₹2 lakh on foreign travel?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/foreignTravExp' },
        { key: 'elec1l', label: 'Spent more than ₹1 lakh on electricity?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/elecExp' },
        { key: 'portuguese', label: 'Governed by the Portuguese Civil Code u/s 5A?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/PortugeseCC5A' },
        { key: 'isFpi', label: 'Are you a Foreign Portfolio Investor?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/FiiFpiFlag' },
        { key: 'sebiReg', label: 'SEBI registration number (if FPI)', type: 'text', required: true, span: 6, maxLen: 25, showIf: { field: 'GEN.isFpi', equals: 'Y' }, path: 'PartA_GEN1/FilingStatus/SebiRegnNo' },
        { key: 'partnerFirm', label: 'Are you a partner in a firm?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/PartnerInFirmFlg' },
        /* The prototype pointed this flag at AssetOutIndiaFlag, which Schedule FA
           already owns. Corrected against the ITR-3 node for the same table. */
        { key: 'unlisted', label: 'Held unlisted equity shares at any time during the year?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/HeldUnlistedEqShrPrYr/HeldUnlistedEqShrPrYrFlag' },
        { key: 'director', label: 'Were you a director in a company at any time during the year?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/CompDirectorPrvYrFlg' },
      ],
      tables: [
        {
          key: 'unlistedShares',
          title: 'Particulars of unlisted equity shares held at any time during the previous year',
          note: 'Every company whose unlisted shares you held at any point in the year, even where nothing was bought or sold.',
          initialRows: 1,
          maxRows: 25,
          source: 'demat',
          showIf: { field: 'GEN.unlisted', equals: 'Y' },
          path: 'PartA_GEN1/FilingStatus/HeldUnlistedEqShrPrYr/HeldUnlistedEqShrPrYrDtls',
          columns: [
            { key: 'coName', label: 'Name of the company', type: 'text', required: true, maxLen: 75, width: '16%', path: 'NameOfCompany' },
            { key: 'coType', label: 'Type of company', type: 'text', maxLen: 25, width: '9%', path: 'CompanyType' },
            { key: 'coPan', label: 'PAN of the company', type: 'pan', required: true, maxLen: 10, width: '9%', path: 'PAN' },
            { key: 'openShares', label: 'Opening balance — number of shares', type: 'dec', width: '9%', path: 'OpngBalNumberOfShares' },
            { key: 'openCost', label: 'Opening balance — cost of acquisition', type: 'num', width: '9%', path: 'OpngBalCostOfAcquisition' },
            { key: 'acqShares', label: 'Shares acquired during the year', type: 'dec', width: '8%', path: 'ShrAcqDurYrNumberOfShares' },
            { key: 'acqCost', label: 'Cost of acquisition', type: 'num', width: '8%', path: 'PurchasePricePerShare' },
            { key: 'issuePrice', label: 'Issue or purchase price per share', type: 'dec', width: '8%', path: 'IssuePricePerShare' },
            { key: 'trfShares', label: 'Shares transferred during the year', type: 'dec', width: '8%', path: 'ShrTrnfNumberOfShares' },
            { key: 'trfConsid', label: 'Sale consideration', type: 'num', width: '8%', path: 'ShrTrnfSaleConsideration' },
            { key: 'closeShares', label: 'Closing balance — number of shares', type: 'dec', width: '8%', path: 'ClsngBalNumberOfShares' },
            { key: 'closeCost', label: 'Closing balance — cost', type: 'num', width: '8%', path: 'ClsngBalCostOfAcquisition' },
          ],
        },
        {
          key: 'directorship',
          title: 'Particulars of directorships held during the previous year',
          initialRows: 1,
          maxRows: 15,
          source: 'user',
          showIf: { field: 'GEN.director', equals: 'Y' },
          path: 'PartA_GEN1/FilingStatus/CompDirectorPrvYr/CompDirectorPrvYrDtls',
          columns: [
            { key: 'dCoName', label: 'Name of the company', type: 'text', required: true, maxLen: 75, width: '30%', path: 'NameOfCompany' },
            { key: 'dCoType', label: 'Domestic or foreign', type: 'sel', required: true, width: '16%', options: [{ value: 'D', label: 'Domestic' }, { value: 'F', label: 'Foreign' }], path: 'CompanyType' },
            { key: 'dCoPan', label: 'PAN of the company', type: 'pan', maxLen: 10, width: '16%', path: 'PAN' },
            { key: 'din', label: 'Director Identification Number', type: 'text', required: true, maxLen: 8, width: '18%', path: 'DIN' },
            { key: 'dListed', label: 'Are the shares listed?', type: 'sel', required: true, width: '20%', options: [{ value: 'L', label: 'Listed' }, { value: 'U', label: 'Unlisted' }], path: 'SharesTypes' },
          ],
        },
      ],
    },
    {
      key: 'representative',
      title: 'Representative assessee and LEI',
      fields: [
        { key: 'repFlag', label: 'Is this return filed by a representative assessee?', type: 'sel', span: 6, options: YESNO, path: 'PartA_GEN1/FilingStatus/AsseseeRepFlg' },
        { key: 'repName', label: 'Name of the representative assessee', type: 'text', required: true, span: 6, maxLen: 75, showIf: { field: 'GEN.repFlag', equals: 'Y' }, path: 'PartA_GEN1/FilingStatus/AssesseeRep/RepName' },
        { key: 'repPan', label: 'PAN of the representative assessee', type: 'pan', required: true, span: 4, maxLen: 10, showIf: { field: 'GEN.repFlag', equals: 'Y' }, path: 'PartA_GEN1/FilingStatus/AssesseeRep/RepPAN' },
        { key: 'repEmail', label: 'Email of the representative assessee', type: 'email', span: 4, maxLen: 125, path: 'PartA_GEN1/FilingStatus/AssesseeRep/RepEmail' },
        { key: 'repMobile', label: 'Contact number of the representative assessee', type: 'mobile', span: 4, maxLen: 10, path: 'PartA_GEN1/FilingStatus/AssesseeRep/RepMobNo' },
        { key: 'lei', label: 'LEI number (mandatory if refund is ₹50 crore or more)', type: 'text', span: 6, maxLen: 20, source: 'user', path: 'PartA_GEN1/FilingStatus/LEI/LEINumber' },
        { key: 'leiDate', label: 'LEI valid up to', type: 'date', span: 6, source: 'user', path: 'PartA_GEN1/FilingStatus/LEI/ValidUptoDate' },
      ],
    },
  ],
};

/* ─────────────────────────── 2 · Schedule S ─────────────────────────── */

const SCHEDULE_S: ScheduleDef = {
  id: 'S',
  code: 'ScheduleS',
  no: 'S',
  name: 'Schedule S · Salary',
  sub: 'Details of income from salary',
  part: 'Part B — Heads of Income',
  forms: ['ITR2'],
  showIf: { field: 'GEN.status', equals: 'I' },
  sections: [
    {
      key: 'employers',
      title: 'Employers',
      tables: [
        {
          key: 'emp',
          title: 'Employer details',
          initialRows: 1,
          maxRows: 5,
          source: 'form16',
          path: 'ScheduleS/Salaries',
          columns: [
            { key: 'eName', label: 'Name of employer', type: 'text', required: true, maxLen: 75, source: 'form16', width: '20%', path: 'NameOfEmployer' },
            { key: 'eCat', label: 'Nature of employer', type: 'sel', required: true, options: ITR2_OPTIONS.EMPCAT, width: '16%', path: 'NatureOfEmployment' },
            { key: 'eTan', label: 'TAN of employer', type: 'tan', required: true, maxLen: 10, source: 'form26as', width: '12%', hint: 'Mandatory if tax deducted', path: 'TANofEmployer' },
            { key: 'eAddr', label: 'Address of employer', type: 'text', required: true, maxLen: 50, width: '18%', path: 'AddressDetail/AddrDetail' },
            { key: 'eCity', label: 'City', type: 'text', required: true, maxLen: 25, width: '12%', path: 'AddressDetail/CityOrTownOrDistrict' },
            { key: 'eState', label: 'State', type: 'sel', required: true, options: STATE, width: '14%', path: 'AddressDetail/StateCode' },
            { key: 'ePin', label: 'PIN', type: 'pin', required: true, maxLen: 6, width: '8%', path: 'AddressDetail/PinCode' },
          ],
        },
      ],
    },
    {
      key: 'gross',
      title: 'Gross salary',
      fields: [
        { key: 'sal17_1', label: 'Salary as per section 17(1)', type: 'num', required: true, span: 6, source: 'form16', path: 'ScheduleS/TotalGrossSalary/Salary' },
        { key: 'sal17_2', label: 'Value of perquisites as per section 17(2)', type: 'num', span: 6, source: 'form16', path: 'ScheduleS/TotalGrossSalary/PerquisitesValue' },
        { key: 'sal17_3', label: 'Profit in lieu of salary as per section 17(3)', type: 'num', span: 6, source: 'form16', path: 'ScheduleS/TotalGrossSalary/ProfitsInLieu' },
        { key: 'sal89A', label: 'Income from retirement benefit account maintained in a notified country u/s 89A', type: 'num', span: 6, path: 'ScheduleS/TotalGrossSalary/IncomeNotified89A' },
      ],
      calcs: [
        { key: 'grossSal', label: 'Gross salary (1a + 1b + 1c + 1d)', expr: 'S.sal17_1+S.sal17_2+S.sal17_3+S.sal89A', path: 'ScheduleS/TotalGrossSalary/GrossSalary' },
      ],
    },
    {
      key: 'exempt',
      title: 'Allowances exempt under section 10',
      tables: [
        {
          key: 'ex10',
          title: 'Exempt allowances',
          initialRows: 1,
          maxRows: 12,
          source: 'form16',
          path: 'ScheduleS/AllwncExemptUs10/AllwncExemptUs10Dtls',
          columns: [
            { key: 'exNat', label: 'Nature of exempt allowance', type: 'sel', required: true, options: ITR2_OPTIONS.ALLOW, width: '70%', path: 'SalNatureDesc' },
            { key: 'exAmt', label: 'Amount', type: 'num', required: true, source: 'form16', width: '30%', path: 'SalOthAmount' },
          ],
        },
      ],
    },
    {
      key: 'deductions',
      title: 'Deductions and net salary',
      fields: [
        { key: 'dedStd', label: 'Standard deduction u/s 16(ia)', type: 'num', span: 4, hint: '₹75,000 new regime / ₹50,000 old', path: 'ScheduleS/DeductionUS16ia' },
        { key: 'dedEnt', label: 'Entertainment allowance u/s 16(ii)', type: 'num', span: 4, path: 'ScheduleS/EntertainmntalwnceUs16ii' },
        { key: 'dedProf', label: 'Professional tax u/s 16(iii)', type: 'num', span: 4, path: 'ScheduleS/ProfessionalTaxUs16iii' },
      ],
      calcs: [
        { key: 'totExempt', label: 'Total exempt allowance u/s 10', expr: 'T(ex10.exAmt)', path: 'ScheduleS/AllwncExemptUs10/TotalAllwncExemptUs10' },
        { key: 'netSalary', label: 'Net salary (gross − exempt)', expr: 'S.grossSal-S.totExempt', path: 'ScheduleS/NetSalary' },
        { key: 'salChargeable', label: 'Income chargeable under the head Salaries', expr: 'S.netSalary-S.dedStd-S.dedEnt-S.dedProf', path: 'ScheduleS/TotIncUnderHeadSalaries' },
      ],
    },
  ],
};

/* ─────────────────────────── 3 · Schedule HP ─────────────────────────── */

const SCHEDULE_HP: ScheduleDef = {
  id: 'HP',
  code: 'ScheduleHP',
  no: 'HP',
  name: 'Schedule HP · House Property',
  sub: 'Income from house property',
  part: 'Part B — Heads of Income',
  forms: ['ITR2'],
  sections: [
    {
      key: 'property1',
      title: 'Property 1',
      fields: [
        { key: 'hpAddr1', label: 'Address of the property', type: 'text', required: true, span: 6, maxLen: 50, path: 'ScheduleHP/PropertyDetails/0/AddressDetailWithZipCode/AddrDetail' },
        { key: 'hpCity1', label: 'Town / city', type: 'text', required: true, span: 3, maxLen: 25, path: 'ScheduleHP/PropertyDetails/0/AddressDetailWithZipCode/CityOrTownOrDistrict' },
        { key: 'hpState1', label: 'State', type: 'sel', required: true, span: 3, options: STATE, path: 'ScheduleHP/PropertyDetails/0/AddressDetailWithZipCode/StateCode' },
        { key: 'hpPin1', label: 'PIN code', type: 'pin', required: true, span: 3, maxLen: 6, path: 'ScheduleHP/PropertyDetails/0/AddressDetailWithZipCode/PinCode' },
        { key: 'hpOwner1', label: 'Owner of the property', type: 'sel', required: true, span: 3, options: ITR2_OPTIONS.HPOWNER, path: 'ScheduleHP/PropertyDetails/0/OwnerPercentGet' },
        { key: 'hpCo1', label: 'Is the property co-owned?', type: 'sel', required: true, span: 3, options: YESNO, path: 'ScheduleHP/PropertyDetails/0/isPropertyCoOwned' },
        { key: 'hpShare1', label: 'Your share in the property (%)', type: 'dec', span: 3, min: 0, max: 100, path: 'ScheduleHP/PropertyDetails/0/AsseseeShareProperty' },
        { key: 'hpType1', label: 'Type of house property', type: 'sel', required: true, span: 4, options: [{ value: 'L', label: 'Let out' }, { value: 'S', label: 'Self occupied' }, { value: 'D', label: 'Deemed let out' }], path: 'ScheduleHP/PropertyDetails/0/ifLetOut' },
        { key: 'hpTenantName1', label: 'Name of tenant', type: 'text', span: 4, maxLen: 75, path: 'ScheduleHP/PropertyDetails/0/TenantDetails/0/NameOfTenant' },
        { key: 'hpTenantPan1', label: 'PAN / TAN of tenant (if TDS claimed)', type: 'text', span: 4, maxLen: 10, source: 'form26as', path: 'ScheduleHP/PropertyDetails/0/TenantDetails/0/PANofTenant' },
      ],
    },
    {
      key: 'computation1',
      title: 'Computation for property 1',
      fields: [
        { key: 'hpAlv1', label: 'Gross rent received / receivable / letable value', type: 'num', required: true, span: 4, source: 'user', path: 'ScheduleHP/PropertyDetails/0/Rentdetails/AnnualLetableValue' },
        { key: 'hpUnreal1', label: 'Rent which cannot be realised', type: 'num', span: 4, path: 'ScheduleHP/PropertyDetails/0/Rentdetails/RentNotRealized' },
        { key: 'hpTax1', label: 'Tax paid to local authorities', type: 'num', span: 4, source: 'user', path: 'ScheduleHP/PropertyDetails/0/Rentdetails/LocalTaxes' },
        { key: 'hpInt1', label: 'Interest payable on borrowed capital u/s 24(b)', type: 'num', span: 6, source: 'lender', hint: 'Capped at ₹2,00,000 for self-occupied', path: 'ScheduleHP/PropertyDetails/0/Rentdetails/IntOnBorwCap' },
        { key: 'hpArrear1', label: 'Arrears / unrealised rent received during the year, less 30%', type: 'num', span: 6, path: 'ScheduleHP/PropertyDetails/0/Rentdetails/ArrearsUnrealizedRentRcvd' },
      ],
      calcs: [
        { key: 'hpAnnual1', label: 'Annual value (gross rent − unrealised rent − local tax)', expr: 'HP.hpAlv1-HP.hpUnreal1-HP.hpTax1', path: 'ScheduleHP/PropertyDetails/0/Rentdetails/AnnualValue' },
        { key: 'hpStd1', label: '30% of annual value u/s 24(a)', expr: 'R(HP.hpAnnual1*0.3)', path: 'ScheduleHP/PropertyDetails/0/Rentdetails/ThirtyPercentOfBalance' },
        { key: 'hpNet1', label: 'Income from house property 1', expr: 'HP.hpAnnual1-R(HP.hpAnnual1*0.3)-HP.hpInt1+HP.hpArrear1', path: 'ScheduleHP/PropertyDetails/0/Rentdetails/IncomeOfHP' },
      ],
    },
    {
      key: 'loans',
      title: 'Home loan details, section 24(b)',
      note: 'The departmental child names inside the section 24(b) block are not in the prototype, so only the block itself carries a path.',
      tables: [
        {
          key: 'loan',
          title: 'Loans against this property',
          initialRows: 1,
          maxRows: 8,
          source: 'lender',
          path: 'ScheduleHP/PropertyDetails/0/Rentdetails/Section24B/Section24BDtls',
          columns: [
            { key: 'lnType', label: 'Loan from', type: 'sel', required: true, options: [{ value: 'B', label: 'Bank' }, { value: 'O', label: 'Other than bank' }], width: '14%' },
            { key: 'lnName', label: 'Name of the lender', type: 'text', required: true, maxLen: 75, source: 'lender', width: '24%' },
            { key: 'lnAcc', label: 'Loan account number', type: 'text', required: true, maxLen: 25, width: '18%' },
            { key: 'lnDate', label: 'Date of sanction', type: 'date', required: true, width: '14%' },
            { key: 'lnAmt', label: 'Sanctioned amount', type: 'num', required: true, width: '12%' },
            { key: 'lnOut', label: 'Outstanding as on 31-03-2026', type: 'num', required: true, width: '12%' },
            { key: 'lnInt', label: 'Interest for the year', type: 'num', required: true, source: 'lender', width: '12%' },
          ],
        },
      ],
    },
    {
      key: 'total',
      title: 'Total',
      calcs: [
        { key: 'hpTotal', label: 'Income chargeable under the head House Property', expr: 'HP.hpNet1', path: 'ScheduleHP/TotalIncomeChargeableUnHP' },
      ],
    },
  ],
};

/* ─────────────────────────── 4 · Schedule CG ─────────────────────────── */

const CG_ST_PATH = 'ScheduleCGFor23/ShortTermCapGainFor23';
const CG_LT_PATH = 'ScheduleCGFor23/LongTermCapGain23';

const SCHEDULE_CG: ScheduleDef = {
  id: 'CG',
  code: 'ScheduleCGFor23',
  no: 'CG',
  name: 'Schedule CG · Capital Gains',
  sub: 'Full computation, short term and long term',
  part: 'Part B — Heads of Income',
  forms: ['ITR2'],
  sections: [
    /* ---------- A · short term ---------- */
    cgBlock('a1', 'A1 · From sale of land or building or both', {
      stamp: true,
      source: 'ais',
      ded: '54B',
      path: `${CG_ST_PATH}/SaleofLandBuild/SaleofLandBuildDtls/0`,
    }),
    {
      key: 'a1buyers',
      title: 'A1 · buyer details, where the property was transferred',
      tables: [
        {
          key: 'a1buy',
          title: 'Buyer details (mandatory where tax is deducted u/s 194-IA)',
          initialRows: 1,
          maxRows: 10,
          path: `${CG_ST_PATH}/SaleofLandBuild/SaleofLandBuildDtls/0/TrnsfImmblPrprty/TrnsfImmblPrprtyDtls`,
          columns: [
            { key: 'bName', label: 'Name of buyer', type: 'text', required: true, maxLen: 75, width: '22%', path: 'NameOfBuyer' },
            { key: 'bPan', label: 'PAN of buyer', type: 'pan', required: true, maxLen: 10, source: 'form26as', width: '14%', path: 'PANofBuyer' },
            { key: 'bAadh', label: 'Aadhaar of buyer', type: 'aadhaar', maxLen: 12, width: '14%', path: 'AadhaarOfBuyer' },
            { key: 'bShare', label: 'Percentage share', type: 'dec', required: true, min: 0, max: 100, width: '12%', path: 'PercentageShare' },
            { key: 'bAmt', label: 'Amount', type: 'num', required: true, width: '14%', path: 'AmtPaidOrCredited' },
            { key: 'bAddr', label: 'Address of property', type: 'text', required: true, maxLen: 50, width: '24%', path: 'AddressOfProperty' },
          ],
        },
      ],
    },
    {
      key: 'a2',
      title: 'A2 · From slump sale',
      fields: [
        { key: 'a2Fmv2', label: 'Fair market value as per Rule 11UAE(2)', type: 'num', span: 4, path: `${CG_ST_PATH}/SlumpSale/FMV` },
        { key: 'a2Fmv3', label: 'Fair market value as per Rule 11UAE(3)', type: 'num', span: 4, path: `${CG_ST_PATH}/SlumpSale/FMVRule11UAE3` },
        { key: 'a2Net', label: 'Net worth of the undertaking or division', type: 'num', span: 4, path: `${CG_ST_PATH}/SlumpSale/NetWorthUndOrDiv` },
      ],
      calcs: [
        { key: 'a2Fvc', label: 'Full value of consideration (higher of the two fair market values)', expr: 'MAX(CG.a2Fmv2,CG.a2Fmv3)', path: `${CG_ST_PATH}/SlumpSale/FullConsideration` },
        { key: 'a2Gain', label: 'A2 — short term capital gain from slump sale', expr: 'MAX(CG.a2Fmv2,CG.a2Fmv3)-CG.a2Net', path: `${CG_ST_PATH}/SlumpSale/STCGSlumpSale` },
      ],
    },
    cgBlock('a3a', 'A3(i) · Equity share or equity oriented MF, STT paid, transferred before 23 July 2024', {
      loss94: true,
      source: 'broker',
      path: `${CG_ST_PATH}/EquityMFonSTT/0`,
    }),
    cgBlock('a3b', 'A3(ii) · Equity share or equity oriented MF, STT paid, transferred on or after 23 July 2024', {
      loss94: true,
      source: 'broker',
      path: `${CG_ST_PATH}/EquityMFonSTT/1`,
    }),
    {
      key: 'a4',
      title: 'A4 · Non-resident, not an FII — sale of shares or debentures of an Indian company',
      fields: [
        { key: 'a4Pre', label: 'STCG covered u/s 111A where the transfer was before 23 July 2024', type: 'num', span: 6, path: `${CG_ST_PATH}/NRITransacSec48Dtl/NRItransacSaleSec48Pre` },
        { key: 'a4Post', label: 'STCG covered u/s 111A where the transfer was on or after 23 July 2024', type: 'num', span: 6, path: `${CG_ST_PATH}/NRITransacSec48Dtl/NRItransacSaleSec48Post` },
        { key: 'a4Oth', label: 'STCG from sale of shares not covered above, or sale of debentures', type: 'num', span: 6, path: `${CG_ST_PATH}/NRITransacSec48Dtl/NRItransacSaleOther` },
      ],
      calcs: [{ key: 'a4Net', label: 'A4 — total', expr: 'CG.a4Pre+CG.a4Post+CG.a4Oth' }],
    },
    cgBlock('a5', 'A5 · Non-resident FII — sale of securities u/s 115AD', {
      loss94: true,
      path: `${CG_ST_PATH}/NRISecur115AD`,
    }),
    cgBlock('a6', 'A6 · From sale of assets other than A1 to A5', {
      loss94: true,
      source: 'cas',
      ded: '54D / 54G / 54GA',
      path: `${CG_ST_PATH}/SaleOnOtherAssets`,
    }),
    {
      key: 'a7a9',
      title: 'A7 to A9 · deemed gains, pass-through and DTAA',
      fields: [
        { key: 'a7Dep', label: 'Deemed short term capital gain on depreciable assets', type: 'num', span: 6, path: `${CG_ST_PATH}/STCGDeemedDepnAssets` },
        { key: 'a7Unutil', label: 'Amount deemed to be STCG on unutilised capital gain deposited in CGAS', type: 'num', span: 6, path: `${CG_ST_PATH}/AmtDeemedStcg` },
        { key: 'a8Pti15', label: 'Pass-through STCG chargeable at 15%', type: 'num', span: 4, path: `${CG_ST_PATH}/PassThrIncNatureSTCG15Per` },
        { key: 'a8Pti20', label: 'Pass-through STCG chargeable at 20%', type: 'num', span: 4, path: `${CG_ST_PATH}/PassThrIncNatureSTCG20Per` },
        { key: 'a8Pti30', label: 'Pass-through STCG chargeable at 30%', type: 'num', span: 4, path: `${CG_ST_PATH}/PassThrIncNatureSTCG30Per` },
        { key: 'a8PtiApp', label: 'Pass-through STCG chargeable at applicable rates', type: 'num', span: 6, path: `${CG_ST_PATH}/PassThrIncNatureSTCGAppRate` },
        { key: 'a9Dtaa', label: 'STCG included above but not chargeable, or chargeable at special rates, as per DTAA', type: 'num', span: 6, path: `${CG_ST_PATH}/TotalSTCGNotChrgblDTAA` },
      ],
      calcs: [
        {
          key: 'stTotal',
          label: 'Total short term capital gain (A1 to A9)',
          expr: 'CG.a1Net+CG.a2Gain+CG.a3aNet+CG.a3bNet+CG.a4Net+CG.a5Net+CG.a6Net+CG.a7Dep+CG.a7Unutil+CG.a8Pti15+CG.a8Pti20+CG.a8Pti30+CG.a8PtiApp-CG.a9Dtaa',
          path: `${CG_ST_PATH}/TotalSTCG`,
        },
      ],
    },

    /* ---------- B · long term ---------- */
    cgBlock('b1', 'B1 · From sale of land or building or both', {
      stamp: true,
      source: 'ais',
      ded: '54 / 54B / 54EC / 54F',
      path: `${CG_LT_PATH}/SaleofLandBuild/SaleofLandBuildDtls/0`,
    }),
    cgBlock('b2', 'B2 · From sale of bonds or debentures (other than capital indexed bonds)', {
      source: 'demat',
      path: `${CG_LT_PATH}/SaleofBondsDebntr`,
    }),
    {
      key: 'b3',
      title: 'B3 · Equity share or equity oriented MF or business trust unit, STT paid, u/s 112A',
      fields: [
        { key: 'b3Ltcg', label: 'LTCG u/s 112A from Schedule 112A, column 14', type: 'num', span: 6, source: 'broker', hint: 'Fill the scrip-wise table in Schedule 112A below and this follows from it', path: `${CG_LT_PATH}/SaleOfEquityShareUs112A/BalanceCG` },
        { key: 'b3Exempt', label: 'Exemption of ₹1,25,000 applied at the tax computation stage', type: 'num', span: 6, readOnly: true, hint: 'Do not reduce it here' },
      ],
    },
    cgBlock('b4', 'B4 · From sale of assets where indexation benefit is not available', {
      source: 'cas',
      path: `${CG_LT_PATH}/SaleofAssetNA`,
    }),
    cgBlock('b5', 'B5 · From sale of assets where indexation benefit is available', {
      source: 'cas',
      ded: '54 / 54EC / 54F',
      path: `${CG_LT_PATH}/SaleofAssetIndexed`,
    }),
    {
      key: 'b6b9',
      title: 'B6 to B9 · non-resident, pass-through, DTAA',
      fields: [
        { key: 'b6Nri112a', label: 'LTCG u/s 112A for non-residents', type: 'num', span: 6, path: `${CG_LT_PATH}/NRISaleOfEquityShareUs112A/BalanceCG` },
        { key: 'b6Nri115', label: 'LTCG for non-residents u/s 115AB, 115AC, 115ACA or 115AD', type: 'num', span: 6, path: `${CG_LT_PATH}/NRIOnSec112and115/BalanceCG` },
        { key: 'b7Unutil', label: 'Amount deemed to be LTCG on unutilised capital gain deposited in CGAS', type: 'num', span: 6, path: `${CG_LT_PATH}/AmtDeemedLtcg` },
        { key: 'b8Pti10', label: 'Pass-through LTCG chargeable at 10%', type: 'num', span: 4, path: `${CG_LT_PATH}/PassThrIncNatureLTCG10Per` },
        { key: 'b8Pti125', label: 'Pass-through LTCG chargeable at 12.5%', type: 'num', span: 4, path: `${CG_LT_PATH}/PassThrIncNatureLTCG125Per` },
        { key: 'b8Pti20', label: 'Pass-through LTCG chargeable at 20%', type: 'num', span: 4, path: `${CG_LT_PATH}/PassThrIncNatureLTCG20Per` },
        { key: 'b9Dtaa', label: 'LTCG included above but not chargeable, or chargeable at special rates, as per DTAA', type: 'num', span: 6, path: `${CG_LT_PATH}/TotalLTCGNotChrgblDTAA` },
      ],
      calcs: [
        {
          key: 'ltTotal',
          label: 'Total long term capital gain (B1 to B9)',
          expr: 'CG.b1Net+CG.b2Net+CG.b3Ltcg+CG.b4Net+CG.b5Net+CG.b6Nri112a+CG.b6Nri115+CG.b7Unutil+CG.b8Pti10+CG.b8Pti125+CG.b8Pti20-CG.b9Dtaa',
          path: `${CG_LT_PATH}/TotalLTCG`,
        },
      ],
    },

    /* ---------- Schedule 112A ---------- */
    {
      key: 'sch112a',
      title: 'Schedule 112A · scrip-wise detail',
      tables: [
        {
          key: 's112a',
          title: 'Equity shares and units where STT is paid, sold on or after 01-04-2018',
          initialRows: 1,
          maxRows: 100,
          source: 'cas',
          path: 'Schedule112A/Schedule112ADtls',
          columns: [
            { key: 'isin', label: 'ISIN', type: 'isin', required: true, maxLen: 12, source: 'demat', width: '9%', path: 'ISINCode' },
            { key: 'scrip', label: 'Name of share or unit (2)', type: 'text', required: true, maxLen: 75, source: 'broker', width: '14%', path: 'ShareUnitName' },
            { key: 'acq', label: 'Acquired (3)', type: 'sel', required: true, width: '9%', options: [{ value: 'B', label: 'On or before 31-01-2018' }, { value: 'A', label: 'After 31-01-2018' }], path: 'AcquisitionDateFlag' },
            { key: 'qty', label: 'Units (4)', type: 'dec', required: true, width: '6%', path: 'NumSharesUnits' },
            { key: 'sprice', label: 'Sale price per unit (5)', type: 'dec', width: '8%', path: 'SalePricePerShareUnit' },
            { key: 'sale', label: 'Total sale value (6)', type: 'num', required: true, source: 'broker', width: '9%', path: 'TotSaleValue' },
            { key: 'cost', label: 'Actual cost of acquisition (8)', type: 'num', required: true, width: '10%', path: 'CostAcqWithoutIndx' },
            { key: 'fmvu', label: 'FMV per unit on 31-01-2018 (10)', type: 'dec', source: 'broker', width: '9%', path: 'FairMktValuePerShareUnit' },
            { key: 'fmv', label: 'Total FMV (11)', type: 'num', width: '8%', path: 'TotFairMktValueCapAst' },
            { key: 'exp', label: 'Transfer expenditure (12)', type: 'num', width: '8%', path: 'ExpExclCnctTransfer' },
            { key: 'c7', label: 'Cost used (7)', type: 'num', readOnly: true, width: '8%', path: 'TotalDeduction' },
            { key: 'c14', label: 'Balance (14)', type: 'num', readOnly: true, width: '8%', path: 'Balance' },
            { key: 'dbuy', label: 'Date of purchase', type: 'date', width: '9%' },
            { key: 'dsale', label: 'Date of sale', type: 'date', width: '9%' },
          ],
        },
      ],
    },

    /* ---------- D · exemptions ---------- */
    {
      key: 'exemptions',
      title: 'D · Deduction claimed against capital gains',
      note: 'The department keeps a separate node per section — DeducClaimInfo/DeducClaimDtlsUs54, …Us54B and so on — so the section column routes the row.',
      tables: [
        {
          key: 'cgex',
          title: 'Exemption u/s 54, 54B, 54EC, 54F, 54GB, 115F',
          initialRows: 1,
          maxRows: 12,
          path: 'ScheduleCGFor23/DeducClaimInfo',
          columns: [
            {
              key: 'exSec',
              label: 'Section',
              type: 'sel',
              required: true,
              width: '11%',
              options: [
                { value: '54', label: '54' },
                { value: '54B', label: '54B' },
                { value: '54D', label: '54D' },
                { value: '54EC', label: '54EC' },
                { value: '54F', label: '54F' },
                { value: '54G', label: '54G' },
                { value: '54GA', label: '54GA' },
                { value: '54GB', label: '54GB' },
                { value: '115F', label: '115F' },
              ],
            },
            { key: 'exDatePur', label: 'Date of transfer of original asset', type: 'date', required: true, width: '16%', path: 'DateofTransfer' },
            { key: 'exCost', label: 'Cost of new asset', type: 'num', required: true, width: '15%', path: 'CostofNewResHouse' },
            { key: 'exDateInv', label: 'Date of purchase or construction', type: 'date', required: true, width: '16%', path: 'DatePurchase' },
            { key: 'exDep', label: 'Amount deposited in CGAS before the due date', type: 'num', width: '18%', path: 'AmtDeposited' },
            { key: 'exAmt', label: 'Deduction claimed', type: 'num', required: true, width: '14%', path: 'AmtDeducted' },
            { key: 'exBond', label: 'Date of investment in bonds (54EC)', type: 'date', width: '10%', path: 'DateofInvestment' },
          ],
        },
      ],
    },

    /* ---------- F · quarterly accrual ---------- */
    {
      key: 'accrual',
      title: 'F · Information about accrual or receipt of capital gain',
      note: 'Table F is not mandatory for a resident senior citizen or super senior citizen who has no income under the head Business or Profession. It drives interest u/s 234C, so fill it if either applies.',
      fields: [
        ...quarterlyRow('q15', 'Short term capital gain taxable at 15%', 'ScheduleCGFor23/CurrYrLosses/InStcg15Per'),
        ...quarterlyRow('q20', 'Short term capital gain taxable at 20%', 'ScheduleCGFor23/CurrYrLosses/InStcg20Per'),
        ...quarterlyRow('q30', 'Short term capital gain taxable at 30%', 'ScheduleCGFor23/CurrYrLosses/InStcg30Per'),
        ...quarterlyRow('qapp', 'Short term capital gain taxable at applicable rates', 'ScheduleCGFor23/CurrYrLosses/InStcgAppRate'),
        ...quarterlyRow('qsdt', 'Short term capital gain taxable at DTAA rates', 'ScheduleCGFor23/CurrYrLosses/InStcgDTAARate'),
        ...quarterlyRow('ql10', 'Long term capital gain taxable at 10%', 'ScheduleCGFor23/CurrYrLosses/InLtcg10Per'),
        ...quarterlyRow('ql125', 'Long term capital gain taxable at 12.5%', 'ScheduleCGFor23/CurrYrLosses/InLtcg125Per'),
        ...quarterlyRow('ql20', 'Long term capital gain taxable at 20%', 'ScheduleCGFor23/CurrYrLosses/InLtcg20Per'),
        ...quarterlyRow('qldt', 'Long term capital gain taxable at DTAA rates', 'ScheduleCGFor23/CurrYrLosses/InLtcgDTAARate'),
        ...quarterlyRow('qvda', 'Gain on transfer of virtual digital assets taxable at 30%', 'ScheduleVDA/VDAQuarterly'),
      ],
    },

    /* ---------- total ---------- */
    {
      key: 'total',
      title: 'Total capital gains',
      calcs: [
        { key: 'cgExTot', label: 'Total exemption claimed under D', expr: 'T(cgex.exAmt)' },
        { key: 'cgTotal', label: 'Income chargeable under the head Capital Gains', expr: 'CG.stTotal+CG.ltTotal-T(cgex.exAmt)', path: 'ScheduleCGFor23/TotScheduleCGFor23' },
        { key: 'accCheck', label: 'Sum of table F across all quarters (should equal the total above)', expr: 'Q(acc)', internal: true },
      ],
    },
  ],
};

/* ─────────────────────────── 5 · Schedule OS ─────────────────────────── */

const SCHEDULE_OS: ScheduleDef = {
  id: 'OS',
  code: 'ScheduleOS',
  no: 'OS',
  name: 'Schedule OS · Other Sources',
  sub: 'Income from other sources',
  part: 'Part B — Heads of Income',
  forms: ['ITR2'],
  sections: [
    {
      key: 'gross',
      title: 'Gross income',
      fields: [
        { key: 'osDiv', label: 'Dividend income (other than u/s 2(22)(e))', type: 'num', span: 6, source: 'ais', path: 'ScheduleOS/IncOthThanOwnRaceHorse/DividendGross' },
        { key: 'osSb', label: 'Interest from savings bank account', type: 'num', span: 6, source: 'bank', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IntrstFrmSavingBank' },
        { key: 'osFd', label: 'Interest from deposits (bank, post office, co-operative)', type: 'num', span: 6, source: 'ais', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IntrstFrmTermDeposit' },
        { key: 'osItr', label: 'Interest on income tax refund', type: 'num', span: 6, source: 'form26as', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IntrstFrmIncmTaxRefund' },
        { key: 'osFamPen', label: 'Family pension', type: 'num', span: 6, path: 'ScheduleOS/IncOthThanOwnRaceHorse/FamilyPension' },
        { key: 'osOthInt', label: 'Any other interest income', type: 'num', span: 6, source: 'ais', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IntrstFrmOthers' },
        { key: 'osGift', label: 'Sum chargeable u/s 56(2)(x) — gifts received', type: 'num', span: 6, path: 'ScheduleOS/IncOthThanOwnRaceHorse/AnyOtherIncome' },
        { key: 'osLottery', label: 'Winnings from lottery, crossword, games, betting u/s 115BB', type: 'num', span: 6, source: 'ais', path: 'ScheduleOS/IncChargeable' },
        { key: 'osOther', label: 'Any other income', type: 'num', span: 6, path: 'ScheduleOS/IncOthThanOwnRaceHorse/AnyOtherIncomeChargeable' },
        { key: 'os2_22e', label: 'Deemed dividend u/s 2(22)(e)', type: 'num', span: 6, path: 'ScheduleOS/IncOthThanOwnRaceHorse/DeemedIncomeUs2_22e' },
      ],
      calcs: [
        {
          key: 'osGross',
          label: 'Gross income from other sources',
          expr: 'OS.osDiv+OS.osSb+OS.osFd+OS.osItr+OS.osFamPen+OS.osOthInt+OS.osGift+OS.osLottery+OS.osOther+OS.os2_22e',
          path: 'ScheduleOS/IncChargeable',
        },
      ],
    },
    {
      key: 'deductions57',
      title: 'Deductions u/s 57',
      fields: [
        { key: 'os57i', label: 'Expenses u/s 57(i) — commission or remuneration for realising dividend or interest', type: 'num', span: 6, path: 'ScheduleOS/DeductionUS57/Expenses' },
        { key: 'os57iia', label: 'Deduction u/s 57(iia) on family pension', type: 'num', span: 6, hint: 'Lower of ⅓ of pension or ₹25,000 (new regime) / ₹15,000 (old)', path: 'ScheduleOS/DeductionUS57/FamilyPension' },
        { key: 'os57Dep', label: 'Depreciation u/s 57', type: 'num', span: 6, path: 'ScheduleOS/DeductionUS57/Depreciation' },
        { key: 'os57Oth', label: 'Any other deduction u/s 57', type: 'num', span: 6, path: 'ScheduleOS/DeductionUS57/AnyOther' },
      ],
      calcs: [
        { key: 'os57Tot', label: 'Total deductions u/s 57', expr: 'OS.os57i+OS.os57iia+OS.os57Dep+OS.os57Oth', path: 'ScheduleOS/DeductionUS57/TotDeductions' },
        { key: 'osNet', label: 'Income chargeable under the head Other Sources', expr: 'OS.osGross-OS.os57Tot', path: 'ScheduleOS/TotOthSrcNoRaceHorse' },
      ],
    },
  ],
};

/* ─────────────────────────── 6 · Schedule CYLA / BFLA ─────────────────────────── */

const SCHEDULE_CYLA: ScheduleDef = {
  id: 'CYLA',
  code: 'ScheduleCYLA',
  no: 'CY',
  name: 'Schedule CYLA · BFLA',
  sub: 'Set-off of current year and brought forward losses',
  part: 'Part C — Set-off and Carry Forward',
  forms: ['ITR2'],
  sections: [
    {
      key: 'cyla',
      title: 'Schedule CYLA · set-off of current year losses',
      note: 'House property loss can be set off against any other head, but only up to ₹2,00,000 in a year under section 71(3A). Anything above that carries forward. Loss under Other Sources can be set off against any head other than race horses. Capital losses are not set off here — they are adjusted within Schedule CG and the balance carries forward through Schedule CFL. The grid itself is produced by the set-off engine, so it holds no editable fields.',
    },
    {
      key: 'bfla',
      title: 'Schedule BFLA · set-off of brought forward losses of earlier years',
      note: 'Brought forward house property loss can only be set off against house property income. Brought forward short term capital loss can be set off against both short and long term gains, but brought forward long term capital loss only against long term gains.',
    },
    {
      key: 'manual',
      title: 'Manual entries',
      fields: [
        { key: 'osraceInc', label: 'Profit from owning and maintaining race horses, current year', type: 'num', span: 6, path: 'ScheduleOS/IncFromOwnHorse/BalanceOwnRaceHorse' },
        { key: 'osdtaaInc', label: 'Income from other sources taxable at DTAA rates, current year', type: 'num', span: 6 },
        { key: 'cylaOverride', label: 'Do you want to edit the set-off figures instead of using the computed ones?', type: 'sel', span: 6, options: [{ value: 'Y', label: 'Yes, let me edit' }, { value: 'N', label: 'No, keep them computed' }] },
      ],
    },
  ],
};

/* ─────────────────────────── 7 · Schedule CFL ─────────────────────────── */

const SCHEDULE_CFL: ScheduleDef = {
  id: 'CFL',
  code: 'ScheduleCFL',
  no: 'CFL',
  name: 'Schedule CFL · Carry Forward',
  sub: 'Losses to be carried forward to future years',
  part: 'Part C — Set-off and Carry Forward',
  forms: ['ITR2'],
  sections: [
    {
      key: 'broughtForward',
      title: 'Brought forward losses of earlier assessment years',
      note: 'House property loss and capital losses may be carried forward for eight assessment years. Loss from owning and maintaining race horses may be carried forward for four. A loss can only be carried forward if the return for that year was filed within the due date under section 139(1). The department keeps one node per year, so the assessment year column routes the row.',
      tables: [
        {
          key: 'cfl',
          title: 'Year-wise brought forward losses',
          initialRows: 3,
          maxRows: 16,
          path: 'ScheduleCFL',
          columns: [
            {
              key: 'ay',
              label: 'Assessment year',
              type: 'sel',
              required: true,
              width: '14%',
              options: [
                { value: '2018-19', label: '2018-19' },
                { value: '2019-20', label: '2019-20' },
                { value: '2020-21', label: '2020-21' },
                { value: '2021-22', label: '2021-22' },
                { value: '2022-23', label: '2022-23' },
                { value: '2023-24', label: '2023-24' },
                { value: '2024-25', label: '2024-25' },
                { value: '2025-26', label: '2025-26' },
              ],
            },
            { key: 'fdate', label: 'Date of filing of that return', type: 'date', required: true, width: '16%', path: 'CarryFwdLossDetail/DateOfFiling' },
            { key: 'hpLoss', label: 'House property loss', type: 'num', width: '17%', path: 'CarryFwdLossDetail/TotalHPPTILossCF' },
            { key: 'stcl', label: 'Short term capital loss', type: 'num', width: '17%', path: 'CarryFwdLossDetail/TotalSTCGPTILossCF' },
            { key: 'ltcl', label: 'Long term capital loss', type: 'num', width: '17%', path: 'CarryFwdLossDetail/TotalLTCGPTILossCF' },
            { key: 'raceLoss', label: 'Loss from owning and maintaining race horses', type: 'num', width: '19%', path: 'CarryFwdLossDetail/OthSrcLossRaceHorseCF' },
          ],
        },
      ],
    },
    {
      key: 'currentYear',
      title: 'Current year losses and totals',
      fields: [
        { key: 'cyHpLoss', label: 'House property loss of the current year remaining after set-off', type: 'num', span: 6, readOnly: true, hint: 'Carried from Schedule CYLA', path: 'ScheduleCFL/LossCFCurrentAssmntYear2026/CarryFwdLossDetail/TotalHPPTILossCF' },
        { key: 'cyStcl', label: 'Short term capital loss of the current year', type: 'num', span: 6, path: 'ScheduleCFL/LossCFCurrentAssmntYear2026/CarryFwdLossDetail/TotalSTCGPTILossCF' },
        { key: 'cyLtcl', label: 'Long term capital loss of the current year', type: 'num', span: 6, path: 'ScheduleCFL/LossCFCurrentAssmntYear2026/CarryFwdLossDetail/TotalLTCGPTILossCF' },
        { key: 'cyRace', label: 'Loss from race horses in the current year', type: 'num', span: 6, path: 'ScheduleCFL/LossCFCurrentAssmntYear2026/CarryFwdLossDetail/OthSrcLossRaceHorseCF' },
      ],
      calcs: [
        { key: 'cflHpBf', label: 'Total brought forward house property loss', expr: 'T(cfl.hpLoss)' },
        { key: 'cflStclBf', label: 'Total brought forward short term capital loss', expr: 'T(cfl.stcl)' },
        { key: 'cflLtclBf', label: 'Total brought forward long term capital loss', expr: 'T(cfl.ltcl)' },
        { key: 'cflRaceBf', label: 'Total brought forward race horse loss', expr: 'T(cfl.raceLoss)' },
        { key: 'cflEarlier', label: 'Total of earlier year losses', expr: 'T(cfl.hpLoss)+T(cfl.stcl)+T(cfl.ltcl)+T(cfl.raceLoss)', path: 'ScheduleCFL/TotalOfBFLossesSetoff/TotalHPPTILossCF' },
        { key: 'cflAdjusted', label: 'Losses adjusted in Schedule BFLA this year', expr: 'B(total)' },
        {
          key: 'cflCarry',
          label: 'Total loss carried forward to future years',
          expr: 'MAX(T(cfl.hpLoss)+T(cfl.stcl)+T(cfl.ltcl)+T(cfl.raceLoss)-B(total),0)+CFL.cyHpLoss+CFL.cyStcl+CFL.cyLtcl+CFL.cyRace',
          path: 'ScheduleCFL/TotalLossCFSummary/TotalHPPTILossCF',
        },
      ],
    },
  ],
};

/* ─────────────────────────── 8 · Schedule VI-A ─────────────────────────── */

const SCHEDULE_VIA: ScheduleDef = {
  id: 'VIA',
  code: 'ScheduleVIA',
  no: 'VI-A',
  name: 'Schedule VI-A · Deductions',
  sub: 'Deductions under Chapter VI-A',
  part: 'Part D — Deductions',
  forms: ['ITR2'],
  sections: [
    {
      key: 'partB',
      title: 'Part B · deductions from gross total income',
      fields: [
        { key: 'd80c', label: '80C — LIC, PF, PPF, ELSS, tuition fees, principal repayment', type: 'num', span: 6, max: 150000, source: 'epfo', path: 'ScheduleVIA/DeductUndChapVIA/Section80C' },
        { key: 'd80ccc', label: '80CCC — contribution to certain pension funds', type: 'num', span: 6, source: 'insurer', path: 'ScheduleVIA/DeductUndChapVIA/Section80CCC' },
        { key: 'd80ccd1', label: '80CCD(1) — employee contribution to NPS', type: 'num', span: 6, source: 'nps', path: 'ScheduleVIA/DeductUndChapVIA/Section80CCDEmployee' },
        { key: 'd80ccd1b', label: '80CCD(1B) — additional NPS contribution', type: 'num', span: 6, max: 50000, source: 'nps', path: 'ScheduleVIA/DeductUndChapVIA/Section80CCD1B' },
        { key: 'd80ccd2', label: '80CCD(2) — employer contribution to NPS', type: 'num', span: 6, source: 'form16', hint: 'Allowed in the new regime too', path: 'ScheduleVIA/DeductUndChapVIA/Section80CCDEmployer' },
      ],
      tables: [
        {
          key: 'nps80ccd',
          title: 'PRAN detail, mandatory to claim 80CCD(1) or 80CCD(1B) — rule 645',
          initialRows: 1,
          maxRows: 4,
          source: 'nps',
          path: 'ScheduleVIA/UsrDeductUndChapVIA/PRANDtls',
          columns: [
            { key: 'idType', label: 'Type of identifier', type: 'sel', required: true, width: '22%', options: [{ value: 'PRAN', label: 'PRAN' }, { value: 'Other', label: 'Other' }], path: 'IdentificationType' },
            { key: 'idNo', label: 'Identifier number', type: 'text', required: true, maxLen: 30, source: 'nps', width: '40%', path: 'IdentificationNo' },
            { key: 'amt', label: 'Amount', type: 'num', required: true, width: '38%', path: 'Amount' },
          ],
        },
      ],
      calcs: [
        { key: 'd80cAgg', label: 'Aggregate under 80C + 80CCC + 80CCD(1), capped at ₹1,50,000', expr: 'MIN(VIA.d80c+VIA.d80ccc+VIA.d80ccd1,150000)' },
      ],
    },
    {
      key: 'health',
      title: 'Health, education and disability',
      fields: [
        { key: 's80dType', label: '80D — coverage claimed for', type: 'sel', span: 6, options: ITR2_OPTIONS.S80D, path: 'ScheduleVIA/UsrDeductUndChapVIA/Section80DSelfFamily' },
        { key: 'd80d', label: '80D — health insurance premium', type: 'num', span: 6, source: 'insurer', path: 'ScheduleVIA/DeductUndChapVIA/Section80D' },
        { key: 'd80ddb', label: '80DDB — medical treatment of specified disease', type: 'num', span: 6, path: 'ScheduleVIA/DeductUndChapVIA/Section80DDB' },
        { key: 'd80dd', label: '80DD — maintenance of a dependant with disability', type: 'num', span: 6, path: 'ScheduleVIA/DeductUndChapVIA/Section80DD' },
        { key: 'd80u', label: '80U — person with disability', type: 'num', span: 6, path: 'ScheduleVIA/DeductUndChapVIA/Section80U' },
        { key: 'd80e', label: '80E — interest on education loan', type: 'num', span: 6, source: 'bank', path: 'ScheduleVIA/DeductUndChapVIA/Section80E' },
        { key: 'd80eea', label: '80EEA — interest on housing loan (affordable housing)', type: 'num', span: 6, source: 'lender', path: 'ScheduleVIA/DeductUndChapVIA/Section80EEA' },
        { key: 'd80eeb', label: '80EEB — interest on electric vehicle loan', type: 'num', span: 6, path: 'ScheduleVIA/DeductUndChapVIA/Section80EEB' },
      ],
    },
    {
      key: 'donations',
      title: 'Donations, savings interest and others',
      fields: [
        { key: 'd80g', label: '80G — donations to charitable institutions', type: 'num', span: 6, hint: 'Donee-wise detail goes in Schedule 80G', path: 'ScheduleVIA/DeductUndChapVIA/Section80G' },
        { key: 'd80gg', label: '80GG — rent paid where HRA is not received', type: 'num', span: 6, source: 'forms', path: 'ScheduleVIA/DeductUndChapVIA/Section80GG' },
        { key: 'd80ggc', label: '80GGC — contribution to a political party', type: 'num', span: 6, path: 'ScheduleVIA/DeductUndChapVIA/Section80GGC' },
        { key: 'd80tta', label: '80TTA — interest on savings account', type: 'num', span: 6, max: 10000, source: 'bank', path: 'ScheduleVIA/DeductUndChapVIA/Section80TTA' },
        { key: 'd80ttb', label: '80TTB — interest income for senior citizens', type: 'num', span: 6, max: 50000, source: 'bank', path: 'ScheduleVIA/DeductUndChapVIA/Section80TTB' },
        { key: 'd80ccg', label: '80CCG — Rajiv Gandhi Equity Savings Scheme', type: 'num', span: 6, path: 'ScheduleVIA/DeductUndChapVIA/Section80CCG' },
      ],
      calcs: [
        {
          key: 'viaRaw',
          label: 'Chapter VI-A before the gross total income restriction',
          expr: 'R(MIN(VIA.d80c+VIA.d80ccc+VIA.d80ccd1,150000)+MIN(VIA.d80ccd1b,50000)+VIA.d80ccd2+VIA.d80d+VIA.d80ddb+VIA.d80dd+VIA.d80u+VIA.d80e+VIA.d80eea+VIA.d80eeb+VIA.d80g+VIA.d80gg+VIA.d80ggc+VIA.d80tta+VIA.d80ttb+VIA.d80ccg)',
        },
        {
          key: 'viaTotal',
          label: 'Total deductions under Chapter VI-A, restricted to gross total income (rules 330 and 509)',
          expr: 'MIN(VIA.viaRaw,MAX(TI.gti,0))',
          path: 'ScheduleVIA/TotalChapVIADeductions',
        },
      ],
    },
  ],
};

/* ─────────────────────────── 9 · Schedule 80G ─────────────────────────── */

/** The four qualifying blocks of Schedule 80G share a column layout. */
function doneeColumns(withArn: boolean): ColumnDef[] {
  const cols: ColumnDef[] = [
    { key: 'doneeName', label: 'Name of the donee', type: 'text', required: true, maxLen: 75, width: '18%', path: 'DoneeWithPanName' },
    { key: 'doneePan', label: 'PAN of the donee', type: 'pan', required: true, maxLen: 10, width: '10%', path: 'DoneePAN' },
    { key: 'address', label: 'Address', type: 'text', required: true, maxLen: 100, width: '16%', path: 'AddressDetail/AddrDetail' },
    { key: 'city', label: 'Town / city', type: 'text', required: true, maxLen: 25, width: '9%', path: 'AddressDetail/CityOrTownOrDistrict' },
    { key: 'state', label: 'State', type: 'sel', required: true, options: STATE, width: '10%', path: 'AddressDetail/StateCode' },
    { key: 'pin', label: 'PIN code', type: 'pin', required: true, maxLen: 6, width: '7%', path: 'AddressDetail/PinCode' },
    { key: 'cash', label: 'Donation in cash', type: 'num', width: '8%', path: 'DonationAmtCash' },
    { key: 'other', label: 'Donation in any other mode', type: 'num', width: '8%', path: 'DonationAmtOtherMode' },
    { key: 'refNo', label: 'Transaction reference for non-cash donations', type: 'text', maxLen: 30, width: '8%', path: 'TransactionRefNum' },
    { key: 'total', label: 'Total donation', type: 'num', required: true, width: '8%', path: 'DonationAmt' },
    { key: 'eligible', label: 'Eligible amount of donation', type: 'num', required: true, width: '8%', path: 'EligibleDonationAmt' },
  ];
  if (!withArn) return cols;
  return [
    ...cols.slice(0, 6),
    { key: 'arn', label: 'Donation reference or ARN', type: 'text', maxLen: 30, width: '9%', path: 'ArnNbr' },
    ...cols.slice(6),
  ];
}

const SCHEDULE_80G: ScheduleDef = {
  id: 'S80G',
  code: 'Schedule80G',
  no: '80G',
  name: 'Schedule 80G · Donations',
  sub: 'Donee-wise detail of donations to certain funds and institutions',
  part: 'Part D — Deductions',
  forms: ['ITR2'],
  sections: [
    {
      key: 'blocks',
      title: 'Donee-wise particulars',
      note: 'Rules 634–648. A cash donation above ₹2,000 does not qualify. The PAN of the donee is compulsory and may not be the PAN of the assessee or of the person verifying the return. Not available under the new regime.',
      tables: [
        {
          key: 'g80a',
          title: 'A · donations entitled to 100% deduction without a qualifying limit',
          initialRows: 1,
          maxRows: 20,
          path: 'Schedule80G/Don100Percent/DoneeWithPan',
          columns: doneeColumns(false),
        },
        {
          key: 'g80b',
          title: 'B · donations entitled to 50% deduction without a qualifying limit',
          initialRows: 1,
          maxRows: 20,
          path: 'Schedule80G/Don50PercentNoApprReqd/DoneeWithPan',
          columns: doneeColumns(false),
        },
        {
          key: 'g80c',
          title: 'C · donations entitled to 100% deduction subject to the qualifying limit',
          initialRows: 1,
          maxRows: 20,
          path: 'Schedule80G/Don100PercentApprReqd/DoneeWithPan',
          columns: doneeColumns(true),
        },
        {
          key: 'g80d',
          title: 'D · donations entitled to 50% deduction subject to the qualifying limit',
          initialRows: 1,
          maxRows: 20,
          path: 'Schedule80G/Don50PercentApprReqd/DoneeWithPan',
          columns: doneeColumns(true),
        },
      ],
      calcs: [
        { key: 'g80Total', label: 'Total donation reported in Schedule 80G', expr: 'T(g80a.total)+T(g80b.total)+T(g80c.total)+T(g80d.total)', path: 'Schedule80G/TotalDonationsUs80GCash' },
        { key: 'g80Eligible', label: 'Total eligible donation before the qualifying limit', expr: 'T(g80a.eligible)+T(g80b.eligible)+T(g80c.eligible)+T(g80d.eligible)', path: 'Schedule80G/TotalEligibleDonationAmt' },
      ],
    },
  ],
};

/* ─────────────────────────── 10 · Schedule 80D ─────────────────────────── */

const SCHEDULE_80D: ScheduleDef = {
  id: 'S80D',
  code: 'Schedule80D',
  no: '80D',
  name: 'Schedule 80D · Health Insurance',
  sub: 'Health insurance premium and medical expenditure',
  part: 'Part D — Deductions',
  forms: ['ITR2'],
  sections: [
    {
      key: 'self',
      title: 'Self and family',
      note: 'Rules 697–726. The limit is ₹25,000 for self and family, ₹50,000 where a senior citizen is covered, and preventive health check-up is limited to ₹5,000 within those limits. Available only under the old regime.',
      fields: [
        { key: 'selfSenior', label: '1 Is any person in the self and family category a senior citizen?', type: 'sel', span: 6, options: [{ value: 'N', label: 'No' }, { value: 'Y', label: 'Yes' }, { value: 'NA', label: 'Not claiming for self or family' }], path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/SeniorCitizenFlag' },
        { key: 'selfPremium', label: '1(a) or 1(b)(i) Health insurance premium — self and family', type: 'num', span: 6, source: 'insurer', path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/HealthInsPremSlfFam' },
        { key: 'selfCheckup', label: 'Preventive health check-up — self and family', type: 'num', span: 6, max: 5000, path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/PrevHlthChckUpSlfFam' },
        { key: 'selfMedExp', label: '1(b)(iii) Medical expenditure — senior citizen not covered by insurance', type: 'num', span: 6, path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/MedicalExpSlfFamSrCtzn' },
      ],
      tables: [
        {
          key: 'ins80dSelf',
          title: 'Insurer and policy detail — self and family',
          initialRows: 1,
          maxRows: 5,
          source: 'insurer',
          path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/Sec80DSelfFamHIDtls/Sch80DInsDtls',
          columns: [
            { key: 'insurer', label: 'Name of the insurer', type: 'text', required: true, maxLen: 75, width: '40%', path: 'InsurerName' },
            { key: 'policyNo', label: 'Policy number', type: 'text', required: true, maxLen: 30, width: '30%', path: 'PolicyNo' },
            { key: 'premium', label: 'Premium paid', type: 'num', required: true, width: '30%', path: 'AmountPaid' },
          ],
        },
      ],
    },
    {
      key: 'parents',
      title: 'Parents',
      fields: [
        { key: 'parentSenior', label: '2 Is any parent a senior citizen?', type: 'sel', span: 6, options: [{ value: 'N', label: 'No' }, { value: 'Y', label: 'Yes' }, { value: 'NA', label: 'Not claiming for parents' }], path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/ParentsSeniorCitizenFlag' },
        { key: 'parentPremium', label: '2(a) or 2(b)(i) Health insurance premium — parents', type: 'num', span: 6, source: 'insurer', path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/HlthInsPremParents' },
        { key: 'parentCheckup', label: 'Preventive health check-up — parents', type: 'num', span: 6, max: 5000, path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/PrevHlthChckUpParents' },
        { key: 'parentMedExp', label: '2(b)(iii) Medical expenditure — parents', type: 'num', span: 6, path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/MedicalExpParentsSrCtzn' },
      ],
      tables: [
        {
          key: 'ins80dParent',
          title: 'Insurer and policy detail — parents',
          initialRows: 1,
          maxRows: 5,
          source: 'insurer',
          path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/Sec80DParentsHIDtls/Sch80DInsDtls',
          columns: [
            { key: 'insurer', label: 'Name of the insurer', type: 'text', required: true, maxLen: 75, width: '40%', path: 'InsurerName' },
            { key: 'policyNo', label: 'Policy number', type: 'text', required: true, maxLen: 30, width: '30%', path: 'PolicyNo' },
            { key: 'premium', label: 'Premium paid', type: 'num', required: true, width: '30%', path: 'AmountPaid' },
          ],
        },
      ],
      calcs: [
        { key: 'total80D', label: '3 Eligible amount of deduction', expr: 'S80D.selfPremium+MIN(S80D.selfCheckup,5000)+S80D.selfMedExp+S80D.parentPremium+MIN(S80D.parentCheckup,5000)+S80D.parentMedExp', path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/EligibleAmountOfDedn' },
      ],
    },
  ],
};

/* ─────────────────────────── 11 · Schedule EI ─────────────────────────── */

const SCHEDULE_EI: ScheduleDef = {
  id: 'EI',
  code: 'ScheduleEI',
  no: 'EI',
  name: 'Schedule EI · Exempt Income',
  sub: 'Income not included in total income',
  part: 'Part E — Other Schedules',
  forms: ['ITR2'],
  sections: [
    {
      key: 'exempt',
      title: 'Exempt income',
      fields: [
        { key: 'eiAgri', label: 'Gross agricultural receipts (other than income to be excluded)', type: 'num', span: 6, path: 'ScheduleEI/GrossAgriRecpt' },
        { key: 'eiAgriExp', label: 'Expenditure incurred on agriculture', type: 'num', span: 6, path: 'ScheduleEI/ExpenditureOnAgri' },
        { key: 'eiAgriLoss', label: 'Unabsorbed agricultural loss of previous eight years', type: 'num', span: 6, path: 'ScheduleEI/UnabsorbAgriLossPrev8' },
        { key: 'eiPpf', label: 'Other exempt income — PPF interest, PF withdrawal, tax-free bonds', type: 'num', span: 6, source: 'ais', path: 'ScheduleEI/OthersInc/OthersIncDtlsOthThanDivIncChargeable' },
        { key: 'eiNri', label: 'Income not chargeable to tax as per DTAA', type: 'num', span: 6, path: 'ScheduleEI/NotSetoffCurrYrLosses' },
        { key: 'eiPti', label: 'Pass-through income not chargeable to tax', type: 'num', span: 6, path: 'ScheduleEI/PassThrIncNotChrgblTax' },
      ],
      calcs: [
        { key: 'eiNetAgri', label: 'Net agricultural income', expr: 'EI.eiAgri-EI.eiAgriExp-EI.eiAgriLoss', path: 'ScheduleEI/NetAgriIncOrOthrIncRule7' },
        { key: 'eiTotal', label: 'Total exempt income', expr: '(EI.eiAgri-EI.eiAgriExp-EI.eiAgriLoss)+EI.eiPpf+EI.eiNri+EI.eiPti', path: 'ScheduleEI/TotalExemptInc' },
      ],
    },
    {
      key: 'other',
      title: 'Other exempt income detail',
      tables: [
        {
          key: 'eiOth',
          title: 'Nature-wise breakup',
          initialRows: 1,
          maxRows: 10,
          path: 'ScheduleEI/OthersInc/OthersIncDtls',
          columns: [
            { key: 'eiNat', label: 'Nature of income', type: 'sel', required: true, options: ITR2_OPTIONS.EXEMPTOTH, width: '62%', path: 'NatureDesc' },
            { key: 'eiDesc', label: 'Description', type: 'text', maxLen: 100, width: '20%', path: 'OthNatOfInc' },
            { key: 'eiAmt', label: 'Amount', type: 'num', required: true, width: '18%', path: 'OthAmount' },
          ],
        },
      ],
    },
  ],
};

/* ─────────────────────────── 12 · Schedule TR ─────────────────────────── */

const SCHEDULE_TR: ScheduleDef = {
  id: 'TR',
  code: 'ScheduleTR1',
  no: 'TR',
  name: 'Schedule TR · Tax Relief',
  sub: 'Relief for taxes paid outside India, residents only',
  part: 'Part E — Other Schedules',
  forms: ['ITR2'],
  showIf: { field: 'GEN.resStatus', notEquals: 'NRI' },
  sections: [
    {
      key: 'summary',
      title: 'Summary of tax relief claimed',
      note: 'If the country code column is left blank the rest of the row is ignored, exactly as in the departmental utility.',
      tables: [
        {
          key: 'tr1',
          title: 'Country-wise relief',
          initialRows: 1,
          maxRows: 20,
          path: 'ScheduleTR1/ScheduleTR',
          columns: [
            { key: 'trCountry', label: 'Country code', type: 'sel', required: true, options: COUNTRY, width: '24%', path: 'CountryCodeExcludingIndia' },
            { key: 'trTin', label: 'Taxpayer identification number', type: 'text', required: true, maxLen: 25, width: '20%', path: 'TaxPayerinCountry' },
            { key: 'trPaid', label: 'Total taxes paid outside India', type: 'num', required: true, width: '18%', hint: 'Total of column (c) of Schedule FSI for that country', path: 'TaxPaidOutsideIndia' },
            { key: 'trAvail', label: 'Total tax relief available', type: 'num', required: true, width: '18%', hint: 'Total of column (e) of Schedule FSI', path: 'TaxReliefOutsideIndia' },
            { key: 'trSec', label: 'Relief claimed under section', type: 'sel', required: true, width: '20%', options: [{ value: '90', label: '90' }, { value: '90A', label: '90A' }, { value: '91', label: '91' }], path: 'ReliefClaimedUsSection' },
          ],
        },
      ],
    },
    {
      key: 'split',
      title: 'Relief split and refunds',
      fields: [
        { key: 'trDtaa', label: 'Total relief where a DTAA applies, sections 90 and 90A', type: 'num', span: 6, path: 'ScheduleTR1/TaxReliefOutsideIndiaDTAA' },
        { key: 'trNoDtaa', label: 'Total relief where no DTAA applies, section 91', type: 'num', span: 6, path: 'ScheduleTR1/TaxReliefOutsideIndiaNotDTAA' },
        { key: 'trRefFlag', label: 'Has any tax paid outside India, on which relief was allowed in India, been refunded or credited by the foreign tax authority?', type: 'sel', span: 6, options: YESNO, path: 'ScheduleTR1/TaxPaidOutsideIndFlg' },
        { key: 'trRefAmt', label: 'Amount of tax refunded', type: 'num', required: true, span: 3, showIf: { field: 'TR.trRefFlag', equals: 'Y' }, path: 'ScheduleTR1/AmtTaxRefunded' },
        { key: 'trRefAy', label: 'Assessment year in which relief was allowed in India', type: 'text', required: true, span: 3, maxLen: 7, hint: 'For example 2024-25', showIf: { field: 'TR.trRefFlag', equals: 'Y' }, path: 'ScheduleTR1/AssmtYrTaxRelief' },
      ],
      calcs: [
        { key: 'trTotPaid', label: 'Total taxes paid outside India', expr: 'T(tr1.trPaid)', path: 'ScheduleTR1/TotalTaxPaidOutsideIndia' },
        { key: 'trTotRelief', label: 'Total tax relief available', expr: 'T(tr1.trAvail)', path: 'ScheduleTR1/TotalTaxReliefOutsideIndia' },
      ],
    },
  ],
};

/* ─────────────────────────── 13 · Schedule FSI ─────────────────────────── */

const SCHEDULE_FSI: ScheduleDef = {
  id: 'FSI',
  code: 'ScheduleFSI',
  no: 'FSI',
  name: 'Schedule FSI · Income Outside India',
  sub: 'Income accruing or arising outside India and the tax relief claimed on it',
  part: 'Part E — Other Schedules',
  forms: ['ITR2'],
  showIf: { field: 'GEN.resStatus', notEquals: 'NRI' },
  sections: [
    {
      key: 'countrywise',
      title: 'Country-wise and head-wise particulars',
      note: 'Rules 887–900 and Category D rule 5. Not applicable where the residential status is non-resident. Form 67 must be furnished on or before the due date under section 139(1). The head-of-income column selects which departmental sub-node the row is written to, so it carries no path of its own.',
      tables: [
        {
          key: 'fsi',
          title: 'Income from outside India and tax relief',
          initialRows: 1,
          maxRows: 25,
          path: 'ScheduleFSI/ScheduleFSIDtls',
          columns: [
            { key: 'fsiCountry', label: 'Country code', type: 'sel', required: true, options: COUNTRY, width: '18%', path: 'CountryCodeExcludingIndia' },
            { key: 'fsiTin', label: 'Taxpayer identification number', type: 'text', required: true, maxLen: 25, width: '16%', path: 'TaxPayerinCountry' },
            {
              key: 'fsiHead',
              label: 'Head of income',
              type: 'sel',
              required: true,
              width: '12%',
              options: [
                { value: 'S', label: 'Salary' },
                { value: 'HP', label: 'House property' },
                { value: 'CG', label: 'Capital gains' },
                { value: 'OS', label: 'Other sources' },
              ],
            },
            { key: 'fsiIncome', label: 'Income from outside India', type: 'num', required: true, width: '14%', path: 'TotalCountryWise/IncFrmOutsideInd' },
            { key: 'fsiTaxPaid', label: 'Tax paid outside India', type: 'num', required: true, width: '13%', path: 'TotalCountryWise/TaxPaidOutsideInd' },
            { key: 'fsiTaxPayable', label: 'Tax payable in India on such income', type: 'num', required: true, width: '13%', path: 'TotalCountryWise/TaxPayableinInd' },
            { key: 'fsiRelief', label: 'Relief available, being the lower of the two', type: 'num', required: true, width: '12%', path: 'TotalCountryWise/TaxReliefinInd' },
            { key: 'fsiSection', label: 'Relief claimed under section', type: 'sel', required: true, width: '12%', options: [{ value: '90', label: '90' }, { value: '90A', label: '90A' }, { value: '91', label: '91' }], path: 'TotalCountryWise/ReliefClaimedUsSection' },
          ],
        },
      ],
      calcs: [
        { key: 'fsiTotIncome', label: 'Total income from outside India', expr: 'T(fsi.fsiIncome)' },
        { key: 'fsiTotRelief', label: 'Total relief claimed', expr: 'T(fsi.fsiRelief)' },
      ],
    },
  ],
};

/* ─────────────────────────── 14 · Schedule FA ─────────────────────────── */

const SCHEDULE_FA: ScheduleDef = {
  id: 'FA',
  code: 'ScheduleFA',
  no: 'FA',
  name: 'Schedule FA · Foreign Assets',
  sub: 'Assets held outside India and income from any source outside India',
  part: 'Part E — Other Schedules',
  forms: ['ITR2'],
  showIf: { field: 'GEN.resStatus', notEquals: 'NRI' },
  sections: [
    {
      key: 'applicability',
      title: 'Applicability',
      note: 'Schedule FA does not apply to a non-resident. A resident must report every foreign asset held at any time during the calendar year 2025, whether or not it produced income. Non-disclosure attracts the Black Money Act, so treat every row here as mandatory once the asset exists.',
      fields: [
        {
          key: 'faFlag',
          label: 'Did you hold, as a beneficial owner, beneficiary or otherwise, any asset located outside India, or have signing authority in any account outside India, or income from any source outside India?',
          type: 'sel',
          required: true,
          span: 12,
          options: YESNO,
          path: 'PartA_GEN1/FilingStatus/AssetOutIndiaFlag',
        },
      ],
    },
    {
      key: 'a1',
      title: 'A1 · Foreign depository accounts',
      tables: [
        {
          key: 'faA1',
          title: 'Depository accounts held at any time during the period',
          initialRows: 1,
          maxRows: 20,
          path: 'ScheduleFA/DetailsForiegnBank',
          columns: [
            FA_COUNTRY,
            { key: 'instName', label: 'Name of financial institution', type: 'text', required: true, maxLen: 75, width: '14%', path: 'FinancialInstName' },
            { key: 'instAddr', label: 'Address of financial institution', type: 'text', required: true, maxLen: 100, width: '14%', path: 'FinancialInstAddress' },
            FA_ZIP,
            { key: 'accNo', label: 'Account number', type: 'text', required: true, maxLen: 35, width: '11%', path: 'ForeignAccountNumber' },
            { key: 'status', label: 'Status', type: 'sel', required: true, options: FA_STATUS, width: '11%', path: 'AccountStatus' },
            { key: 'openDate', label: 'Account opening date', type: 'date', required: true, width: '10%', path: 'AccOpenDate' },
            { key: 'peak', label: 'Peak balance during the period', type: 'num', required: true, width: '8%', path: 'PeakBalanceDuringYear' },
            { key: 'closing', label: 'Closing balance', type: 'num', required: true, width: '7%', path: 'ClosingBalance' },
            { key: 'interest', label: 'Gross interest paid or credited during the period', type: 'num', required: true, width: '7%', path: 'IntrstAccured' },
          ],
        },
      ],
    },
    {
      key: 'a2',
      title: 'A2 · Foreign custodial accounts',
      tables: [
        {
          key: 'faA2',
          title: 'Custodial accounts held at any time during the period',
          initialRows: 1,
          maxRows: 20,
          path: 'ScheduleFA/DtlsForeignCustodialAcc',
          columns: [
            FA_COUNTRY,
            { key: 'instName', label: 'Name of financial institution', type: 'text', required: true, maxLen: 75, width: '13%', path: 'FinancialInstName' },
            { key: 'instAddr', label: 'Address of financial institution', type: 'text', required: true, maxLen: 100, width: '13%', path: 'FinancialInstAddress' },
            FA_ZIP,
            { key: 'accNo', label: 'Account number', type: 'text', required: true, maxLen: 35, width: '10%', path: 'ForeignAccountNumber' },
            { key: 'status', label: 'Status', type: 'sel', required: true, options: FA_STATUS, width: '10%', path: 'AccountStatus' },
            { key: 'openDate', label: 'Account opening date', type: 'date', required: true, width: '9%', path: 'AccOpenDate' },
            { key: 'peak', label: 'Peak balance during the period', type: 'num', required: true, width: '8%', path: 'PeakBalanceDuringPeriod' },
            { key: 'closing', label: 'Closing balance', type: 'num', required: true, width: '7%', path: 'ClosingBalance' },
            {
              key: 'amtNature',
              label: 'Nature of amount credited',
              type: 'sel',
              required: true,
              width: '11%',
              options: [
                { value: 'Interest', label: 'Interest' },
                { value: 'Dividend', label: 'Dividend' },
                { value: 'Sale proceeds', label: 'Proceeds from sale or redemption' },
                { value: 'Other', label: 'Other income' },
              ],
              path: 'NatureOfAmount',
            },
            { key: 'amt', label: 'Amount', type: 'num', required: true, width: '8%', path: 'GrossAmountPaidCredited' },
          ],
        },
      ],
    },
    {
      key: 'a3',
      title: 'A3 · Foreign equity and debt interest',
      tables: [
        {
          key: 'faA3',
          title: 'Equity and debt interest held in any entity outside India',
          initialRows: 1,
          maxRows: 30,
          path: 'ScheduleFA/DtlsForeignEquityDebtInterest',
          columns: [
            FA_COUNTRY,
            { key: 'entName', label: 'Name of entity', type: 'text', required: true, maxLen: 75, width: '13%', path: 'EntityName' },
            { key: 'entAddr', label: 'Address of entity', type: 'text', required: true, maxLen: 100, width: '13%', path: 'EntityAddress' },
            FA_ZIP,
            { key: 'entNature', label: 'Nature of entity', type: 'text', required: true, maxLen: 50, width: '10%', path: 'EntityNature' },
            { key: 'acqDate', label: 'Date of acquiring the interest', type: 'date', required: true, width: '10%', path: 'InterestAcquiringDate' },
            { key: 'initVal', label: 'Initial value of the investment', type: 'num', required: true, width: '9%', path: 'InitialValOfInvstmnt' },
            { key: 'peakVal', label: 'Peak value during the period', type: 'num', required: true, width: '9%', path: 'PeakBalanceDuringPeriod' },
            { key: 'closing', label: 'Closing balance', type: 'num', required: true, width: '8%', path: 'ClosingBalance' },
            { key: 'grossAmt', label: 'Total gross amount paid or credited on the holding', type: 'num', required: true, width: '10%', path: 'TotGrossAmtPaidCredited' },
            { key: 'proceeds', label: 'Total gross proceeds from sale or redemption', type: 'num', required: true, width: '10%', path: 'TotGrossProceeds' },
          ],
        },
      ],
    },
    {
      key: 'a4',
      title: 'A4 · Cash value insurance or annuity contracts',
      tables: [
        {
          key: 'faA4',
          title: 'Insurance and annuity contracts held outside India',
          initialRows: 1,
          maxRows: 15,
          path: 'ScheduleFA/DtlsForeignCashValueInsurance',
          columns: [
            FA_COUNTRY,
            { key: 'instName', label: 'Name of the institution holding the contract', type: 'text', required: true, maxLen: 75, width: '22%', path: 'FinancialInstName' },
            { key: 'instAddr', label: 'Address of the institution', type: 'text', required: true, maxLen: 100, width: '22%', path: 'FinancialInstAddress' },
            FA_ZIP,
            { key: 'cDate', label: 'Date of contract', type: 'date', required: true, width: '14%', path: 'ContractDate' },
            { key: 'cashVal', label: 'Cash or surrender value of the contract', type: 'num', required: true, width: '12%', path: 'CashValOrSurrenderVal' },
            { key: 'grossAmt', label: 'Total gross amount paid or credited on the contract', type: 'num', required: true, width: '12%', path: 'TotGrossAmtPaidCredited' },
          ],
        },
      ],
    },
    {
      key: 'b',
      title: 'B · Financial interest in any entity',
      tables: [
        {
          key: 'faB',
          title: 'Financial interest held in any entity outside India',
          initialRows: 1,
          maxRows: 25,
          path: 'ScheduleFA/DetailsFinancialInterest',
          columns: [
            FA_COUNTRY,
            FA_ZIP,
            { key: 'entNature', label: 'Nature of entity', type: 'text', required: true, maxLen: 50, width: '10%', path: 'NatureOfEntity' },
            { key: 'entName', label: 'Name of the entity', type: 'text', required: true, maxLen: 75, width: '12%', path: 'NameOfEntity' },
            { key: 'entAddr', label: 'Address of the entity', type: 'text', required: true, maxLen: 100, width: '12%', path: 'AddressOfEntity' },
            { key: 'intNature', label: 'Nature of interest', type: 'sel', required: true, options: FA_OWNERSHIP, width: '10%', path: 'NatureOfInterest' },
            { key: 'since', label: 'Date since held', type: 'date', required: true, width: '9%', path: 'DateHeld' },
            { key: 'invest', label: 'Total investment at cost', type: 'num', required: true, width: '9%', path: 'TotalInvestment' },
            { key: 'income', label: 'Income accrued from such interest', type: 'num', required: true, width: '8%', path: 'IncomeAccruedFrmIntrst' },
            { key: 'incNature', label: 'Nature of income', type: 'text', required: true, maxLen: 50, width: '9%', path: 'NatureOfIncome' },
            { key: 'incAmt', label: 'Income taxable and offered in this return', type: 'num', width: '8%', path: 'IncomeTaxableOfferedAmount' },
            FA_SCHEDULE,
            FA_ITEM,
          ],
        },
      ],
    },
    {
      key: 'c',
      title: 'C · Immovable property outside India',
      tables: [
        {
          key: 'faC',
          title: 'Immovable property held outside India',
          initialRows: 1,
          maxRows: 20,
          path: 'ScheduleFA/DetailsImmovableProperty',
          columns: [
            FA_COUNTRY,
            FA_ZIP,
            { key: 'addr', label: 'Address of the property', type: 'text', required: true, maxLen: 100, width: '20%', path: 'AddressOfProperty' },
            { key: 'ownership', label: 'Ownership', type: 'sel', required: true, options: FA_OWNERSHIP, width: '12%', path: 'OwnershipStatus' },
            { key: 'acqDate', label: 'Date of acquisition', type: 'date', required: true, width: '11%', path: 'DateOfAcquisition' },
            { key: 'invest', label: 'Total investment at cost', type: 'num', required: true, width: '11%', path: 'TotalInvestment' },
            { key: 'income', label: 'Income derived from the property', type: 'num', required: true, width: '10%', path: 'IncomeDerived' },
            { key: 'incNature', label: 'Nature of income', type: 'text', required: true, maxLen: 50, width: '10%', path: 'NatureOfIncome' },
            { key: 'incAmt', label: 'Income taxable and offered in this return', type: 'num', width: '8%', path: 'IncomeTaxableOfferedAmount' },
            FA_SCHEDULE,
            FA_ITEM,
          ],
        },
      ],
    },
    {
      key: 'd',
      title: 'D · Any other capital asset outside India',
      tables: [
        {
          key: 'faD',
          title: 'Other capital assets held outside India',
          initialRows: 1,
          maxRows: 20,
          path: 'ScheduleFA/DetailsOthAssets',
          columns: [
            FA_COUNTRY,
            FA_ZIP,
            { key: 'assetNature', label: 'Nature of asset', type: 'text', required: true, maxLen: 50, width: '18%', path: 'NatureOfAsset' },
            { key: 'ownership', label: 'Ownership', type: 'sel', required: true, options: FA_OWNERSHIP, width: '12%', path: 'OwnershipStatus' },
            { key: 'acqDate', label: 'Date of acquisition', type: 'date', required: true, width: '11%', path: 'DateOfAcquisition' },
            { key: 'invest', label: 'Total investment at cost', type: 'num', required: true, width: '11%', path: 'TotalInvestment' },
            { key: 'income', label: 'Income derived from the asset', type: 'num', required: true, width: '10%', path: 'IncomeDerived' },
            { key: 'incNature', label: 'Nature of income', type: 'text', required: true, maxLen: 50, width: '11%', path: 'NatureOfIncome' },
            { key: 'incAmt', label: 'Income taxable and offered in this return', type: 'num', width: '9%', path: 'IncomeTaxableOfferedAmount' },
            FA_SCHEDULE,
            FA_ITEM,
          ],
        },
      ],
    },
    {
      key: 'e',
      title: 'E · Accounts where you have signing authority',
      tables: [
        {
          key: 'faE',
          title: 'Signing authority in accounts held outside India',
          initialRows: 1,
          maxRows: 20,
          path: 'ScheduleFA/DetailsOfAccntsHvngSigningAuth',
          columns: [
            { key: 'instName', label: 'Name of the institution', type: 'text', required: true, maxLen: 75, width: '14%', path: 'NameOfInstitution' },
            { key: 'instAddr', label: 'Address of the institution', type: 'text', required: true, maxLen: 100, width: '14%', path: 'AddressOfInstitution' },
            FA_COUNTRY,
            FA_ZIP,
            { key: 'holderName', label: 'Name of the account holder', type: 'text', required: true, maxLen: 75, width: '13%', path: 'NameMentionedInAccnt' },
            { key: 'accNo', label: 'Account number', type: 'text', required: true, maxLen: 35, width: '11%', path: 'AccountNumber' },
            { key: 'peak', label: 'Peak balance or investment during the year', type: 'num', required: true, width: '10%', path: 'PeakBalanceOrInvstmnt' },
            { key: 'taxable', label: 'Is the income accrued taxable in your hands?', type: 'sel', required: true, options: YESNO, width: '9%', path: 'WhetherIncomeTaxable' },
            { key: 'income', label: 'Income accrued in the account', type: 'num', width: '9%', path: 'IncomeAccruedInAccnt' },
            FA_SCHEDULE,
            FA_ITEM,
          ],
        },
      ],
    },
    {
      key: 'f',
      title: 'F · Trusts outside India where you are trustee, beneficiary or settlor',
      tables: [
        {
          key: 'faF',
          title: 'Foreign trusts',
          initialRows: 1,
          maxRows: 15,
          path: 'ScheduleFA/DetailsOfTrustOutIndiaTrustee',
          columns: [
            FA_COUNTRY,
            FA_ZIP,
            { key: 'trustName', label: 'Name of the trust', type: 'text', required: true, maxLen: 75, width: '10%', path: 'NameOfTrust' },
            { key: 'trustAddr', label: 'Address of the trust', type: 'text', required: true, maxLen: 100, width: '10%', path: 'AddressOfTrust' },
            { key: 'trusteeName', label: 'Name of trustees', type: 'text', required: true, maxLen: 75, width: '9%', path: 'NameOfTrustees' },
            { key: 'trusteeAddr', label: 'Address of trustees', type: 'text', required: true, maxLen: 100, width: '9%', path: 'AddressOfTrustees' },
            { key: 'settlorName', label: 'Name of settlor', type: 'text', required: true, maxLen: 75, width: '9%', path: 'NameOfSettlor' },
            { key: 'settlorAddr', label: 'Address of settlor', type: 'text', required: true, maxLen: 100, width: '9%', path: 'AddressOfSettlor' },
            { key: 'benName', label: 'Name of beneficiaries', type: 'text', required: true, maxLen: 75, width: '9%', path: 'NameOfBeneficiaries' },
            { key: 'benAddr', label: 'Address of beneficiaries', type: 'text', required: true, maxLen: 100, width: '9%', path: 'AddressOfBeneficiaries' },
            { key: 'since', label: 'Date since position held', type: 'date', required: true, width: '8%', path: 'DateHeld' },
            { key: 'taxable', label: 'Is the income derived taxable in your hands?', type: 'sel', required: true, options: YESNO, width: '8%', path: 'WhetherIncomeTaxable' },
            { key: 'income', label: 'Income derived', type: 'num', width: '8%', path: 'IncomeDerivedFrmTrust' },
            FA_SCHEDULE,
            FA_ITEM,
          ],
        },
      ],
    },
    {
      key: 'g',
      title: 'G · Any other income from a source outside India',
      tables: [
        {
          key: 'faG',
          title: 'Other foreign income not reported in A to F',
          initialRows: 1,
          maxRows: 20,
          path: 'ScheduleFA/DetailsOfOthSourcesIncOutsideIndia',
          columns: [
            FA_COUNTRY,
            FA_ZIP,
            { key: 'fromName', label: 'Name of the person from whom derived', type: 'text', required: true, maxLen: 75, width: '18%', path: 'NameOfPerson' },
            { key: 'fromAddr', label: 'Address of that person', type: 'text', required: true, maxLen: 100, width: '18%', path: 'AddressOfPerson' },
            { key: 'income', label: 'Income derived', type: 'num', required: true, width: '12%', path: 'IncomeDerived' },
            { key: 'incNature', label: 'Nature of income', type: 'text', required: true, maxLen: 50, width: '12%', path: 'NatureOfIncome' },
            { key: 'taxable', label: 'Is it taxable in your hands?', type: 'sel', required: true, options: YESNO, width: '10%', path: 'WhetherIncomeTaxable' },
            FA_SCHEDULE,
            FA_ITEM,
          ],
        },
      ],
    },
    {
      key: 'totals',
      title: 'Foreign asset totals',
      calcs: [
        {
          key: 'faTotIncome',
          label: 'Total foreign income reported in Schedule FA',
          expr: 'T(faA1.interest)+T(faA2.amt)+T(faA3.grossAmt)+T(faA4.grossAmt)+T(faB.income)+T(faC.income)+T(faD.income)+T(faE.income)+T(faF.income)+T(faG.income)',
        },
        {
          key: 'faTotValue',
          label: 'Total value of foreign assets (peak or cost, as reported)',
          expr: 'T(faA1.peak)+T(faA2.peak)+T(faA3.peakVal)+T(faA4.cashVal)+T(faB.invest)+T(faC.invest)+T(faD.invest)+T(faE.peak)',
        },
      ],
    },
  ],
};

/* ─────────────────────────── 15 · Schedule AL ─────────────────────────── */

const SCHEDULE_AL: ScheduleDef = {
  id: 'AL',
  code: 'ScheduleAL',
  no: 'AL',
  name: 'Schedule AL · Assets and Liabilities',
  sub: 'Applicable where total income exceeds ₹1 crore',
  part: 'Part E — Other Schedules',
  forms: ['ITR2'],
  sections: [
    {
      key: 'applicability',
      title: 'Applicability',
      note: 'Schedule AL must be filled only where total income exceeds ₹1 crore. Report the cost of each asset, not its market value.',
      fields: [
        { key: 'alFlag', label: 'Do you own any immovable asset to report here?', type: 'sel', required: true, span: 6, options: YESNO, path: 'ScheduleAL/IsImmovableAsset' },
        { key: 'alFirmFlag', label: 'Do you hold any interest in the assets of a firm or an association of persons?', type: 'sel', span: 6, options: YESNO, path: 'ScheduleAL/IsInterestHeld' },
      ],
    },
    {
      key: 'immovable',
      title: 'A · Immovable assets',
      tables: [
        {
          key: 'alA',
          title: 'Land and buildings held at the end of the year',
          initialRows: 1,
          maxRows: 20,
          path: 'ScheduleAL/ImmovableDetails',
          columns: [
            { key: 'desc', label: 'Description', type: 'text', required: true, maxLen: 50, width: '14%', path: 'Description' },
            { key: 'flat', label: 'Flat, door or block number', type: 'text', required: true, maxLen: 50, width: '11%', path: 'AddressAL/ResidenceNo' },
            { key: 'village', label: 'Premises, building or village', type: 'text', maxLen: 50, width: '11%', path: 'AddressAL/ResidenceName' },
            { key: 'road', label: 'Road or street', type: 'text', maxLen: 50, width: '10%', path: 'AddressAL/RoadOrStreet' },
            { key: 'area', label: 'Area or locality', type: 'text', required: true, maxLen: 50, width: '10%', path: 'AddressAL/LocalityOrArea' },
            { key: 'city', label: 'Town, city or district', type: 'text', required: true, maxLen: 25, width: '10%', path: 'AddressAL/CityOrTownOrDistrict' },
            { key: 'state', label: 'State', type: 'sel', required: true, options: STATE, width: '12%', path: 'AddressAL/StateCode' },
            { key: 'country', label: 'Country', type: 'sel', required: true, options: COUNTRY, width: '11%', path: 'AddressAL/CountryCode' },
            { key: 'pin', label: 'PIN code', type: 'pin', required: true, maxLen: 6, width: '6%', path: 'AddressAL/PinCode' },
            { key: 'amount', label: 'Cost of the asset', type: 'num', required: true, width: '10%', path: 'Amount' },
          ],
        },
      ],
    },
    {
      key: 'movable',
      title: 'B · Movable assets',
      fields: [
        { key: 'alJewel', label: 'Jewellery, bullion and similar articles', type: 'num', span: 4, path: 'ScheduleAL/MovableAsset/JewelleryBullionEtc' },
        { key: 'alArt', label: 'Archaeological collections, drawings, paintings, sculptures, works of art', type: 'num', span: 4, path: 'ScheduleAL/MovableAsset/ArchCollDrawPaintSulpArt' },
        { key: 'alVeh', label: 'Vehicles, yachts, boats and aircraft', type: 'num', span: 4, source: 'ais', path: 'ScheduleAL/MovableAsset/VehiclesYachtsBoatsAircrafts' },
        { key: 'alBank', label: 'Bank balances, including all deposits', type: 'num', span: 4, source: 'bank', path: 'ScheduleAL/MovableAsset/FinancialAsset/BankBalance' },
        { key: 'alShare', label: 'Shares and securities', type: 'num', span: 4, source: 'demat', path: 'ScheduleAL/MovableAsset/FinancialAsset/SharesAndSecurities' },
        { key: 'alIns', label: 'Insurance policies', type: 'num', span: 4, source: 'insurer', path: 'ScheduleAL/MovableAsset/FinancialAsset/InsurancePolicies' },
        { key: 'alLoan', label: 'Loans and advances given', type: 'num', span: 4, path: 'ScheduleAL/MovableAsset/FinancialAsset/LoansAndAdvances' },
        { key: 'alCash', label: 'Cash in hand', type: 'num', span: 4, path: 'ScheduleAL/MovableAsset/FinancialAsset/CashInHand' },
      ],
      calcs: [
        { key: 'alMovable', label: 'Total movable assets', expr: 'AL.alJewel+AL.alArt+AL.alVeh+AL.alBank+AL.alShare+AL.alIns+AL.alLoan+AL.alCash' },
      ],
    },
    {
      key: 'firmInterest',
      title: 'C · Interest held in the assets of a firm or AOP',
      tables: [
        {
          key: 'alC',
          title: 'Firm or AOP where you are a partner or member',
          initialRows: 1,
          maxRows: 15,
          path: 'ScheduleAL/InterestHeldInaAsset',
          columns: [
            { key: 'name', label: 'Name of the firm or AOP', type: 'text', required: true, maxLen: 75, width: '38%', path: 'NameOfFirm' },
            { key: 'pan', label: 'PAN of the firm or AOP', type: 'pan', maxLen: 10, width: '24%', path: 'PANOfFirm' },
            { key: 'invest', label: 'Amount of investment', type: 'num', required: true, width: '38%', path: 'AmountOfInvestment' },
          ],
        },
      ],
    },
    {
      key: 'liabilities',
      title: 'Liabilities and totals',
      fields: [
        { key: 'alLiab', label: 'Liabilities in relation to the assets at A and B', type: 'num', span: 6, source: 'lender', path: 'ScheduleAL/LiabilityInRelatAsset' },
      ],
      calcs: [
        { key: 'alImmovable', label: 'Total immovable assets', expr: 'T(alA.amount)' },
        { key: 'alFirm', label: 'Total interest in firms and AOPs', expr: 'T(alC.invest)' },
        { key: 'alTotal', label: 'Total assets (A + B + C)', expr: 'T(alA.amount)+AL.alMovable+T(alC.invest)' },
        { key: 'alNet', label: 'Net assets after liabilities', expr: 'T(alA.amount)+AL.alMovable+T(alC.invest)-AL.alLiab' },
        { key: 'alThreshold', label: 'Your total income — Schedule AL is required only above ₹1,00,00,000', expr: 'TI.totalIncome', internal: true },
      ],
    },
  ],
};

/* ─────────────────────────── 16 · Schedule SI ─────────────────────────── */

/** Departmental SecCode values for the special rates an ITR-2 filer can meet. */
const SI_SECTIONS: SelectOption[] = [
  { value: '1A', label: '111A — short term capital gain on equity where STT is paid' },
  { value: '21', label: '112 — long term capital gain with indexation' },
  { value: '22', label: '112A — long term capital gain on equity above ₹1,25,000' },
  { value: '21ciii', label: '112(1)(c)(iii) — long term capital gain of a non-resident on unlisted securities' },
  { value: '5AC', label: '115AC — bonds or GDRs of an Indian company held by a non-resident' },
  { value: '5ACA', label: '115ACA — GDRs held by a resident employee' },
  { value: '5AD1b', label: '115AD(1)(b) — capital gain of a foreign institutional investor' },
  { value: '5BB', label: '115BB — winnings from lotteries, crosswords and betting' },
  { value: '5BBE', label: '115BBE — unexplained income under sections 68 to 69D' },
  { value: '5BBH', label: '115BBH — transfer of a virtual digital asset' },
  { value: '5BBJ', label: '115BBJ — net winnings from online games' },
  { value: '5E', label: '115E — investment income and long term capital gain of a non-resident Indian' },
  { value: 'DTAA', label: 'Income chargeable at the rate in an agreement under section 90, 90A or 91' },
];

const SCHEDULE_SI: ScheduleDef = {
  id: 'SI',
  code: 'ScheduleSI',
  no: 'SI',
  name: 'Schedule SI · Special Rates',
  sub: 'Income chargeable at rates other than the slab rates',
  part: 'Part E — Other Schedules',
  forms: ['ITR2'],
  sections: [
    {
      key: 'rates',
      title: 'Income chargeable at special rates',
      note: 'Rules 849–873. Each figure must agree with the corresponding item of Schedules BFLA, CG and OS. The department stores one row per section code, carrying the code, the rate and the income; the tax column follows from the two.',
      tables: [
        {
          key: 'si',
          title: 'Section-wise special rate income',
          initialRows: 1,
          maxRows: 20,
          source: 'computed',
          path: 'ScheduleSI/SplCodeRateTax',
          columns: [
            { key: 'siSec', label: 'Section', type: 'sel', required: true, options: SI_SECTIONS, width: '46%', path: 'SecCode' },
            { key: 'siRate', label: 'Rate (%)', type: 'dec', required: true, min: 0, max: 100, width: '12%', path: 'SplRatePercent' },
            { key: 'siInc', label: 'Income', type: 'num', required: true, width: '21%', path: 'SplRateInc' },
            { key: 'siTax', label: 'Tax thereon', type: 'num', required: true, width: '21%', path: 'SplRateIncTax' },
          ],
        },
      ],
      calcs: [
        { key: 'siTotalInc', label: 'Total income chargeable at special rates', expr: 'T(si.siInc)', path: 'ScheduleSI/TotSplRateInc' },
        { key: 'siTotalTax', label: 'Total tax on income chargeable at special rates', expr: 'T(si.siTax)', path: 'ScheduleSI/TotSplRateIncTax' },
      ],
    },
  ],
};

/* ─────────────────────────── 17 · Schedule 5A ─────────────────────────── */

const SCHEDULE_5A: ScheduleDef = {
  id: 'S5A',
  code: 'Schedule5A2014',
  no: '5A',
  name: 'Schedule 5A · Apportionment between Spouses',
  sub: 'Apportionment of income between spouses governed by the Portuguese Civil Code',
  part: 'Part E — Other Schedules',
  forms: ['ITR2'],
  showIf: { field: 'GEN.portuguese', equals: 'Y' },
  sections: [
    {
      key: 'spouse',
      title: 'Spouse',
      note: 'Section 5A applies to a person governed by the Portuguese Civil Code, that is to a resident of Goa, Daman or Diu. Half of the income of each head, other than salary, is apportioned to the spouse together with the tax deducted on it.',
      fields: [
        { key: 'spouseName', label: 'Name of the spouse', type: 'text', required: true, span: 6, maxLen: 75, path: 'Schedule5A2014/NameOfSpouse' },
        { key: 'spousePan', label: 'PAN of the spouse', type: 'pan', required: true, span: 6, maxLen: 10, path: 'Schedule5A2014/PANOfSpouse' },
      ],
    },
    {
      key: 'apportionment',
      title: 'Head-wise apportionment',
      fields: [
        { key: 'hpRecd', label: '1 House property — income received', type: 'num', span: 4, path: 'Schedule5A2014/HPHeadIncome/IncRecvdUndHead' },
        { key: 'hpApp', label: '1 House property — amount apportioned to the spouse', type: 'num', span: 4, path: 'Schedule5A2014/HPHeadIncome/AmtApprndOfSpouse' },
        { key: 'hpTds', label: '1 House property — tax deducted apportioned', type: 'num', span: 4, source: 'form26as', path: 'Schedule5A2014/HPHeadIncome/TDSDetails' },
        { key: 'cgRecd', label: '2 Capital gains — income received', type: 'num', span: 4, path: 'Schedule5A2014/CapGainHeadIncome/IncRecvdUndHead' },
        { key: 'cgApp', label: '2 Capital gains — amount apportioned to the spouse', type: 'num', span: 4, path: 'Schedule5A2014/CapGainHeadIncome/AmtApprndOfSpouse' },
        { key: 'cgTds', label: '2 Capital gains — tax deducted apportioned', type: 'num', span: 4, source: 'form26as', path: 'Schedule5A2014/CapGainHeadIncome/TDSDetails' },
        { key: 'osRecd', label: '3 Other sources — income received', type: 'num', span: 4, path: 'Schedule5A2014/OtherSourcesHeadIncome/IncRecvdUndHead' },
        { key: 'osApp', label: '3 Other sources — amount apportioned to the spouse', type: 'num', span: 4, path: 'Schedule5A2014/OtherSourcesHeadIncome/AmtApprndOfSpouse' },
        { key: 'osTds', label: '3 Other sources — tax deducted apportioned', type: 'num', span: 4, source: 'form26as', path: 'Schedule5A2014/OtherSourcesHeadIncome/TDSDetails' },
      ],
      calcs: [
        { key: 'totApp', label: '4 Total apportioned to the spouse', expr: 'S5A.hpApp+S5A.cgApp+S5A.osApp', path: 'Schedule5A2014/TotalHeadIncome/AmtApprndOfSpouse' },
        { key: 'totTds', label: '4 Total tax deducted apportioned to the spouse', expr: 'S5A.hpTds+S5A.cgTds+S5A.osTds', path: 'Schedule5A2014/TotalHeadIncome/TDSDetails' },
      ],
    },
  ],
};

/* ─────────────────────────── 18 · Schedule TDS / TCS ─────────────────────────── */

const SCHEDULE_TDS: ScheduleDef = {
  id: 'TDS',
  code: 'ScheduleTDS1',
  no: 'TDS',
  name: 'Schedule TDS / TCS',
  sub: 'Tax deducted and collected at source',
  part: 'Part G — Taxes Paid',
  forms: ['ITR2'],
  sections: [
    {
      key: 'tds1',
      title: 'TDS 1 · tax deducted from salary',
      tables: [
        {
          key: 'tds1',
          title: 'Form 16 · employer TDS',
          initialRows: 1,
          maxRows: 10,
          source: 'form26as',
          path: 'ScheduleTDS1/TDSonSalary',
          columns: [
            { key: 't1Tan', label: 'TAN of employer', type: 'tan', required: true, maxLen: 10, source: 'form26as', width: '18%', path: 'EmployerOrDeductorOrCollectDetl/TAN' },
            { key: 't1Name', label: 'Name of employer', type: 'text', required: true, maxLen: 75, source: 'form16', width: '32%', path: 'EmployerOrDeductorOrCollectDetl/EmployerOrDeductorOrCollecterName' },
            { key: 't1Inc', label: 'Income chargeable under Salaries', type: 'num', required: true, source: 'form16', width: '25%', path: 'IncChrgSal' },
            { key: 't1Tds', label: 'Total tax deducted', type: 'num', required: true, source: 'form26as', width: '25%', path: 'TotalTDSSal' },
          ],
        },
      ],
    },
    {
      key: 'tds2',
      title: 'TDS 2 · tax deducted from income other than salary',
      tables: [
        {
          key: 'tds2',
          title: 'Form 16A · other TDS',
          initialRows: 1,
          maxRows: 25,
          source: 'form26as',
          path: 'ScheduleTDS2/TDSOthThanSalaryDtls',
          columns: [
            { key: 't2Tan', label: 'TAN of deductor', type: 'tan', required: true, maxLen: 10, source: 'form26as', width: '14%', path: 'TANOfDeductor' },
            { key: 't2Name', label: 'Name of deductor', type: 'text', required: true, maxLen: 75, width: '20%', path: 'TDSCreditName' },
            { key: 't2Gross', label: 'Gross amount', type: 'num', required: true, source: 'ais', width: '14%', path: 'GrossAmount' },
            {
              key: 't2Head',
              label: 'Head of income',
              type: 'sel',
              required: true,
              width: '14%',
              options: [
                { value: 'HP', label: 'House Property' },
                { value: 'OS', label: 'Other Sources' },
                { value: 'CG', label: 'Capital Gains' },
                { value: 'EOI', label: 'Exempt income' },
              ],
              path: 'HeadOfIncome',
            },
            { key: 't2Year', label: 'Financial year of deduction', type: 'sel', required: true, options: ITR2_OPTIONS.FY, width: '14%', path: 'FinYearOfDeduction' },
            { key: 't2Tds', label: 'TDS credit claimed this year', type: 'num', required: true, source: 'form26as', width: '14%', path: 'TaxDeductCreditDtls/TaxClaimedOwnHands' },
            { key: 't2Bf', label: 'Unclaimed TDS brought forward', type: 'num', width: '10%', path: 'TaxDeductCreditDtls/TaxDeductedOwnHands' },
          ],
        },
      ],
    },
    {
      key: 'tds3',
      title: 'TDS 3 · tax deducted on sale of immovable property (Form 26QB)',
      tables: [
        {
          key: 'tds3',
          title: 'Buyer-wise TDS u/s 194-IA',
          initialRows: 1,
          maxRows: 10,
          source: 'form26as',
          path: 'ScheduleTDS3/TDS3onOthThanSalDtls',
          columns: [
            { key: 't3Pan', label: 'PAN of buyer / tenant', type: 'pan', required: true, maxLen: 10, width: '16%', path: 'PANOfBuyerTenant' },
            { key: 't3Aadh', label: 'Aadhaar of buyer / tenant', type: 'aadhaar', maxLen: 12, width: '16%', path: 'AadhaarOfBuyerTenant' },
            { key: 't3Name', label: 'Name of buyer / tenant', type: 'text', required: true, maxLen: 75, width: '24%', path: 'TDSCreditName' },
            { key: 't3Gross', label: 'Gross amount', type: 'num', required: true, source: 'ais', width: '16%', path: 'GrossAmount' },
            {
              key: 't3Head',
              label: 'Head of income',
              type: 'sel',
              required: true,
              width: '14%',
              options: [
                { value: 'CG', label: 'Capital Gains' },
                { value: 'HP', label: 'House Property' },
                { value: 'OS', label: 'Other Sources' },
              ],
              path: 'HeadOfIncome',
            },
            { key: 't3Tds', label: 'TDS claimed', type: 'num', required: true, source: 'form26as', width: '14%', path: 'TaxDeductCreditDtls/TaxClaimedOwnHands' },
          ],
        },
      ],
    },
    {
      key: 'tcs',
      title: 'TCS · tax collected at source',
      tables: [
        {
          key: 'tcs',
          title: 'Form 27D',
          initialRows: 1,
          maxRows: 10,
          source: 'form26as',
          path: 'ScheduleTCS/TCS',
          columns: [
            { key: 'tcTan', label: 'TAN of collector', type: 'tan', required: true, maxLen: 10, source: 'form26as', width: '22%', path: 'EmployerOrDeductorOrCollectTAN' },
            { key: 'tcName', label: 'Name of collector', type: 'text', required: true, maxLen: 75, width: '32%', path: 'TCSCreditOwner' },
            { key: 'tcAmt', label: 'Amount collected', type: 'num', required: true, source: 'form26as', width: '23%', path: 'TCSCurrFYDtls/TCSAmtCollOwnHand' },
            { key: 'tcClaim', label: 'Amount claimed this year', type: 'num', required: true, width: '23%', path: 'TCSClaimedThisYearDtls/TCSAmtCollOwnHand' },
          ],
        },
      ],
    },
    {
      key: 'totals',
      title: 'Totals',
      calcs: [
        { key: 'tdsTotal', label: 'Total TDS and TCS credit claimed', expr: 'T(tds1.t1Tds)+T(tds2.t2Tds)+T(tds3.t3Tds)+T(tcs.tcClaim)' },
      ],
    },
  ],
};

/* ─────────────────────────── 19 · Schedule IT ─────────────────────────── */

const SCHEDULE_IT: ScheduleDef = {
  id: 'IT',
  code: 'ScheduleIT',
  no: 'IT',
  name: 'Schedule IT · Tax Payments',
  sub: 'Advance tax and self-assessment tax',
  part: 'Part G — Taxes Paid',
  forms: ['ITR2'],
  sections: [
    {
      key: 'challans',
      title: 'Challans',
      tables: [
        {
          key: 'chal',
          title: 'Advance tax and self-assessment tax paid',
          initialRows: 1,
          maxRows: 15,
          source: 'form26as',
          path: 'ScheduleIT/TaxPayment',
          columns: [
            { key: 'bsr', label: 'BSR code', type: 'bsr', required: true, maxLen: 7, source: 'form26as', width: '20%', path: 'BSRCode' },
            { key: 'depDate', label: 'Date of deposit', type: 'date', required: true, source: 'form26as', width: '25%', path: 'DateDep' },
            { key: 'srl', label: 'Challan serial number', type: 'text', required: true, maxLen: 9, width: '25%', path: 'SrlNoOfChaln' },
            { key: 'chAmt', label: 'Amount paid', type: 'num', required: true, source: 'form26as', width: '30%', path: 'Amt' },
          ],
        },
      ],
    },
    {
      key: 'total',
      title: 'Total',
      calcs: [
        { key: 'itTotal', label: 'Total advance and self-assessment tax paid', expr: 'T(chal.chAmt)', path: 'ScheduleIT/TotalTaxPayments' },
      ],
    },
  ],
};

/* ─────────────────────────── 20 · Part B-TI ─────────────────────────── */

const PART_B_TI: ScheduleDef = {
  id: 'TI',
  code: 'PartB-TI',
  no: 'B-TI',
  name: 'Part B-TI · Total Income',
  sub: 'Computation of total income',
  part: 'Part F — Computation',
  forms: ['ITR2'],
  sections: [
    {
      key: 'computation',
      title: 'Computation of total income',
      calcs: [
        { key: 'tiSal', label: 'Salaries', expr: 'S.salChargeable', path: 'PartB-TI/Salaries' },
        { key: 'tiHp', label: 'Income from house property', expr: 'HP.hpTotal', path: 'PartB-TI/IncomeFromHP' },
        { key: 'tiStcg', label: 'Total short term capital gain', expr: 'CG.stTotal', path: 'PartB-TI/CapGain/ShortTerm/TotalShortTerm' },
        { key: 'tiLtcg', label: 'Total long term capital gain', expr: 'CG.ltTotal', path: 'PartB-TI/CapGain/LongTerm/TotalLongTerm' },
        { key: 'tiCg', label: 'Capital gains', expr: 'CG.cgTotal', path: 'PartB-TI/CapGain/TotalCapGains' },
        { key: 'tiOs', label: 'Income from other sources', expr: 'OS.osNet', path: 'PartB-TI/IncFromOS/TotIncFromOS' },
        { key: 'gti', label: 'Gross total income', expr: 'S.salChargeable+HP.hpTotal+CG.cgTotal+OS.osNet', path: 'PartB-TI/GrossTotalIncome' },
        { key: 'tiSpecial', label: 'Income chargeable at special rates, as per Schedule SI', expr: 'SI.siTotalInc', path: 'PartB-TI/IncChargeableTaxSplRates' },
        { key: 'tiNetAgri', label: 'Net agricultural income for rate purposes', expr: 'MAX(EI.eiNetAgri,0)', path: 'PartB-TI/NetAgricultureIncomeOrOtherIncomeForRate' },
        { key: 'totalIncome', label: 'Total income (gross total income − Chapter VI-A)', expr: 'MAX(S.salChargeable+HP.hpTotal+CG.cgTotal+OS.osNet-VIA.viaTotal,0)', path: 'PartB-TI/TotalIncome' },
        { key: 'tiCarryFwd', label: 'Losses of the current year to be carried forward', expr: 'CFL.cflCarry', path: 'PartB-TI/LossesOfCurrentYearCarriedFwd' },
      ],
    },
  ],
};

/* ─────────────────────────── 21 · Part B-TTI ─────────────────────────── */

const PART_B_TTI: ScheduleDef = {
  id: 'TTI',
  code: 'PartB_TTI',
  no: 'B-TTI',
  name: 'Part B-TTI · Tax Liability',
  sub: 'Computation of tax liability on total income',
  part: 'Part F — Computation',
  forms: ['ITR2'],
  sections: [
    {
      key: 'liability',
      title: 'Relief and interest',
      note: 'xTax, xReb, xSur and xCess are supplied by the tax computation engine — tax before rebate, rebate u/s 87A, surcharge and cess. They are not schedule fields.',
      fields: [
        { key: 'rel89', label: 'Relief u/s 89', type: 'num', span: 4, source: 'forms', path: 'PartB_TTI/ComputationOfTaxLiability/Rlf89' },
        { key: 'rel90', label: 'Relief u/s 90 / 90A', type: 'num', span: 4, path: 'PartB_TTI/ComputationOfTaxLiability/TaxRelief/Section90' },
        { key: 'rel91', label: 'Relief u/s 91', type: 'num', span: 4, path: 'PartB_TTI/ComputationOfTaxLiability/TaxRelief/Section91' },
        { key: 'int234a', label: 'Interest u/s 234A', type: 'num', span: 3, path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/IntrstPayUs234A' },
        { key: 'int234b', label: 'Interest u/s 234B', type: 'num', span: 3, path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/IntrstPayUs234B' },
        { key: 'int234c', label: 'Interest u/s 234C', type: 'num', span: 3, path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/IntrstPayUs234C' },
        { key: 'fee234f', label: 'Fee u/s 234F for late filing', type: 'num', span: 3, path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/IntrstPayUs234F' },
        { key: 'fee234i', label: 'Fee u/s 234-I for a revised return filed after 31-12-2026', type: 'num', span: 3, path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/IntrstPayUs234I' },
        {
          key: 'taxOverride',
          label: 'Override the computed tax figures and enter them yourself?',
          type: 'sel',
          span: 6,
          options: [{ value: 'Y', label: 'Yes, let me enter them' }, { value: 'N', label: 'No, keep them computed' }],
          hint: 'The computation below follows the slabs for AY 2026-27. Verify against the department calculator before filing.',
        },
        { key: 'taxPayable', label: 'Tax on total income at normal and special rates', type: 'num', span: 3, source: 'computed', overridable: true, showIf: { field: 'TTI.taxOverride', equals: 'Y' }, path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/TaxAtNormalRatesOnAggrInc' },
        { key: 'rebate87a', label: 'Rebate u/s 87A', type: 'num', span: 3, source: 'computed', overridable: true, showIf: { field: 'TTI.taxOverride', equals: 'Y' }, path: 'PartB_TTI/ComputationOfTaxLiability/Rebate87A' },
        { key: 'surcharge', label: 'Surcharge', type: 'num', span: 3, source: 'computed', overridable: true, showIf: { field: 'TTI.taxOverride', equals: 'Y' }, path: 'PartB_TTI/ComputationOfTaxLiability/Surcharge' },
        { key: 'cess', label: 'Health and education cess at 4%', type: 'num', span: 3, source: 'computed', overridable: true, showIf: { field: 'TTI.taxOverride', equals: 'Y' }, path: 'PartB_TTI/ComputationOfTaxLiability/EducationCess' },
      ],
      calcs: [
        { key: 'taxAfterRebate', label: 'Tax payable after rebate u/s 87A (rule 524)', expr: 'MAX(xTax-xReb,0)' },
        { key: 'grossTax', label: 'Gross tax liability, tax plus surcharge plus cess (rule 525)', expr: 'xTax+xSur+xCess', path: 'PartB_TTI/ComputationOfTaxLiability/GrossTaxLiability' },
        { key: 'totRelief', label: 'Total tax relief, sections 89, 90/90A and 91 (rule 528)', expr: 'TTI.rel89+TTI.rel90+TTI.rel91', path: 'PartB_TTI/ComputationOfTaxLiability/TaxRelief/TotTaxRelief' },
        { key: 'netTax', label: 'Net tax liability, rounded to the nearest ten rupees u/s 288B', expr: 'R10(MAX(xTax+xSur+xCess-xReb-TTI.rel89-TTI.rel90-TTI.rel91,0))', path: 'PartB_TTI/ComputationOfTaxLiability/NetTaxLiability' },
        { key: 'totInterest', label: 'Total interest and fee payable (rule 529)', expr: 'TTI.int234a+TTI.int234b+TTI.int234c+TTI.fee234f+TTI.fee234i' },
        { key: 'aggLiab', label: 'Aggregate liability (rule 530)', expr: 'R10(MAX(xTax+xSur+xCess-xReb-TTI.rel89-TTI.rel90-TTI.rel91,0))+TTI.int234a+TTI.int234b+TTI.int234c+TTI.fee234f+TTI.fee234i', path: 'PartB_TTI/ComputationOfTaxLiability/AggregateTaxInterestLiability' },
        { key: 'advTax', label: 'Advance tax, challans paid within the previous year (rule 521)', expr: 'S(adv)', path: 'PartB_TTI/TaxPaid/TaxesPaid/AdvanceTax' },
        { key: 'selfAsmt', label: 'Self assessment tax, challans paid after 31-03-2026 (rule 520)', expr: 'S(self)', path: 'PartB_TTI/TaxPaid/TaxesPaid/SelfAssessmentTax' },
        { key: 'taxesPaid', label: 'Total taxes paid (rule 531)', expr: 'TDS.tdsTotal+IT.itTotal', path: 'PartB_TTI/TaxPaid/TaxesPaid/TotalTaxesPaid' },
        { key: 'balDue', label: 'Amount payable (rule 537)', expr: 'MAX(TTI.aggLiab-TTI.taxesPaid,0)', path: 'PartB_TTI/TaxPaid/BalTaxPayable' },
        { key: 'refund', label: 'Refund due (rule 536)', expr: 'MAX(TTI.taxesPaid-TTI.aggLiab,0)', path: 'PartB_TTI/Refund/RefundDue' },
      ],
    },
    {
      key: 'bank',
      title: 'Bank account for refund',
      fields: [
        { key: 'nAccounts', label: 'Total number of savings and current accounts held during the year', type: 'num', required: true, span: 4, source: 'eri', path: 'PartB_TTI/Refund/BankAccountDtls/AddtnlBankDetails' },
      ],
      tables: [
        {
          key: 'bank',
          title: 'Bank accounts · tick the one where refund should be credited',
          initialRows: 1,
          maxRows: 10,
          source: 'eri',
          path: 'PartB_TTI/Refund/BankAccountDtls/AddtnlBankDetails',
          columns: [
            { key: 'bIfsc', label: 'IFSC code', type: 'ifsc', required: true, maxLen: 11, source: 'eri', width: '16%', path: 'IFSCCode' },
            { key: 'bName', label: 'Name of the bank', type: 'text', required: true, maxLen: 75, source: 'eri', width: '26%', path: 'BankName' },
            { key: 'bAcc', label: 'Account number', type: 'text', required: true, maxLen: 30, source: 'eri', width: '22%', path: 'BankAccountNo' },
            {
              key: 'bType',
              label: 'Type of account',
              type: 'sel',
              required: true,
              width: '20%',
              options: [
                { value: 'SB', label: 'Savings' },
                { value: 'CA', label: 'Current' },
                { value: 'CC', label: 'Cash credit' },
                { value: 'OD', label: 'Overdraft' },
                { value: 'NRO', label: 'Non-resident' },
                { value: 'CGAS', label: 'Capital gain account' },
              ],
              path: 'BankAccountType',
            },
            { key: 'bRefund', label: 'Refund here', type: 'sel', options: YESNO, width: '16%', path: 'UseForRefund' },
          ],
        },
      ],
    },
  ],
};

/* ─────────────────────────── 22 · Verification ─────────────────────────── */

const VERIFICATION: ScheduleDef = {
  id: 'VER',
  code: 'Verification',
  no: 'V',
  name: 'Verification',
  sub: 'Declaration by the assessee',
  part: 'Part H — Verification',
  forms: ['ITR2'],
  sections: [
    {
      key: 'declaration',
      title: 'Declaration',
      fields: [
        { key: 'vName', label: 'I, full name in block letters', type: 'text', required: true, span: 6, maxLen: 75, path: 'Verification/Declaration/AssesseeVerName' },
        { key: 'vFather', label: 'son / daughter of', type: 'text', required: true, span: 6, maxLen: 75, path: 'Verification/Declaration/FatherName' },
        {
          key: 'vCapacity',
          label: 'Making this return in my capacity as',
          type: 'sel',
          required: true,
          span: 6,
          options: [
            { value: 'S', label: 'Self' },
            { value: 'K', label: 'Karta' },
            { value: 'A', label: 'Authorised signatory' },
            { value: 'R', label: 'Representative assessee' },
          ],
          path: 'Verification/Declaration/AssesseeVerCapacity',
        },
        { key: 'vPan', label: 'PAN of the person verifying', type: 'pan', required: true, span: 6, maxLen: 10, path: 'Verification/Declaration/AssesseeVerPAN' },
        { key: 'vPlace', label: 'Place', type: 'text', required: true, span: 6, maxLen: 50, path: 'Verification/Place' },
        { key: 'vDate', label: 'Date', type: 'date', required: true, span: 6, path: 'Verification/Date' },
      ],
    },
  ],
};

/* ─────────────────────────── The schema ─────────────────────────── */

/** Every schedule of ITR-2 for assessment year 2026-27, in wizard order. */
export const ITR2_SCHEDULES: ScheduleDef[] = [
  GEN,
  SCHEDULE_S,
  SCHEDULE_HP,
  SCHEDULE_CG,
  SCHEDULE_OS,
  SCHEDULE_CYLA,
  SCHEDULE_CFL,
  SCHEDULE_VIA,
  SCHEDULE_80G,
  SCHEDULE_80D,
  SCHEDULE_EI,
  SCHEDULE_TR,
  SCHEDULE_FSI,
  SCHEDULE_FA,
  SCHEDULE_AL,
  SCHEDULE_SI,
  SCHEDULE_5A,
  SCHEDULE_TDS,
  SCHEDULE_IT,
  PART_B_TI,
  PART_B_TTI,
  VERIFICATION,
];

const BY_ID = new Map(ITR2_SCHEDULES.map((s) => [s.id, s]));

/** Looks up one ITR-2 schedule by its id, e.g. "CG". */
export function itr2Schedule(id: string): ScheduleDef | undefined {
  return BY_ID.get(id);
}
