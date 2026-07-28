# Filing application — UI kit

A click-through recreation of the NRITAX 2.0 filing surface. Compact density (24–32px rhythm), `paper` canvas, `ink` shell header, Archivo Expanded used only at `display-sm` for step titles.

## Screens

| File | Screen | Notes |
|---|---|---|
| `Dashboard.jsx` | My returns | Deadline banner at the 4–14 day tier, current return card, 26AS table, refund hero, earlier returns |
| `DocumentsStep.jsx` | Your details (step 1) | PAN and Aadhaar character boxes, all four document states, trust bar |
| `IncomeStep.jsx` | Income (step 2) | Money inputs with source chips, live ledger side panel in `aria-live="polite"` |
| `ReviewStep.jsx` | Review (step 5) | Regime comparison, the full computation sheet with the single double rule, pre-file checks |
| `FiledScreen.jsx` | File and verify (step 7) | Acknowledgement with the stamp motion, verification choice |

`Shared.jsx` holds the `Page` wrapper only. Everything else composes the published components — nothing is re-implemented here.

## Interactions

Shell nav switches screens. "Ask a CA" opens the 400px expert drawer and sends real messages into the thread. On Review, choosing the old regime opens the switch dialog. "File my return" goes to the acknowledgement, where the stamp fires once.

## Not built

The Deductions, Taxes paid and Pay steps are reachable in the stepper but not drawn — no source screens were provided for them, and the kit does not invent designs.
