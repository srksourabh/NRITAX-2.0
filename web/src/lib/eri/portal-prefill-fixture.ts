/**
 * Anonymized portal getPrefillCurrentYr shape for unit tests.
 * Mirrors real structure; no real taxpayer data.
 */
export const PORTAL_PREFILL_FIXTURE = {
  personalInfo: {
    fatherName: 'TEST FATHER',
    assesseeName: { firstName: 'TEST', surNameOrOrgName: 'TAXPAYER' },
    address: {
      residenceNo: '1 TEST LANE',
      residenceName: 'TEST HOUSE',
      roadOrStreet: 'Test Road',
      localityOrArea: 'Test Area',
      cityOrTownOrDistrict: 'Bengaluru',
      stateCode: '15',
      countryCode: '91',
      pinCode: 560001,
      emailAddress: 'test.taxpayer@example.com',
      mobileNo: 9876543210,
    },
    filingStatus: { residentialStatus: 'RES' },
    dob: '1990-01-15',
    aadhaarCardNo: '123456789012',
    pan: 'AAJPS4321K',
    status: 'I',
  },
  form26as: {
    taxPayments: {
      taxPayment: [
        {
          srlNoOfChaln: 10001,
          dateDep: '2026-03-15',
          bsrCode: '0000123',
          amt: 50000,
        },
      ],
    },
    tdsOnOthThanSals: {
      tdSonOthThanSal: [
        {
          taxDeductCreditDtls: {
            taxClaimedOwnHands: 5000,
            taxDeductedOwnHands: 5000,
          },
          sectionCode: '94A',
          grossAmount: 50000,
          headOfIncome: 'OS',
          employerOrDeductorOrCollectDetl: {
            tan: 'MUMH03189E',
            employerOrDeductorOrCollecterName: 'TEST BANK LIMITED',
          },
        },
      ],
    },
    scheduleOS: {
      incOthThanOwnRaceHorse: {
        dividendGross: 12000,
        DividendOthThan22e: 12000,
      },
    },
    tdsOnSalaries: {
      tdsOnSalary: [
        {
          totalTDSSal: 80000,
          incChrgSal: 1200000,
          employerOrDeductorOrCollectDetl: {
            tan: 'BLRI04321F',
            employerOrDeductorOrCollecterName: 'TEST EMPLOYER LLP',
          },
        },
      ],
    },
    incomeDeductionsOthersInc: [
      { othSrcOthAmount: 12000, othSrcNatureDesc: 'DIV' },
      { othSrcOthAmount: 45000, othSrcNatureDesc: 'IFD' },
      { othSrcOthAmount: 8000, othSrcNatureDesc: 'SAV' },
    ],
    intrstFrmTermDeposit: 45000,
  },
  bankAccountDtls: [
    {
      addtnlBankDetails: [
        {
          useForRefund: 'true',
          bankAccountNo: '501234567890',
          bankName: 'HDFC BANK',
          ifsccode: 'HDFC0000123',
          AccountType: 'SB',
        },
      ],
    },
  ],
  insights: {
    salaries: {
      salary: [
        {
          nameOfEmployer: 'TEST EMPLOYER LLP',
          salarys: {
            valueOfPerquisites: 0,
            profitsinLieuOfSalary: 0,
            salary: 1200000,
          },
          tanOfEmployer: 'BLRI04321F',
        },
      ],
    },
    intrstFrmSavingBank: 8000,
    intrstFrmTermDeposit: 45000,
  },
  form10IF: { newTaxRegime: 'N' },
  filingStatus: {
    returnFileSec: 11,
    SeventhProvisio139: 'N',
  },
  Form10BC: null,
  natOfBus: null,
  ScheduleEI: null,
  ais: null,
} as const;
