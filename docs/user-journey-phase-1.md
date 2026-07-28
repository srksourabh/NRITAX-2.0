# NRITAX 2.0 — User journey (Phase 1)

Confirmed against `docs/intent/phase-1.md` and `web/src/components/filing/FilingWizard.tsx`.

**Outcome:** An NRI signs in without an Indian mobile number, fills ITR-2 or ITR-3 (helpers optional), validates, then downloads filing JSON to upload on the Income Tax portal themselves.

**Not in this phase:** ERI filing on the user’s behalf, storing the portal password, blocking on OCR / full KYC.

```mermaid
flowchart TD
  A([Arrive at NRITAX]) --> B{Signed in?}

  B -->|No| C[Home → Start filing]
  C --> D[Login]
  D --> E{How do you sign in?}
  E -->|Email magic link| F[Open link from inbox]
  E -->|Google| G[OAuth]
  E -->|Demo| H[Sign in as demo]
  F --> I[/filing]
  G --> I
  H --> I

  B -->|Yes| J[Home → Continue filing / Open the form]
  J --> I

  I --> K[Choose form]
  K --> L{ITR-2 or ITR-3?}
  L -->|ITR-2| M[Individuals / HUF without business]
  L -->|ITR-3| N[With business / profession income]
  M --> O[File workspace]
  N --> O

  O --> P[Optional helpers — all skippable]
  P --> P1[Upload ITD prefill JSON]
  P --> P2[CAS · CAMS / KFintech]
  P --> P3[Sandbox · PAN / IFSC / DigiLocker]
  P --> P4[Form 16 / 26AS OCR when available]
  P1 --> Q[Fill / edit schedules]
  P2 --> Q
  P3 --> Q
  P4 --> Q
  P -->|Skip all helpers| Q

  Q --> R[Autosave draft when PAN present]
  R --> S{Need regime stub?}
  S -->|Yes| T[Old vs new regime · placeholder]
  T --> Q
  S -->|No · stay on file| U[Validate return]

  U --> V{Validation result?}
  V -->|Issues| W[Fix fields · Category messages]
  W --> Q
  V -->|Clear enough| X[Download filing JSON]

  X --> Y[User leaves NRITAX]
  Y --> Z[incometax.gov.in → e-File → Upload JSON]
  Z --> AA([Portal acknowledgement · verify within 30 days])

  style A fill:#EEF1EE,stroke:#141A22,color:#141A22
  style AA fill:#14704A,stroke:#141A22,color:#FCFDFC
  style P fill:#E8F1F7,stroke:#0B4A75,color:#141A22
  style X fill:#0B4A75,stroke:#141A22,color:#FCFDFC
```

## Journey in one line

**Sign in → choose ITR-2/3 → enrich (optional) → fill → validate → download JSON → upload on the portal.**

## Two JSONs (do not conflate)

| JSON | Direction | Who moves it |
| --- | --- | --- |
| ITD prefill | Portal → NRITAX | User downloads from department, uploads into the wizard |
| Final filing | NRITAX → Portal | User downloads from NRITAX, uploads on the portal |

## Defaults that shape the path

- Residential status defaults to **NRI**
- Assessment year **2026-27**, due **31 July 2026**
- Regime preference defaults to **new**
- Schedules such as FSI / FA / TR stay out of the way for NRI until needed
- No helper may block the form — manual entry always remains open
