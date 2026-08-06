/**
 * ITR-3 form schema for assessment year 2026-27.
 *
 * Ported from docs/reference/ITR3-source.html. Each schedule carries the
 * departmental JSON node name in `code` and each field the path it writes to,
 * so a control cannot drift out of step with the schema it feeds. Field keys are
 * unprefixed inside a schedule; everything outside this file addresses them as
 * `${scheduleId}.${fieldKey}`, which is also how paths.ts is keyed.
 *
 * Select options carry the departmental code as the value and the taxpayer's
 * wording as the label. Where two wordings share a code — the three conditions
 * for a section 44AB audit all report "bi" — both are kept, because the wording
 * is what the taxpayer recognises and the department only ever sees the code.
 *
 * A table's `path` is its primary repeating block and a column's `path` is the
 * node inside that block. A few tables feed more than one block: Schedule HP
 * writes co-owners and tenants into arrays nested under the property, and
 * Schedule CFL routes each row by assessment year. Those columns carry no path
 * here — SCH_TABLES and SCH_ROUTES in paths.ts place them.
 */

import type { ScheduleDef, SelectOption } from '@/lib/itr/types';

export const ITR3_SCHEDULES: ScheduleDef[] = [
  {
    id: 'GEN',
    code: 'PartA_GEN1',
    no: 'A-1',
    name: 'General Information & Filing Status',
    part: 'Part A — General',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'General Information & Filing Status',
        note: 'Rules 1, 3, 4, 14, 23–31, 39–50. Name and date of birth must agree with the PAN database; Aadhaar must agree with the e-Filing profile. Where the return responds to a notice, the DIN and date are compulsory.',
        fields: [
          {
            key: 'FirstName', label: 'First name', type: 'text', required: true, source: 'eri',
            path: 'PartA_GEN1/PersonalInfo/AssesseeName/FirstName',
          },
          {
            key: 'MiddleName', label: 'Middle name', type: 'text', source: 'eri',
            path: 'PartA_GEN1/PersonalInfo/AssesseeName/MiddleName',
          },
          {
            key: 'SurNameOrOrgName', label: 'Last name / surname (as per PAN)', type: 'text',
            required: true, source: 'eri',
            path: 'PartA_GEN1/PersonalInfo/AssesseeName/SurNameOrOrgName',
          },
          {
            key: 'PAN', label: 'Permanent Account Number', type: 'pan', required: true,
            source: 'eri', path: 'PartA_GEN1/PersonalInfo/PAN',
          },
          {
            key: 'DOB', label: 'Date of birth / formation', type: 'date', required: true,
            source: 'eri', path: 'PartA_GEN1/PersonalInfo/DOB',
          },
          {
            key: 'Status', label: 'Status', type: 'sel', required: true,
            options: [
              { value: 'I', label: 'Individual' },
              { value: 'H', label: 'Hindu Undivided Family' },
            ],
            source: 'user', path: 'PartA_GEN1/PersonalInfo/Status',
          },
          {
            key: 'AadhaarCardNo', label: 'Aadhaar number (12 digits)', type: 'aadhaar',
            required: true, source: 'eri', path: 'PartA_GEN1/PersonalInfo/AadhaarCardNo',
            hint: 'Must agree with the Aadhaar held in the e-Filing profile.',
          },
          {
            key: 'AadhaarEnrolmentId', label: 'Aadhaar enrolment ID (where Aadhaar not allotted)',
            type: 'text', source: 'eri', showIf: { field: 'GEN.AadhaarCardNo', equals: '' },
          },
          {
            key: 'DOCB', label: 'Date of commencement of business', type: 'date', source: 'user',
            path: 'PartA_GEN1/PersonalInfo/DateofBusCommencement',
          },
          {
            key: 'FlatDoorNo', label: 'Flat / door / block number', type: 'text', required: true,
            source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/ResidenceNo',
          },
          {
            key: 'PremiseName', label: 'Name of premises / building / village', type: 'text',
            source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/ResidenceName',
          },
          {
            key: 'RoadStreet', label: 'Road / street / post office', type: 'text', source: 'eri',
            path: 'PartA_GEN1/PersonalInfo/Address/RoadOrStreet',
          },
          {
            key: 'Locality', label: 'Area / locality', type: 'text', required: true, source: 'eri',
            path: 'PartA_GEN1/PersonalInfo/Address/LocalityOrArea',
          },
          {
            key: 'City', label: 'Town / city / district', type: 'text', required: true,
            source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/CityOrTownOrDistrict',
          },
          {
            key: 'State', label: 'State', type: 'text', required: true, source: 'eri',
            path: 'PartA_GEN1/PersonalInfo/Address/StateCode',
          },
          {
            key: 'Country', label: 'Country', type: 'text', required: true, source: 'eri',
            path: 'PartA_GEN1/PersonalInfo/Address/CountryCode',
          },
          {
            key: 'PinCode', label: 'PIN code', type: 'pin', required: true, source: 'eri',
            path: 'PartA_GEN1/PersonalInfo/Address/PinCode',
          },
          {
            key: 'SecAddSame', label: 'Is the secondary address the same as the primary address?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }], source: 'user',
            path: 'PartA_GEN1/PersonalInfo/SecondaryAdd',
          },
          {
            key: 'SecAddress', label: 'Secondary address (where the answer above is “No”)',
            type: 'text', source: 'user', showIf: { field: 'GEN.SecAddSame', equals: 'N' },
          },
          {
            key: 'EmailAddress', label: 'Primary email address', type: 'email', required: true,
            source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/EmailAddress',
          },
          {
            key: 'MobileNo', label: 'Primary mobile number', type: 'mobile', required: true,
            source: 'eri', path: 'PartA_GEN1/PersonalInfo/Address/MobileNo',
          },
          {
            key: 'MobileNo2', label: 'Secondary mobile number', type: 'mobile', source: 'user',
            path: 'PartA_GEN1/PersonalInfo/Address/MobileNoSec',
          },
          {
            key: 'ResidentialStatus', label: 'Residential status', type: 'sel', required: true,
            options: [
              { value: 'RES', label: 'Resident' },
              { value: 'NOR', label: 'Resident but not ordinarily resident' },
              { value: 'NRI', label: 'Non-resident' },
            ],
            source: 'user', path: 'PartA_GEN1/FilingStatus/ResidentialStatus',
          },
          {
            key: 'JurisdictionResidence',
            label: 'Jurisdiction of residence and taxpayer identification number (non-residents)',
            type: 'text', span: 8, source: 'user',
            path: 'PartA_GEN1/FilingStatus/JurisdictionResPrevYr/JurisdictionResPrevYrDtls/JurisdictionResidence',
            showIf: { field: 'GEN.ResidentialStatus', equals: 'NRI' },
          },
          {
            key: 'StayInIndiaDays',
            label: 'Period of stay in India during the previous year (days)', type: 'num',
            source: 'user', path: 'PartA_GEN1/FilingStatus/TotalPrStayIndiaPrevYr',
            hint: 'Days physically present in India between 1 April 2025 and 31 March 2026.',
          },
          {
            key: 'ReturnFileSec', label: 'Return filed under section', type: 'sel', required: true,
            options: [
              { value: '11', label: '139(1) — on or before the due date' },
              { value: '12', label: '139(4) — belated' },
              { value: '17', label: '139(5) — revised' },
              { value: '18', label: '139(9) — in response to defective notice' },
              { value: '13', label: '142(1) — in response to notice' },
              { value: '14', label: '148 — reassessment' },
              { value: '20', label: '119(2)(b) — condonation' },
              { value: '19', label: '92CD — modified return' },
              { value: '21', label: '139(8A) — updated return' },
            ],
            source: 'user', path: 'PartA_GEN1/FilingStatus/ReturnFileSec',
          },
          {
            key: 'NoticeDIN', label: 'Notice number / Document Identification Number', type: 'text',
            source: 'eri', path: 'PartA_GEN1/FilingStatus/NoticeNo',
            showIf: { field: 'GEN.ReturnFileSec', equals: ['13', '14', '18', '19', '20'] },
          },
          {
            key: 'NoticeDate', label: 'Date of such notice or order', type: 'date', source: 'eri',
            path: 'PartA_GEN1/FilingStatus/NoticeDate',
            showIf: { field: 'GEN.ReturnFileSec', equals: ['13', '14', '18', '19', '20'] },
          },
          {
            key: 'OrigRetAckNo', label: 'Acknowledgement number of the original return',
            type: 'text', source: 'eri', path: 'PartA_GEN1/FilingStatus/ReceiptNo',
            showIf: { field: 'GEN.ReturnFileSec', equals: ['12', '17', '21'] },
          },
          {
            key: 'OrigRetDate', label: 'Date of filing the original return', type: 'date',
            source: 'eri', path: 'PartA_GEN1/FilingStatus/OrigRetFiledDate',
            showIf: { field: 'GEN.ReturnFileSec', equals: ['12', '17', '21'] },
          },
          {
            key: 'DueDate', label: 'Applicable due date for filing the return', type: 'sel',
            required: true,
            options: [
              { value: '31ST JULY', label: '31st July' },
              { value: '31ST OCTOBER', label: '31st October' },
              { value: '30TH NOVEMBER', label: '30th November' },
            ],
            source: 'user', path: 'PartA_GEN1/FilingStatus/ItrFilingDueDate',
          },
          {
            key: 'OptOutNewTaxRegime',
            label: 'A19 — Option exercised under section 115BAC(6) to opt out of the new regime',
            type: 'sel', required: true,
            options: [
              { value: 'N', label: 'No — new tax regime applies' },
              { value: 'Y', label: 'Yes — opting out of the new regime' },
            ],
            source: 'forms', path: 'PartA_GEN1/FilingStatus/OptOldRegimeCurrAY',
            hint: 'Opting out needs Form 10-IEA filed on or before the due date under section 139(1).',
          },
          {
            key: 'BusIncomeFlag',
            label: 'A19(b) — Is there income from business or profession in this year?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }], source: 'user',
            path: 'PartA_GEN1/FilingStatus/IncFrmBusOrProf',
          },
          {
            key: 'Form10IEAAckNo', label: 'Form 10-IEA acknowledgement number', type: 'text',
            source: 'forms', showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'Form10IEADate', label: 'Form 10-IEA date of filing', type: 'date',
            source: 'forms', showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'SeventhProviso139', label: 'Filing under the seventh proviso to section 139(1)?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }], source: 'user',
            path: 'PartA_GEN1/FilingStatus/SeventhProvisio139',
            hint: 'Applies where income is below the exemption limit but deposits, foreign travel or electricity spend crossed the prescribed thresholds.',
          },
          {
            key: 'LiableAudit44AB', label: 'Liable to audit under section 44AB?', type: 'sel',
            required: true, options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }],
            source: 'user', path: 'PartA_GEN2/AuditInfo/LiableSec44ABflg',
          },
          {
            key: 'Audit44ABCondition',
            label: 'Condition by virtue of which liable to audit under section 44AB', type: 'sel',
            options: [
              { value: 'bi', label: 'Sales or turnover exceeding ₹1 crore' },
              { value: 'bi', label: 'Turnover up to ₹10 crore with cash receipts or payments exceeding 5%' },
              { value: 'bi', label: 'Turnover exceeding ₹10 crore' },
              { value: 'bii', label: 'Profit declared below the limit under section 44AD(4)' },
              { value: 'bii', label: 'Profit declared below 50% under section 44ADA' },
              { value: 'biii', label: 'Other' },
            ],
            source: 'user', path: 'PartA_GEN2/AuditInfo/Cndnfor44AB',
            showIf: { field: 'GEN.LiableAudit44AB', equals: 'Y' },
          },
          {
            key: 'AuditedFlag', label: 'Have the accounts been audited by an accountant?',
            type: 'sel', options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }],
            source: 'audit', path: 'PartA_GEN2/AuditInfo/AuditAccountantFlg',
            showIf: { field: 'GEN.LiableAudit44AB', equals: 'Y' },
          },
          {
            key: 'AuditorName', label: 'Name of the auditor', type: 'text', source: 'audit',
            showIf: { field: 'GEN.LiableAudit44AB', equals: 'Y' },
          },
          {
            key: 'AuditorMemNo', label: 'Membership number of the auditor', type: 'text',
            source: 'audit', showIf: { field: 'GEN.LiableAudit44AB', equals: 'Y' },
          },
          {
            key: 'AuditFirmName', label: 'Name of the audit firm', type: 'text', source: 'audit',
            path: 'PartA_GEN2/AuditInfo/AudFrmName',
            showIf: { field: 'GEN.LiableAudit44AB', equals: 'Y' },
          },
          {
            key: 'AuditFirmPAN', label: 'Permanent Account Number of the audit firm', type: 'pan',
            source: 'audit', path: 'PartA_GEN2/AuditInfo/AudFrmPAN',
            showIf: { field: 'GEN.LiableAudit44AB', equals: 'Y' },
          },
          {
            key: 'AuditReportDate', label: 'Date of the audit report', type: 'date',
            source: 'audit', path: 'PartA_GEN2/AuditInfo/AuditReportFurnishDate',
            showIf: { field: 'GEN.LiableAudit44AB', equals: 'Y' },
          },
          {
            key: 'AuditFurnishDate', label: 'Date of furnishing the audit report', type: 'date',
            source: 'audit', path: 'PartA_GEN2/AuditInfo/AuditReportFurnishDate',
            showIf: { field: 'GEN.LiableAudit44AB', equals: 'Y' },
          },
          {
            key: 'Liable92E', label: 'Liable to audit under section 92E (transfer pricing)?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }], source: 'user',
            path: 'PartA_GEN2/AuditInfo/LiableSec92Eflg',
          },
          {
            key: 'PresumptiveOnly',
            label: 'A14 — Declaring income only under sections 44AE / 44B / 44BB / 44AD / 44ADA / 44BBA / 44BBB / 44BBC / 44BBD?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }], source: 'user',
            path: 'PartA_GEN2/AuditInfo/IncDclrdUs',
          },
          {
            key: 'TurnoverRange', label: 'a2(i) — Range of total sales, turnover or gross receipts',
            type: 'sel',
            options: [
              { value: 'Upto1CR', label: 'Up to ₹1 crore' },
              { value: 'Upto10CR', label: 'More than ₹1 crore and up to ₹10 crore' },
              { value: 'MoreThan10CR', label: 'More than ₹10 crore' },
            ],
            source: 'books', path: 'PartA_GEN2/AuditInfo/TotalSalesExcOneCr',
          },
          {
            key: 'CashReceiptPct',
            label: 'a2(ii) — Cash receipts as a proportion of total receipts', type: 'sel',
            options: [
              { value: 'Upto5Per', label: 'Up to 5%' },
              { value: 'MoreThan5Per', label: 'More than 5%' },
            ],
            source: 'books', path: 'PartA_GEN2/AuditInfo/AgrOFAllAmtsRcvd',
          },
          {
            key: 'CashPaymentPct',
            label: 'a2(iii) — Cash payments as a proportion of total payments', type: 'sel',
            options: [
              { value: 'Upto5Per', label: 'Up to 5%' },
              { value: 'MoreThan5Per', label: 'More than 5%' },
            ],
            source: 'books', path: 'PartA_GEN2/AuditInfo/AgrOFAllPayMade',
          },
          {
            key: 'FPIFlag', label: 'Are you a Foreign Portfolio Investor?', type: 'sel',
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }], source: 'user',
            path: 'PartA_GEN1/FilingStatus/FiiFpiFlag',
          },
          {
            key: 'PortugueseCC', label: 'Governed by the Portuguese Civil Code under section 5A?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }], source: 'user',
            path: 'PartA_GEN1/FilingStatus/PortugeseCC5A',
          },
          {
            key: 'SpousePAN',
            label: 'Permanent Account Number of the spouse (where section 5A applies)', type: 'pan',
            source: 'user', path: 'Schedule5A2014/PANOfSpouse',
            showIf: { field: 'GEN.PortugueseCC', equals: 'Y' },
          },
          {
            key: 'RepAssesseeFlag',
            label: 'Is this return being filed by a representative assessee?', type: 'sel',
            required: true, options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }],
            source: 'user', path: 'PartA_GEN1/FilingStatus/AsseseeRepFlg',
          },
          {
            key: 'RepName', label: 'Name of the representative', type: 'text', source: 'user',
            path: 'PartA_GEN1/FilingStatus/AssesseeRep/RepName',
            showIf: { field: 'GEN.RepAssesseeFlag', equals: 'Y' },
          },
          {
            key: 'RepPAN', label: 'Permanent Account Number of the representative', type: 'pan',
            source: 'user', showIf: { field: 'GEN.RepAssesseeFlag', equals: 'Y' },
          },
        ],
        tables: [
          {
            key: 'UnlistedShares',
            title: 'Particulars of unlisted equity shares held at any time during the previous year',
            source: 'demat',
            path: 'PartA_GEN1/FilingStatus/HeldUnlistedEqShrPrYr/HeldUnlistedEqShrPrYrDtls',
            columns: [
              { key: 'CompanyName', label: 'Name of the company', type: 'text', path: 'NameOfCompany' },
              { key: 'CompanyPAN', label: 'Permanent Account Number', type: 'pan', path: 'PAN' },
              { key: 'CompanyType', label: 'Type of company', type: 'text', path: 'CompanyType' },
              {
                key: 'OpeningShares', label: 'Opening balance — number of shares', type: 'num',
                path: 'OpngBalNumberOfShares',
              },
              {
                key: 'OpeningCost', label: 'Opening balance — cost of acquisition', type: 'num',
                path: 'OpngBalCostOfAcquisition',
              },
              {
                key: 'AcqShares', label: 'Shares acquired during the year', type: 'num',
                path: 'ShrAcqDurYrNumberOfShares',
              },
              { key: 'AcqCost', label: 'Cost of acquisition', type: 'num', path: 'PurchasePricePerShare' },
              {
                key: 'IssuePrice', label: 'Issue or purchase price per share', type: 'num',
                path: 'IssuePricePerShare',
              },
              {
                key: 'TransferShares', label: 'Shares transferred during the year', type: 'num',
                path: 'ShrTrnfNumberOfShares',
              },
              { key: 'SaleConsid', label: 'Sale consideration', type: 'num', path: 'ShrTrnfSaleConsideration' },
              {
                key: 'ClosingShares', label: 'Closing balance — number of shares', type: 'num',
                path: 'ClsngBalNumberOfShares',
              },
              {
                key: 'ClosingCost', label: 'Closing balance — cost', type: 'num',
                path: 'ClsngBalCostOfAcquisition',
              },
            ],
          },
          {
            key: 'Directorship',
            title: 'Particulars of directorships held during the previous year',
            source: 'user',
            path: 'PartA_GEN1/FilingStatus/CompDirectorPrvYr/CompDirectorPrvYrDtls',
            columns: [
              { key: 'CoName', label: 'Name of the company', type: 'text', path: 'NameOfCompany' },
              { key: 'CoType', label: 'Domestic or foreign', type: 'text', path: 'CompanyType' },
              { key: 'CoPAN', label: 'Permanent Account Number', type: 'pan', path: 'PAN' },
              { key: 'DIN', label: 'Director Identification Number', type: 'text', path: 'DIN' },
              { key: 'SharesListed', label: 'Are the shares listed?', type: 'text', path: 'SharesTypes' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'U8A',
    code: 'PartA_139_8A',
    no: 'A-1a',
    name: 'Part A — Updated Return under Section 139(8A)',
    part: 'Part A — General',
    forms: ['ITR3'],
    showIf: { field: 'GEN.ReturnFileSec', equals: '21' },
    sections: [
      {
        key: 'main',
        title: 'Updated return under section 139(8A)',
        note: 'Complete only when the return is filed under section 139(8A). Reasons for updating income and any reduction of carried-forward loss or unabsorbed depreciation must be stated.',
        fields: [
          {
            key: 'PrevFiled',
            label: 'Was a return previously filed for this assessment year?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }],
            source: 'user',
          },
          {
            key: 'EligibleUpdated',
            label: 'Eligible to file an updated return under the provisos to section 139(8A)?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }],
            source: 'user',
          },
          {
            key: 'ReasonsUpdating',
            label: 'Reasons for updating income',
            type: 'longtext', span: 12, source: 'user',
          },
          {
            key: 'FilingPeriod',
            label: 'Period in which the updated return is being filed',
            type: 'sel',
            options: [
              { value: 'P1', label: 'Within 12 months from the end of the relevant assessment year' },
              { value: 'P2', label: 'Between 12 and 24 months' },
              { value: 'P3', label: 'Between 24 and 36 months' },
              { value: 'P4', label: 'Between 36 and 48 months' },
            ],
            source: 'user',
          },
          {
            key: 'ReduceCFL',
            label: 'Filing to reduce carried-forward loss, unabsorbed depreciation or tax credit?',
            type: 'sel',
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }],
            source: 'user',
          },
        ],
        tables: [
          {
            key: 'U8AReasonsRows',
            title: 'Reasons for updating income (one row per reason)',
            source: 'user',
            path: 'PartA_139_8A/UpdatingInc/ReasonsForUpdatingIncDtls',
            columns: [
              { key: 'Reason', label: 'Reason', type: 'text', path: 'ReasonsForUpdatingInc' },
            ],
          },
          {
            key: 'U8AUDYearRows',
            title: 'Assessment years where carried-forward loss or unabsorbed depreciation is affected',
            source: 'user',
            showIf: { field: 'U8A.ReduceCFL', equals: 'Y' },
            path: 'PartA_139_8A/RetrntoRedCarriedFL/UDYear/UnabsorbedDepreciationYearDtls',
            columns: [
              { key: 'AY', label: 'Assessment year', type: 'text', path: 'AssYr' },
              { key: 'OrigFiled', label: 'Original / revised return filed for that year?', type: 'text', path: 'OrigRevRetFiledFlg' },
              { key: 'UpdatedFiled', label: 'Updated return filed for that year?', type: 'text', path: 'UpdatedRetFiledFlg' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'NOB',
    code: 'NatOfBus',
    no: 'A-2',
    name: 'Nature of Business or Profession',
    part: 'Part A — General',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Nature of Business or Profession',
        note: 'Rules 106, 108 and 110. Compulsory wherever business or profession income is declared. Use the business codes notified by the Board; the code selected governs the presumptive section available.',
        tables: [
          {
            key: 'NOBRows',
            title: 'Codes, trade names and description of each business or profession carried on',
            source: 'gst',
            path: 'PartA_GEN2/NatOfBus/NatureOfBusiness',
            columns: [
              { key: 'Code', label: 'Business or profession code', type: 'text', path: 'Code' },
              { key: 'TradeName', label: 'Trade name of the concern', type: 'text', path: 'TradeName1' },
              { key: 'Description', label: 'Description of the activity', type: 'text', path: 'Description' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'BS',
    code: 'PartA_BS',
    no: 'A-3',
    name: 'Balance Sheet as at 31 March 2026',
    part: 'Part A — Accounts',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Balance Sheet as at 31 March 2026',
        note: 'Rules 51–60. Compulsory where the accounts are audited under section 44AB. Total sources of funds must equal total application of funds, and each sub-total must agree with its components.',
        fields: [
          {
            key: 'PropCapital', label: '1(a) Proprietor’s capital', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/PropFund/PropCap',
          },
          {
            key: 'RevSurplus', label: '1(b)(i) Revaluation reserve', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/PropFund/ResrNSurp/RevResr',
          },
          {
            key: 'CapReserve', label: '1(b)(ii) Capital reserve', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/PropFund/ResrNSurp/CapResr',
          },
          {
            key: 'StatReserve', label: '1(b)(iii) Statutory reserve', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/PropFund/ResrNSurp/StatResr',
          },
          {
            key: 'OthReserve', label: '1(b)(iv) Any other reserve', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/PropFund/ResrNSurp/OthResr',
          },
          {
            key: 'TotReserve', label: '1(b)(v) Total reserves and surplus', type: 'num',
            source: 'books', path: 'PARTA_BS/FundSrc/PropFund/ResrNSurp/TotResrNSurp',
          },
          {
            key: 'TotPropFund', label: '1(c) Total proprietor’s fund', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/PropFund/TotPropFund',
          },
          {
            key: 'SecuredLoansFin', label: '2(a)(i) Secured loans — from banks', type: 'num',
            source: 'books', path: 'PARTA_BS/FundSrc/LoanFunds/SecrLoan/RupeeLoan/FrmBank',
          },
          {
            key: 'SecuredLoansOth', label: '2(a)(ii) Secured loans — from others', type: 'num',
            source: 'books', path: 'PARTA_BS/FundSrc/LoanFunds/SecrLoan/RupeeLoan/FrmOthrs',
          },
          {
            key: 'UnsecuredLoans', label: '2(b) Unsecured loans including deposits', type: 'num',
            source: 'books', path: 'PARTA_BS/FundSrc/LoanFunds/UnsecrLoan/TotUnSecrLoan',
          },
          {
            key: 'TotLoanFunds', label: '2(c) Total loan funds', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/LoanFunds/TotLoanFund',
          },
          {
            key: 'DefTaxLiab', label: '3 Deferred tax liability', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/DeferredTax',
          },
          {
            key: 'AdvFrom40A2b', label: '4(a) Advances from persons specified in section 40A(2)(b)',
            type: 'num', source: 'books', path: 'PARTA_BS/FundSrc/Advances/FromPrsn',
          },
          {
            key: 'AdvFromOthers', label: '4(b) Advances from others', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/Advances/FromOthers',
          },
          {
            key: 'TotAdvances', label: '4(c) Total advances', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/Advances/TotalAdvances',
          },
          {
            key: 'SourcesTotal', label: '5 Total sources of funds', type: 'num', source: 'books',
            path: 'PARTA_BS/FundSrc/TotFundSrc',
          },
          {
            key: 'FixedAssetsNet',
            label: 'A Total fixed assets (net block and capital work in progress)', type: 'num',
            source: 'books', path: 'PARTA_BS/FundApply/FixedAsset/TotFixedAsset',
          },
          {
            key: 'LTInvest', label: 'B(i) Long-term investments', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/Investments/LongTermInv/TotLongTermInv',
          },
          {
            key: 'STInvest', label: 'B(ii) Short-term investments', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/Investments/TradeInv/TotTradeInv',
          },
          {
            key: 'TotInvest', label: 'B(iii) Total investments', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/Investments/TotInvestments',
          },
          {
            key: 'Inventories', label: 'C(i) Inventories', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/CurrAsset/Inventories/TotInventries',
          },
          {
            key: 'SundryDebtors', label: 'C(ii) Sundry debtors', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/CurrAsset/SndryDebtors',
          },
          {
            key: 'CashBank', label: 'C(iii) Cash and bank balances', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/CurrAsset/CashOrBankBal/TotCashOrBankBal',
          },
          {
            key: 'OthCurrAssets', label: 'C(iv) Other current assets', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/CurrAsset/OthCurrAsset',
          },
          {
            key: 'LoansAdvGiven', label: 'C(v) Loans and advances given', type: 'num',
            source: 'books', path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/LoanAdv/TotLoanAdv',
          },
          {
            key: 'TotCurrAssets', label: 'C(vi) Total current assets, loans and advances',
            type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/TotCurrAssetLoanAdv',
          },
          {
            key: 'CurrLiab', label: 'D(i) Current liabilities', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/CurrLiabilitiesProv/CurrLiabilities/TotCurrLiabilities',
          },
          {
            key: 'Provisions', label: 'D(ii) Provisions', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/CurrLiabilitiesProv/Provisions/TotProvisions',
          },
          {
            key: 'TotCurrLiab', label: 'D(iii) Total current liabilities and provisions',
            type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/CurrLiabilitiesProv/TotCurrLiabilitiesProvision',
          },
          {
            key: 'NetCurrAssets', label: 'E Net current assets', type: 'num', source: 'books',
            path: 'PARTA_BS/FundApply/CurrAssetLoanAdv/NetCurrAsset',
          },
          {
            key: 'MiscExp', label: 'F Miscellaneous expenditure not written off', type: 'num',
            source: 'books', path: 'PARTA_BS/FundApply/MiscAdjust/TotMiscAdjust',
          },
          {
            key: 'ApplicationTotal', label: 'G Total application of funds', type: 'num',
            source: 'books', path: 'PARTA_BS/FundApply/TotFundApply',
          },
          {
            key: 'NoAccCashBal', label: 'No-accounts case — cash balance', type: 'num',
            source: 'books', path: 'PARTA_BS/NoBooksOfAccBS/CashBalAmt',
          },
          {
            key: 'NoAccDebtors', label: 'No-accounts case — sundry debtors', type: 'num',
            source: 'books', path: 'PARTA_BS/NoBooksOfAccBS/TotSundryDbtAmt',
          },
          {
            key: 'NoAccCreditors', label: 'No-accounts case — sundry creditors', type: 'num',
            source: 'books', path: 'PARTA_BS/NoBooksOfAccBS/TotSundryCrdAmt',
          },
          {
            key: 'NoAccStock', label: 'No-accounts case — stock in trade', type: 'num',
            source: 'books', path: 'PARTA_BS/NoBooksOfAccBS/TotStkInTradAmt',
          },
        ],
      },
    ],
  },

  {
    id: 'MFG',
    code: 'PartA_Manufacture',
    no: 'A-4',
    name: 'Manufacturing Account',
    part: 'Part A — Accounts',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Manufacturing Account',
        note: 'Rules 61–68. Negative figures are permitted only against the cost of goods produced, which is carried to item 11 of the Trading Account.',
        fields: [
          {
            key: 'OpRawMat', label: '1A(i) Opening inventory — raw material', type: 'num',
            source: 'books', path: 'ManufacturingAccount/OpeningInventory/OpngStckRawMat',
          },
          {
            key: 'OpWIP', label: '1A(ii) Opening inventory — work in progress', type: 'num',
            source: 'books', path: 'ManufacturingAccount/OpeningInventory/OpngStckWrkinPrgrs',
          },
          {
            key: 'OpTotal', label: '1A(iii) Total opening inventory', type: 'num', source: 'books',
            path: 'ManufacturingAccount/OpeningInventory/OpngInvntryTotal',
          },
          {
            key: 'Purchases', label: '1B Purchases net of refunds and returns', type: 'num',
            source: 'books', path: 'ManufacturingAccount/OpeningInventory/Purchases',
          },
          {
            key: 'DirectWages', label: '1C Direct wages', type: 'num', source: 'books',
            path: 'ManufacturingAccount/OpeningInventory/DirectWages',
          },
          {
            key: 'DirectExpTotal', label: '1D Direct expenses — total', type: 'num',
            source: 'books', path: 'ManufacturingAccount/OpeningInventory/DirectExpenses',
          },
          {
            key: 'FactoryOverheads', label: '1E Factory overheads — total', type: 'num',
            source: 'books', path: 'ManufacturingAccount/OpeningInventory/TotalFactoryOverheads',
          },
          {
            key: 'FactoryDep', label: '1E(vi) Depreciation included in factory overheads',
            type: 'num', source: 'books',
            path: 'ManufacturingAccount/OpeningInventory/DeprctnOfFactoryMachinery',
          },
          {
            key: 'TotalDebits', label: '1F Total debits to the manufacturing account', type: 'num',
            source: 'books', path: 'ManufacturingAccount/OpeningInventory/TotalDebtsManfctrngAcc',
          },
          {
            key: 'ClosingStock', label: '2 Closing stock of raw material and work in progress',
            type: 'num', source: 'books', path: 'ManufacturingAccount/ClosingStock/ClsngStckTotal',
          },
          {
            key: 'CostGoodsProduced',
            label: '3 Cost of goods produced, transferred to the Trading Account', type: 'num',
            source: 'books', path: 'ManufacturingAccount/CostOfGoodsPrdcd',
          },
        ],
      },
    ],
  },

  {
    id: 'TRD',
    code: 'PartA_Trading',
    no: 'A-5',
    name: 'Trading Account',
    part: 'Part A — Accounts',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Trading Account',
        note: 'Rules 69–79. Income from intraday trading and from futures and options may not exceed the corresponding turnover declared alongside.',
        fields: [
          {
            key: 'SaleGoods', label: '4A(i) Sale of goods', type: 'num', source: 'books',
            path: 'TradingAccount/SaleOfGoods',
          },
          {
            key: 'SaleServices', label: '4A(ii) Sale of services', type: 'num', source: 'books',
            path: 'TradingAccount/SaleOfServices',
          },
          {
            key: 'OtherOpRevenue', label: '4A(iii) Other operating revenue', type: 'num',
            source: 'books', path: 'TradingAccount/OperatingRevenueTotal',
          },
          {
            key: 'GrossReceipts', label: '4A(iv) Total of the above', type: 'num', source: 'books',
            path: 'TradingAccount/SalesGrossReceiptsTotal',
          },
          {
            key: 'GrossReceiptsGST',
            label: '4B Gross receipts from activities registered under GST', type: 'num',
            source: 'gst', path: 'TradingAccount/GrossRcptFromProfession',
          },
          {
            key: 'DutiesTotal',
            label: '4C(ix) Duties, taxes and cess received or receivable — total', type: 'num',
            source: 'gst', path: 'TradingAccount/ExciseCustomsVAT/TotExciseCustomsVAT',
          },
          {
            key: 'TotRevenueOps', label: '4D Total revenue from operations', type: 'num',
            source: 'books', path: 'TradingAccount/TotRevenueFrmOperations',
          },
          {
            key: 'ClosingStockTrd', label: '5 Closing stock of finished goods', type: 'num',
            source: 'books', path: 'TradingAccount/ClsngStckOfFinishedStcks',
          },
          {
            key: 'TotalOfCredits', label: '6 Total of credits to the trading account', type: 'num',
            source: 'books', path: 'TradingAccount/TardingAccTotCred',
          },
          {
            key: 'OpStockFG', label: '7 Opening stock of finished goods', type: 'num',
            source: 'books', path: 'TradingAccount/OpngStckOfFinishedStcks',
          },
          {
            key: 'PurchasesTrd', label: '8 Purchases net of refunds and returns', type: 'num',
            source: 'books', path: 'TradingAccount/Purchases',
          },
          {
            key: 'DirectExpTrd',
            label: '9 Direct expenses — carriage inward, power and fuel and others', type: 'num',
            source: 'books', path: 'TradingAccount/DirectExpensesTotal',
          },
          {
            key: 'DutiesTaxesPaid',
            label: '10(xii) Duties and taxes paid or payable on purchases — total', type: 'num',
            source: 'gst', path: 'TradingAccount/DutyTaxPay/ExciseCustomsVAT/TotExciseCustomsVAT',
          },
          {
            key: 'CostGoodsFromMfg',
            label: '11 Cost of goods produced, transferred from the Manufacturing Account',
            type: 'num', source: 'books', path: 'TradingAccount/GoodsCostPrdcdFrmMA',
          },
          {
            key: 'GrossProfit', label: '12 Gross profit from business or profession', type: 'num',
            source: 'books', path: 'TradingAccount/GrossProfitFrmBusProf',
          },
          {
            key: 'IntradayTurnover', label: '12(a) Turnover from intraday trading', type: 'num',
            source: 'broker', path: 'TradingAccount/TurnoverIntradayTrd',
          },
          {
            key: 'IntradayIncome',
            label: '12(b) Income from intraday trading transferred to profit and loss', type: 'num',
            source: 'broker', path: 'TradingAccount/IncomeIntradayTrd',
          },
          {
            key: 'FOTurnover', label: '12(c) Turnover from futures and options trading',
            type: 'num', source: 'broker', path: 'TradingAccount/TurnoverFutureTrd',
          },
          {
            key: 'FOIncome',
            label: '12(d) Income from futures and options transferred to profit and loss',
            type: 'num', source: 'broker', path: 'TradingAccount/IncomeFutureTrd',
          },
        ],
      },
    ],
  },

  {
    id: 'PL',
    code: 'PartA_PL',
    no: 'A-6',
    name: 'Profit and Loss Account, including Presumptive Income',
    part: 'Part A — Accounts',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Profit and Loss Account, including Presumptive Income',
        note: 'Rules 80–146. Item 61 relates to section 44AD, item 62 to section 44ADA, item 63 to section 44AE, items 64 and 65 to cases where books are not maintained, and item 66 to sections 44B, 44BB, 44BBA, 44BBC and 44BBD.',
        fields: [
          {
            key: 'GrossProfitTrf', label: '13 Gross profit transferred from the Trading Account',
            type: 'num', source: 'books', path: 'PARTA_PL/CreditsToPL/GrossProfitTrnsfFrmTrdAcc',
          },
          {
            key: 'OtherIncTotal', label: '14 Other income — total', type: 'num', source: 'books',
            path: 'PARTA_PL/CreditsToPL/OthIncome/TotOthIncome',
          },
          {
            key: 'DividendInc14iii', label: '14(iii) Dividend income', type: 'num', source: 'ais',
            path: 'PARTA_PL/CreditsToPL/OthIncome/Dividends',
          },
          {
            key: 'TotalCredits', label: '15 Total credits to the profit and loss account',
            type: 'num', source: 'books', path: 'PARTA_PL/CreditsToPL/TotCreditsToPL',
          },
          {
            key: 'OpeningStockPL',
            label: '16 to 21 Purchases, consumption and principal expense heads — total',
            type: 'num', source: 'books',
          },
          {
            key: 'EmpComp', label: '22(xi) Compensation to employees — total', type: 'num',
            source: 'books', path: 'PARTA_PL/DebitsToPL/EmployeeComp/TotEmployeeComp',
          },
          {
            key: 'Insurance', label: '23(v) Total expenditure on insurance', type: 'num',
            source: 'insurer', path: 'PARTA_PL/DebitsToPL/Insurances/TotInsurances',
          },
          {
            key: 'CommissionTot', label: '30(iii) Commission — total', type: 'num', source: 'books',
            path: 'PARTA_PL/DebitsToPL/CommissionExpdrDtls/Total',
          },
          {
            key: 'RoyaltyTot', label: '31(iii) Royalty — total', type: 'num', source: 'books',
            path: 'PARTA_PL/DebitsToPL/RoyalityDtls/Total',
          },
          {
            key: 'ProfFees',
            label: '32(iii) Professional or consultancy fees and fees for technical services',
            type: 'num', source: 'books', path: 'PARTA_PL/DebitsToPL/ProfessionalConstDtls/Total',
          },
          {
            key: 'OtherExp', label: '46 Other expenses — total', type: 'num', source: 'books',
            path: 'PARTA_PL/DebitsToPL/OtherExpenses',
          },
          {
            key: 'BadDebt', label: '47(iv) Bad debts — total', type: 'num', source: 'books',
            path: 'PARTA_PL/DebitsToPL/BadDebtDtls/BadDebt',
          },
          {
            key: 'ProvBadDebt', label: '48 Provision for bad and doubtful debts', type: 'num',
            source: 'books', path: 'PARTA_PL/DebitsToPL/ProvForBadDoubtDebt',
          },
          {
            key: 'OtherProv', label: '49 Other provisions', type: 'num', source: 'books',
            path: 'PARTA_PL/DebitsToPL/OthProvisionsExpdr',
          },
          {
            key: 'PBIDT', label: '50 Profit before interest, depreciation and taxes', type: 'num',
            source: 'books', path: 'PARTA_PL/DebitsToPL/PBIDTA',
          },
          {
            key: 'InterestTot', label: '51(iii) Interest — total', type: 'num', source: 'books',
            path: 'PARTA_PL/DebitsToPL/InterestExpdrtDtls/InterestExpdr',
          },
          {
            key: 'Depreciation52', label: '52 Depreciation and amortisation', type: 'num',
            source: 'books', path: 'PARTA_PL/DebitsToPL/DepreciationAmort',
          },
          {
            key: 'NPBT', label: '53 Net profit before taxes', type: 'num', source: 'books',
            path: 'PARTA_PL/DebitsToPL/PBT',
          },
          {
            key: 'ProvCurrTax', label: '54 Provision for current tax', type: 'num', source: 'books',
            path: 'PARTA_PL/TaxProvAppr/ProvForCurrTax',
          },
          {
            key: 'ProvDefTax', label: '55 Provision for deferred tax', type: 'num', source: 'books',
            path: 'PARTA_PL/TaxProvAppr/ProvDefTax',
          },
          {
            key: 'PAT', label: '56 Profit after tax', type: 'num', source: 'books',
            path: 'PARTA_PL/TaxProvAppr/ProfitAfterTax',
          },
          {
            key: 'BalBroughtFwd', label: '57 Balance brought forward from the previous year',
            type: 'num', source: 'books', path: 'PARTA_PL/TaxProvAppr/BalBFPrevYr',
          },
          {
            key: 'AmtAvailAppr', label: '58 Amount available for appropriation', type: 'num',
            source: 'books', path: 'PARTA_PL/TaxProvAppr/AmtAvlAppr',
          },
          {
            key: 'Appropriations', label: '59 Transferred to reserves and funds', type: 'num',
            source: 'books', path: 'PARTA_PL/TaxProvAppr/TrfToReserves',
          },
          {
            key: 'BalCarriedBS',
            label: '60 Balance carried to the balance sheet in the proprietor’s account',
            type: 'num', source: 'books', path: 'PARTA_PL/TaxProvAppr/ProprietorAccBalTrf',
          },
          {
            key: 'GT44ADBank',
            label: '61(i)(a) Section 44AD — gross turnover received through banking or prescribed electronic modes',
            type: 'num', source: 'books', path: 'PARTA_PL/PersumptiveInc44AD/GrsTrnOverBank',
            hint: 'Section 44AD runs to ₹2 crore of turnover, or ₹3 crore where cash receipts do not exceed five per cent.',
          },
          {
            key: 'GT44ADCash', label: '61(i)(b) Section 44AD — gross turnover received in cash',
            type: 'num', source: 'books', path: 'PARTA_PL/PersumptiveInc44AD/GrsTotalTrnOverInCash',
          },
          {
            key: 'GT44ADOther',
            label: '61(i)(c) Section 44AD — gross turnover received by any other mode', type: 'num',
            source: 'books', path: 'PARTA_PL/PersumptiveInc44AD/GrsTrnOverAnyOthMode',
          },
          {
            key: 'PI44ADBank',
            label: '61(ii)(A) Presumptive income at six per cent of item 61(i)(a)', type: 'num',
            source: 'books', path: 'PARTA_PL/PersumptiveInc44AD/PersumptiveInc44AD6Per',
            hint: 'Six per cent of the turnover received through banking or electronic modes.',
          },
          {
            key: 'PI44ADCash',
            label: '61(ii)(B) Presumptive income at eight per cent of items 61(i)(b) and (c)',
            type: 'num', source: 'books',
            path: 'PARTA_PL/PersumptiveInc44AD/PersumptiveInc44AD8Per',
            hint: 'Eight per cent of the turnover received in cash or by any other mode.',
          },
          {
            key: 'GR44ADA', label: '62(i) Section 44ADA — gross receipts', type: 'num',
            source: 'books', path: 'PARTA_PL/PersumptiveInc44ADA/GrsReceipt',
            hint: 'Section 44ADA runs to ₹50 lakh of gross receipts, or ₹75 lakh where cash receipts do not exceed five per cent.',
          },
          {
            key: 'PI44ADA',
            label: '62(ii) Presumptive income under section 44ADA, being not less than fifty per cent',
            type: 'num', source: 'books',
            path: 'PARTA_PL/PersumptiveInc44ADA/TotPersumptiveInc44ADA',
            hint: 'Not less than fifty per cent of gross receipts.',
          },
          {
            key: 'PI44AE',
            label: '63(ii) Total presumptive income from goods carriages under section 44AE',
            type: 'num', source: 'user', path: 'PARTA_PL/TotalPrsumptvIncUs44EGoods',
            hint: '₹1,000 per tonne per month for a heavy goods vehicle and ₹7,500 per month for any other carriage.',
          },
          {
            key: 'NA_BusGR', label: '64(i)(a) No accounts — business gross receipts', type: 'num',
            source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/GrossReceipt',
          },
          {
            key: 'NA_BusGP', label: '64(i)(b) No accounts — business gross profit', type: 'num',
            source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/GrossProfit',
          },
          {
            key: 'NA_BusExp', label: '64(i)(c) No accounts — business expenses', type: 'num',
            source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/Expenses',
          },
          {
            key: 'NA_BusNP', label: '64(i)(d) No accounts — business net profit', type: 'num',
            source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/NetProfit',
          },
          {
            key: 'NA_ProfGR', label: '64(ii)(a) No accounts — professional gross receipts',
            type: 'num', source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/GrossReceiptPrf',
          },
          {
            key: 'NA_ProfGP', label: '64(ii)(b) No accounts — professional gross profit',
            type: 'num', source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/GrossProfitPrf',
          },
          {
            key: 'NA_ProfExp', label: '64(ii)(c) No accounts — professional expenses', type: 'num',
            source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/ExpensesPrf',
          },
          {
            key: 'NA_ProfNP', label: '64(ii)(d) No accounts — professional net profit', type: 'num',
            source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/NetProfitPrf',
          },
          {
            key: 'NA_Total', label: '64(iii) Total profit where books are not maintained',
            type: 'num', source: 'books', path: 'PARTA_PL/NoBooksOfAccPL/TotBusinessProfession',
          },
          {
            key: 'SpecTurnover', label: '65(i) Speculative activity — turnover', type: 'num',
            source: 'broker', path: 'PARTA_PL/TurnverFrmSpecActivity',
          },
          {
            key: 'SpecGP', label: '65(ii) Speculative activity — gross profit', type: 'num',
            source: 'broker', path: 'PARTA_PL/GrossProfit',
          },
          {
            key: 'SpecExp', label: '65(iii) Speculative activity — expenditure', type: 'num',
            source: 'broker', path: 'PARTA_PL/Expenditure',
          },
          {
            key: 'SpecNet', label: '65(iv) Net income from speculative activity', type: 'num',
            source: 'broker', path: 'PARTA_PL/NetIncomeFrmSpecActivity',
          },
          {
            key: 'OthPresSec', label: '66 Other presumptive provision opted', type: 'sel',
            options: [
              { value: '', label: 'Not applicable' },
              { value: '44B', label: 'seven and one-half per cent' },
              { value: '44BB', label: 'ten per cent' },
              { value: '44BBA', label: 'five per cent' },
              { value: '44BBC', label: 'twenty per cent' },
              { value: '44BBD', label: 'twenty-five per cent' },
            ],
            source: 'user', path: 'PARTA_PL/NonResidentPLDetails/Section',
          },
          {
            key: 'OthPresGR', label: '66(i) Gross receipts or turnover under the section opted',
            type: 'num', source: 'books', path: 'PARTA_PL/NonResidentPLDetails/GrossReceipt',
            showIf: { field: 'PL.OthPresSec', notEquals: '' },
          },
          {
            key: 'OthPresNP', label: '66(ii) Net profit declared under the section opted',
            type: 'num', source: 'books', path: 'PARTA_PL/NonResidentPLDetails/NetProfit',
            showIf: { field: 'PL.OthPresSec', notEquals: '' },
          },
        ],
        tables: [
          {
            key: 'Goods44AE',
            title: '63(i) Particulars of goods carriages — section 44AE (aggregate months not to exceed 120; tonnage not to exceed 100 MT)',
            note: 'The aggregate of months may not exceed 120 and tonnage may not exceed 100 MT.',
            source: 'user',
            path: 'PARTA_PL/GoodsDtlsUs44AE',
            columns: [
              { key: 'RegNo', label: 'Registration number', type: 'text', path: 'RegNumberGoodsCarriage' },
              { key: 'Ownership', label: 'Owned, leased or hired', type: 'text', path: 'OwnedLeasedHiredFlag' },
              {
                key: 'Tonnage', label: 'Tonnage capacity in metric tonnes', type: 'num',
                path: 'TonnageCapacity',
              },
              { key: 'Months', label: 'Number of months held', type: 'num', path: 'HoldingPeriod' },
              {
                key: 'PresInc', label: 'Presumptive income for the carriage', type: 'num',
                path: 'PresumptiveIncome',
              },
            ],
          },
          {
            key: 'BadDebtors',
            title: '47(i) Particulars of bad debts written off where the amount exceeds ₹1 lakh',
            source: 'books',
            path: 'PARTA_PL/DebitsToPL/BadDebtDtls/BadDebtAmtDtls',
            columns: [
              { key: 'DebtorPAN', label: 'Permanent Account Number or Aadhaar', type: 'text', path: 'PAN' },
              { key: 'DebtorName', label: 'Name, where no number is available', type: 'text' },
              { key: 'DebtorAddr', label: 'Address', type: 'text' },
              { key: 'Amt', label: 'Amount written off', type: 'num', path: 'Amount' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'OI',
    code: 'PartA_OI',
    no: 'A-7',
    name: 'Other Information',
    part: 'Part A — Accounts',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Other Information',
        note: 'Rules 148–159. Where the accounts are audited, these particulars must agree with the corresponding clauses of Form 3CD as set out in Annexure 1 to the validation rules.',
        fields: [
          {
            key: 'MethodAcc', label: '1 Method of accounting employed', type: 'sel',
            options: [{ value: 'MERC', label: 'Mercantile' }, { value: 'CASH', label: 'Cash' }],
            source: 'books', path: 'PARTA_OI/MethodOfAcct',
          },
          {
            key: 'MethodChange', label: '2 Has there been a change in the method of accounting?',
            type: 'sel', options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }],
            source: 'books', path: 'PARTA_OI/ChangeInAcctMethFlg',
          },
          {
            key: 'ICDSIncrease',
            label: '3(a) Increase in profit on account of deviation from income computation and disclosure standards',
            type: 'num', source: 'audit', path: 'PARTA_OI/ProfDeviatDueAcctMeth',
          },
          {
            key: 'ICDSDecrease', label: '3(b) Decrease in profit on account of such deviation',
            type: 'num', source: 'audit', path: 'PARTA_OI/DecProOrIncLossUs145_2',
          },
          {
            key: 'MethodValStock', label: '4(a) Method of valuation of closing stock', type: 'sel',
            options: [
              { value: '2', label: 'Cost' },
              { value: '3', label: 'Market rate' },
              { value: '1', label: 'Cost or market rate, whichever is lower' },
            ],
            source: 'books', path: 'PARTA_OI/MethodOfValClgStk/ValRawMaterial',
          },
          {
            key: 'NotCredited5f',
            label: '5(f) Amounts not credited to the profit and loss account — total', type: 'num',
            source: 'audit', path: 'PARTA_OI/NoCredToPLAmt/TotNoCredToPLAmt',
          },
          {
            key: 'Disallow36', label: '6(s) Amounts disallowable under section 36 — total',
            type: 'num', source: 'audit', path: 'PARTA_OI/AmtDisallUs36/TotAmtDisallUs36',
          },
          {
            key: 'Disallow37', label: '7(j) Amounts disallowable under section 37 — total',
            type: 'num', source: 'audit', path: 'PARTA_OI/AmtDisallUs37/TotAmtDisallUs37',
          },
          {
            key: 'Disallow40', label: '8A(j) Amounts disallowable under section 40 — total',
            type: 'num', source: 'audit', path: 'PARTA_OI/AmtDisallUs40/TotAmtDisallUs40',
          },
          {
            key: 'Allow40PY',
            label: '8B Amounts disallowed under section 40 in an earlier year, allowable this year',
            type: 'num', source: 'audit', path: 'PARTA_OI/AmtDisallUs40/AmtDisallUs40PyNowAll',
          },
          {
            key: 'Disallow40A', label: '9(f) Amounts disallowable under section 40A — total',
            type: 'num', source: 'audit', path: 'PARTA_OI/AmtDisallUs40A/TotAmtDisallUs40A',
          },
          {
            key: 'Allow43B', label: '10(g) Amounts allowable under section 43B — total',
            type: 'num', source: 'audit',
            path: 'PARTA_OI/AmtDisallUs43BPyNowAll/AmtUs43B/TotAmtUs43b',
          },
          {
            key: 'Disallow43B', label: '11(i) Amounts disallowable under section 43B — total',
            type: 'num', source: 'audit', path: 'PARTA_OI/AmtDisall43B/AmtUs43B/TotAmtUs43b',
          },
          {
            key: 'MSMEBeyond',
            label: '11(h) Sums payable to a micro or small enterprise beyond the time limit in section 15 of the MSMED Act',
            type: 'num', source: 'audit', path: 'PARTA_OI/AmtDisall43B/AmtUs43B/MSEPayable',
          },
          {
            key: 'OutstandingTax12i',
            label: '12(i) Amounts of tax, duty and cess outstanding — total', type: 'num',
            source: 'audit',
            path: 'PARTA_OI/AmtExciseCustomsVATOutstanding/ExciseCustomsVAT/TotExciseCustomsVAT',
          },
          {
            key: 'Deemed33AB', label: '13 Amounts deemed to be profits under section 33AB or 33ABA',
            type: 'num', source: 'audit', path: 'PARTA_OI/DeemedProfUs33ABs',
          },
          {
            key: 'Profit41', label: '14 Amount of profit chargeable to tax under section 41',
            type: 'num', source: 'audit', path: 'PARTA_OI/ProfTaxAmtUs41',
          },
          {
            key: 'Disallow14A', label: '16 Amount of expenditure disallowed under section 14A',
            type: 'num', source: 'audit', path: 'PARTA_OI/AmountOfExpDisAllwUs14A',
          },
          {
            key: 'IntMSME23', label: '17 Interest disallowable under section 23 of the MSMED Act',
            type: 'num', source: 'audit', path: 'PARTA_OI/InterestDisAllowUs23SMEAct',
          },
          {
            key: 'Sec92CE2A',
            label: 'Is the option under sub-section (2A) of section 92CE being exercised?',
            type: 'sel', options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }],
            source: 'user', path: 'PARTA_OI/ScheduleTPSAFlg',
          },
        ],
      },
    ],
  },

  {
    id: 'QD',
    code: 'PartA_QD',
    no: 'A-8',
    name: 'Quantitative Details',
    part: 'Part A — Accounts',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Quantitative Details',
        fields: [
          {
            key: 'TradingItems',
            label: 'Trading concern — principal items, unit, opening stock, purchases, sales, closing stock and shortage',
            type: 'text', span: 12, source: 'books',
          },
          {
            key: 'MfgRawMat',
            label: 'Manufacturing concern — raw materials: opening stock, purchases, consumption, sales, closing stock and yield',
            type: 'text', span: 12, source: 'books',
          },
          {
            key: 'MfgFinished',
            label: 'Manufacturing concern — finished products: opening stock, production, sales and closing stock',
            type: 'text', span: 12, source: 'books',
          },
        ],
      },
    ],
  },

  {
    id: 'S',
    code: 'ScheduleS',
    no: 'B-1',
    name: 'Schedule S — Salaries',
    part: 'Part B — Heads of Income',
    forms: ['ITR3'],
    showIf: { field: 'GEN.Status', notEquals: 'H' },
    sections: [
      {
        key: 'main',
        title: 'Schedule S — Salaries',
        note: 'Rules 160–209. Not applicable where the status is Hindu Undivided Family. The table under section 10(13A) must be completed to claim house rent allowance, which is available only under the old regime.',
        fields: [
          {
            key: 'EmployerName', label: 'Name of the employer', type: 'text', source: 'form16',
            path: 'ScheduleS/Salaries/NameOfEmployer',
          },
          {
            key: 'EmployerTAN', label: 'Tax Deduction Account Number of the employer', type: 'tan',
            source: 'form16', path: 'ScheduleS/Salaries/TANofEmployer',
          },
          {
            key: 'EmployerCategory', label: 'Nature of the employer', type: 'sel',
            options: [
              { value: 'CGOV', label: 'Central Government' },
              { value: 'SGOV', label: 'State Government' },
              { value: 'PSU', label: 'Public Sector Undertaking' },
              { value: 'PE', label: 'Pensioners — Central Government' },
              { value: 'PESG', label: 'Pensioners — State Government' },
              { value: 'PEPS', label: 'Pensioners — Public Sector Undertaking' },
              { value: 'PEO', label: 'Pensioners — Other' },
              { value: 'OTH', label: 'Others' },
              { value: '', label: 'Not applicable' },
            ],
            source: 'form16', path: 'ScheduleS/Salaries/NatureOfEmployment',
          },
          {
            key: 'Sal17_1', label: '1(a) Salary as per section 17(1)', type: 'num',
            source: 'form16', path: 'ScheduleS/Salaries/Salarys/Salary',
          },
          {
            key: 'Perq17_2', label: '1(b) Value of perquisites as per section 17(2)', type: 'num',
            source: 'form16', path: 'ScheduleS/Salaries/Salarys/ValueOfPerquisites',
          },
          {
            key: 'Profit17_3', label: '1(c) Profit in lieu of salary as per section 17(3)',
            type: 'num', source: 'form16', path: 'ScheduleS/Salaries/Salarys/ProfitsinLieuOfSalary',
          },
          {
            key: 'Income89A_1d',
            label: '1(d) Income from a retirement benefit account maintained in a notified country',
            type: 'num', source: 'user', path: 'ScheduleS/Salaries/Salarys/IncomeNotified89A',
          },
          {
            key: 'Income89A_1e',
            label: '1(e) Income from a retirement benefit account maintained in any other country',
            type: 'num', source: 'user', path: 'ScheduleS/Salaries/Salarys/IncomeNotifiedOther89A',
          },
          {
            key: 'GrossSalary', label: '2 Total gross salary from all employers', type: 'num',
            source: 'form16', path: 'ScheduleS/TotalGrossSalary',
          },
          {
            key: 'ExemptAllow', label: '3 Allowances exempt under section 10 — total', type: 'num',
            source: 'form16', path: 'ScheduleS/AllwncExtentExemptUs10',
          },
          {
            key: 'HRAExempt', label: 'Of which, house rent allowance exempt under section 10(13A)',
            type: 'num', source: 'form16', path: 'ScheduleS/Section10_13A/EligbleExmpAllwncUs13A',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
            hint: 'The least of the allowance received, rent paid less ten per cent of salary, and fifty or forty per cent of salary.',
          },
          {
            key: 'HRABasicDA',
            label: 'Table 10(13A) — basic salary and dearness allowance for the period',
            type: 'num', source: 'form16', path: 'ScheduleS/Section10_13A/DtlsSalUsSec171',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'HRAReceived', label: 'Table 10(13A) — actual house rent allowance received',
            type: 'num', source: 'form16', path: 'ScheduleS/Section10_13A/ActlHRARecv',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'HRARentPaid', label: 'Table 10(13A) — actual rent paid', type: 'num',
            source: 'user', path: 'ScheduleS/Section10_13A/ActlRentPaid',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'HRAMetro', label: 'Table 10(13A) — place of residence', type: 'sel',
            options: [
              { value: '1', label: 'Metro city — fifty per cent' },
              { value: '2', label: 'Non-metro city — forty per cent' },
            ],
            source: 'user', path: 'ScheduleS/Section10_13A/Placeofwork',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'NetSalary', label: '4 Net salary', type: 'num', source: 'form16',
            path: 'ScheduleS/NetSalary',
          },
          {
            key: 'StdDeduction', label: '5(a) Standard deduction under section 16(ia)', type: 'num',
            source: 'form16', path: 'ScheduleS/DeductionUnderSection16ia',
            hint: '₹75,000 under the new regime and ₹50,000 under the old, capped at net salary.',
          },
          {
            key: 'EntAllow', label: '5(b) Entertainment allowance under section 16(ii)',
            type: 'num', source: 'form16', path: 'ScheduleS/EntertainmntalwncUs16ii',
          },
          {
            key: 'ProfTax', label: '5(c) Professional tax under section 16(iii)', type: 'num',
            source: 'form16', path: 'ScheduleS/ProfessionalTaxUs16iii',
          },
          {
            key: 'IncomeSalaries', label: '6 Income chargeable under the head “Salaries”',
            type: 'num', source: 'form16', path: 'ScheduleS/TotIncUnderHeadSalaries',
          },
          {
            key: 'Relief89A', label: '2(a) Relief claimed under section 89A', type: 'num',
            source: 'user', path: 'ScheduleS/Increliefus89A',
          },
        ],
      },
    ],
  },

  {
    id: 'HP',
    code: 'ScheduleHP',
    no: 'B-2',
    name: 'Schedule HP — Income from House Property',
    part: 'Part B — Heads of Income',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule HP — Income from House Property',
        note: 'Rules 210–236. Not more than two properties may be treated as self-occupied. Standard deduction is thirty per cent of the annual value. Interest on borrowed capital for a self-occupied property is limited to ₹2,00,000 and is available only under the old regime.',
        fields: [
          {
            key: 'TotalHP', label: '3 Total income chargeable under the head “House Property”',
            type: 'num', source: 'user', path: 'ScheduleHP/TotalIncomeChargeableUnHP',
            hint: 'Set-off of a house property loss against other heads is capped at ₹2,00,000 by section 71(3A).',
          },
        ],
        tables: [
          {
            key: 'HPRows',
            title: 'Particulars of each house property',
            source: 'user',
            path: 'ScheduleHP/PropertyDetails',
            columns: [
              {
                key: 'Address', label: 'Address of the property', type: 'text',
                path: 'AddressDetailWithZipCode/AddrDetail',
              },
              {
                key: 'Type', label: 'Self-occupied, let out or deemed let out', type: 'text',
                path: 'ifLetOut',
              },
              { key: 'CoOwned', label: 'Is the property co-owned?', type: 'text', path: 'PropCoOwnedFlg' },
              {
                key: 'OwnShare', label: 'Percentage share of the assessee', type: 'num',
                path: 'AsseseeShareProperty',
              },
              { key: 'CoOwnerPAN', label: 'Name and Permanent Account Number of each co-owner', type: 'text' },
              {
                key: 'TenantName', label: 'Name and Permanent Account Number or TAN of the tenant',
                type: 'text', span: 8,
              },
              {
                key: 'GrossRent', label: '1(a) Gross rent received, receivable or lettable value',
                type: 'num', path: 'Rentdetails/AnnualLetableValue',
              },
              {
                key: 'UnrealRent', label: '1(b) Rent which cannot be realised', type: 'num',
                path: 'Rentdetails/RentNotRealized',
              },
              {
                key: 'MunTax', label: '1(c) Municipal taxes paid', type: 'num',
                path: 'Rentdetails/LocalTaxes',
              },
              { key: 'AnnualValue', label: '1(e) Annual value', type: 'num', path: 'Rentdetails/BalanceALV' },
              {
                key: 'StdDed30', label: '1(g) Standard deduction at thirty per cent', type: 'num',
                path: 'Rentdetails/ThirtyPercentOfBalance',
              },
              {
                key: 'Interest24b',
                label: '1(h) Interest payable on borrowed capital under section 24(b)', type: 'num',
                path: 'Rentdetails/IntOnBorwCap',
              },
              {
                key: 'LenderDetail',
                label: 'Table 24(b) — lender, Permanent Account Number and loan account number',
                type: 'text', span: 8,
              },
              {
                key: 'ArrearsRent',
                label: '1(j) Arrears or unrealised rent received, less thirty per cent',
                type: 'num', path: 'Rentdetails/ArrearsUnrealizedRentRcvd',
              },
              {
                key: 'IncomeHP', label: '1(k) Income from this house property', type: 'num',
                path: 'Rentdetails/IncomeOfHP',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'BP',
    code: 'ScheduleBP',
    no: 'B-3',
    name: 'Schedule BP — Profits and Gains from Business or Profession',
    part: 'Part B — Heads of Income',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule BP — Profits and Gains from Business or Profession',
        note: 'Rules 237–303. Part A relates to business other than speculative and specified business, Part B to speculative business, Part C to specified business under section 35AD and Part D to the aggregate.',
        fields: [
          {
            key: 'A1_ProfitPL',
            label: 'A1 Profit before tax as per the profit and loss account, including presumptive income',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/ProfBfrTaxPL',
          },
          {
            key: 'A2a_SpecProfit',
            label: 'A2(a) Net profit or loss from speculative business included above', type: 'num',
            source: 'broker', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/NetPLFromSpecBus',
          },
          {
            key: 'A2b_SpecifiedProfit',
            label: 'A2(b) Net profit or loss from specified business included above', type: 'num',
            source: 'books', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/NetPLFromSpecifiedBus',
          },
          {
            key: 'A3a_SalaryInc',
            label: 'A3(a) Income credited to the profit and loss account, chargeable under “Salaries”',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncRecCredPLOthHeadDtls/Salary',
          },
          {
            key: 'A3b_HPInc', label: 'A3(b) Income credited, chargeable under “House Property”',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncRecCredPLOthHeadDtls/HouseProperty',
          },
          {
            key: 'A3c_CGInc', label: 'A3(c) Income credited, chargeable under “Capital Gains”',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncRecCredPLOthHeadDtls/CapitalGains',
          },
          {
            key: 'A3d_OSInc', label: 'A3(d) Income credited, chargeable under “Other Sources”',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncRecCredPLOthHeadDtls/OtherSources',
          },
          {
            key: 'A3e_115BBF',
            label: 'A3(e) Income chargeable under section 115BBF — royalty on patents', type: 'num',
            source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncRecCredPLOthHeadDtls/Us115BBF',
          },
          {
            key: 'A3f_115BBG',
            label: 'A3(f) Income chargeable under section 115BBG — transfer of carbon credits',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncRecCredPLOthHeadDtls/Us115BBG',
          },
          {
            key: 'A3g_115BBH',
            label: 'A3(g) Income chargeable under section 115BBH — virtual digital assets',
            type: 'num', source: 'broker',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncRecCredPLOthHeadDtls/115BBH',
          },
          {
            key: 'A4a_ExemptInc',
            label: 'A4(a) Exempt income credited to the profit and loss account', type: 'num',
            source: 'books', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncCredPL/TotExempIncPL',
          },
          {
            key: 'A4b_Rule7',
            label: 'A4(b) Profit from activities covered under Rules 7, 7A, 7B and 8', type: 'num',
            source: 'books', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/TotalProfitFrmActCvrd',
          },
          {
            key: 'A5a_FirmShare',
            label: 'A5(a) Share of income from firms in which you are a partner', type: 'num',
            source: 'user', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncCredPL/FirmShareInc',
          },
          {
            key: 'A5c_DividendRed', label: 'A5(c) Dividend income reduced', type: 'num',
            source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncCredPL/OtherExmptIncDtl/OperatingDividendAmt',
          },
          {
            key: 'A6_Balance', label: 'A6 Balance after the above adjustments', type: 'num',
            source: 'books', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/BalancePLOthThanSpecBus',
          },
          {
            key: 'A9_Additions', label: 'A9 Expenses relating to income of other heads, added back',
            type: 'num', source: 'books', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/TotExpDebPL',
          },
          {
            key: 'A10', label: 'A10 Adjusted profit', type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/AdjustedPLOthThanSpecBus',
          },
          {
            key: 'A11_Depreciation',
            label: 'A11 Depreciation and amortisation debited to the profit and loss account',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DepreciationDebPLCosAct',
          },
          {
            key: 'A12i_DepIT',
            label: 'A12(i) Depreciation allowable under sections 32(1)(ii) and 32(1)(iia)',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DepreciationAllowITAct32/DepreciationAllowUs32_1_ii',
            hint: 'Must agree with item 6 of Schedule DEP.',
          },
          {
            key: 'A12ii_Dep32_1i',
            label: 'A12(ii) Depreciation allowable under section 32(1)(i) — power sector only',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DepreciationAllowITAct32/DepreciationAllowUs32_1_i',
          },
          {
            key: 'A13', label: 'A13 Profit after allowing depreciation under the Act', type: 'num',
            source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/AdjustPLAfterDeprOthSpecInc',
          },
          {
            key: 'A14_Dis36', label: 'A14 Amounts disallowable under section 36', type: 'num',
            source: 'audit', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/AmtDebPLDisallowUs36',
          },
          {
            key: 'A15_Dis37', label: 'A15 Amounts disallowable under section 37', type: 'num',
            source: 'audit', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/AmtDebPLDisallowUs37',
          },
          {
            key: 'A16_Dis40', label: 'A16 Amounts disallowable under section 40', type: 'num',
            source: 'audit', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/AmtDebPLDisallowUs40',
          },
          {
            key: 'A17_Dis40A', label: 'A17 Amounts disallowable under section 40A', type: 'num',
            source: 'audit', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/AmtDebPLDisallowUs40A',
          },
          {
            key: 'A18_Dis43B', label: 'A18 Amounts disallowable under section 43B', type: 'num',
            source: 'audit', path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/AmtDebPLDisallowUs43B',
          },
          {
            key: 'A22_Interest23',
            label: 'A22 Interest disallowable under section 23 of the MSMED Act', type: 'num',
            source: 'audit',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/InterestDisAllowUs23SMEAct',
          },
          {
            key: 'A24e_ESRNeg', label: 'A24(e) Deemed income arising from Schedule ESR',
            type: 'num', source: 'audit',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DeemIncUs35ABA',
          },
          {
            key: 'A25_ICDSInc',
            label: 'A25 Increase in profit on account of income computation and disclosure standards',
            type: 'num', source: 'audit',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncProfDecLossAccICDSAdj',
          },
          {
            key: 'A26', label: 'A26 Total additions', type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/TotAfterAddToPLDeprOthSpecInc',
          },
          {
            key: 'A27_43BAllow',
            label: 'A27 to A30 Amounts allowable under sections 40 and 43B in this year',
            type: 'num', source: 'audit',
          },
          {
            key: 'A28_ESRDeduction',
            label: 'A28 Deduction under section 35 and allied sections in excess of the amount debited',
            type: 'num', source: 'audit',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DebPLUs35ExcessAmt',
          },
          {
            key: 'A32_ICDSDec',
            label: 'A32 Decrease in profit on account of income computation and disclosure standards',
            type: 'num', source: 'audit',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DecProfIncLossAccICDSAdj',
          },
          {
            key: 'A33', label: 'A33 Total deductions', type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/TotDeductionAmts',
          },
          {
            key: 'A34_Income', label: 'A34 Income', type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/PLAftAdjDedBusOthThanSpec',
          },
          {
            key: 'A35i_44AD', label: 'A35(i) Presumptive income under section 44AD', type: 'num',
            source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DeemedProfitBusUs/Section44AD',
          },
          {
            key: 'A35ii_44ADA', label: 'A35(ii) Presumptive income under section 44ADA',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DeemedProfitBusUs/Section44ADA',
          },
          {
            key: 'A35iii_44AE', label: 'A35(iii) Presumptive income under section 44AE',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/DeemedProfitBusUs/Section44AE',
          },
          {
            key: 'A35iv_vii',
            label: 'A35(iv) to (vii) Income under sections 44B, 44BB, 44BBA, 44BBC and 44BBD',
            type: 'num', source: 'books',
          },
          {
            key: 'A36_NetPGBP',
            label: 'A36 Net profit or loss from business other than speculative and specified business',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/NetPLAftAdjBusOthThanSpec',
          },
          {
            key: 'A37', label: 'A37 Net profit after apportionment under Rules 7, 7A, 7B and 8',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/IncomeOtherThanRule',
          },
          {
            key: 'A38_AgriDeemed', label: 'A38 Balance of income deemed to be from agriculture',
            type: 'num', source: 'books',
            path: 'ITR3ScheduleBP/BusinessIncOthThanSpec/BalIncDeemedFrmAgri',
          },
          {
            key: 'B39_SpecPL',
            label: 'B39 Speculative business — net profit or loss as per the accounts', type: 'num',
            source: 'broker', path: 'ITR3ScheduleBP/SpecBusinessInc/NetPLFrmSpecBus',
          },
          {
            key: 'B42_SpecIncome', label: 'B42 Income from speculative business', type: 'num',
            source: 'broker', path: 'ITR3ScheduleBP/SpecBusinessInc/AdjustedPLFrmSpecuBus',
          },
          {
            key: 'C43_SpecifiedPL',
            label: 'C43 Specified business — net profit or loss as per the accounts', type: 'num',
            source: 'books', path: 'ITR3ScheduleBP/SpecifiedBusinessInc/NetPLFrmSpecifiedBus',
          },
          {
            key: 'SpecifiedNature', label: 'Nature of the specified business under section 35AD',
            type: 'text', span: 8, source: 'user',
            path: 'ITR3ScheduleBP/SpecifiedBusinessInc/DedUs35ADSubSec5Dtls/DedUs35ADSubSec5',
          },
          {
            key: 'C48_SpecifiedIncome', label: 'C48 Income from specified business', type: 'num',
            source: 'books', path: 'ITR3ScheduleBP/SpecifiedBusinessInc/PLFrmSpecifiedBus',
          },
          {
            key: 'D_TotalPGBP',
            label: 'D Income chargeable under the head “Profits and gains from business or profession”',
            type: 'num', source: 'books', path: 'ITR3ScheduleBP/IncChrgUnHdProftGain',
          },
        ],
      },
    ],
  },

  {
    id: 'DEP',
    code: 'ScheduleDPM',
    no: 'B-4',
    name: 'Schedules DPM, DOA, DEP and DCG — Depreciation',
    part: 'Part B — Heads of Income',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedules DPM, DOA, DEP and DCG — Depreciation',
        note: 'Rules 304–351. Under the new regime, additional depreciation may not be claimed and the forty-five per cent block is not available.',
        fields: [
          {
            key: 'PM15_WDV',
            label: 'Plant and machinery at fifteen per cent — written down value at the beginning',
            type: 'num', source: 'books',
            path: 'ScheduleDPM/PlantMachinery/Rate15/DepreciationDetail/WDVFirstDay',
          },
          {
            key: 'PM15_Add',
            label: 'Plant and machinery at fifteen per cent — additions during the year',
            type: 'num', source: 'books',
            path: 'ScheduleDPM/PlantMachinery/Rate15/DepreciationDetail/AdditionsGrThan180Days',
          },
          {
            key: 'PM15_Sale', label: 'Plant and machinery at fifteen per cent — sale consideration',
            type: 'num', source: 'books',
            path: 'ScheduleDPM/PlantMachinery/Rate15/DepreciationDetail/RealizationTotalPeriod',
          },
          {
            key: 'PM15_Dep', label: 'Plant and machinery at fifteen per cent — depreciation',
            type: 'num', source: 'books',
            path: 'ScheduleDPM/PlantMachinery/Rate15/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'PM30_Dep', label: 'Plant and machinery at thirty per cent — depreciation',
            type: 'num', source: 'books',
            path: 'ScheduleDPM/PlantMachinery/Rate30/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'PM40_Dep', label: 'Plant and machinery at forty per cent — depreciation',
            type: 'num', source: 'books',
            path: 'ScheduleDPM/PlantMachinery/Rate40/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'PM45_Dep', label: 'Plant and machinery at forty-five per cent — depreciation',
            type: 'num', source: 'books',
            path: 'ScheduleDPM/PlantMachinery/Rate45/DepreciationDetail/TotalDepreciation',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'AddlDep', label: 'Additional depreciation under section 32(1)(iia)', type: 'num',
            source: 'books',
            path: 'ScheduleDPM/PlantMachinery/Rate15/DepreciationDetail/AddlnDeprOnGT180DayAdditions',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'Bld5_Dep', label: 'Buildings at five per cent — depreciation', type: 'num',
            source: 'books',
            path: 'ScheduleDOA/Building/Rate5/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'Bld10_Dep', label: 'Buildings at ten per cent — depreciation', type: 'num',
            source: 'books',
            path: 'ScheduleDOA/Building/Rate10/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'Bld40_Dep', label: 'Buildings at forty per cent — depreciation', type: 'num',
            source: 'books',
            path: 'ScheduleDOA/Building/Rate40/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'Furn10_Dep', label: 'Furniture and fittings at ten per cent — depreciation',
            type: 'num', source: 'books',
            path: 'ScheduleDOA/FurnitureFittings/Rate10/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'Intang25_Dep', label: 'Intangible assets at twenty-five per cent — depreciation',
            type: 'num', source: 'books',
            path: 'ScheduleDOA/IntangibleAssets/Rate25/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'Ships20_Dep', label: 'Ships at twenty per cent — depreciation', type: 'num',
            source: 'books', path: 'ScheduleDOA/Ships/Rate20/DepreciationDetail/TotalDepreciation',
          },
          {
            key: 'DEP_Total', label: 'Schedule DEP item 6 — total depreciation allowable',
            type: 'num', source: 'books', path: 'ScheduleDEP/SummaryFromDeprSch/TotalDepreciation',
          },
          {
            key: 'DCG_Total',
            label: 'Schedule DCG — total deemed capital gains on the sale of depreciable assets',
            type: 'num', source: 'books',
            path: 'ScheduleDCG/SummaryFromDeprSchCG/TotalDepreciation',
          },
        ],
      },
    ],
  },

  {
    id: 'ESR',
    code: 'ScheduleESR',
    no: 'B-5',
    name: 'Schedule ESR — Deduction under Section 35',
    part: 'Part B — Heads of Income',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule ESR — Deduction under Section 35',
        note: 'Rules 352–354. Under the new regime, no amount may be entered against sections 35(1)(ii), 35(1)(iia), 35(1)(iii), 35(2AA) and 35CCC.',
        fields: [
          {
            key: 'ESR_35_1_i', label: 'Section 35(1)(i)', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_1_i/DeductUs35/AmtUs35Allowable',
          },
          {
            key: 'ESR_35_1_ii', label: 'Section 35(1)(ii)', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_1_ii/DeductUs35/AmtUs35Allowable',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'ESR_35_1_iia', label: 'Section 35(1)(iia)', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_1_iia/DeductUs35/AmtUs35Allowable',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'ESR_35_1_iii', label: 'Section 35(1)(iii)', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_1_iii/DeductUs35/AmtUs35Allowable',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'ESR_35_1_iv', label: 'Section 35(1)(iv)', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_1_iv/DeductUs35/AmtUs35Allowable',
          },
          {
            key: 'ESR_35_2AA', label: 'Section 35(2AA)', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_2AA/DeductUs35/AmtUs35Allowable',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'ESR_35_2AB', label: 'Section 35(2AB)', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_2AB/DeductUs35/AmtUs35Allowable',
          },
          {
            key: 'ESR_35CCC', label: 'Section 35CCC', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_CCC/DeductUs35/AmtUs35Allowable',
            showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
          },
          {
            key: 'ESR_35CCD', label: 'Section 35CCD', type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/Section35_CCD/DeductUs35/AmtUs35Allowable',
          },
          {
            key: 'ESR_Excess',
            label: 'Item X(4) — deduction in excess of the amount debited to the profit and loss account',
            type: 'num', source: 'audit',
            path: 'ScheduleESR/DeductionUs35/TotUs35/DeductUs35/ExcessAmtOverDebPL',
          },
        ],
      },
    ],
  },

  {
    id: 'CG',
    code: 'ScheduleCGFor23',
    no: 'B-6',
    name: 'Schedule CG — Capital Gains',
    part: 'Part B — Heads of Income',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule CG — Capital Gains',
        note: 'Rules 355–484. For land or building the dates of purchase and sale are compulsory; for residents, transfers before 23 July 2024 are taxed at twenty per cent with indexation and thereafter at twelve and one-half per cent. Deduction under section 54EC may not exceed ₹50 lakh and under section 54F may not exceed ₹10 crore.',
        fields: [
          {
            key: 'STCG_A1_LandBld',
            label: 'A1 Short-term — land or building: full value of consideration', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/SaleofLandBuild/SaleofLandBuildDtls/FullConsideration',
          },
          {
            key: 'STCG_A1_Cost', label: 'A1(b)(i) Cost of acquisition', type: 'num', source: 'user',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/SaleofLandBuild/SaleofLandBuildDtls/AquisitCost',
          },
          {
            key: 'STCG_A1_Improve', label: 'A1(b)(ii) Cost of improvement', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/SaleofLandBuild/SaleofLandBuildDtls/ImproveCost',
          },
          {
            key: 'STCG_A1_Exp',
            label: 'A1(b)(iii) Expenditure wholly in connection with the transfer', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/SaleofLandBuild/SaleofLandBuildDtls/ExpOnTrans',
          },
          {
            key: 'STCG_A1e', label: 'A1(e) Short-term capital gain on land or building',
            type: 'num', source: 'user',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/SaleofLandBuild/SaleofLandBuildDtls/CapgainonAssets',
          },
          {
            key: 'STCG_A2', label: 'A2 Short-term capital gain on slump sale', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/SlumpSaleInStcg/CapgainonAssets',
          },
          {
            key: 'STCG_A3_111A',
            label: 'A3 Short-term capital gain under section 111A on which securities transaction tax is paid',
            type: 'num', source: 'broker',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/EquityMFonSTT/EquityMFonSTTDtls/CapgainonAssets',
          },
          {
            key: 'STCG_A5_NR',
            label: 'A5 Short-term capital gain of a non-resident, including under section 115AD',
            type: 'num', source: 'broker',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/NRISecur115AD/CapgainonAssets',
          },
          {
            key: 'STCG_A6_Other',
            label: 'A6 Short-term capital gain on assets other than the above', type: 'num',
            source: 'cas',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/SaleOnOtherAssets/CapgainonAssets',
          },
          {
            key: 'STCG_A7_PTI', label: 'A7 Pass-through short-term capital gain', type: 'num',
            source: 'user', path: 'ScheduleCGFor23/ShortTermCapGainFor23/PassThrIncNatureSTCG',
          },
          {
            key: 'STCG_A8_DTAA',
            label: 'A8 Short-term capital gain chargeable at the rates under an agreement',
            type: 'num', source: 'user',
            path: 'ScheduleCGFor23/ShortTermCapGainFor23/TotalAmtTaxUsDTAAStcg',
          },
          {
            key: 'STCG_A9_Total', label: 'A9 Total short-term capital gain', type: 'num',
            source: 'user', path: 'ScheduleCGFor23/ShortTermCapGainFor23/TotalSTCG',
          },
          {
            key: 'LTCG_B1_LandBld',
            label: 'B1 Long-term — land or building: full value of consideration', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/SaleofLandBuild/SaleofLandBuildDtls/FullConsideration',
          },
          {
            key: 'LTCG_B1_IndexCost', label: 'B1(b)(i) Indexed cost of acquisition', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/SaleofLandBuild/SaleofLandBuildDtls/AquisitCost',
          },
          {
            key: 'LTCG_B1_PurDate', label: 'B1 Date of purchase of the land or building',
            type: 'date', source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/SaleofLandBuild/SaleofLandBuildDtls/DateofPurchase',
          },
          {
            key: 'LTCG_B1_SaleDate', label: 'B1 Date of sale or transfer', type: 'date',
            source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/SaleofLandBuild/SaleofLandBuildDtls/DateofSale',
            hint: 'A transfer before 23 July 2024 is charged at twenty per cent with indexation, and at twelve and one-half per cent thereafter.',
          },
          {
            key: 'LTCG_B1e', label: 'B1(e) and (g) Long-term capital gain on land or building',
            type: 'num', source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/SaleofLandBuild/SaleofLandBuildDtls/CapgainonAssets',
          },
          {
            key: 'LTCG_B2_SlumpSale', label: 'B2(e) Long-term capital gain on slump sale',
            type: 'num', source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/SlumpSaleInLtcgDtls/SlumpSaleInLtcg/CapgainonAssets',
          },
          {
            key: 'LTCG_B3_Bonds', label: 'B3(e) Long-term capital gain on bonds or debentures',
            type: 'num', source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/Proviso112Applicable/Proviso112Applicabledtls/CapgainonAssets',
          },
          {
            key: 'LTCG_B4_112A', label: 'B4(a) Long-term capital gain under section 112A',
            type: 'num', source: 'cas',
            path: 'ScheduleCGFor23/LongTermCapGain23/SaleOfEquityShareUs112A/BalanceCG',
          },
          {
            key: 'LTCG_B4_Exemption',
            label: 'B4(b) Exemption of the first ₹1,25,000 under section 112A', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/SaleOfEquityShareUs112A/DeductionUs54F',
            hint: 'The first ₹1,25,000 of section 112A gain is exempt.',
          },
          {
            key: 'LTCG_B5_ShareDeb',
            label: 'B5(c) Long-term capital gain on listed securities without indexation',
            type: 'num', source: 'cas',
          },
          {
            key: 'LTCG_B6_Other', label: 'B6(e) Long-term capital gain on other assets',
            type: 'num', source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/SaleofAssetNADtls/SaleofAssetNA/CapgainonAssets',
          },
          {
            key: 'LTCG_B7_115AD',
            label: 'B7(a) Long-term capital gain under the proviso to section 115AD(1)(iii)',
            type: 'num', source: 'broker',
            path: 'ScheduleCGFor23/LongTermCapGain23/NRISaleOfEquityShareUs112A/BalanceCG',
          },
          {
            key: 'LTCG_B9_Other', label: 'B9(e) Long-term capital gain remaining', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/NRIOnSec112and115/NRIOnSec112and115Dtls/CapgainonAssets',
          },
          {
            key: 'LTCG_B10_PTI', label: 'B10 Pass-through long-term capital gain', type: 'num',
            source: 'user', path: 'ScheduleCGFor23/LongTermCapGain23/PassThrIncNatureLTCG',
          },
          {
            key: 'LTCG_B11_DTAA',
            label: 'B11 Long-term capital gain chargeable at the rates under an agreement',
            type: 'num', source: 'user',
            path: 'ScheduleCGFor23/LongTermCapGain23/TotalAmtTaxUsDTAALtcg',
          },
          {
            key: 'LTCG_B12_Total', label: 'B12 Total long-term capital gain', type: 'num',
            source: 'user', path: 'ScheduleCGFor23/LongTermCapGain23/TotalLTCG',
          },
          {
            key: 'D_54EC', label: 'Table D — deduction under section 54EC', type: 'num',
            source: 'user', path: 'ScheduleCGFor23/DeducClaimInfo/DeducClaimDtlsUs54EC/AmtDeducted',
            hint: 'Capped at ₹50 lakh; the investment must be made within six months of the transfer.',
          },
          {
            key: 'D_54F', label: 'Table D — deduction under section 54F', type: 'num',
            source: 'user', path: 'ScheduleCGFor23/DeducClaimInfo/DeducClaimDtlsUs54F/AmtDeducted',
            hint: 'Capped at ₹10 crore.',
          },
          {
            key: 'D_54', label: 'Table D — deduction under sections 54, 54B, 54D, 54G and 54GA',
            type: 'num', source: 'user',
          },
          {
            key: 'C1_TotalCG', label: 'C1 Income chargeable under the head “Capital Gains”',
            type: 'num', source: 'user', path: 'ScheduleCGFor23/SumOfCGIncm',
          },
          {
            key: 'C2_VDA_CG', label: 'C2 Income from the transfer of virtual digital assets',
            type: 'num', source: 'broker', path: 'ScheduleCGFor23/IncmFromVDATrnsf',
          },
          {
            key: 'C3_Total', label: 'C3 Total capital gains', type: 'num', source: 'user',
            path: 'ScheduleCGFor23/TotScheduleCGFor23',
          },
          {
            key: 'F_Q1', label: 'Table F — accrual up to 15 June', type: 'num', source: 'user',
            path: 'ScheduleCGFor23/AccruOrRecOfCG/ShortTermUnder20Per/DateRange/Upto15Of6',
            hint: 'The quarter-wise split drives interest under section 234C.',
          },
          {
            key: 'F_Q2', label: 'Table F — accrual from 16 June to 15 September', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/AccruOrRecOfCG/ShortTermUnder20Per/DateRange/Upto15Of9',
          },
          {
            key: 'F_Q3', label: 'Table F — accrual from 16 September to 15 December', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/AccruOrRecOfCG/ShortTermUnder20Per/DateRange/Up16Of9To15Of12',
          },
          {
            key: 'F_Q4', label: 'Table F — accrual from 16 December to 15 March', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/AccruOrRecOfCG/ShortTermUnder20Per/DateRange/Up16Of12To15Of3',
          },
          {
            key: 'F_Q5', label: 'Table F — accrual from 16 March to 31 March', type: 'num',
            source: 'user',
            path: 'ScheduleCGFor23/AccruOrRecOfCG/ShortTermUnder20Per/DateRange/Up16Of3To31Of3',
          },
        ],
        tables: [
          {
            key: 'Sch112A',
            title: 'Schedule 112A — scrip-wise particulars of long-term capital gain on which securities transaction tax is paid',
            note: 'The fair market value as at 31 January 2018 is what grandfathers gain accrued before section 112A took effect.',
            source: 'cas',
            path: 'Schedule112A/Schedule112ADtls',
            columns: [
              {
                key: 'ISIN', label: 'International Securities Identification Number', type: 'isin',
                path: 'ISINCode',
              },
              { key: 'ShareName', label: 'Name of the share or unit', type: 'text', path: 'ShareUnitName' },
              { key: 'Qty', label: 'Number of shares or units', type: 'num', path: 'NumSharesUnits' },
              {
                key: 'SalePrice', label: 'Sale price per share or unit', type: 'num',
                path: 'SalePricePerShareUnit',
              },
              { key: 'SaleValue', label: 'Column 6 — total sale value', type: 'num', path: 'TotSaleValue' },
              {
                key: 'CostNoIndex', label: 'Column 7 — cost of acquisition without indexation',
                type: 'num', path: 'CostAcqWithoutIndx',
              },
              {
                key: 'FMV31Jan18', label: 'Column 11 — fair market value as at 31 January 2018',
                type: 'num', path: 'TotFairMktValueCapAst',
              },
              {
                key: 'Expense', label: 'Column 12 — expenditure on transfer', type: 'num',
                path: 'ExpExclCnctTransfer',
              },
              { key: 'Balance', label: 'Column 14 — balance', type: 'num', path: 'Balance' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'VDA',
    code: 'ScheduleVDA',
    no: 'B-7',
    name: 'Schedule VDA — Virtual Digital Assets',
    part: 'Part B — Heads of Income',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule VDA — Virtual Digital Assets',
        note: 'Rules 300, 437, 438 and 501–504. Income is chargeable at thirty per cent under section 115BBH; no deduction other than the cost of acquisition is allowed and losses may not be set off.',
        tables: [
          {
            key: 'VDARows',
            title: 'Transaction-wise particulars of virtual digital assets',
            source: 'broker',
            path: 'ScheduleVDA/ScheduleVDADtls',
            columns: [
              { key: 'DateAcq', label: 'Date of acquisition', type: 'date', path: 'DateofAcquisition' },
              { key: 'DateTrf', label: 'Date of transfer', type: 'date', path: 'DateofTransfer' },
              {
                key: 'Head', label: 'Head under which income is offered', type: 'text',
                path: 'HeadUndIncTaxed',
              },
              { key: 'CostAcq', label: 'Item 5 — cost of acquisition', type: 'num', path: 'AcquisitionCost' },
              {
                key: 'Consideration', label: 'Item 6 — consideration received', type: 'num',
                path: 'ConsidReceived',
              },
              { key: 'Income', label: 'Item 7 — income', type: 'num', path: 'IncomeFromVDA' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'OS',
    code: 'ScheduleOS',
    no: 'B-8',
    name: 'Schedule OS — Income from Other Sources',
    part: 'Part B — Heads of Income',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule OS — Income from Other Sources',
        note: 'Rules 505–549. Interest expenditure against dividend under section 57(1) may not exceed twenty per cent of the dividend. Deduction against family pension is one-third or ₹15,000 under the old regime and ₹25,000 under the new regime, whichever is lower.',
        fields: [
          {
            key: 'Dividend1a', label: '1(a) Dividend income — gross', type: 'num', source: 'ais',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/DividendGross',
          },
          {
            key: 'Interest1b', label: '1(b) Interest — gross', type: 'num', source: 'ais',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/InterestGross',
          },
          {
            key: 'IntSavings', label: 'Of which, interest from savings accounts', type: 'num',
            source: 'bank', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IntrstFrmSavingBank',
          },
          {
            key: 'IntDeposits', label: 'Of which, interest from deposits', type: 'num',
            source: 'bank', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IntrstFrmTermDeposit',
          },
          {
            key: 'IntITRefund', label: 'Of which, interest on income-tax refund', type: 'num',
            source: 'form26as', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IntrstFrmIncmTaxRefund',
          },
          {
            key: 'Rental1c', label: '1(c) Rental income from machinery, plant or buildings — gross',
            type: 'num', source: 'user',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/RentFromMachPlantBldgs',
          },
          {
            key: 'Income56_2x', label: '1(d) Income of the nature referred to in section 56(2)(x)',
            type: 'num', source: 'user', path: 'ScheduleOS/IncOthThanOwnRaceHorse/Tot562x',
          },
          {
            key: 'FamilyPension', label: '1(e) Family pension and any other income', type: 'num',
            source: 'user', path: 'ScheduleOS/IncOthThanOwnRaceHorse/FamilyPension',
          },
          {
            key: 'Income89A_OS',
            label: '1(e) Income from a retirement benefit account under section 89A', type: 'num',
            source: 'user', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IncomeNotified89AOS',
          },
          {
            key: 'Gross1', label: '1 Gross amount chargeable at normal applicable rates',
            type: 'num', source: 'user',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/GrossIncChrgblTaxAtAppRate',
          },
          {
            key: 'Lottery2ai',
            label: '2(a)(i) Winnings from lotteries and crossword puzzles chargeable under section 115BB',
            type: 'num', source: 'ais',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/LtryPzzlChrgblUs115BB',
          },
          {
            key: 'OnlineGames2aii',
            label: '2(a)(ii) Winnings from online games chargeable under section 115BBJ',
            type: 'num', source: 'ais', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IncChrgblUs115BBJ',
          },
          {
            key: 'Unexplained2b', label: '2(b) Income chargeable under section 115BBE', type: 'num',
            source: 'user', path: 'ScheduleOS/IncOthThanOwnRaceHorse/IncChrgblUs115BBE',
          },
          {
            key: 'AccumPF2c',
            label: '2(c) Accumulated balance of recognised provident fund chargeable to tax',
            type: 'num', source: 'epfo',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/TaxAccumulatedBalRecPF/TotalIncomeBenefit',
          },
          {
            key: 'AnySpecial2d', label: '2(d) Any other income chargeable at a special rate',
            type: 'num', source: 'user', path: 'ScheduleOS/IncOthThanOwnRaceHorse/OthersGross',
          },
          {
            key: 'PTISpecial2e', label: '2(e) Pass-through income chargeable at special rates',
            type: 'num', source: 'user',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/PassThrIncOSChrgblSplRate',
          },
          {
            key: 'DTAA2f', label: '2(f) Income chargeable at the rates under an agreement',
            type: 'num', source: 'user',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/IncChargblSplRateOS/TotalAmtTaxUsDTAASchOs',
          },
          {
            key: 'Ded57iia',
            label: '3(a)(ii) Deduction under section 57(iia) against family pension', type: 'num',
            source: 'user', path: 'ScheduleOS/IncOthThanOwnRaceHorse/Deductions/DeductionUs57iia',
            hint: 'One-third of the family pension, capped at ₹15,000 under the old regime and ₹25,000 under the new.',
          },
          {
            key: 'Ded57Exp', label: '3(a)(i) Other expenditure allowable under section 57',
            type: 'num', source: 'user',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/Deductions/Expenses',
          },
          {
            key: 'Ded57Int', label: '3(c)(i) Interest expenditure on dividend under section 57(1)',
            type: 'num', source: 'user',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/Deductions/IntExp57',
            hint: 'Limited to twenty per cent of the dividend shown at item 1(a).',
          },
          {
            key: 'Dep3b', label: '3(b) Depreciation', type: 'num', source: 'user',
            path: 'ScheduleOS/IncOthThanOwnRaceHorse/Deductions/Depreciation',
          },
          {
            key: 'Relief89A_5a',
            label: '5(a) Income claimed for relief from taxation under section 89A', type: 'num',
            source: 'user', path: 'ScheduleOS/IncOthThanOwnRaceHorse/Increliefus89AOS',
          },
          {
            key: 'Net6', label: '6 Net income chargeable at normal applicable rates', type: 'num',
            source: 'user', path: 'ScheduleOS/IncOthThanOwnRaceHorse/BalanceNoRaceHorse',
          },
          {
            key: 'Total7', label: '7 Income from other sources other than from owning race horses',
            type: 'num', source: 'user', path: 'ScheduleOS/TotOthSrcNoRaceHorse',
          },
          {
            key: 'RaceHorses8e',
            label: '8(e) Income from the activity of owning and maintaining race horses',
            type: 'num', source: 'user', path: 'ScheduleOS/IncFromOwnHorse/BalanceOwnRaceHorse',
          },
          {
            key: 'Total9', label: '9 Income chargeable under the head “Income from Other Sources”',
            type: 'num', source: 'user', path: 'ScheduleOS/IncChargeable',
          },
          {
            key: 'DivQ1', label: 'Item 10 — dividend accruing up to 15 June', type: 'num',
            source: 'ais', path: 'ScheduleOS/DividendIncUs115BBDA/DateRange/Upto15Of6',
          },
          {
            key: 'DivQ2', label: 'Item 10 — dividend from 16 June to 15 September', type: 'num',
            source: 'ais', path: 'ScheduleOS/DividendIncUs115BBDA/DateRange/Up16Of6To15Of9',
          },
          {
            key: 'DivQ3', label: 'Item 10 — dividend from 16 September to 15 December', type: 'num',
            source: 'ais', path: 'ScheduleOS/DividendIncUs115BBDA/DateRange/Up16Of9To15Of12',
          },
          {
            key: 'DivQ4', label: 'Item 10 — dividend from 16 December to 15 March', type: 'num',
            source: 'ais', path: 'ScheduleOS/DividendIncUs115BBDA/DateRange/Up16Of12To15Of3',
          },
          {
            key: 'DivQ5', label: 'Item 10 — dividend from 16 March to 31 March', type: 'num',
            source: 'ais', path: 'ScheduleOS/DividendIncUs115BBDA/DateRange/Up16Of3To31Of3',
          },
        ],
      },
    ],
  },

  {
    id: 'CYLA',
    code: 'ScheduleCYLA',
    no: 'C-1',
    name: 'Schedules CYLA and BFLA — Set-off of Current and Brought Forward Losses',
    part: 'Part C — Set-off of Losses',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedules CYLA and BFLA — Set-off of Current and Brought Forward Losses',
        note: 'Rules 550–614. Under the new regime, loss under the head house property may neither be set off against other heads nor carried forward. Set-off of house property loss against other heads is in any case limited to ₹2,00,000.',
        fields: [
          {
            key: 'CYLA_HPLoss', label: 'Current year loss from house property set off', type: 'num',
            source: 'user', path: 'ScheduleCYLA/TotalLossSetOff/TotHPlossCurYrSetoff',
          },
          {
            key: 'CYLA_BPLoss', label: 'Current year business loss set off', type: 'num',
            source: 'user', path: 'ScheduleCYLA/TotalLossSetOff/TotBusLossSetoff',
          },
          {
            key: 'CYLA_OSLoss', label: 'Current year loss from other sources set off', type: 'num',
            source: 'user', path: 'ScheduleCYLA/TotalLossSetOff/TotOthSrcLossNoRaceHorseSetoff',
          },
          {
            key: 'CYLA_TotalSetoff', label: 'Total losses set off during the year', type: 'num',
            source: 'user',
          },
          {
            key: 'BFLA_BFLoss', label: 'Brought forward losses set off, as per Schedule CFL',
            type: 'num', source: 'user', path: 'ScheduleBFLA/TotalBFLossSetOff/TotBFLossSetoff',
          },
          {
            key: 'BFLA_UnabsDep', label: 'Brought forward depreciation set off, as per Schedule UD',
            type: 'num', source: 'user',
            path: 'ScheduleBFLA/TotalBFLossSetOff/TotUnabsorbedDeprSetoff',
          },
          {
            key: 'BFLA_Total', label: 'Total brought forward losses set off', type: 'num',
            source: 'user', path: 'ScheduleBFLA/IncomeOfCurrYrAftCYLABFLA',
          },
        ],
      },
    ],
  },

  {
    id: 'CFL',
    code: 'ScheduleCFL',
    no: 'C-2',
    name: 'Schedule CFL — Losses to be Carried Forward',
    part: 'Part C — Set-off of Losses',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule CFL — Losses to be Carried Forward',
        note: 'Rules 615–623 and Category B rules 2 and 34. Where the return is filed after the due date under section 139(4), no loss other than loss from house property and specified business may be carried forward.',
        tables: [
          {
            key: 'CFLRows',
            title: 'Assessment year-wise particulars of losses carried forward',
            note: 'A return filed late under section 139(4) may carry forward only a house property loss and a specified business loss.',
            source: 'eri',
            columns: [
              { key: 'AY', label: 'Assessment year', type: 'text' },
              { key: 'FilingDate', label: 'Date of filing of that return', type: 'date' },
              { key: 'HPLoss', label: 'Loss from house property', type: 'num' },
              { key: 'BPLoss', label: 'Business loss other than speculative', type: 'num' },
              { key: 'SpecLoss', label: 'Speculative business loss', type: 'num' },
              { key: 'SpecifiedLoss', label: 'Specified business loss', type: 'num' },
              { key: 'STCL', label: 'Short-term capital loss', type: 'num' },
              { key: 'LTCL', label: 'Long-term capital loss', type: 'num' },
              { key: 'RaceLoss', label: 'Loss from owning and maintaining race horses', type: 'num' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'UD',
    code: 'ScheduleUD',
    no: 'C-3',
    name: 'Schedule UD — Unabsorbed Depreciation and Allowance under Section 35(4)',
    part: 'Part C — Set-off of Losses',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule UD — Unabsorbed Depreciation and Allowance under Section 35(4)',
        tables: [
          {
            key: 'UDRows',
            title: 'Assessment year-wise particulars',
            source: 'eri',
            path: 'ITR3ScheduleUD/ScheduleUD',
            columns: [
              { key: 'AY', label: 'Assessment year', type: 'text', path: 'AssYr' },
              { key: 'DepBF', label: 'Depreciation brought forward', type: 'num', path: 'AmtBFUD' },
              {
                key: 'Adj115BAC',
                label: 'Amount adjusted on opting for taxation under section 115BAC', type: 'num',
                path: 'AdjustAccTax115BACAmt',
              },
              { key: 'SetOff', label: 'Amount set off during the year', type: 'num', path: 'AmtDeprSOCY' },
              { key: 'DepCF', label: 'Balance carried forward', type: 'num', path: 'BalCFNY' },
              {
                key: 'Allow35_4',
                label: 'Allowance under section 35(4) brought forward, set off and carried forward',
                type: 'num',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'ICDS',
    code: 'ScheduleICDS',
    no: 'C-4',
    name: 'Schedule ICDS — Effect of Income Computation and Disclosure Standards on Profit',
    part: 'Part C — Set-off of Losses',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule ICDS — Effect of Income Computation and Disclosure Standards on Profit',
        fields: [
          {
            key: 'ICDS_I', label: 'I — Accounting policies', type: 'num', source: 'audit',
            path: 'ScheduleICDS/AccPolicyAmtDetl/NetEffect',
          },
          {
            key: 'ICDS_II', label: 'II — Valuation of inventories', type: 'num', source: 'audit',
            path: 'ScheduleICDS/InventoriesValueDetl/NetEffect',
          },
          {
            key: 'ICDS_III', label: 'III — Construction contracts', type: 'num', source: 'audit',
            path: 'ScheduleICDS/ConstContractsAmtDetl/NetEffect',
          },
          {
            key: 'ICDS_IV', label: 'IV — Revenue recognition', type: 'num', source: 'audit',
            path: 'ScheduleICDS/RevenueRcgAmtDetl/NetEffect',
          },
          {
            key: 'ICDS_V', label: 'V — Tangible fixed assets', type: 'num', source: 'audit',
            path: 'ScheduleICDS/TangibleFixedAssetDetl/NetEffect',
          },
          {
            key: 'ICDS_VI', label: 'VI — Effects of changes in foreign exchange rates', type: 'num',
            source: 'audit', path: 'ScheduleICDS/ForeignExgRatesDetl/NetEffect',
          },
          {
            key: 'ICDS_VII', label: 'VII — Government grants', type: 'num', source: 'audit',
            path: 'ScheduleICDS/GovtGrantsDetl/NetEffect',
          },
          {
            key: 'ICDS_VIII', label: 'VIII — Securities', type: 'num', source: 'audit',
            path: 'ScheduleICDS/SecuritiesDetl/NetEffect',
          },
          {
            key: 'ICDS_IX', label: 'IX — Borrowing costs', type: 'num', source: 'audit',
            path: 'ScheduleICDS/BorrowingCostsDetl/NetEffect',
          },
          {
            key: 'ICDS_X', label: 'X — Provisions, contingent liabilities and contingent assets',
            type: 'num', source: 'audit', path: 'ScheduleICDS/ProvAssetsDetl/NetEffect',
          },
          { key: 'ICDS_XI', label: 'XI — Total effect', type: 'num', source: 'audit' },
        ],
      },
    ],
  },

  {
    id: 'S10AA',
    code: 'Schedule10AA',
    no: 'D-1',
    name: 'Schedule 10AA — Deduction in respect of Units in a Special Economic Zone',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
    sections: [
      {
        key: 'main',
        title: 'Schedule 10AA — Deduction in respect of Units in a Special Economic Zone',
        note: 'Rule 633 and Category D rules 6 and 7. Not available under the new regime. Form 56F is required and the return must be filed within the due date under section 139(1).',
        fields: [
          {
            key: 'UndertakingNo',
            label: 'Particulars of the undertaking and the assessment year of first deduction',
            type: 'text', span: 8, source: 'user',
            path: 'Schedule10AA/DeductSEZ/DedUs10Detail/Undertaking/DedFromUndertakingWithAy/AssmtYrUnit',
          },
          {
            key: 'Amt10AA', label: 'Total deduction under section 10AA', type: 'num',
            source: 'audit', path: 'Schedule10AA/DeductSEZ/DedUs10Detail/TotalDedUs10Sub',
            hint: 'Form 56F is required and the return must be filed within the due date under section 139(1).',
          },
        ],
      },
    ],
  },

  {
    id: 'D80G',
    code: 'Schedule80G',
    no: 'D-2',
    name: 'Schedule 80G — Donations to Certain Funds and Institutions',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
    sections: [
      {
        key: 'main',
        title: 'Schedule 80G — Donations to Certain Funds and Institutions',
        note: 'Rules 634–648. Donations in cash exceeding ₹2,000 do not qualify. The Permanent Account Number of the donee is compulsory and may not be the same as that of the assessee or the verifier. Not available under the new regime.',
        tables: [
          {
            key: 'Rows80G',
            title: 'Donee-wise particulars — block A: hundred per cent without limit; B: fifty per cent without limit; C: hundred per cent subject to limit; D: fifty per cent subject to limit',
            note: 'A cash donation above ₹2,000 does not qualify. The donee PAN may be neither the assessee’s nor the verifier’s.',
            source: 'user',
            path: 'Schedule80G/Don100Percent/DoneeWithPan',
            columns: [
              { key: 'Block', label: 'Block', type: 'text' },
              { key: 'DoneeName', label: 'Name of the donee', type: 'text', path: 'DoneeWithPanName' },
              {
                key: 'DoneePAN', label: 'Permanent Account Number of the donee', type: 'pan',
                path: 'DoneePAN',
              },
              {
                key: 'Address', label: 'Address, city, state and PIN code', type: 'text',
                path: 'AddressDetail/AddrDetail',
              },
              { key: 'ARN', label: 'Donation reference or ARN', type: 'text' },
              { key: 'Cash', label: 'Donation in cash', type: 'num', path: 'DonationAmtCash' },
              { key: 'Other', label: 'Donation in any other mode', type: 'num', path: 'DonationAmtOtherMode' },
              {
                key: 'RefNo', label: 'Transaction reference and IFSC for non-cash donations',
                type: 'text', span: 8, path: 'TransactionRefNum',
              },
              { key: 'Total', label: 'Total donation', type: 'num', path: 'DonationAmt' },
              {
                key: 'Eligible', label: 'Eligible amount of donation', type: 'num',
                path: 'EligibleDonationAmt',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'D80GGA',
    code: 'Schedule80GGA',
    no: 'D-3',
    name: 'Schedule 80GGA — Donations for Scientific Research or Rural Development',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule 80GGA — Donations for Scientific Research or Rural Development',
        note: 'Rules 649–655. Donations in cash exceeding ₹2,000 do not qualify. Allowable to a person who is a partner of a firm deriving only a share of profit.',
        tables: [
          {
            key: 'Rows80GGA',
            title: 'Donee-wise particulars',
            source: 'user',
            path: 'Schedule80GGA/DonationDtlsSciRsrchRuralDev',
            columns: [
              { key: 'Section', label: 'Relevant clause', type: 'text', path: 'RelevantClauseUndrDedClaimed' },
              { key: 'DoneeName', label: 'Name of the donee', type: 'text', path: 'NameOfDonee' },
              { key: 'DoneePAN', label: 'Permanent Account Number', type: 'pan', path: 'DoneePAN' },
              { key: 'Cash', label: 'Donation in cash', type: 'num', path: 'DonationAmtCash' },
              { key: 'Other', label: 'Donation in any other mode', type: 'num', path: 'DonationAmtOtherMode' },
              { key: 'Total', label: 'Total donation', type: 'num', path: 'DonationAmt' },
              { key: 'Eligible', label: 'Eligible amount', type: 'num', path: 'EligibleDonationAmt' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'D80GGC',
    code: 'Schedule80GGC',
    no: 'D-4',
    name: 'Schedule 80GGC — Contributions to Political Parties',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule 80GGC — Contributions to Political Parties',
        note: 'Rules 656–669. Contributions must be made between 1 April 2025 and 31 March 2026. The name and Permanent Account Number of the party are compulsory and no cash contribution qualifies.',
        tables: [
          {
            key: 'Rows80GGC',
            title: 'Contribution-wise particulars',
            note: 'No cash contribution qualifies, and the contribution must fall between 1 April 2025 and 31 March 2026.',
            source: 'user',
            path: 'Schedule80GGC/Schedule80GGCDetails',
            columns: [
              { key: 'Date', label: 'Date of contribution', type: 'date', path: 'DonationDate' },
              {
                key: 'PartyName', label: 'Name of the political party', type: 'text',
                path: 'PoliticalPartyName',
              },
              {
                key: 'PartyPAN', label: 'Permanent Account Number of the party', type: 'pan',
                path: 'PoliticalPartyPAN',
              },
              { key: 'Cash', label: 'Contribution in cash', type: 'num', path: 'DonationAmtCash' },
              {
                key: 'Other', label: 'Contribution in any other mode', type: 'num',
                path: 'DonationAmtOtherMode',
              },
              {
                key: 'RefNo', label: 'Transaction reference and IFSC', type: 'text',
                path: 'TransactionRefNum',
              },
              { key: 'Total', label: 'Total contribution', type: 'num', path: 'DonationAmt' },
              { key: 'Eligible', label: 'Eligible amount', type: 'num', path: 'EligibleDonationAmt' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'D80C',
    code: 'Schedule80C',
    no: 'D-5',
    name: 'Schedule 80C — Investments and Payments',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
    sections: [
      {
        key: 'main',
        title: 'Schedule 80C — Investments and Payments',
        note: 'Rules 693–695 and 750. The aggregate of sections 80C, 80CCC and 80CCD(1) may not exceed ₹1,50,000. Available only under the old regime; a policy or document identification number must be furnished for each item.',
        tables: [
          {
            key: 'Rows80C',
            title: 'Item-wise particulars',
            source: 'insurer',
            path: 'Schedule80C/Schedule80CDtls',
            columns: [
              { key: 'Nature', label: 'Nature of the investment or payment', type: 'text' },
              {
                key: 'PolicyNo', label: 'Policy or document identification number', type: 'text',
                path: 'IdentificationNo',
              },
              { key: 'Amount', label: 'Amount eligible for deduction', type: 'num', path: 'Amount' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'D80D',
    code: 'Schedule80D',
    no: 'D-6',
    name: 'Schedule 80D — Health Insurance and Medical Expenditure',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
    sections: [
      {
        key: 'main',
        title: 'Schedule 80D — Health Insurance and Medical Expenditure',
        note: 'Rules 697–726. The limit is ₹25,000 for self and family and ₹50,000 where a senior citizen is covered; preventive health check-up is limited to ₹5,000 within those limits. Available only under the old regime.',
        fields: [
          {
            key: 'SelfSenior',
            label: '1 Is any person in the self and family category a senior citizen?', type: 'sel',
            options: [
              { value: 'N', label: 'No' },
              { value: 'Y', label: 'Yes' },
              { value: 'S', label: 'Not claiming for self or family' },
            ],
            source: 'user', path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/SeniorCitizenFlag',
          },
          {
            key: 'SelfPremium', label: '1(a) or 1(b)(i) Health insurance premium — self and family',
            type: 'num', source: 'insurer',
            path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/HealthInsPremSlfFam',
            hint: '₹25,000 for self and family, or ₹50,000 where a senior citizen is covered.',
          },
          {
            key: 'SelfCheckup', label: 'Preventive health check-up — self and family', type: 'num',
            source: 'user', path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/PrevHlthChckUpSlfFam',
            hint: 'Preventive health check-up is limited to ₹5,000 within the overall limit.',
          },
          {
            key: 'SelfMedExp',
            label: '1(b)(iii) Medical expenditure — senior citizen not covered by insurance',
            type: 'num', source: 'user',
            path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/MedicalExpSlfFamSrCtzn',
          },
          {
            key: 'SelfInsurer', label: 'Name of the insurer and policy number — self and family',
            type: 'text', span: 8, source: 'insurer',
          },
          {
            key: 'ParentSenior', label: '2 Is any parent a senior citizen?', type: 'sel',
            options: [
              { value: 'N', label: 'No' },
              { value: 'Y', label: 'Yes' },
              { value: 'S', label: 'Not claiming for parents' },
            ],
            source: 'user', path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/ParentsSeniorCitizenFlag',
          },
          {
            key: 'ParentPremium', label: '2(a) or 2(b)(i) Health insurance premium — parents',
            type: 'num', source: 'insurer',
            path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/HlthInsPremParents',
            hint: '₹25,000, or ₹50,000 where a parent is a senior citizen.',
          },
          {
            key: 'ParentCheckup', label: 'Preventive health check-up — parents', type: 'num',
            source: 'user', path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/PrevHlthChckUpParents',
          },
          {
            key: 'ParentMedExp', label: '2(b)(iii) Medical expenditure — parents', type: 'num',
            source: 'user', path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/MedicalExpParentsSrCtzn',
          },
          {
            key: 'ParentInsurer', label: 'Name of the insurer and policy number — parents',
            type: 'text', source: 'insurer',
          },
          {
            key: 'Total80D', label: '3 Eligible amount of deduction', type: 'num', source: 'user',
            path: 'Schedule80D/Sec80DSelfFamSrCtznHealth/EligibleAmountOfDedn',
          },
        ],
      },
    ],
  },

  {
    id: 'D80DD',
    code: 'Schedule80DD',
    no: 'D-7',
    name: 'Schedules 80DD and 80U — Deduction in respect of Disability',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
    sections: [
      {
        key: 'main',
        title: 'Schedules 80DD and 80U — Deduction in respect of Disability',
        note: 'Rules 670–682. The deduction is a fixed sum of ₹75,000 for disability and ₹1,25,000 for severe disability; it can be neither more nor less. Form 10-IA is required and the deduction is available only under the old regime.',
        fields: [
          {
            key: 'DD_Category', label: 'Section 80DD — category of the dependant', type: 'sel',
            options: [
              { value: '', label: 'Not applicable' },
              { value: '1', label: 'Dependant with disability — ₹75,000' },
              { value: '2', label: 'Dependant with severe disability — ₹1,25,000' },
            ],
            source: 'forms', path: 'Schedule80DD/NatureOfDisability',
            hint: 'A fixed sum. It can be neither more nor less than the amount shown.',
          },
          {
            key: 'DD_NatureDisability', label: 'Section 80DD — nature of the disability',
            type: 'text', source: 'forms', path: 'Schedule80DD/TypeOfDisability',
            showIf: { field: 'D80DD.DD_Category', notEquals: '' },
          },
          {
            key: 'DD_DependentType',
            label: 'Section 80DD — relationship of the dependant or member of the Hindu Undivided Family',
            type: 'text', span: 8, source: 'user', path: 'Schedule80DD/DependentType',
            showIf: { field: 'D80DD.DD_Category', notEquals: '' },
          },
          {
            key: 'DD_DependentPAN',
            label: 'Section 80DD — Permanent Account Number of the dependant', type: 'pan',
            source: 'user', path: 'Schedule80DD/DependentPan',
            showIf: { field: 'D80DD.DD_Category', notEquals: '' },
          },
          {
            key: 'DD_Aadhaar', label: 'Section 80DD — Aadhaar of the dependant', type: 'aadhaar',
            source: 'eri', path: 'Schedule80DD/DependentAadhaar',
            showIf: { field: 'D80DD.DD_Category', notEquals: '' },
          },
          {
            key: 'DD_Form10IA',
            label: 'Section 80DD — Form 10-IA acknowledgement number, date and UDID', type: 'text',
            span: 8, source: 'forms', showIf: { field: 'D80DD.DD_Category', notEquals: '' },
          },
          {
            key: 'U_Category', label: 'Section 80U — category of the assessee', type: 'sel',
            options: [
              { value: '', label: 'Not applicable' },
              { value: '1', label: 'Self with disability — ₹75,000' },
              { value: '2', label: 'Self with severe disability — ₹1,25,000' },
            ],
            source: 'forms', path: 'Schedule80U/NatureOfDisability',
            hint: 'A fixed sum. It can be neither more nor less than the amount shown.',
          },
          {
            key: 'U_NatureDisability', label: 'Section 80U — nature of the disability',
            type: 'text', source: 'forms', path: 'Schedule80U/TypeOfDisability',
            showIf: { field: 'D80DD.U_Category', notEquals: '' },
          },
          {
            key: 'U_Form10IA',
            label: 'Section 80U — Form 10-IA acknowledgement number, date and UDID', type: 'text',
            span: 8, source: 'forms', showIf: { field: 'D80DD.U_Category', notEquals: '' },
          },
        ],
      },
    ],
  },

  {
    id: 'D80E',
    code: 'Schedule80E',
    no: 'D-8',
    name: 'Schedules 80E, 80EE, 80EEA and 80EEB — Interest on Loans',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
    sections: [
      {
        key: 'main',
        title: 'Schedules 80E, 80EE, 80EEA and 80EEB — Interest on Loans',
        note: 'Rules 727–744 and 828. Section 80EE is limited to ₹50,000 where the loan does not exceed ₹35 lakh and was sanctioned in 2016-17; section 80EEA to ₹1,50,000 where the stamp value does not exceed ₹45 lakh and the loan was sanctioned between 1 April 2019 and 31 March 2022; section 80EEB to ₹1,50,000 for an electric vehicle loan sanctioned between 1 April 2019 and 31 March 2023. Sections 80EE and 80EEA may not both be claimed, and none of these is available to a Hindu Undivided Family or under the new regime.',
        fields: [
          {
            key: 'E_LoanBank', label: 'Section 80E — lender and loan account number', type: 'text',
            source: 'bank',
          },
          {
            key: 'E_Interest', label: 'Section 80E — total interest paid', type: 'num',
            source: 'bank', path: 'Schedule80E/TotalInterest80E',
            hint: 'Interest only, for eight assessment years beginning with the year repayment starts.',
          },
          {
            key: 'EE_LoanDetail',
            label: 'Section 80EE — lender, loan account number and date of sanction', type: 'text',
            span: 8, source: 'bank',
          },
          {
            key: 'EE_Interest', label: 'Section 80EE — interest claimed', type: 'num',
            source: 'bank', path: 'Schedule80EE/TotalInterest80EE',
            hint: 'Capped at ₹50,000 where the loan does not exceed ₹35 lakh and was sanctioned in 2016-17.',
          },
          {
            key: 'EEA_LoanDetail',
            label: 'Section 80EEA — lender, loan account number, date of sanction and stamp value',
            type: 'text', span: 8, source: 'bank',
          },
          {
            key: 'EEA_Interest', label: 'Section 80EEA — interest claimed', type: 'num',
            source: 'bank', path: 'Schedule80EEA/TotalInterest80EEA',
            hint: 'Capped at ₹1,50,000 where the stamp value does not exceed ₹45 lakh and the loan was sanctioned between 1 April 2019 and 31 March 2022.',
          },
          {
            key: 'EEB_LoanDetail',
            label: 'Section 80EEB — lender, loan account number and date of sanction', type: 'text',
            span: 8, source: 'bank',
          },
          {
            key: 'EEB_Interest', label: 'Section 80EEB — interest claimed', type: 'num',
            source: 'bank', path: 'Schedule80EEB/TotalInterest80EEB',
            hint: 'Capped at ₹1,50,000 for an electric vehicle loan sanctioned between 1 April 2019 and 31 March 2023.',
          },
        ],
      },
    ],
  },

  {
    id: 'RA',
    code: 'ScheduleRA',
    no: 'D-9',
    name: 'Schedule RA — Donations to Research Associations and Other Institutions',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule RA — Donations to Research Associations and Other Institutions',
        tables: [
          {
            key: 'RARows',
            title: 'Donee-wise particulars under sections 35(1)(ii), 35(1)(iia), 35(1)(iii), 35CCC and 35CCD',
            source: 'user',
            path: 'Schedule80RA/DonationDtlsRsrchAssctn',
            columns: [
              { key: 'Name', label: 'Name and address of the donee', type: 'text', path: 'NameOfDonee' },
              { key: 'PAN', label: 'Permanent Account Number', type: 'pan', path: 'DoneePAN' },
              { key: 'Cash', label: 'Donation in cash', type: 'num', path: 'DonationAmtCash' },
              { key: 'Other', label: 'Donation in any other mode', type: 'num', path: 'DonationAmtOtherMode' },
              { key: 'Total', label: 'Total donation', type: 'num', path: 'DonationAmt' },
              { key: 'Eligible', label: 'Eligible amount', type: 'num', path: 'EligibleDonationAmt' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'D80IA',
    code: 'Schedule80_IA',
    no: 'D-9a',
    name: 'Schedules 80-IA, 80-IB and 80-IC — Undertaking Deductions',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
    sections: [
      {
        key: 'ia',
        title: 'Schedule 80-IA — Deductions in respect of profits of certain undertakings',
        note: 'Supported by Form 10CCB. Leave blank under the new tax regime. Totals must agree with Schedule VI-A.',
        tables: [
          {
            key: 'Rows80IA',
            title: 'Undertaking-wise particulars under section 80-IA',
            source: 'audit',
            path: 'Schedule80_IA/DeductUs80_IA_4_iv/Sch80DeductAmtDtls',
            columns: [
              { key: 'Clause', label: 'Clause (e.g. 80-IA(4)(iv) — Power)', type: 'text', path: 'SectionClause' },
              { key: 'Undertaking', label: 'Undertaking reference', type: 'text', path: 'UndertakingRef' },
              { key: 'Amount', label: 'Deduction claimed', type: 'num', path: 'DeductAmt' },
            ],
          },
        ],
        fields: [
          {
            key: 'Total80IA', label: 'Total deduction under section 80-IA', type: 'num',
            source: 'audit', path: 'Schedule80_IA/DeductUs80_IA_4_iv/TotDeductAmt',
          },
        ],
      },
      {
        key: 'ib',
        title: 'Schedule 80-IB — Deductions in respect of profits of certain industrial undertakings',
        tables: [
          {
            key: 'Rows80IB',
            title: 'Undertaking-wise particulars under section 80-IB',
            source: 'audit',
            path: 'Schedule80_IB/DeductHousUs80_IB_10_Und/Sch80DeductAmtDtls',
            columns: [
              { key: 'Clause', label: 'Clause (e.g. 80-IB(10) — Housing)', type: 'text', path: 'SectionClause' },
              { key: 'Undertaking', label: 'Undertaking reference', type: 'text', path: 'UndertakingRef' },
              { key: 'Amount', label: 'Deduction claimed', type: 'num', path: 'DeductAmt' },
            ],
          },
        ],
        fields: [
          {
            key: 'Total80IB', label: 'Total deduction under section 80-IB', type: 'num',
            source: 'audit', path: 'Schedule80_IB/DeductHousUs80_IB_10_Und/TotDeductAmt',
          },
        ],
      },
      {
        key: 'ic',
        title: 'Schedule 80-IC — Special provisions for certain undertakings in North-Eastern States',
        tables: [
          {
            key: 'Rows80IC',
            title: 'State-wise and undertaking-wise particulars under section 80-IC',
            source: 'audit',
            path: 'Schedule80_IC/DeductInNorthEast/Assam_Und/Sch80DeductAmtDtls',
            columns: [
              { key: 'State', label: 'State / North-Eastern area', type: 'text', path: 'StateCode' },
              { key: 'Undertaking', label: 'Undertaking reference', type: 'text', path: 'UndertakingRef' },
              { key: 'Amount', label: 'Deduction claimed', type: 'num', path: 'DeductAmt' },
            ],
          },
        ],
        fields: [
          {
            key: 'Total80IC', label: 'Total deduction under section 80-IC', type: 'num',
            source: 'audit', path: 'Schedule80_IC/DeductInNorthEast/Assam_Und/TotDeductAmt',
          },
        ],
      },
    ],
  },

  {
    id: 'VIA',
    code: 'ScheduleVIA',
    no: 'D-10',
    name: 'Schedule VI-A — Deductions under Chapter VI-A',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule VI-A — Deductions under Chapter VI-A',
        note: 'Rules 745–828. Under the new regime only sections 80CCD(2), 80CCH and 80JJAA remain available; the deduction under section 80CCD(2) is limited to fourteen per cent of basic salary and dearness allowance.',
        fields: [
          {
            key: 'VIA_80C', label: 'Section 80C — investments and payments', type: 'num',
            source: 'insurer', path: 'ScheduleVIA/DeductUndChapVIA/Section80C',
            hint: 'Sections 80C, 80CCC and 80CCD(1) together may not exceed ₹1,50,000.',
          },
          {
            key: 'VIA_80CCC', label: 'Section 80CCC — contribution to pension funds', type: 'num',
            source: 'insurer', path: 'ScheduleVIA/DeductUndChapVIA/Section80CCC',
          },
          {
            key: 'VIA_80CCD1',
            label: 'Section 80CCD(1) — contribution to the National Pension System', type: 'num',
            source: 'nps', path: 'ScheduleVIA/DeductUndChapVIA/Section80CCDEmployeeOrSE',
          },
          {
            key: 'VIA_80CCD1B',
            label: 'Section 80CCD(1B) — additional contribution, limited to ₹50,000', type: 'num',
            source: 'nps', path: 'ScheduleVIA/DeductUndChapVIA/Section80CCD1B',
            hint: 'An additional ₹50,000, over and above the ₹1,50,000 aggregate.',
          },
          {
            key: 'VIA_80CCD2', label: 'Section 80CCD(2) — employer contribution', type: 'num',
            source: 'nps', path: 'ScheduleVIA/DeductUndChapVIA/Section80CCDEmployer',
            hint: 'Limited to fourteen per cent of basic salary and dearness allowance. One of the three deductions that survive under the new regime.',
          },
          {
            key: 'VIA_PRAN', label: 'Permanent Retirement Account Number', type: 'text',
            source: 'nps', path: 'ScheduleVIA/UsrDeductUndChapVIA/PRANDtls/PRANNum',
          },
          {
            key: 'VIA_80CCH', label: 'Section 80CCH — contribution to the Agniveer Corpus Fund',
            type: 'num', source: 'user', path: 'ScheduleVIA/DeductUndChapVIA/AnyOthSec80CCH',
          },
          {
            key: 'VIA_80D', label: 'Section 80D — health insurance', type: 'num', source: 'insurer',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80D',
          },
          {
            key: 'VIA_80DD', label: 'Section 80DD — maintenance of a dependant with disability',
            type: 'num', source: 'forms', path: 'ScheduleVIA/DeductUndChapVIA/Section80DD',
          },
          {
            key: 'VIA_80DDB', label: 'Section 80DDB — medical treatment of specified diseases',
            type: 'num', source: 'user', path: 'ScheduleVIA/DeductUndChapVIA/Section80DDB',
          },
          {
            key: 'VIA_80DDB_Disease', label: 'Section 80DDB — description of the specified disease',
            type: 'text', span: 8, source: 'user',
            path: 'ScheduleVIA/UsrDeductUndChapVIA/NameOfSpecDisease80DDB',
          },
          {
            key: 'VIA_80E', label: 'Section 80E — interest on an education loan', type: 'num',
            source: 'bank', path: 'ScheduleVIA/DeductUndChapVIA/Section80E',
          },
          {
            key: 'VIA_80EE', label: 'Section 80EE', type: 'num', source: 'bank',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80EE',
          },
          {
            key: 'VIA_80EEA', label: 'Section 80EEA', type: 'num', source: 'bank',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80EEA',
          },
          {
            key: 'VIA_80EEB', label: 'Section 80EEB', type: 'num', source: 'bank',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80EEB',
          },
          {
            key: 'VIA_80G', label: 'Section 80G — donations', type: 'num', source: 'user',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80G',
          },
          {
            key: 'VIA_80GG', label: 'Section 80GG — rent paid, Form 10BA required', type: 'num',
            source: 'forms', path: 'ScheduleVIA/DeductUndChapVIA/Section80GG',
            hint: 'Form 10BA is required. Not available where house rent allowance is claimed.',
          },
          {
            key: 'VIA_80GGA', label: 'Section 80GGA', type: 'num', source: 'user',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80GGA',
          },
          {
            key: 'VIA_80GGC', label: 'Section 80GGC', type: 'num', source: 'user',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80GGC',
          },
          {
            key: 'VIA_80IA', label: 'Section 80-IA, supported by Form 10CCB', type: 'num',
            source: 'audit', path: 'ScheduleVIA/DeductUndChapVIA/Section80IA',
          },
          {
            key: 'VIA_80IB', label: 'Section 80-IB', type: 'num', source: 'audit',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80IB',
          },
          {
            key: 'VIA_80IE', label: 'Sections 80-IC and 80-IE', type: 'num', source: 'audit',
            path: 'ScheduleVIA/DeductUndChapVIA/Section80IC',
          },
          {
            key: 'VIA_80JJAA',
            label: 'Section 80JJAA — employment of new workmen, Form 10DA required', type: 'num',
            source: 'audit', path: 'ScheduleVIA/DeductUndChapVIA/Section80JJAA',
          },
          {
            key: 'VIA_80QQB', label: 'Section 80QQB — royalty on books, Form 10CCD acknowledgement',
            type: 'num', source: 'forms', path: 'ScheduleVIA/DeductUndChapVIA/Section80QQB',
          },
          {
            key: 'VIA_80RRB',
            label: 'Section 80RRB — royalty on patents, Form 10CCE acknowledgement', type: 'num',
            source: 'forms', path: 'ScheduleVIA/DeductUndChapVIA/Section80RRB',
          },
          {
            key: 'VIA_80TTA', label: 'Section 80TTA — interest on savings accounts', type: 'num',
            source: 'bank', path: 'ScheduleVIA/DeductUndChapVIA/Section80TTA',
            hint: 'Capped at ₹10,000, and not available where section 80TTB is claimed.',
          },
          {
            key: 'VIA_80TTB', label: 'Section 80TTB — interest income of a senior citizen',
            type: 'num', source: 'bank', path: 'ScheduleVIA/DeductUndChapVIA/Section80TTB',
            hint: 'Capped at ₹50,000 and available only to a resident senior citizen.',
          },
          {
            key: 'VIA_80U', label: 'Section 80U — person with disability', type: 'num',
            source: 'forms', path: 'ScheduleVIA/DeductUndChapVIA/Section80U',
          },
          {
            key: 'VIA_PartB',
            label: '1 Total of Part B — deductions in respect of certain payments', type: 'num',
            source: 'user', path: 'ScheduleVIA/DeductUndChapVIA/TotPartBchapterVIA',
          },
          {
            key: 'VIA_PartC', label: '2 Total of Part C — deductions in respect of certain incomes',
            type: 'num', source: 'user', path: 'ScheduleVIA/DeductUndChapVIA/TotPartCchapterVIA',
          },
          {
            key: 'VIA_Total', label: 'Total deductions under Chapter VI-A', type: 'num',
            source: 'user', path: 'ScheduleVIA/DeductUndChapVIA/TotalChapVIADeductions',
          },
        ],
      },
    ],
  },

  {
    id: 'AMT',
    code: 'ScheduleAMT',
    no: 'D-11',
    name: 'Schedules AMT and AMTC — Alternate Minimum Tax and Credit',
    part: 'Part D — Deductions',
    forms: ['ITR3'],
    showIf: { field: 'GEN.OptOutNewTaxRegime', equals: 'Y' },
    sections: [
      {
        key: 'main',
        title: 'Schedules AMT and AMTC — Alternate Minimum Tax and Credit',
        note: 'Rules 829–848 and Category D rules 1 and 12. Not applicable under the new regime. Tax under section 115JC is eighteen and one-half per cent, or nine per cent for a unit in an International Financial Services Centre, where the adjusted total income exceeds ₹20 lakh. Form 29C is required.',
        fields: [
          {
            key: 'AMT_TotalIncome', label: '1 Total income as per Part B-TI', type: 'num',
            source: 'user', path: 'ScheduleAMT/TotalIncItem11',
          },
          {
            key: 'AMT_PartCDed', label: '2(a) Deductions claimed under Part C of Chapter VI-A',
            type: 'num', source: 'user', path: 'ScheduleAMT/AdjustmentSec115JC/DeductClaimSec6A',
          },
          {
            key: 'AMT_10AA', label: '2(b) Deduction claimed under section 10AA', type: 'num',
            source: 'user', path: 'ScheduleAMT/AdjustmentSec115JC/DeductClaimSec10AA',
          },
          {
            key: 'AMT_35AD', label: '2(c) Deduction under section 35AD as reduced by depreciation',
            type: 'num', source: 'user', path: 'ScheduleAMT/AdjustmentSec115JC/DeductClaimSec35AD',
          },
          {
            key: 'AMT_AdjTotal', label: '3 Adjusted total income under section 115JC', type: 'num',
            source: 'user', path: 'ScheduleAMT/AdjustedUnderSec115JC',
          },
          {
            key: 'AMT_Tax', label: '4 Tax payable under section 115JC', type: 'num', source: 'user',
            path: 'ScheduleAMT/TaxPayableUnderSec115JC',
            hint: 'Eighteen and one-half per cent of adjusted total income, or nine per cent for a unit in an International Financial Services Centre, once that income exceeds ₹20 lakh.',
          },
          {
            key: 'AMTC_BF', label: 'Credit under section 115JD brought forward', type: 'num',
            source: 'eri', path: 'ScheduleAMTC/AmtTaxCreditAvailable',
            hint: 'Credit under section 115JD may be carried forward for fifteen assessment years.',
          },
          {
            key: 'AMTC_Utilized', label: '5 Credit utilised during the year', type: 'num',
            source: 'user', path: 'ScheduleAMTC/TotAmtCreditUtilisedCY',
          },
          {
            key: 'AMTC_CF', label: '6 Credit available for subsequent assessment years',
            type: 'num', source: 'user', path: 'ScheduleAMTC/TotBalAMTCreditCF',
          },
        ],
      },
    ],
  },

  {
    id: 'SPI',
    code: 'ScheduleSPI',
    no: 'E-1',
    name: 'Schedules SPI, SI and IF — Clubbed Income, Special Rates and Partnership Firms',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedules SPI, SI and IF — Clubbed Income, Special Rates and Partnership Firms',
        note: 'Rules 849–873 and 910–911. Special rate incomes must agree with the corresponding items of Schedules BFLA, CG and OS.',
        fields: [
          {
            key: 'SPI_Detail',
            label: 'Schedule SPI — name, Permanent Account Number, relationship, nature and amount of income clubbed',
            type: 'text', span: 12, source: 'user',
          },
          {
            key: 'SI_111A',
            label: 'Schedule SI — short-term capital gain under section 111A at twenty per cent',
            type: 'num', source: 'user',
          },
          {
            key: 'SI_112A',
            label: 'Schedule SI — long-term capital gain under section 112A at twelve and one-half per cent',
            type: 'num', source: 'user',
          },
          {
            key: 'SI_115BB',
            label: 'Schedule SI — winnings chargeable under section 115BB at thirty per cent',
            type: 'num', source: 'user',
          },
          {
            key: 'SI_115BBJ',
            label: 'Schedule SI — winnings from online games under section 115BBJ at thirty per cent',
            type: 'num', source: 'user',
          },
          {
            key: 'SI_115BBE', label: 'Schedule SI — income under section 115BBE at sixty per cent',
            type: 'num', source: 'user',
          },
          {
            key: 'SI_115BBH',
            label: 'Schedule SI — virtual digital assets under section 115BBH at thirty per cent',
            type: 'num', source: 'user',
          },
          {
            key: 'SI_Total', label: 'Schedule SI — total special rate income and the tax thereon',
            type: 'num', source: 'user', path: 'ScheduleSI/TotSplRateInc',
          },
        ],
        tables: [
          {
            key: 'IFRows',
            title: 'Schedule IF — particulars of firms in which the assessee is a partner',
            source: 'user',
            path: 'ScheduleIF/PartnerFirmDetails',
            columns: [
              { key: 'FirmName', label: 'Name of the firm', type: 'text', path: 'FirmName' },
              { key: 'FirmPAN', label: 'Permanent Account Number of the firm', type: 'pan', path: 'FirmPAN' },
              {
                key: 'Liable92E_IF', label: 'Is the firm liable to audit or to section 92E?',
                type: 'text', path: 'IsLiableToAudit',
              },
              {
                key: 'PctShare', label: 'Percentage share in the profit', type: 'num',
                path: 'ProfitSharePercent',
              },
              { key: 'ShareAmt', label: 'Amount of share in the profit', type: 'num', path: 'ProfitShareAmt' },
              {
                key: 'Capital', label: 'Capital balance as at 31 March', type: 'num',
                path: 'FirmCapBalOn31Mar',
              },
              {
                key: 'InterestRecd', label: 'Interest due or received', type: 'num',
                path: 'IntrstAmtDueOrRecv',
              },
              {
                key: 'RemunRecd', label: 'Remuneration due or received', type: 'num',
                path: 'RemunernAmtDueOrRecv',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'EI',
    code: 'ScheduleEI',
    no: 'E-2',
    name: 'Schedule EI — Exempt Income',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule EI — Exempt Income',
        note: 'Rules 992–1001. Where net agricultural income exceeds ₹5 lakh, particulars of each agricultural land must be furnished. Certain exemptions may not be claimed by residents or under the new regime.',
        fields: [
          {
            key: 'EI_Interest', label: '1 Interest income which is exempt', type: 'num',
            source: 'user', path: 'ScheduleEI/InterestInc',
          },
          {
            key: 'EI_AgriGross', label: '2(i) Gross agricultural receipts', type: 'num',
            source: 'user', path: 'ScheduleEI/GrossAgriRecpt',
          },
          {
            key: 'EI_AgriExp', label: '2(ii) Expenditure incurred on agriculture', type: 'num',
            source: 'user', path: 'ScheduleEI/ExpIncAgri',
          },
          {
            key: 'EI_AgriLossBF',
            label: '2(iii) Unabsorbed agricultural loss of the preceding eight assessment years',
            type: 'num', source: 'user', path: 'ScheduleEI/UnabAgriLossPrev8',
          },
          {
            key: 'EI_AgriRule',
            label: '2(iv) Agricultural income portion relating to Rules 7, 7A, 7B and 8',
            type: 'num', source: 'user', path: 'ScheduleEI/AgriIncRule7and8',
          },
          {
            key: 'EI_AgriNet', label: '2(v) Net agricultural income', type: 'num', source: 'user',
            path: 'ScheduleEI/NetAgriIncOrOthrIncRule7',
            hint: 'Where net agricultural income exceeds ₹5 lakh, particulars of each agricultural land are compulsory.',
          },
          {
            key: 'EI_AgriLandDetail',
            label: 'Particulars of each agricultural land — district and PIN, measurement, owned or leased, irrigated or rain-fed',
            type: 'text', span: 12, source: 'user',
          },
          {
            key: 'EI_Other', label: '3 Other exempt income', type: 'num', source: 'user',
            path: 'ScheduleEI/Others',
          },
          {
            key: 'EI_DTAA', label: '4 Income not chargeable to tax as per an agreement',
            type: 'num', source: 'user', path: 'ScheduleEI/IncChrgblAsPerDTAA',
          },
          {
            key: 'EI_PTI', label: '5 Pass-through income not chargeable to tax', type: 'num',
            source: 'user', path: 'ScheduleEI/PassThrIncNotChrgblTax',
          },
          {
            key: 'EI_FirmShare', label: 'Share of profit from a firm, as per Schedule IF',
            type: 'num', source: 'user',
          },
          {
            key: 'EI_Total', label: '6 Total exempt income', type: 'num', source: 'user',
            path: 'ScheduleEI/TotalExemptInc',
          },
        ],
      },
    ],
  },

  {
    id: 'PTI',
    code: 'SchedulePTI',
    no: 'E-3',
    name: 'Schedule PTI — Pass-Through Income from Business Trusts and Investment Funds',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule PTI — Pass-Through Income from Business Trusts and Investment Funds',
        tables: [
          {
            key: 'PTIRows',
            title: 'Fund-wise particulars under sections 115UA and 115UB',
            source: 'ais',
            path: 'SchedulePTI/SchedulePTIDtls',
            columns: [
              {
                key: 'FundName', label: 'Name of the business trust or investment fund',
                type: 'text', path: 'BusinessName',
              },
              { key: 'FundPAN', label: 'Permanent Account Number', type: 'pan', path: 'BusinessPAN' },
              { key: 'HeadInc', label: 'Head of income', type: 'text', path: 'InvstmntCvrdUs115UA115UB' },
              { key: 'Amount', label: 'Amount of income', type: 'num', path: 'IncFromHP/AmountOfInc' },
              { key: 'TDSAmt', label: 'Tax deducted on such income', type: 'num', path: 'IncFromHP/TDSAmount' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'FSI',
    code: 'ScheduleFSI',
    no: 'E-4',
    name: 'Schedules FSI and TR — Income Accruing Outside India and Tax Relief',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    showIf: { field: 'GEN.ResidentialStatus', notEquals: 'NRI' },
    sections: [
      {
        key: 'main',
        title: 'Schedules FSI and TR — Income Accruing Outside India and Tax Relief',
        note: 'Rules 887–900 and Category D rule 5. Not applicable where the residential status is non-resident. Form 67 must be filed within the due date under section 139(1).',
        tables: [
          {
            key: 'FSIRows',
            title: 'Country-wise and head-wise particulars (Schedule FSI)',
            source: 'user',
            path: 'ScheduleFSI/ScheduleFSIDtls',
            columns: [
              { key: 'Country', label: 'Country, code and taxpayer identification number', type: 'text' },
              { key: 'Head', label: 'Head of income', type: 'text' },
              {
                key: 'IncomeFrgn', label: 'Income from outside India', type: 'num',
                path: 'TotalCountryWise/IncFrmOutsideInd',
              },
              {
                key: 'TaxPaidFrgn', label: 'Tax paid outside India', type: 'num',
                path: 'TotalCountryWise/TaxPaidOutsideInd',
              },
              {
                key: 'TaxPayableIN', label: 'Tax payable in India on such income', type: 'num',
                path: 'TotalCountryWise/TaxPayableinInd',
              },
              {
                key: 'ReliefE', label: 'Relief available, being the lower of the two', type: 'num',
                path: 'TotalCountryWise/TaxReliefinInd',
              },
              { key: 'Section', label: 'Relief claimed under section 90, 90A or 91', type: 'text' },
            ],
          },
          {
            key: 'TRRows',
            title: 'Schedule TR — Summary of tax relief claimed for taxes paid outside India',
            note: 'Totals by country must agree with Schedule FSI. Form 67 is compulsory for relief under section 90 or 90A.',
            source: 'user',
            path: 'ScheduleTR1/ScheduleTR',
            columns: [
              { key: 'Country', label: 'Country code', type: 'text', path: 'CountryCodeExcludingIndia' },
              { key: 'TIN', label: 'Taxpayer identification number', type: 'text', path: 'TaxPayerinCountry' },
              { key: 'TaxPaid', label: 'Total taxes paid outside India', type: 'num', path: 'TaxPaidOutsideIndia' },
              { key: 'Relief', label: 'Total tax relief available', type: 'num', path: 'TaxReliefOutsideIndia' },
              { key: 'Section', label: 'Section 90, 90A or 91', type: 'text', path: 'ReliefClaimedUsSection' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'FA',
    code: 'ScheduleFA',
    no: 'E-5',
    name: 'Schedule FA — Foreign Assets and Income from any Source Outside India',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    showIf: { field: 'GEN.ResidentialStatus', notEquals: 'NRI' },
    sections: [
      {
        key: 'main',
        title: 'Schedule FA — Foreign Assets and Income from any Source Outside India',
        note: 'Rules 901 and 902. Compulsory for a resident holding any foreign asset, account or signing authority at any time during the calendar year 2025.',
        tables: [
          {
            key: 'FARows',
            title: 'Asset-wise particulars across tables A1 to G',
            note: 'Reported for the calendar year 2025, not for the previous year.',
            source: 'user',
            path: 'ScheduleFA/DetailsForiegnBank',
            columns: [
              { key: 'Category', label: 'Table', type: 'text' },
              { key: 'Country', label: 'Country and code', type: 'text' },
              { key: 'Institution', label: 'Name and address of the institution or entity', type: 'text' },
              {
                key: 'AccountNo', label: 'Account number or asset reference', type: 'text',
                path: 'ForeignAccountNumber',
              },
              { key: 'OpenDate', label: 'Date of opening or acquisition', type: 'date', path: 'AccOpenDate' },
              {
                key: 'PeakBal', label: 'Peak balance or value during the year', type: 'num',
                path: 'PeakBalanceDuringYear',
              },
              { key: 'CloseBal', label: 'Closing balance', type: 'num', path: 'ClosingBalance' },
              {
                key: 'IncomeAccrued', label: 'Income accrued from the asset', type: 'num',
                path: 'IntrstAccured',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'S5A',
    code: 'Schedule5A',
    no: 'E-6',
    name: 'Schedule 5A — Apportionment of Income between Spouses Governed by the Portuguese Civil Code',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    showIf: { field: 'GEN.PortugueseCC', equals: 'Y' },
    sections: [
      {
        key: 'main',
        title: 'Schedule 5A — Apportionment of Income between Spouses Governed by the Portuguese Civil Code',
        fields: [
          {
            key: 'SpousePAN5A', label: 'Permanent Account Number of the spouse', type: 'pan',
            source: 'user', path: 'Schedule5A2014/PANOfSpouse',
          },
          {
            key: 'HP5A', label: '1 House property income apportioned', type: 'num', source: 'user',
            path: 'Schedule5A2014/HPHeadIncome/AmtApprndOfSpouse',
          },
          {
            key: 'BP5A', label: '2 Business income apportioned', type: 'num', source: 'user',
            path: 'Schedule5A2014/BusHeadIncome/AmtApprndOfSpouse',
          },
          {
            key: 'CG5A', label: '3 Capital gains apportioned', type: 'num', source: 'user',
            path: 'Schedule5A2014/CapGainHeadIncome/AmtApprndOfSpouse',
          },
          {
            key: 'OS5A', label: '4 Income from other sources apportioned', type: 'num',
            source: 'user', path: 'Schedule5A2014/OtherSourcesHeadIncome/AmtApprndOfSpouse',
          },
          {
            key: 'Tot5A', label: '5 Total apportioned', type: 'num', source: 'user',
            path: 'Schedule5A2014/TotalHeadIncome/AmtApprndOfSpouse',
          },
        ],
      },
    ],
  },

  {
    id: 'AL',
    code: 'ScheduleAL',
    no: 'E-7',
    name: 'Schedule AL — Assets and Liabilities at the End of the Year',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule AL — Assets and Liabilities at the End of the Year',
        note: 'Rule 905. Compulsory where the total income exceeds ₹1 crore.',
        fields: [
          {
            key: 'AL_Immovable', label: 'A Immovable assets — land and buildings, at cost',
            type: 'num', source: 'user', path: 'ScheduleAL/ImmovableDetails/Amount',
            hint: 'Schedule AL is compulsory where total income exceeds ₹1 crore.',
          },
          {
            key: 'AL_Jewellery', label: 'B(i) Jewellery, bullion and articles of precious metal',
            type: 'num', source: 'user', path: 'ScheduleAL/MovableAsset/JewelleryBullionEtc',
          },
          {
            key: 'AL_Vehicles', label: 'B(ii) Vehicles, yachts, boats and aircraft', type: 'num',
            source: 'user', path: 'ScheduleAL/MovableAsset/VehiclYachtsBoatsAircrafts',
          },
          {
            key: 'AL_Bank', label: 'B(iii)(a) Balances in bank accounts including deposits',
            type: 'num', source: 'bank', path: 'ScheduleAL/MovableAsset/DepositsInBank',
          },
          {
            key: 'AL_Shares', label: 'B(iii)(b) Shares and securities', type: 'num',
            source: 'demat', path: 'ScheduleAL/MovableAsset/SharesAndSecurities',
          },
          {
            key: 'AL_Insurance', label: 'B(iii)(c) Insurance policies', type: 'num',
            source: 'insurer', path: 'ScheduleAL/MovableAsset/InsurancePolicies',
          },
          {
            key: 'AL_Loans', label: 'B(iii)(d) Loans and advances given', type: 'num',
            source: 'user', path: 'ScheduleAL/MovableAsset/LoansAndAdvancesGiven',
          },
          {
            key: 'AL_Cash', label: 'B(iii)(e) Cash in hand', type: 'num', source: 'user',
            path: 'ScheduleAL/MovableAsset/CashInHand',
          },
          {
            key: 'AL_Liability', label: 'C Liabilities in relation to the assets above',
            type: 'num', source: 'user', path: 'ScheduleAL/LiabilityInRelatAssets',
          },
        ],
      },
    ],
  },

  {
    id: 'ESOP',
    code: 'ScheduleESOP',
    no: 'E-8',
    name: 'Schedule ESOP — Tax Deferred on Securities Allotted by an Eligible Start-up',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule ESOP — Tax Deferred on Securities Allotted by an Eligible Start-up',
        note: 'Rules 906–909. The balance carried forward must agree with item 3(b) of Part B-TTI.',
        fields: [
          {
            key: 'ESOP_DPIIT',
            label: 'Registration number of the eligible start-up and the Permanent Account Number of the employer',
            type: 'text', span: 12, source: 'user',
          },
          {
            key: 'ESOP_TaxDeferredBF', label: '3 Amount of tax deferred brought forward',
            type: 'num', source: 'eri',
          },
          {
            key: 'ESOP_Sold',
            label: '4 and 5 Whether the securities have been sold or employment has ceased',
            type: 'sel',
            options: [
              { value: 'N', label: 'Not sold' },
              { value: 'Y', label: 'Partly sold' },
              { value: 'Y', label: 'Fully sold' },
            ],
            source: 'user',
          },
          {
            key: 'ESOP_TaxPayableCY',
            label: '7 Amount of tax payable in the current assessment year', type: 'num',
            source: 'user',
          },
          {
            key: 'ESOP_TaxCF', label: '8 Balance amount of tax deferred to be carried forward',
            type: 'num', source: 'user', path: 'ScheduleESOP/ScheduleESOP2627_Type/BalanceTaxCF',
            hint: 'Must agree with item 3(b) of Part B-TTI.',
          },
        ],
      },
    ],
  },

  {
    id: 'GSTS',
    code: 'ScheduleGST',
    no: 'E-9',
    name: 'Schedule GST — Turnover Reported under the Goods and Services Tax',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule GST — Turnover Reported under the Goods and Services Tax',
        tables: [
          {
            key: 'GSTRows',
            title: 'Registration-wise particulars',
            source: 'gst',
            path: 'ScheduleGST/TurnoverGrsRcptForGSTIN',
            columns: [
              {
                key: 'GSTIN', label: 'Goods and Services Tax Identification Number', type: 'gstin',
                path: 'GSTINNo',
              },
              {
                key: 'Turnover', label: 'Annual value of outward supplies as per the returns filed',
                type: 'num', path: 'AmtTurnGrossRcptGSTIN',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'TPSA',
    code: 'ScheduleTPSA',
    no: 'E-10',
    name: 'Schedule TPSA — Secondary Adjustment under Section 92CE(2A)',
    part: 'Part E — Other Schedules',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule TPSA — Secondary Adjustment under Section 92CE(2A)',
        note: 'Rules 879–886. Additional tax is eighteen per cent, with surcharge at twelve per cent and cess at four per cent. The date of deposit may not be later than the current date.',
        fields: [
          {
            key: 'TPSA_Primary', label: '1 Amount of the primary adjustment', type: 'num',
            source: 'audit', path: 'ScheduleTPSA/AmtPrimaryAdjUs92CE_2A',
          },
          {
            key: 'TPSA_Tax18', label: '2(a) Additional income-tax payable at eighteen per cent',
            type: 'num', source: 'user', path: 'ScheduleTPSA/AdditionalIncTax18PercAbove',
            hint: 'Eighteen per cent, with surcharge at twelve per cent and cess at four.',
          },
          {
            key: 'TPSA_Surch', label: '2(b) Surcharge at twelve per cent', type: 'num',
            source: 'user', path: 'ScheduleTPSA/Surcharge12Perc',
          },
          {
            key: 'TPSA_Cess', label: '2(c) Health and education cess at four per cent', type: 'num',
            source: 'user', path: 'ScheduleTPSA/HealthEducationCess',
          },
          {
            key: 'TPSA_TotalTax', label: '2(d) Total additional tax payable', type: 'num',
            source: 'user', path: 'ScheduleTPSA/TotalAdditionalTax',
          },
          {
            key: 'TPSA_Paid', label: '3 Taxes paid, challan-wise', type: 'num', source: 'user',
            path: 'ScheduleTPSA/TaxesPaid',
          },
          {
            key: 'TPSA_Net', label: '4 Net tax payable', type: 'num', source: 'user',
            path: 'ScheduleTPSA/NetTaxPayable',
          },
        ],
      },
    ],
  },

  {
    id: 'BTI',
    code: 'PartB-TI',
    no: 'F-1',
    name: 'Part B-TI — Computation of Total Income',
    part: 'Part F — Computation',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Part B-TI — Computation of Total Income',
        note: 'Rules 913–959. Each figure must agree with the corresponding schedule. Where the return is belated under section 139(4), current year losses other than house property loss may not be carried forward.',
        fields: [
          {
            key: 'TI_Salary', label: '1 Salaries, as per Schedule S', type: 'num', source: 'user',
            path: 'PartB-TI/Salaries',
          },
          {
            key: 'TI_HP', label: '2 Income from house property, as per Schedule HP', type: 'num',
            source: 'user', path: 'PartB-TI/IncomeFromHP',
          },
          {
            key: 'TI_PGBP',
            label: '3(v) Profits and gains from business or profession, as per Schedule BP',
            type: 'num', source: 'user', path: 'PartB-TI/ProfBusGain/TotProfBusGain',
          },
          {
            key: 'TI_STCG', label: '4(a) Total short-term capital gains', type: 'num',
            source: 'user', path: 'PartB-TI/CapGain/ShortTerm/TotalShortTerm',
          },
          {
            key: 'TI_LTCG', label: '4(b) Total long-term capital gains', type: 'num',
            source: 'user', path: 'PartB-TI/CapGain/LongTerm/TotalLongTerm',
          },
          {
            key: 'TI_CG',
            label: '4(e) Total capital gains, including income from virtual digital assets',
            type: 'num', source: 'user', path: 'PartB-TI/CapGain/TotalCapGains',
          },
          {
            key: 'TI_OS', label: '5(d) Income from other sources', type: 'num', source: 'user',
            path: 'PartB-TI/IncFromOS/TotIncFromOS',
          },
          {
            key: 'TI_Total6', label: '6 Total of the head-wise income', type: 'num', source: 'user',
            path: 'PartB-TI/TotalTI',
          },
          {
            key: 'TI_CYLA', label: '7 Losses of the current year set off, as per Schedule CYLA',
            type: 'num', source: 'user', path: 'PartB-TI/CurrentYearLoss',
          },
          {
            key: 'TI_BFLA', label: '9 Brought forward losses set off, as per Schedule BFLA',
            type: 'num', source: 'user', path: 'PartB-TI/BroughtFwdLossesSetoff',
          },
          {
            key: 'TI_GTI', label: '10 Gross total income', type: 'num', source: 'user',
            path: 'PartB-TI/GrossTotalIncome',
          },
          {
            key: 'TI_SpecialInGTI', label: '11 Income chargeable at special rates included above',
            type: 'num', source: 'user', path: 'PartB-TI/IncChargeTaxSplRate111A112',
          },
          {
            key: 'TI_VIA_a', label: '12(a) Deductions under Parts B, CA and D of Chapter VI-A',
            type: 'num', source: 'user', path: 'PartB-TI/DeductionsUndSchVIADtl/PartBchapterVIA',
          },
          {
            key: 'TI_VIA_b', label: '12(b) Deductions under Part C of Chapter VI-A', type: 'num',
            source: 'user', path: 'PartB-TI/DeductionsUndSchVIADtl/PartCchapterVIA',
          },
          {
            key: 'TI_10AA', label: '13 Deduction under section 10AA', type: 'num', source: 'user',
            path: 'PartB-TI/DeductionsUnder10Aor10AA',
          },
          {
            key: 'TI_TotalIncome', label: '14 Total income', type: 'num', source: 'user',
            path: 'PartB-TI/TotalIncome',
          },
          {
            key: 'TI_SpecialIncome',
            label: '15 Income chargeable at special rates, as per Schedule SI', type: 'num',
            source: 'user', path: 'PartB-TI/IncChargeableTaxSplRates',
          },
          {
            key: 'TI_NetAgri', label: '16 Net agricultural income for rate purposes', type: 'num',
            source: 'user', path: 'PartB-TI/NetAgricultureIncomeOrOtherIncomeForRate',
          },
          {
            key: 'TI_AggIncome', label: '17 Aggregate income', type: 'num', source: 'user',
            path: 'PartB-TI/AggregateIncome',
          },
          {
            key: 'TI_CFLosses', label: '18 Losses of the current year to be carried forward',
            type: 'num', source: 'user', path: 'PartB-TI/LossesOfCurrentYearCarriedFwd',
          },
          {
            key: 'TI_DeemedAMT', label: '19 Deemed total income under section 115JC', type: 'num',
            source: 'user', path: 'PartB-TI/DeemedIncomeUs115JC',
          },
        ],
      },
    ],
  },

  {
    id: 'BTTI',
    code: 'PartB_TTI',
    no: 'F-2',
    name: 'Part B-TTI — Computation of Tax Liability on Total Income',
    part: 'Part F — Computation',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Part B-TTI — Computation of Tax Liability on Total Income',
        note: 'Rules 960–991. Rebate under section 87A is limited to ₹12,500 under the old regime where total income does not exceed ₹5 lakh, and is governed by section 87A including marginal relief under the new regime. At least one bank account held in India must be furnished, and the IFSC is validated against the Reserve Bank database.',
        fields: [
          {
            key: 'TTI_TaxNormal', label: '1(a) Tax at normal rates on the aggregate income',
            type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/TaxAtNormalRatesOnAggrInc',
          },
          {
            key: 'TTI_TaxSpecial', label: '1(b) Tax at special rates, as per Schedule SI',
            type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/TaxAtSpecialRates',
          },
          {
            key: 'TTI_AgriRebate', label: '1(c) Rebate on agricultural income', type: 'num',
            source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/RebateOnAgriInc',
          },
          {
            key: 'TTI_TaxPayable1d', label: '1(d) Tax payable on the total income', type: 'num',
            source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/TaxPayableOnTotInc',
          },
          {
            key: 'TTI_TaxAMT',
            label: '2 Tax on the deemed total income under section 115JC, with surcharge and cess',
            type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnDeemedTI/TotalTax',
          },
          {
            key: 'TTI_Rebate87A', label: '2(e) Rebate under section 87A', type: 'num',
            source: 'user', path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/Rebate87A',
            hint: 'Up to ₹60,000 under the new regime where total income does not exceed ₹12,00,000, and ₹12,500 under the old where it does not exceed ₹5,00,000. Residents only.',
          },
          {
            key: 'TTI_GrossTax',
            label: '3 Gross tax payable, being the higher of items 1(d) and 2(i)', type: 'num',
            source: 'user', path: 'PartB_TTI/ComputationOfTaxLiability/GrossTaxPayable',
          },
          {
            key: 'TTI_AMTCredit', label: '4 Credit under section 115JD, as per Schedule AMTC',
            type: 'num', source: 'user', path: 'PartB_TTI/ComputationOfTaxLiability/CreditUS115JD',
          },
          {
            key: 'TTI_Surcharge', label: 'Surcharge on the tax payable', type: 'num',
            source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/TotalSurcharge',
          },
          {
            key: 'TTI_Cess', label: 'Health and education cess at four per cent', type: 'num',
            source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/EducationCess',
            hint: 'Four per cent of tax and surcharge.',
          },
          {
            key: 'TTI_GrossLiab', label: '5 Gross tax liability', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxPayableOnTI/GrossTaxLiability',
          },
          {
            key: 'TTI_Relief89', label: '6(a) Relief under section 89, Form 10E required',
            type: 'num', source: 'forms',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxRelief/Section89',
            hint: 'Form 10E must be filed before the return is uploaded.',
          },
          {
            key: 'TTI_Relief90', label: '6(b) Relief under section 90 or 90A, as per Schedule TR',
            type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxRelief/Section90',
          },
          {
            key: 'TTI_Relief91', label: '6(c) Relief under section 91', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/TaxRelief/Section91',
          },
          {
            key: 'TTI_NetLiab', label: '7 Net tax liability', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/NetTaxLiability',
          },
          {
            key: 'TTI_234A', label: '8(a) Interest under section 234A', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/IntrstPayUs234A',
          },
          {
            key: 'TTI_234B', label: '8(b) Interest under section 234B', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/IntrstPayUs234B',
          },
          {
            key: 'TTI_234C', label: '8(c) Interest under section 234C', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/IntrstPayUs234C',
          },
          {
            key: 'TTI_234F', label: '8(d) Fee under section 234F', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/LateFilingFee234F',
            hint: '₹5,000, or ₹1,000 where total income does not exceed ₹5 lakh.',
          },
          {
            key: 'TTI_234I', label: '8(e) Fee under section 234-I', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/IntrstPay/FeeFurnish234I',
          },
          {
            key: 'TTI_AggLiab', label: '9 Aggregate liability', type: 'num', source: 'user',
            path: 'PartB_TTI/ComputationOfTaxLiability/AggregateTaxInterestLiability',
          },
          {
            key: 'TTI_TotalPaid',
            label: '10 Total taxes paid — advance tax, tax deducted, tax collected and self-assessment tax',
            type: 'num', source: 'form26as', path: 'PartB_TTI/TaxPaid/TaxesPaid/TotalTaxesPaid',
          },
          {
            key: 'TTI_Payable', label: '11 Amount payable', type: 'num', source: 'user',
            path: 'PartB_TTI/TaxPaid/BalTaxPayable',
          },
          {
            key: 'TTI_Refund', label: '12 Refund claimed', type: 'num', source: 'user',
            path: 'PartB_TTI/Refund/RefundDue',
          },
          {
            key: 'TTI_FAFlag',
            label: '14 Do you hold any asset outside India, signing authority in any account outside India, or income from any source outside India?',
            type: 'sel', required: true,
            options: [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }], source: 'user',
            path: 'PartB_TTI/AssetOutIndiaFlag',
          },
        ],
        tables: [
          {
            key: 'BankRows',
            title: 'Schedule BA — Bank accounts held in India at any time during the previous year (nominate one for refund)',
            note: 'At least one account held in India is compulsory. The IFSC is checked against the Reserve Bank directory on upload. Enter every account held, including accounts opened or closed during the year.',
            source: 'user',
            path: 'PartB_TTI/Refund/BankAccountDtls/AddtnlBankDetails',
            columns: [
              { key: 'IFSC', label: 'Indian Financial System Code', type: 'ifsc', path: 'IFSCCode' },
              { key: 'BankName', label: 'Name of the bank', type: 'text', path: 'BankName' },
              {
                key: 'JointHolders',
                label: 'Name of joint holder(s), if any (worksheet only — not in departmental JSON)',
                type: 'text',
              },
              { key: 'AccountNo', label: 'Account number', type: 'text', path: 'BankAccountNo' },
              {
                key: 'AccountStatus',
                label: 'Account status (worksheet only — not in departmental JSON)',
                type: 'text',
              },
              {
                key: 'Balance31Mar',
                label: 'Account balance as on 31 March (worksheet only — not in departmental JSON)',
                type: 'num',
              },
              { key: 'Nominate', label: 'Nominated for refund', type: 'text', path: 'UseForRefund' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'ATI',
    code: 'PartB-ATI',
    no: 'F-3',
    name: 'Part B-ATI — Computation of Total Updated Income and Tax Payable',
    part: 'Part F — Computation',
    forms: ['ITR3'],
    showIf: { field: 'GEN.ReturnFileSec', equals: '21' },
    sections: [
      {
        key: 'main',
        title: 'Part B-ATI — Updated income and additional tax',
        note: 'Applies only to updated returns under section 139(8A). Additional income-tax under section 140B is 25%, 50%, 60% or 70% of the aggregate liability on additional income, depending on when the return is filed.',
        fields: [
          {
            key: 'AddlSalary', label: 'Additional income — Salaries', type: 'num', source: 'user',
          },
          {
            key: 'AddlHP', label: 'Additional income — House property', type: 'num', source: 'user',
          },
          {
            key: 'AddlBP', label: 'Additional income — Business or profession', type: 'num',
            source: 'user',
          },
          {
            key: 'AddlCG', label: 'Additional income — Capital gains', type: 'num', source: 'user',
          },
          {
            key: 'AddlOS', label: 'Additional income — Other sources', type: 'num', source: 'user',
          },
          {
            key: 'TotalAddl', label: 'Total additional income', type: 'num', source: 'user',
          },
          {
            key: 'TotalIncomeLatest', label: 'Total income as per latest valid return', type: 'num',
            source: 'user',
          },
          {
            key: 'TotalIncomeBTI', label: 'Total income as per Part B-TI', type: 'num', source: 'user',
          },
          {
            key: 'PayableUpdated', label: 'Amount payable as per Part B-TTI of the updated return',
            type: 'num', source: 'user',
          },
          {
            key: 'RefundUpdated', label: 'Refund as per Part B-TTI of the updated return',
            type: 'num', source: 'user',
          },
          {
            key: 'AddlTax140B', label: 'Additional income-tax liability under section 140B',
            type: 'num', source: 'user',
          },
          {
            key: 'TaxPaid140B', label: 'Tax paid under section 140B', type: 'num', source: 'user',
          },
          {
            key: 'TaxDueATI', label: 'Tax due on the updated return', type: 'num', source: 'user',
          },
        ],
        tables: [
          {
            key: 'ATI140BRows',
            title: 'Tax payments under section 140B',
            source: 'user',
            path: 'PartB-ATI/ScheduleIT1/TaxPayment1/TaxPayments',
            columns: [
              { key: 'DepositDate', label: 'Date of deposit', type: 'date', path: 'DateDep' },
              { key: 'Challan', label: 'Serial number of challan', type: 'text', path: 'SrlNoOfChaln' },
              { key: 'Amount', label: 'Amount', type: 'num', path: 'Amt' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'TDS1',
    code: 'TDSonSalaries',
    no: 'G-1',
    name: 'Schedule TDS-1 — Tax Deducted at Source on Salary',
    part: 'Part G — Taxes Paid',
    forms: ['ITR3'],
    showIf: { field: 'GEN.Status', notEquals: 'H' },
    sections: [
      {
        key: 'main',
        title: 'Schedule TDS-1 — Tax Deducted at Source on Salary',
        note: 'Rules 1003 and 1017–1019. Not applicable where the status is Hindu Undivided Family. Total tax deducted may not exceed the income chargeable under the head Salaries together with exempt allowances.',
        tables: [
          {
            key: 'TDS1Rows',
            title: 'Employer-wise particulars as per Form 16',
            source: 'form26as',
            path: 'ScheduleTDS1/TDSonSalary',
            columns: [
              {
                key: 'TAN', label: 'Tax Deduction Account Number of the employer', type: 'text',
                path: 'EmployerOrDeductorOrCollectDetl/TAN',
              },
              {
                key: 'EmpName', label: 'Name of the employer', type: 'text',
                path: 'EmployerOrDeductorOrCollectDetl/EmployerOrDeductorOrCollecterName',
              },
              {
                key: 'IncomeSal', label: 'Income chargeable under the head Salaries', type: 'num',
                path: 'IncChrgSal',
              },
              { key: 'TaxDeducted', label: 'Total tax deducted', type: 'num', path: 'TotalTDSSal' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'TDS2',
    code: 'TDSonOthThanSals',
    no: 'G-2',
    name: 'Schedule TDS-2 — Tax Deducted at Source on Income Other Than Salary',
    part: 'Part G — Taxes Paid',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule TDS-2 — Tax Deducted at Source on Income Other Than Salary',
        note: 'Rules 1004–1021. Credit claimed may not exceed the tax deducted; unclaimed brought forward credit and current year credit must be shown in separate rows, and the corresponding income and head must be stated.',
        tables: [
          {
            key: 'TDS2Rows',
            title: 'Deductor-wise particulars as per Form 16A, 16B, 16C or 16D',
            note: 'Credit claimed may not exceed the tax deducted.',
            source: 'form26as',
            path: 'ScheduleTDS2/TDSOthThanSalaryDtls',
            columns: [
              {
                key: 'TAN2',
                label: 'Tax Deduction Account Number of the deductor, or Permanent Account Number of the tenant or buyer',
                type: 'text', span: 12, path: 'TANOfDeductor',
              },
              { key: 'DeductorName', label: 'Name of the deductor', type: 'text', path: 'TDSCreditName' },
              {
                key: 'BFFlag',
                label: 'Unclaimed credit brought forward, with the year of deduction', type: 'text',
                span: 8,
              },
              {
                key: 'TDSDeducted', label: 'Tax deducted', type: 'num',
                path: 'TaxDeductCreditDtls/TaxDeductedOwnHands',
              },
              {
                key: 'TDSClaimed', label: 'Credit claimed this year', type: 'num',
                path: 'TaxDeductCreditDtls/TaxClaimedOwnHands',
              },
              {
                key: 'GrossAmt', label: 'Corresponding gross income offered', type: 'num',
                path: 'GrossAmount',
              },
              { key: 'HeadIncome', label: 'Head of income', type: 'text', path: 'HeadOfIncome' },
              { key: 'TDSCF', label: 'Credit carried forward', type: 'num', path: 'AmtCarriedFwd' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'TDS3',
    code: 'TDSonRent',
    no: 'G-3',
    name: 'Schedule TDS-3 — Tax Deducted at Source on Rent under Form 26QC',
    part: 'Part G — Taxes Paid',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule TDS-3 — Tax Deducted at Source on Rent under Form 26QC',
        tables: [
          {
            key: 'TDS3Rows',
            title: 'Tenant-wise particulars under section 194-IB',
            source: 'form26as',
            path: 'ScheduleTDS3/TDS3onOthThanSalDtls',
            columns: [
              {
                key: 'TenantPAN', label: 'Permanent Account Number of the tenant', type: 'pan',
                path: 'PANOfBuyerTenant',
              },
              { key: 'TenantName', label: 'Name of the tenant', type: 'text', path: 'TDSCreditName' },
              {
                key: 'TDSDed3', label: 'Tax deducted', type: 'num',
                path: 'TaxDeductCreditDtls/TaxDeductedOwnHands',
              },
              {
                key: 'TDSClm3', label: 'Credit claimed this year', type: 'num',
                path: 'TaxDeductCreditDtls/TaxClaimedOwnHands',
              },
              { key: 'GrossRentAmt', label: 'Gross rent', type: 'num', path: 'GrossAmount' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'TCS',
    code: 'ScheduleTCS',
    no: 'G-4',
    name: 'Schedule TCS — Tax Collected at Source',
    part: 'Part G — Taxes Paid',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule TCS — Tax Collected at Source',
        note: 'Rules 1022–1029. Credit claimed may not exceed the tax collected, and the collection account number of the collector must be furnished.',
        tables: [
          {
            key: 'TCSRows',
            title: 'Collector-wise particulars',
            source: 'form26as',
            path: 'ScheduleTCS/TCS',
            columns: [
              {
                key: 'CollectorTAN',
                label: 'Tax Deduction and Collection Account Number of the collector', type: 'text',
                span: 8, path: 'EmployerOrDeductorOrCollectTAN',
              },
              { key: 'CollectorName', label: 'Name of the collector', type: 'text', path: 'TCSCreditOwner' },
              {
                key: 'TCSCollected', label: 'Tax collected', type: 'num',
                path: 'TCSCurrFYDtls/TCSAmtCollOwnHand',
              },
              {
                key: 'TCSClaimed', label: 'Credit claimed this year', type: 'num',
                path: 'TCSClaimedThisYearDtls/TCSAmtCollOwnHand',
              },
              { key: 'TCSCF', label: 'Credit carried forward', type: 'num', path: 'AmtCarriedFwd' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'IT',
    code: 'ScheduleIT',
    no: 'G-5',
    name: 'Schedule IT — Advance Tax and Self-Assessment Tax Payments',
    part: 'Part G — Taxes Paid',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Schedule IT — Advance Tax and Self-Assessment Tax Payments',
        tables: [
          {
            key: 'ITRows',
            title: 'Challan-wise particulars',
            source: 'form26as',
            path: 'ScheduleIT/TaxPayment',
            columns: [
              {
                key: 'BSRCode', label: 'Basic Statistical Return code of the branch', type: 'bsr',
                path: 'BSRCode',
              },
              { key: 'DepDate', label: 'Date of deposit', type: 'date', path: 'DateDep' },
              { key: 'ChallanNo', label: 'Serial number of the challan', type: 'text', path: 'SrlNoOfChaln' },
              { key: 'TaxAmt', label: 'Amount deposited', type: 'num', path: 'Amt' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'VER',
    code: 'Verification',
    no: 'H-1',
    name: 'Verification',
    part: 'Part H — Verification',
    forms: ['ITR3'],
    sections: [
      {
        key: 'main',
        title: 'Verification',
        note: 'Rules 8 and 9. Where the return is filed by a representative assessee, the Permanent Account Number quoted here must be that of the person uploading the return.',
        fields: [
          {
            key: 'VerName', label: 'Name of the person verifying the return', type: 'text',
            required: true, source: 'eri', path: 'Verification/Declaration/AssesseeVerName',
          },
          {
            key: 'VerFatherName', label: 'Father’s name', type: 'text', source: 'eri',
            path: 'Verification/Declaration/FatherName',
          },
          {
            key: 'VerPAN', label: 'Permanent Account Number of the person verifying', type: 'pan',
            required: true, source: 'eri', path: 'Verification/Declaration/AssesseeVerPAN',
          },
          {
            key: 'VerCapacity', label: 'Capacity in which the return is verified', type: 'sel',
            required: true,
            options: [
              { value: 'S', label: 'Self' },
              { value: 'K', label: 'Karta' },
              { value: 'R', label: 'Representative assessee' },
              { value: 'A', label: 'Authorised signatory' },
            ],
            source: 'user', path: 'Verification/Capacity',
          },
          {
            key: 'VerPlace', label: 'Place', type: 'text', required: true, source: 'user',
            path: 'Verification/Place',
          },
          {
            key: 'VerDate', label: 'Date', type: 'date', required: true, source: 'user',
            path: 'Verification/Date',
          },
        ],
      },
    ],
  },
];

/** State and country codes, as the department publishes them. */
export const ITR3_OPTIONS: { state: SelectOption[]; country: SelectOption[] } = {
  state: [
    { value: '01', label: 'ANDAMAN AND NICOBAR ISLANDS' },
    { value: '02', label: 'ANDHRA PRADESH' },
    { value: '03', label: 'ARUNACHAL PRADESH' },
    { value: '04', label: 'ASSAM' },
    { value: '05', label: 'BIHAR' },
    { value: '06', label: 'CHANDIGARH' },
    { value: '07', label: 'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU' },
    { value: '09', label: 'DELHI' },
    { value: '10', label: 'GOA' },
    { value: '11', label: 'GUJARAT' },
    { value: '12', label: 'HARYANA' },
    { value: '13', label: 'HIMACHAL PRADESH' },
    { value: '14', label: 'JAMMU AND KASHMIR' },
    { value: '15', label: 'KARNATAKA' },
    { value: '16', label: 'KERALA' },
    { value: '17', label: 'LAKSHADWEEP' },
    { value: '18', label: 'MADHYA PRADESH' },
    { value: '19', label: 'MAHARASHTRA' },
    { value: '20', label: 'MANIPUR' },
    { value: '21', label: 'MEGHALAYA' },
    { value: '22', label: 'MIZORAM' },
    { value: '23', label: 'NAGALAND' },
    { value: '24', label: 'ODISHA' },
    { value: '25', label: 'PUDUCHERRY' },
    { value: '26', label: 'PUNJAB' },
    { value: '27', label: 'RAJASTHAN' },
    { value: '28', label: 'SIKKIM' },
    { value: '29', label: 'TAMIL NADU' },
    { value: '30', label: 'TRIPURA' },
    { value: '31', label: 'UTTAR PRADESH' },
    { value: '32', label: 'WEST BENGAL' },
    { value: '33', label: 'CHHATTISGARH' },
    { value: '34', label: 'UTTARAKHAND' },
    { value: '35', label: 'JHARKHAND' },
    { value: '36', label: 'TELANGANA' },
    { value: '37', label: 'LADAKH' },
  ],
  country: [
    { value: '93', label: 'AFGHANISTAN' },
    { value: '1001', label: 'ALAND ISLANDS' },
    { value: '355', label: 'ALBANIA' },
    { value: '213', label: 'ALGERIA' },
    { value: '684', label: 'AMERICAN SAMOA' },
    { value: '376', label: 'ANDORRA' },
    { value: '244', label: 'ANGOLA' },
    { value: '1264', label: 'ANGUILLA' },
    { value: '1010', label: 'ANTARCTICA' },
    { value: '1268', label: 'ANTIGUA AND BARBUDA' },
    { value: '54', label: 'ARGENTINA' },
    { value: '374', label: 'ARMENIA' },
    { value: '297', label: 'ARUBA' },
    { value: '61', label: 'AUSTRALIA' },
    { value: '43', label: 'AUSTRIA' },
    { value: '994', label: 'AZERBAIJAN' },
    { value: '1242', label: 'BAHAMAS' },
    { value: '973', label: 'BAHRAIN' },
    { value: '880', label: 'BANGLADESH' },
    { value: '1246', label: 'BARBADOS' },
    { value: '375', label: 'BELARUS' },
    { value: '32', label: 'BELGIUM' },
    { value: '501', label: 'BELIZE' },
    { value: '229', label: 'BENIN' },
    { value: '1441', label: 'BERMUDA' },
    { value: '975', label: 'BHUTAN' },
    { value: '591', label: 'BOLIVIA (PLURINATIONAL STATE OF)' },
    { value: '1002', label: 'BONAIRE, SINT EUSTATIUS AND SABA' },
    { value: '387', label: 'BOSNIA AND HERZEGOVINA' },
    { value: '267', label: 'BOTSWANA' },
    { value: '1003', label: 'BOUVET ISLAND' },
    { value: '55', label: 'BRAZIL' },
    { value: '1014', label: 'BRITISH INDIAN OCEAN TERRITORY' },
    { value: '673', label: 'BRUNEI DARUSSALAM' },
    { value: '359', label: 'BULGARIA' },
    { value: '226', label: 'BURKINA FASO' },
    { value: '257', label: 'BURUNDI' },
    { value: '238', label: 'CABO VERDE' },
    { value: '855', label: 'CAMBODIA' },
    { value: '237', label: 'CAMEROON' },
    { value: '1', label: 'CANADA' },
    { value: '1345', label: 'CAYMAN ISLANDS' },
    { value: '236', label: 'CENTRAL AFRICAN REPUBLIC' },
    { value: '235', label: 'CHAD' },
    { value: '56', label: 'CHILE' },
    { value: '86', label: 'CHINA' },
    { value: '9', label: 'CHRISTMAS ISLAND' },
    { value: '672', label: 'COCOS (KEELING) ISLANDS' },
    { value: '57', label: 'COLOMBIA' },
    { value: '270', label: 'COMOROS' },
    { value: '242', label: 'CONGO' },
    { value: '243', label: 'CONGO (DEMOCRATIC REPUBLIC OF THE)' },
    { value: '682', label: 'COOK ISLANDS' },
    { value: '506', label: 'COSTA RICA' },
    { value: '225', label: 'COTE DIVOIRE' },
    { value: '385', label: 'CROATIA' },
    { value: '53', label: 'CUBA' },
    { value: '1015', label: 'CURACAO' },
    { value: '357', label: 'CYPRUS' },
    { value: '420', label: 'CZECHIA' },
    { value: '45', label: 'DENMARK' },
    { value: '253', label: 'DJIBOUTI' },
    { value: '1767', label: 'DOMINICA' },
    { value: '1809', label: 'DOMINICAN REPUBLIC' },
    { value: '593', label: 'ECUADOR' },
    { value: '20', label: 'EGYPT' },
    { value: '240', label: 'EQUATORIAL GUINEA' },
    { value: '291', label: 'ERITREA' },
    { value: '251', label: 'ETHIOPIA' },
    { value: '500', label: 'FALKLAND ISLANDS (MALVINAS)' },
    { value: '298', label: 'FAROE ISLANDS' },
    { value: '679', label: 'FIJI' },
    { value: '358', label: 'FINLAND' },
    { value: '33', label: 'FRANCE' },
    { value: '594', label: 'FRENCH GUIANA' },
    { value: '689', label: 'FRENCH POLYNESIA' },
    { value: '1004', label: 'FRENCH SOUTHERN TERRITORIES' },
    { value: '241', label: 'GABON' },
    { value: '220', label: 'GAMBIA' },
    { value: '995', label: 'GEORGIA' },
    { value: '233', label: 'GHANA' },
    { value: '350', label: 'GIBRALTAR' },
    { value: '30', label: 'GREECE' },
    { value: '299', label: 'GREENLAND' },
    { value: '590', label: 'GUADELOUPE' },
    { value: '1671', label: 'GUAM' },
    { value: '502', label: 'GUATEMALA' },
    { value: '1481', label: 'GUERNSEY' },
    { value: '224', label: 'GUINEA' },
    { value: '245', label: 'GUINEA-BISSAU' },
    { value: '6', label: 'HOLY SEE' },
    { value: '504', label: 'HONDURAS' },
    { value: '852', label: 'HONG KONG' },
    { value: '354', label: 'ICELAND' },
    { value: '91', label: 'INDIA' },
    { value: '98', label: 'IRAN (ISLAMIC REPUBLIC OF)' },
    { value: '964', label: 'IRAQ' },
    { value: '972', label: 'ISRAEL' },
    { value: '5', label: 'ITALY' },
    { value: '1534', label: 'JERSEY' },
    { value: '962', label: 'JORDAN' },
    { value: '7', label: 'KAZAKHSTAN' },
    { value: '254', label: 'KENYA' },
    { value: '686', label: 'KIRIBATI' },
    { value: '850', label: 'KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)' },
    { value: '82', label: 'KOREA (REPUBLIC OF)' },
    { value: '965', label: 'KUWAIT' },
    { value: '996', label: 'KYRGYZSTAN' },
    { value: '856', label: 'LAO PEOPLES DEMOCRATIC REPUBLIC' },
    { value: '371', label: 'LATVIA' },
    { value: '961', label: 'LEBANON' },
    { value: '266', label: 'LESOTHO' },
    { value: '231', label: 'LIBERIA' },
    { value: '218', label: 'LIBYA' },
    { value: '423', label: 'LIECHTENSTEIN' },
    { value: '370', label: 'LITHUANIA' },
    { value: '352', label: 'LUXEMBOURG' },
    { value: '853', label: 'MACAO' },
    { value: '389', label: 'MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)' },
    { value: '261', label: 'MADAGASCAR' },
    { value: '265', label: 'MALAWI' },
    { value: '60', label: 'MALAYSIA' },
    { value: '960', label: 'MALDIVES' },
    { value: '223', label: 'MALI' },
    { value: '356', label: 'MALTA' },
    { value: '692', label: 'MARSHALL ISLANDS' },
    { value: '596', label: 'MARTINIQUE' },
    { value: '222', label: 'MAURITANIA' },
    { value: '230', label: 'MAURITIUS' },
    { value: '269', label: 'MAYOTTE' },
    { value: '52', label: 'MEXICO' },
    { value: '691', label: 'MICRONESIA (FEDERATED STATES OF)' },
    { value: '373', label: 'MOLDOVA (REPUBLIC OF)' },
    { value: '377', label: 'MONACO' },
    { value: '976', label: 'MONGOLIA' },
    { value: '382', label: 'MONTENEGRO' },
    { value: '1664', label: 'MONTSERRAT' },
    { value: '212', label: 'MOROCCO' },
    { value: '258', label: 'MOZAMBIQUE' },
    { value: '95', label: 'MYANMAR' },
    { value: '264', label: 'NAMIBIA' },
    { value: '674', label: 'NAURU' },
    { value: '977', label: 'NEPAL' },
    { value: '31', label: 'NETHERLANDS' },
    { value: '687', label: 'NEW CALEDONIA' },
    { value: '64', label: 'NEW ZEALAND' },
    { value: '505', label: 'NICARAGUA' },
    { value: '227', label: 'NIGER' },
    { value: '234', label: 'NIGERIA' },
    { value: '683', label: 'NIUE' },
    { value: '15', label: 'NORFOLK ISLAND' },
    { value: '1670', label: 'NORTHERN MARIANA ISLANDS' },
    { value: '968', label: 'OMAN' },
    { value: '92', label: 'PAKISTAN' },
    { value: '680', label: 'PALAU' },
    { value: '595', label: 'PARAGUAY' },
    { value: '51', label: 'PERU' },
    { value: '63', label: 'PHILIPPINES' },
    { value: '1011', label: 'PITCAIRN' },
    { value: '48', label: 'POLAND' },
    { value: '14', label: 'PORTUGAL' },
    { value: '1787', label: 'PUERTO RICO' },
    { value: '974', label: 'QATAR' },
    { value: '262', label: 'REUNION' },
    { value: '40', label: 'ROMANIA' },
    { value: '8', label: 'RUSSIAN FEDERATION' },
  ],
};

/** Look a schedule up by its id, e.g. `itr3Schedule('CG')`. */
export function itr3Schedule(id: string): ScheduleDef | undefined {
  return ITR3_SCHEDULES.find((s) => s.id === id);
}
