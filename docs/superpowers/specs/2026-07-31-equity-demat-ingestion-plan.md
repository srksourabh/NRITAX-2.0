# Equity / demat investment ingestion — research plan

**Status:** Research only (no implementation)  
**Date:** 2026-07-31  
**Audience:** Product + eng for NRITAX Phase fit  
**Related:** `docs/CONTRACTS.md`, `docs/intent/phase-1.md`, `docs/superpowers/plans/2026-07-30-phase-3-execution.md` (Sprint 4 contract notes)

---

## 1. Problem statement

NRITAX already fills **Schedule CG / 112A** from mutual-fund CAS well. Equity and demat shares are the gap.

| Source | What it gives today | Gap for equity CG |
| --- | --- | --- |
| **Detailed CAMS / KFintech CAS** (`services/cas` + upload) | FIFO buy/sell on MF schemes → STCG/LTCG + 112A | No listed equity shares |
| **casparser.in smart-parse / CDSL OTP / Portfolio Connect** | Investor + **holdings** across demat (equities, bonds, demat MF); MF folios often have txn history | Equity `transactions` are documented as **beta**; CDSL/NSDL eCAS is holdings-first. When txns missing, app soft-applies metadata and warns — **no realised gains** |
| **Local open-source `casparser` service** | Explicitly **rejects** NSDL/CDSL depositories (`UNSUPPORTED_FORMAT`) | Same: holdings, not MF-style FIFO |
| **AIS / Form 26AS import** | Credits / info statements for TDS and some income signals | Not FIFO cost basis; not Schedule 112A scrip rows |
| **Sandbox DigiLocker / OCR** | Identity (PAN/Aadhaar); Form 16 / 26AS OCR → salary/TDS | DigiLocker does **not** pull demat trade history. Tax-PnL product exists but is **not wired** in `web/src/lib/sandbox` |
| **Broker Tax P&L / tradebook / contract notes** | Industry standard for equity CG (Zerodha Console, etc.) | Contract-note API exists at casparser; Phase 3 Sprint 4 planned but **not built**. Sandbox tax-PnL needs a tradebook you already have |

**Root cause:** Filing needs **buy + sell + cost + STT/listed flags** for FIFO and 112A grandfathering. Depository eCAS answers “what do I hold?”; MF Detailed CAS answers “what did I buy/sell in folios?”. Equity needs **broker trade history** (contract notes, tradebook, or Tax P&L), not another holdings snapshot.

**NRI twist:** CDSL OTP needs a **CDSL BO ID + Indian SMS**. NSDL-only or dormant CDSL users cannot use OTP fetch. Generator / Gmail / manual upload remain more NRI-friendly for MF; equity still needs broker exports.

---

## 2. What the codebase already does

### Enrichment surface (`EnrichmentPanels` + related)

- Prefill JSON, Sandbox enrich (PAN/IFSC), DigiLocker apply, Form 16/26AS OCR, AIS/26AS JSON paste, CAS PDF upload, demo CAS fetch, Auto-fill (DigiLocker + CDSL OTP), `PortfolioImport` (`@cas-parser/connect`).
- All paths soft-fail; manual Schedule CG stays open (`docs/intent/phase-1.md`).

### Unified CG apply path

1. Source → `CasParseResult` (`web/src/lib/cas/types.ts`)
2. `applyCasPipeline` / `applyCasToReturn` → Schedule CG + 112A tables
3. Smart-parse: `mapSmartParseTransactions` reads MF `transactions` **and** demat holding `transactions` when present; empty → warning only (`map-smart-parse.ts`)
4. Portfolio Connect: same mapper; incomplete gains warning (`map-portfolio-connect.ts`)

### Planned but not shipped (Phase 3 plan)

- `POST /v4/contract_note/parse` → `web/src/lib/casparser/contract-note.ts` + EnrichmentPanels upload
- Gmail inbox CAS import
- MF generator mailback
- Dedupe when CAS + contract notes both applied

### Out of scope today for equity

- Sandbox `/it/calculator/tax-pnl/securities/domestic` (named in `CONTRACTS.md`, no client methods)
- Quicko/Suvit as **data** providers (ERI names only: filing upload later, not trade import)
- Public CDSL/NSDL “give me all trades” REST for third-party apps (depository portals are OTP/manual; CDSL “APIs” page is DP/issuer oriented, not retail tax ingest)

---

## 3. External options (researched)

### A. casparser.in — stay on vendor, add equity-grade sources

| Product | Fit |
| --- | --- |
| **Contract note parse** (`/v4/contract_note/parse`) | Best equity signal: Zerodha, Groww, Upstox, ICICI Direct; ISIN, buy/sell qty/WAP, STT, charges. Explicit tax use case in their docs. |
| **CDSL OTP + smart-parse** | Already wired. Good for **holdings / AL / identity**; weak for realised equity CG unless beta txns are complete for the FY. Cross-depository holdings (CDSL+NSDL) when user has a CDSL BO. |
| **NSDL/CDSL PDF upload** | Same schema as OTP; still holdings-primary. |
| **Portfolio Connect** | UX wrapper; same data limits as underlying CAS. |
| **Gmail inbox / generator** | Helps **MF** Detailed CAS for NRIs; not a substitute for equity tradebooks. |

