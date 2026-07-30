---
name: nritax-design
description: >-
  Use this skill whenever designing, building, restyling, or reviewing NRITAX 2.0
  UI — marketing pages, the filing app, components, tokens, copy, or HTML mocks.
  The canonical design system lives at design-system/ in this repo.
---

# NRITAX 2.0 design system

The product UI is governed by **`design-system/`** at the repo root. That folder is the source of truth. Do not invent a parallel palette, type scale, or component look.

## Before writing UI

1. Read `design-system/readme.md` (brand voice, ledger rules, colour/type/motion law).
2. Use tokens from `design-system/tokens/` — already imported into `web/src/app/globals.css`. Prefer `var(--token)` and existing `.ntx-*` classes.
3. For component behaviour and API, read the matching files under `design-system/components/` (`*.jsx`, `*.d.ts`, `*.prompt.md`).
4. For screen composition, study `design-system/ui_kits/filing_app/` and `design-system/ui_kits/marketing_site/`.

## Production rules (`web/`)

- Tokens: change them only in `design-system/tokens/` (and sync `web/design-system/tokens/` for the Vercel web root). Do not re-copy hex values into `globals.css`.
- Fonts: load via `next/font` in `web/src/app/layout.tsx` (Archivo + IBM Plex Sans/Mono). Do not add a Google Fonts `<link>` or import `tokens/fonts.css` into the app.
- App utilities (buttons, inputs, shell, badges) live as `.ntx-*` classes in `web/src/app/globals.css` and compose DS tokens. Prefer those classes over one-off Tailwind colour utilities.
- When porting a DS component into React/TSX, match the kit’s behaviour and tokens; put production components under `web/src/components/`. Keep kit JSX in `design-system/` as the reference.

## Non-negotiables (short)

- Brand name is always **NRITAX 2.0** (never NRITAX.AI).
- Register is the **accountant’s ledger / filing sheet**: cool paper, official ink, seal CTA, right-aligned mono figures, statute in the margin.
- Seven core colours only for meaning: `ink`, `primary` (opt blue), `credit`/`seal`, `due`, `notice`, `paper`, `surface`. No purple gradients, no glass, no decorative shadows at rest.
- Primary filled button = seal green (`--seal`), radius `--radius-control` (5px). Masthead = ink + 3px seal border + circular seal logo.
- Archivo Expanded only for display (≥28px) and the wordmark. Plex Sans for UI. Plex Mono for figures, statutes, identifiers.
- Sentence case. No emoji. Outcome-named buttons. Errors state cause + fix.
- Double rule appears **once per sheet**, under the final payable/refund figure.
- Indian digit grouping via `Intl.NumberFormat('en-IN')`. Whole rupees only.
- Mobile-first React; usable at 360px with no horizontal scroll.

## Artifacts

For throwaway mocks, copy assets from `design-system/assets/` and link `design-system/styles.css`. For production work, implement in `web/` against the tokens and `.ntx-*` utilities.
