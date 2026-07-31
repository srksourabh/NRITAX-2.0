# NRITAX build contracts

Read this before writing any code in this repo. Every module obeys these rules so
the pieces compose without a rewrite.

## What we are building

A PWA that lets a non-resident Indian file an ITR-2 or ITR-3 return for assessment
year 2026-27 with as few manual steps as possible:

1. Sign in with an email magic link or Google.
2. Choose ITR-2 or ITR-3. The forms are separate tracks — each keeps its own
   schedules, calculations, validations, mandatory fields, drafts and JSON.
3. Optionally upload ITD prefill JSON, use Sandbox/DigiLocker helpers, or fill
   Part A by hand. No helper blocks the wizard.
4. Optionally upload a Detailed CAMS/KFintech consolidated account statement.
   The free open-source `casparser` service parses it and fills Schedule CG and
   Schedule 112A. The PDF password defaults to the PAN already on the return.
5. Complete remaining schedules on the chosen track; regime comparison uses the
   return's own numbers when wired.
6. The CBDT validation rules run for that form.
7. We build the departmental JSON for download (and later upload through an ERI
   when registered). Phase 1 is download-only.

## Layout

```
design-system/           Canonical design system (tokens, components, UI kits, guidelines).
web/                     Next.js app router, TypeScript, Tailwind. The PWA.
  src/lib/itr/           Form schema, validation rules, tax computation, JSON builder.
  src/lib/eri/           ERI provider adapter + mock + live implementations.
  src/lib/cas/           Client for the CAS parsing service.
  src/lib/ai/            Claude-powered audit of a completed return.
  src/lib/db/            Drizzle schema and connection.
  src/app/               Routes and UI.
services/cas/            Python FastAPI service wrapping the casparser library.
docs/reference/          The two HTML prototypes this work is ported from.
```

## Design system

`design-system/` is the source of truth for visual design and product UI voice.
Read `design-system/readme.md` before changing any surface.

- **Tokens** live only in `design-system/tokens/`. The app imports them from
  `web/src/app/globals.css`. Do not redeclare palette or type tokens in the app.
- **Reference components** are under `design-system/components/` (JSX kits).
  Production React ports go in `web/src/components/` and must use the same tokens.
- **Fonts** in the app are loaded with `next/font` in `layout.tsx`. Do not also
  import `design-system/tokens/fonts.css` into the Next bundle.
- **Copy rules** in the design-system readme apply to product strings: sentence
  case, no emoji, outcome-named buttons, Indian digit grouping, statute in the
  margin, double rule once per sheet under the final figure.

## Non-negotiables

- **Types come from `web/src/lib/itr/types.ts`**, `web/src/lib/eri/types.ts` and
  `web/src/lib/cas/types.ts`. Import them; do not redeclare equivalent shapes.
- **Field keys are fully qualified**: `"S.sal17_1"`, `"CG.ltcg112A"`, `"BP.d_totalPGBP"`.
  The prefix is `ScheduleDef.id`. Table keys are bare, e.g. `"tds1"`.
- **Money is whole rupees.** Use `r0` for figures and `r10` for tax amounts
  (section 288B). Never store formatted strings.
- **Dates are ISO `yyyy-mm-dd`.** The previous year runs 2025-04-01 to 2026-03-31.
- **No `any`.** `strict` is on. If a departmental JSON node is genuinely untyped,
  use `Record<string, unknown>` and narrow at the boundary.
- **Nothing in `src/lib/itr` may import React, Next.js or touch the DOM.** It has
  to run in a Node test and in a server action unchanged.
- **Every exported function gets a short doc comment saying what it is for**, in
  the same plain register as the existing files. Match the surrounding style.
- **Tests are Vitest**, colocated as `*.test.ts` next to the module.

## Porting from the HTML prototypes

`docs/reference/ITR2-source.html` and `docs/reference/ITR3-source.html` contain
working schema tables, rule sets and computation engines. They are the source of
truth for field paths, enum codes, and rule numbers. Port them faithfully:

- Keep the CBDT rule serial numbers exactly as they appear. They are how a
  taxpayer traces a failure back to the published document.
- Keep the departmental JSON paths byte-for-byte. A drifted path fails at upload
  with an opaque error.
- The prototypes use `/`-delimited paths (ITR-3) and `.`-delimited paths (ITR-2).
  Normalise everything to `/`.
- Where a prototype rule is commented as unverifiable in the browser, port it as
  a rule that returns `null` and add a note — do not silently drop it.

## Rates and thresholds for AY 2026-27