### B. Sandbox.co.in — Tax PnL / capital gains reports

| Product | Fit |
| --- | --- |
| **Domestic securities Tax P&L** (async job: tradebook or tradewise_settlement → scripwise / tradewise tax PnL) | Strong **calculator** once you have a structured tradebook (stocks, MF, ETF, F&O, bonds). Outputs align with Schedule CG rate buckets / 112A-style numbers. |
| **Capital gains reports** (`/it/reports/capital-gains/securities/domestic`) | Same input family; XLSX/JSON for review. |
| **Foreign securities Tax P&L** | Relevant for NRI foreign holdings later — not Phase 1 demat India equity. |
| **DigiLocker** | KYC docs only; **not** demat txn feed. |
| **Form 26AS OCR** | Credits; partial equity **sale/TDS** signal at best. |

**Critical:** Sandbox does **not** fetch broker or demat data. You upload annexures. Pair with casparser contract notes (or broker CSV) as the ingest front-end, Sandbox optional as second opinion / F&O engine.

### C. Broker-native Tax P&L / tradebook (user download)

Zerodha Console (and peers) already ship Tax P&L, tradebook, contract notes, Annual Global Statement. Lowest ToS risk: user downloads, NRITAX parses/maps.

### D. AIS / 26AS

Useful for **reconciliation** (dividends, some securities income, TDS) and AI review flags — not primary CG computation.

### E. Quicko / Suvit / ERI partners

Scaffolded as **filing** providers (`ERI_PROVIDER`), not investment ingest. Do not confuse with demat collection unless a future partner contract includes portfolio APIs.

### F. Direct CDSL/NSDL APIs

Not a viable product path for NRITAX today: no simple third-party “all equity trades for PAN” API; OTP portals remain the fetch surface (already proxied by casparser for CDSL).

---

## 4. Recommended approaches (2–3)

### Approach 1 — **Primary: casparser contract notes (+ optional broker Tax P&L / tradebook CSV)** (recommended)

**Flow:** User uploads one or more contract-note PDFs (or later: yearly Tax P&L / tradebook export) → parse → `LotTxn[]` → existing FIFO / `gainsFromMappedTransactions` → merge into `CasParseResult` → `applyCasToReturn`.

| Pros | Cons |
| --- | --- |
| Same vendor already in Pro plan / Phase 3 Sprint 4 | Many PDFs for active traders; multi-broker = multi-upload |
| Real buy/sell + STT for 111A/112A | Brokers beyond Zerodha/Groww/Upstox/ICICI need fallback |
| Fits EnrichmentPanels soft-fail pattern | Must dedupe vs MF CAS and across notes |
| NRI-friendly (email PDFs; no Indian OTP required) | Opening cost for sells before statement history still hard |

### Approach 2 — **Sandbox Tax PnL as calculation backend**

**Flow:** Build or map a Sandbox tradebook (from contract notes / CSV) → submit job → map scripwise PnL into Schedule CG / 112A.

| Pros | Cons |
| --- | --- |
| Handles F&O / mixed assets; indexation helpers | **No data fetch** — still need Approach 1 (or manual CSV) |
| Documented annexure schemas | Second vendor, async jobs, auth/Bearer vs existing Sandbox quirks |
| Complements CAS for equity | Mapping Sandbox output → departmental paths is non-trivial |

Use as **Phase 2+** if in-house FIFO is insufficient for F&O or foreign, or as a validation cross-check — not as the first equity ingest.

### Approach 3 — **Holdings-only demat (CDSL/Portfolio Connect) + manual / AI assist for CG**

**Flow:** Keep CDSL for Schedule AL / “held unlisted?” / awareness; user pastes Tax P&L totals or fills CG by hand; AI review flags mismatch vs AIS.

| Pros | Cons |
| --- | --- |
| Already mostly built | Does **not** solve realised equity CG |
| Low risk | Poor NRI UX for equity-heavy returns |

Treat as **supporting**, not the equity solution.

---

## 5. Clear recommendation for NRITAX Phase fit

| Phase | What to do |
| --- | --- |
| **Phase 1 (now)** | Keep MF Detailed CAS as CG source of truth. Document equity gap in UX. Do **not** block wizard. |
| **Next enrichment sprint (align Phase 3 Sprint 4)** | Ship **Approach 1**: contract-note parse → lot engine → CG/112A, additive merge + dedupe warnings. Prefer this over Sandbox Tax PnL first. |
| **Same sprint / soon after** | Optional: accept **broker Tax P&L / tradebook CSV** (Zerodha-shaped) mapped to `LotTxn` if contract-note volume is painful. |
| **Later** | Sandbox domestic Tax PnL for F&O / cross-check; Gmail for MF; AIS reconcile. Quicko only after ERI contract for **filing**, not ingest. |

