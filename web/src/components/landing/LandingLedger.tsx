import { money } from '@/lib/itr/types';

const ROWS = [
  { label: 'Gross salary', statute: 'u/s 17(1)', amount: 1480000 },
  { label: 'Less: standard deduction', statute: 'u/s 16(ia)', amount: 75000 },
  { label: 'Income from salary', amount: 1405000, kind: 'subtotal' as const },
  { label: 'Income from other sources', statute: 'AIS', amount: 42318 },
  { label: 'Total income (rounded)', statute: 's.288A', amount: 1447320, kind: 'subtotal' as const },
  { label: 'Less: TDS', statute: '26AS', amount: 112000 },
  { label: 'Refund due', amount: 8557, kind: 'final' as const },
];

export function LandingLedger() {
  return (
    <section className="ntx-section ntx-landing-ink-band" aria-labelledby="ledger-heading">
      <div className="ntx-shell ntx-grid-band">
        <div className="ntx-landing-ink-copy">
          <h2 id="ledger-heading" className="ntx-display-lg">
            Every figure traces to a line and a section
          </h2>
          <p>
            The computation sheet is the product. Each row names where the number came from, so
            you can check it against the paper in front of you before you file.
          </p>
          <div className="ntx-landing-chip-row">
            {['Form 16 Part B', '26AS', 'AIS', 'u/s 16(ia)', 's.288A'].map((chip) => (
              <span key={chip} className="ntx-landing-chip">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="ntx-landing-sheet" aria-label="Sample computation sheet">
          <p className="ntx-landing-sheet-caption">
            A sample sheet from a salaried return. Figures changed.
          </p>
          <ul className="ntx-landing-sheet-rows">
            {ROWS.map((row) => (
              <li
                key={row.label}
                className={
                  row.kind === 'final'
                    ? 'is-final'
                    : row.kind === 'subtotal'
                      ? 'is-subtotal'
                      : undefined
                }
              >
                <span className="ntx-landing-sheet-label">
                  {row.label}
                  {'statute' in row && row.statute ? (
                    <span className="ntx-landing-statute"> {row.statute}</span>
                  ) : null}
                </span>
                <span className="ntx-figure">{money(row.amount)}</span>
              </li>
            ))}
          </ul>
          <hr className="ntx-double-rule" />
        </div>
      </div>
    </section>
  );
}
