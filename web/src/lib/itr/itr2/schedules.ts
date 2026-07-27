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
  CalcDef,
  ColumnDef,
  FieldDef,
  ScheduleDef,
  SectionDef,
  SelectOption,
  SourceKey,
  TableDef,
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