**Do not** expect CDSL OTP or Portfolio Connect alone to “collect all investments” for tax. They collect **portfolio snapshots**; equity tax needs **trade history**.

---

## 6. Integration points

```text
EnrichmentPanels / PortfolioImport / AutoFillPanel
        │
        ├─ MF Detailed CAS PDF ──► services/cas OR casparser smart-parse
        ├─ CDSL OTP / Connect ──► holdings (+ beta txns if any)
        ├─ NEW: contract notes ──► casparser /v4/contract_note/parse
        └─ LATER: tradebook CSV / Sandbox tax-pnl job
                │
                ▼
        LotTxn[] ──► gainsFromMappedTransactions
                │
                ▼
        CasParseResult ──► applyCasPipeline ──► applyCasToReturn
                │
                ▼
        Schedule CG + Schedule 112A (+ warnings)
```

| Module | Change (when implementing) |
| --- | --- |
| `web/src/lib/casparser/client.ts` | `parseContractNote` soft-fail |
| `web/src/lib/casparser/contract-note.ts` (new) | Map `equity_transactions` / `detailed_trades` → `MappedLotTxn` |
| `web/src/lib/cas/pipeline.ts` | Merge equity gains with MF CAS; dedupe ISIN+date+qty |
| `EnrichmentPanels.tsx` | “Upload contract notes / Tax P&L” section |
| `docs/CONTRACTS.md` | Document equity path; keep Sandbox tax-pnl as optional complement |
| AIS panel | Optional reconcile-only, not CG writer |

---

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| **Consent / OTP** | CDSL OTP to demat mobile; keep optional. Contract notes need no OTP. |
| **ToS / scraping** | Prefer official casparser + user-uploaded PDFs; avoid scraping broker consoles. |
| **Data quality** | Beta demat txns incomplete → never invent cost. Warn loudly. |
| **Double count** | MF CAS + equity notes + demat CAS; dedupe + “replace vs merge” UX. |
| **Incomplete cost basis** | Pre-period buys; corporate actions; gifts — warn + manual override. |
| **112A FMV 31-Jan-2018** | Same gap as MF service; optional FMV column / later lookup. |
| **NRI** | No Indian mobile → skip CDSL; email contract notes / Console Tax P&L. |
| **Sandbox DigiLocker** | Identity only; do not market as investment fetch. |
| **Credits / cost** | Cache parses; prefer yearly Tax P&L over hundreds of daily notes when available. |

---

## 8. Suggested phased rollout

### Phase A — Honesty + MF solid (current)

1. UX copy: CDSL / Portfolio Connect = holdings; Detailed MF CAS = MF gains; equity = upload broker Tax P&L or contract notes (coming) / enter CG manually.
2. Keep soft-fail; no fake equity gains from holdings.

### Phase B — Contract notes → CG (highest ROI)

1. Soft-fail API + mapper + EnrichmentPanels upload (multi-file).
2. FIFO via existing lot engine; STT → 111A/112A classification.
3. Dedupe vs prior CAS apply; golden fixture: one Zerodha note → 112A row.
4. Exit: equity sale in FY appears on Schedule CG without hand entry.

### Phase C — Lower friction for heavy traders

1. Broker Tax P&L / tradebook CSV (start Zerodha).
2. Optional Sandbox Tax PnL job for F&O / second opinion.
3. Gmail: pull contract notes + MF CAS where present.

### Phase D — Reconcile & harden

1. AIS/26AS vs reported CG mismatch flags in AI review.
2. Schedule AL from demat holdings (optional).
3. Partner ERI remains filing-only unless portfolio APIs appear in contract.

---

## 9. Decision summary

| Question | Answer |
| --- | --- |
| Does CAS “cash purses” / casparser cover shares? | **Holdings yes; realised equity CG no** (txns beta / often empty). |
| Alternate method? | **Yes — broker contract notes / Tax P&L tradebook**, via casparser (planned) and optionally Sandbox Tax PnL as calculator. |
| Sandbox DigiLocker for demat? | **No.** |
| Phase 1 blocker? | **No** — optional enrichment; manual CG remains. |
| Next build? | **Phase 3 Sprint 4 contract-note path** before Sandbox tax-pnl wiring. |

---

## Sources

- Repo: `docs/CONTRACTS.md`, `services/cas/README.md`, `web/src/lib/casparser/*`, `EnrichmentPanels.tsx`, `docs/superpowers/plans/2026-07-30-phase-3-execution.md`
- casparser.in docs: CDSL fetch, parsing, contract notes, smart-parse schema (`transactions` **beta** on demat equities)
- Sandbox docs: domestic securities Tax P&L / capital gains reports (tradebook input)
- Industry: Zerodha/CDSL/NSDL CAS = consolidated holdings; broker Tax P&L / contract notes for equity tax