New regime slabs: nil to 4,00,000 · 5% to 8,00,000 · 10% to 12,00,000 ·
15% to 16,00,000 · 20% to 20,00,000 · 25% to 24,00,000 · 30% above.
Basic exemption 4,00,000 under the new regime; under the old regime 2,50,000,
3,00,000 for a senior citizen and 5,00,000 for a super senior citizen.

Rebate under section 87A: new regime up to 60,000 where total income does not
exceed 12,00,000, with marginal relief above it; old regime up to 12,500 where
total income does not exceed 5,00,000. Residents and RNORs only, individuals only.

Standard deduction under section 16(ia): 75,000 new regime, 50,000 old regime,
capped at net salary. Surcharge 10 / 15 / 25 / 37 per cent at 50 lakh, 1 crore,
2 crore and 5 crore, with the 37 per cent band unavailable under the new regime
(capped at 25) and capital-gain and dividend income capped at 15 per cent.
Health and education cess 4 per cent. Section 112A exemption 1,25,000.
Section 71(3A) house property set-off ceiling 2,00,000.

## Security rules

- The taxpayer's Income Tax portal password must never be logged or persisted to
  the database. Optional portal prefill fetch may collect it only for an active
  job: hold in worker memory (TTL ≤ 10 minutes), wipe on success/fail/timeout.
  See `docs/superpowers/specs/2026-07-31-portal-prefill-fetch-design.md`.
  Manual JSON upload remains the default path when fetch is unavailable.
- PAN, Aadhaar and bank account numbers are personal data. Never write them to
  application logs. Mask them in any error message that could surface to a third
  party.
- Uploaded statements are parsed and discarded. Do not persist the PDF bytes.
- All secrets come from environment variables. No key literals anywhere.

## Environment

Read `.env.example`. Nothing may hard-require a service that is absent in local
development: with no `DATABASE_URL` the app uses an embedded Postgres file, with
`ERI_PROVIDER=mock` the whole filing flow runs offline, and with the CAS service
down the uploader falls back to manual entry with a clear message.

## Sandbox.co.in provider, verified against the live API on 2026-07-27

Verified with real calls against `test-api.sandbox.co.in`. Do not guess any of
this.

Servers: `https://test-api.sandbox.co.in` for development,
`https://api.sandbox.co.in` for production. Read the host from `ERI_BASE_URL`.

Authenticate with `POST /authenticate` carrying `x-api-key`, `x-api-secret` and
`x-api-version: 1.0`. Success is HTTP 200 shaped
`{ code, timestamp, transaction_id, data: { access_token } }`. The token lasts
twenty-four hours — cache it in module scope and refresh on 401 rather than
authenticating on every call.

KYC / bank lookups send `x-accept-cache: true` by default so purchased response
cache is used (`SANDBOX_ACCEPT_CACHE=0` forces a fresh origin hit). DigiLocker
session and OCR multipart calls do not send the cache header.

Every later call sends `Authorization: <access_token>` **with no `Bearer`
prefix**, alongside `x-api-key` and `x-api-version`. Sending `Bearer` is the
most likely mistake here. This was confirmed working: a real endpoint answered
with a request-shape error rather than an authorisation error.

The test environment replays saved examples. A well-formed request with inputs
that are not one of their fixtures returns HTTP 404 with the message
"Request does not match any saved example". That is a success as far as
transport and auth are concerned, and integration tests must treat it as such.

### Sandbox has no ERI endpoints

The full catalogue was retrieved. Sandbox offers KYC, GST, TDS, Banking, and an
Income Tax product that is calculators, reports and OCR. There is no client
registration, no taxpayer consent, no prefill download, no ITR upload, no
ITR-V, no AIS. Sandbox cannot file a return.

So `sandbox.ts` is not an `EriProvider`. It implements `authenticate` for real,
plus the enrichment calls below, and throws
`EriError('NOT_AN_ERI', …)` from `requestConsent`, `fetchPrefill` and
`uploadReturn`, with a comment saying why. The mock provider remains the
default and remains complete: it is what the product runs on until a real ERI
is contracted.

### Sandbox endpoints we do want

These automate real work and are worth wiring behind their own client, separate
from the ERI interface.

