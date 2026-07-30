/**
 * Brand imagery from design-system/assets/imagery (copied to web/public).
 * Prefer documentary desks, paper, currency — not lifestyle people shots.
 * Use as background bands behind ink / primary overlays with saturate(0.85).
 */

export const BRAND_PHOTOS = {
  /** Filing paperwork — hero / prefill */
  paperwork: {
    src: '/paperwork-filing.jpg',
    alt: 'Paper tax files and folders on a desk',
  },
  /** Calendar / deadline cue — CTA */
  taxTime: {
    src: '/tax-time-reminder.jpg',
    alt: 'Tax deadline reminder on a desk',
  },
  /** Figures and bills — features / footer */
  calculating: {
    src: '/calculating-bills.jpg',
    alt: 'Bills and a calculator on a work surface',
  },
  /** Currency on dark — trust band */
  currencyStack: {
    src: '/stack-of-currency-black.jpg',
    alt: 'Stack of currency notes on a dark surface',
  },
  /** Receipts — prefill JSON guide */
  billsReceipts: {
    src: '/bills-and-receipts.jpg',
    alt: 'Bills and receipts ready for filing',
  },
  /** Laptop filing — how it works */
  deskLaptop: {
    src: '/macbook-air-on-desk.jpg',
    alt: 'Laptop open on a desk for digital filing',
  },
  /** Form filling — how it works side */
  filingTaxes: {
    src: '/filing-taxes.jpg',
    alt: 'Tax forms and paperwork being prepared',
  },
  /** Markets / CAS helpers */
  markets: {
    src: '/stock-market-tracking-and-stocks.jpg',
    alt: 'Market charts and investment tracking',
  },
  /** Organised finances — CA / helpers */
  financesOrder: {
    src: '/getting-business-finances-in-order.jpg',
    alt: 'Financial documents organised for review',
  },
  /** Typed money — security / figures */
  typedMoney: {
    src: '/typed-money.jpg',
    alt: 'Currency and typed financial papers',
  },
} as const;

export type BrandPhotoKey = keyof typeof BRAND_PHOTOS;
