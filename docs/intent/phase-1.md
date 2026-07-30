# Phase 1 intent — NRITAX

Confirmed 2026-07-28.

## Outcome

An NRI can open NRITAX, upload the ITD prefill JSON, complete ITR-2 or ITR-3 for
assessment year 2026-27 with Sandbox and CAS helping fill gaps, validate and
compute tax, then download the final filing JSON to upload on the Income Tax
portal themselves.

## User

Builder/owner shipping for NRI filers. App sign-in does not require an Indian
mobile number.

## Why now

Own ERI / PAT is not ready. Sandbox cannot pull departmental prefill. Filing
season needs a working fill → JSON path now.

## Success

- Prefill JSON from incometax.gov.in maps into the form when available (manual
  upload or optional portal-fetch helper).
- No helper is required: missing prefill, IT portal login, Sandbox, DigiLocker,
  or CAS never blocks the wizard — the form stays open for manual entry.
- Sandbox (PAN, IFSC, DigiLocker) and CAS enrich what they can when present.
- Validation and tax calculation run.
- Final filing JSON downloads and is portal-uploadable.
- OCR comes after that core path is solid.

## Design language

UI follows the NRITAX 2.0 Claude design system (`NRITAX 2.0 Filing App.html`):

- Ink shell header, paper page `#EEF1EE`, flat bordered surfaces (no resting shadows)
- Archivo Expanded display, IBM Plex Sans UI, IBM Plex Mono figures
- Primary `#0B4A75`, credit `#14704A`, due `#A15C07`, notice `#B3261E`
- Flow: choose ITR-2/ITR-3 → ledger form → optional regime compare stub → validate → download JSON

## Non-blocking helpers

Every enrichment step is skippable:

1. Optional: upload ITD prefill JSON, or use portal-fetch when configured
   (or skip and enter manually).
2. Optional: Sandbox PAN / IFSC / DigiLocker (or skip).
3. Optional: CAS statement upload (or enter capital gains by hand).
4. Always: fill remaining fields → validate → compute tax → download JSON.

## Constraint

No live ERI upload until registered. Prefill may arrive via manual JSON upload
or optional portal-fetch helper (ephemeral portal password only; never stored).
Manual final JSON out.

## Out of scope (this phase)

- Filing through an ERI on the user's behalf
- Persisting the Income Tax portal password across sessions
- Treating Sandbox as an ERI
- Blocking on OCR or full KYC Console activation before form + JSON works

## Two JSONs

1. **ITD prefill JSON** — downloaded by the taxpayer (or optional portal-fetch
   helper) from the department; imported via `prefill-file.ts`.
2. **Final filing JSON** — generated after fill, validation, and tax calc;
   downloaded by the user and uploaded to the department by hand.

## Data helpers (optional, not hard dependencies)

| Source | Role |
| --- | --- |
| Sandbox | PAN verify, IFSC, DigiLocker, later OCR / tax-PnL when products respond |
| CAS service | CAMS / KFintech statement → Schedule CG / 112A |
| Mock ERI | Offline demo only until a real ERI is contracted |

Absent credentials or a down helper, the wizard asks the user and says why.