| Endpoint | Method | What it gives the filing |
| --- | --- | --- |
| `/kyc/pan/verify` | POST | Confirms PAN, name and date of birth (live path; older docs said `verify-details`) |
| `/kyc/pan-aadhaar/status` | POST | An unlinked PAN is a filing risk — surface it early |
| `/it/ocr/form-16/pdf` | POST multipart | Salary / TDS from Form 16 PDF → Schedule S + TDS1 |
| `/it/ocr/form-26as/pdf` | POST multipart | Tax credits from Form 26AS → TDS2 / TCS / challans |
| `/bank/{ifsc}` | GET | Validates the refund account IFSC and fills bank name |
| `/bank/{ifsc}/accounts/{acct}/penniless-verify` | GET | Confirms the refund account without a deposit |
| `/kyc/digilocker/sessions/init` | POST | Starts DigiLocker consent (`redirect_url` **must be https**) |
| `/kyc/digilocker/sessions/{id}/status` | GET | Poll until consent succeeded |
| `/kyc/digilocker/sessions/{id}/documents/{doc}` | GET | Fetch consented PAN / Aadhaar |
| `/it/calculator/tax-pnl/securities/domestic/submit-job` | POST | Capital gains from a broker tradebook, complementing CAS |

Product wiring: `/api/sandbox/enrich` prompts for PAN / name / DOB (and optional
Aadhaar + IFSC), verifies via KYC with cache, and writes into Part A General plus
the first bank row. OCR and DigiLocker apply helpers still fill blank schedule
fields only.

Every one of these is optional. Absent credentials, the wizard asks the user
instead and says why. Nothing here may become a hard dependency.

### DigiLocker enablement (verified 2026-07-28)

Auth works with the test keys, and IFSC returns real data. DigiLocker (and PAN
KYC) currently answer HTTP 200 with an empty broken body (`"code": ,` and no
`data`) — that means the **DigiLocker / KYC product is not enabled** on the
Sandbox account, not that our client is wrong.

To run live DigiLocker consent:

1. Enable DigiLocker under KYC in the Sandbox dashboard for the API key in use.
2. Set `DIGILOCKER_REDIRECT_URL` to a **public HTTPS** URL that lands on `/filing`
   (DigiLocker rejects `http://localhost`). Use ngrok or a deployed host.
3. Set `DIGILOCKER_MOCK=0` (or remove it) so the live API is used.

Until the product is enabled, set `DIGILOCKER_MOCK=1` for a local consent
stand-in that exercises the same wizard apply path without calling DigiLocker.

## casparser.in Pro (DigiLocker + CDSL + PAN KYC status)

Pro plan features (CDSL OTP Fetch, DigiLocker KYC, KYC PAN Status, smart parse)
are wired through `CASPARSER_API_KEY` → `https://api.casparser.in` (optional
`CASPARSER_BASE_URL`). Soft-fail client: [`web/src/lib/casparser/client.ts`](../web/src/lib/casparser/client.ts).

| App route | Upstream |
| --- | --- |
| `POST /api/casparser/digilocker/init` | `/v1/kyc/digilocker/session` (+ account lookup) |
| `POST /api/casparser/digilocker/apply` | `/v1/kyc/digilocker/result/{id}` + `/v1/kyc/pan/status` |
| `POST /api/casparser/cdsl/otp` | `/v4/cdsl/fetch` |
| `POST /api/casparser/cdsl/verify` | `/v4/cdsl/fetch/{id}/verify` then `/v4/smart/parse` |
| `POST /api/casparser/token` | `/v1/token` → short-lived `at_` for Portfolio Connect |
| `POST /api/casparser/generate` | `/v4/generate` → Detailed MF CAS mailback |
| `POST /api/casparser/inbox/connect` | `/v4/inbox/connect` → Gmail OAuth URL |
| `GET /api/casparser/inbox/callback` | Stores `inbox_token` server-side; redirects to `/filing` |
| `GET|POST /api/casparser/inbox/list` | `/v4/inbox/cas` or `/v4/inbox/status` (token never to browser) |
| `POST /api/casparser/inbox/apply` | `/v4/smart/parse` + shared CAS pipeline |
| `POST /api/casparser/inbox/disconnect` | `/v4/inbox/disconnect` + clear DB row |
| `POST /api/pay/verify` | Razorpay Checkout.js signature → entitlement |
| `POST /api/pay/webhook` | `payment.captured` signature → entitlement |

The filing wizard embeds `@cas-parser/connect` (`PortfolioImport`). The browser
only receives the minted access token — never `CASPARSER_API_KEY`. Gmail
`inbox_token` is stored in `cas_inbox_token` and never returned to the client.

Local: keep `DIGILOCKER_MOCK=1` so DigiLocker consent works on `http://localhost`.
Live DigiLocker on your phone needs HTTPS (ngrok) + `DIGILOCKER_MOCK=0` and a
redirect to `/filing/digilocker/callback`. CDSL needs a 16-digit BO ID + SMS OTP
and a real API key. CAS Generator and Gmail inbox import soft-fail without
`CASPARSER_API_KEY`. Apply the `cas_inbox_token` table from `web/supabase-schema.sql`
before using Gmail connect in a Supabase project.
