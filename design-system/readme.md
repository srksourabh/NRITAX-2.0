# NRITAX 2.0 — Design System

**Product:** NRITAX 2.0 · **Domain:** income tax return filing and compliance, India · **Version:** 1.0
**Surfaces covered here:** marketing site, filing application. (The expert console and mobile web are governed by the same tokens but have no kit yet.)

NRITAX 2.0 lets an Indian taxpayer file a correct income tax return without opening the departmental utility. The user uploads Form 16, 26AS and AIS, answers plain questions, sees both tax regimes compared side by side, and files. A CA can take over at any point.

Three facts shape every decision in this system:

1. **Most users arrive on a phone.** Mobile is the primary layout; desktop is the expansion.
2. **The user does not trust the number until they can see how it was reached.** Every computed figure traces to a line item and a section of the Act. Opacity reads as a scam in this category.
3. **The product is used once a year under deadline pressure.** Nothing relies on learned behaviour. Every screen has to be legible cold.

The register is the **accountant's ledger / filing sheet**, not the fintech dashboard: cool paper, official ink, seal-green CTAs, right-aligned monospaced figures, statute references in the margin. Calm, dense, slightly institutional. It does not make tax fun; it makes tax legible.

---

## Sources this system was built from

| Source | What it gave us |
|---|---|
| A written brand and design brief supplied in the project prompt ("DESIGN", v1.0) | The entire foundation: palette with measured contrast ratios, type scale, spacing, radii, elevation, motion, component behaviour, filing status taxonomy, deadline tiers, voice rules, accessibility targets |
| `uploads/*.jpg` — 15 stock photographs (rupee notes, tax paperwork, desks, spreadsheets) | Imagery library, copied to `assets/imagery/` |

**No codebase, Figma file, font binaries or slide template were provided originally.** Palette and chrome now follow the departmental ITR filing-sheet model (ink mast, seal CTA) plus the written brief. Where the brief and this implementation could differ on filing-sheet chrome, the filing-sheet model wins.

### Gaps and substitutions, flagged

- **Logo.** Circular seal mark (`assets/logo/nritax-seal.svg`) — ink disc, seal-green ring, mono `NT` / `2.0`. Wired in the web app as `NritaxSeal`, `/logo.svg`, and Next `icon` / `apple-icon` routes.
- **No font binaries.** Archivo (variable, width axis pinned to `wdth 125` for "Expanded"), IBM Plex Sans, IBM Plex Mono and IBM Plex Sans Devanagari all load from Google Fonts in `tokens/fonts.css`. The brief calls for self-hosted, subset files — send them and the `@import` becomes real `@font-face` rules.
- **No icon set.** See [Iconography](#iconography).
- **Stock imagery conflicts with the brief.** The brief says marketing should use real product screens and a redacted acknowledgement, "no stock photos of people pointing at phones". The 15 supplied photos are kept in `assets/imagery/` and are only used in the imagery specimen card; the marketing kit uses the ledger and the acknowledgement as its imagery instead.
- **Certification numbers are placeholders** (`ERIP00XXXX`, `Cert. XXXXXX`). Never ship a mark the company does not hold.

---

## Content fundamentals

**Person and tone.** Address the user as **you**. Never `assessee`, `taxpayer` or `the user`. The voice is a competent accountant explaining your own numbers back to you: direct, unhurried, never chirpy, never apologetic.

**Lead with the number, follow with the explanation.**
> You get ₹8,557 back. Here is how we reached that.

**Casing.** Sentence case everywhere — headings, buttons, labels, pills. ALL CAPS only for form codes: `PAN`, `TDS`, `AIS`, `ITR`, `TAN`, `IFSC`. Statute references are written the way the department writes them: `u/s 80C`, `s.288A`, `s.139(9)`, `26AS`.

**Buttons name the outcome, and the confirmation echoes the verb.**
> `File my return` → `Filed`. Never `Submit`, never `Continue` where a real outcome exists.

**Errors state the cause and the fix, without apology.**
> `PAN must be 10 characters. You entered 9.`
> `This file has 0 pages we could read. It may be a scan. Try a clearer photo, or enter the figures yourself.`
> Not: `Oops, something went wrong.`

**Honesty rules that are copy rules.**
- Never promise a refund before processing: `Refund due` before, `Refund credited` after.
- Never claim savings the product did not create: `The new regime is lower for you this year` — not `We saved you ₹28,400`.
- Statute references are shown, not explained inline. The margin carries `s.80C`; the Explainer carries the meaning, in two plain sentences.
- Every status states a state, never a brand adjective. `Filed, verify within 30 days` — not `All done!`

**Emoji: never.** Not in product, not in marketing, not in empty states. The only glyphs used as marks are `✓` inside a completed step or a plan list, and `₹`.

**Banned words:** empower, unlock, seamless, effortless, revolutionise, streamline, hassle-free, "take your X to the next level", "built for the modern Y". **Em-dashes are not used anywhere in the product's copy.**

**Numbers in prose vs numbers in columns.** Plex Sans for numbers inside a sentence ("You saved ₹28,400 this year"); Plex Mono for any number in a column, table, ledger or hero. The two never mix inside one column. Indian digit grouping always, through `Intl.NumberFormat('en-IN')`: `₹12,34,567`, never `₹1,234,567`. No paise anywhere. Compact `L` / `Cr` forms are allowed in chips and chart axes only, and are **forbidden** on the computation sheet, review screen, challan screen and acknowledgement.

---

## Visual foundations

**The signature: the Computation Sheet.** Wherever a tax figure appears — marketing hero, summary card, final review — it is rendered as a fragment of a ledger: label on the left, statute or source reference in a margin column, right-aligned monospaced amount in a fixed 140px column. Rules encode meaning and are never decorative:

- **Hairline rule** (1px `--rule`) closes a subtotal group.
- **Double rule** (two 1px `--ink` lines, 3px apart) appears **exactly once per sheet**, under the final payable or refundable figure, and nowhere else in the product.
- **Left margin column** carries `u/s 80C`, `Form 16 Part B`, `AIS`, `26AS` — the thing that converts a number into a claim the user can verify.

**Secondary motif: the character box.** PAN, TAN, Aadhaar and IFSC are entered into per-character boxes (40×44, 6px gap, 14px group gap, 3px radius) mirroring the physical form. It cuts transposition errors on the four identifiers that block a filing.

**Colour.** Seven core values — `ink #141C29`, `primary #1B5E9C` (optional / informational blue), `credit` / `seal #0D6B5B` (filled CTA and confirmed refunds), `due #9A6212`, `notice #B3261E`, `paper #F5F6F8`, `surface #FFFFFF` — over a cool ink-cast neutral ramp. Never `#000000`. Tax-specific rules: a **payable figure is ink, never red** (owing tax is not an error); **seal green is for primary CTAs, confirmed refunds, verifications and completions**; the regime comparison never colours the loser. `neutral-400` is excluded from text use — placeholders use `neutral-500`. **The semantic tints are only valid on `surface` and `paper`**: pills on the shell header use `StatusPill onInk` — surface text on a 10% white fill over `ink`, with the state colour carried by the dot (`credit #8FE3D0`, `due #D89A3C`, `notice #F08279`). Focus ring is seal-tinted: `0 0 0 3px rgba(13,107,91,0.22)`.

**Chrome.** The only dark region in the app is the `ink` masthead with a **3px `seal` bottom border** and the circular seal logo (`assets/logo/nritax-seal.svg` / `SealMark`) beside the `NRITAX 2.0` wordmark. Marketing may add one full-bleed `ink` band and a `primary-800` footer — no more. No gradients. No textures, patterns or grain. No illustrations. `primary-50` and `primary-100` are the only tinted backgrounds allowed for informational surfaces.

**Type.** Three families, three jobs. **Archivo Expanded** (600/700) for display only, at or above 28px and in the wordmark — never in body, labels, buttons or tables. **IBM Plex Sans** (400/500/600) for all UI and body. **IBM Plex Mono** (400/500) for every figure, statute reference and identifier. **IBM Plex Sans Devanagari** for Hindi, metrically matched, line heights 0.1 higher. Body never below 13px. No fourth typeface. Brand name is always **NRITAX 2.0** (never NRITAX.AI).

**Backgrounds.** `paper` is the canvas on both surfaces. `surface` is the working sheet.

**Imagery.** Documentary and cool: paper, folders, desks, currency. Slightly desaturated (`saturate(0.85)`), never warm-graded, never lifestyle. Preferred marketing imagery is a real product screen or a redacted acknowledgement, not a photograph.

**Cards.** `surface` fill, 1px `neutral-200` border, 12px radius, **no shadow at rest**. Borders carry separation; shadows carry float. A ledger block sits square-cornered inside the rounded card — that soft-container/hard-sheet contrast is intentional and consistent.

**Shadows.** Three only: `raised` for dropdowns and popovers, `overlay` (`0 16px 32px -8px rgba(20,28,41,0.14)` with a `rgba(20,28,41,0.44)` backdrop) for modals and sheets, `sticky` (a top hairline, no blur) for action bars. No inner shadows anywhere.

**Transparency and blur.** Transparency only in semantic tints, the modal backdrop and nav text on ink. **No backdrop blur anywhere** — no frosted bars, no protection gradients. Sticky bars are opaque `surface` with a hairline.

**Radii.** `0` ledger rules, table cell edges; `3px` character boxes, statute chips; `5px` buttons and mast actions (`--radius-control`); `6px` inputs, checkboxes; `8px` schedule cards, dropdowns; `12px` cards, upload zones; `16px` modals and sheets; `full` pills, avatars, progress tracks. Primary buttons are not pills.

**Hover, press, focus.** Hover on a primary button darkens to `seal-2`; a secondary fills `neutral-50` and its border darkens; an interactive card changes border to `primary-200` and fill to `neutral-50`. **Nothing lifts, nothing scales, nothing shrinks on press** — the press state is the darker colour plus the focus ring. Focus is `0 0 0 3px rgba(13,107,91,0.22)` plus a 1px `seal` or `primary` border as appropriate, `rgba(179,38,30,0.38)` on destructive controls, visible on every interactive element including the active character box.

**Motion.** `instant` 100ms linear (colour, border), `quick` 150ms (hover, focus, chip), `panel` 220ms (drawers, sheets, accordions), and `stamp` 180ms `cubic-bezier(0.16,1,0.3,1)` — used **once per return**, on the acknowledgement: scale 1.06 → 1, opacity 0 → 1, −1.5deg → 0. No scroll-triggered reveals, no parallax, no marquees, no staggered entrances. The only continuous animation permitted is the indeterminate bar while a document is parsed. `prefers-reduced-motion: reduce` collapses everything to a 100ms opacity change.

**Layout.** Base unit 4px, rhythm on 8px. Page gutters 16/24/40px. Content max widths: app 1120px, reading 680px, ledger sheet 720px. Section rhythm 32/48/64px in the app, 64–96px on marketing. Breakpoints 480/768/1024/1280. Every screen holds at 360px with no horizontal scroll and at 200% zoom. The only fixed/sticky elements are the shell header, the mobile action bar and the desktop review footer.

---

## Iconography

**The sources contain no icon set, no icon font and no SVG assets.** Nothing was drawn to fill the gap. What the system uses instead:

- **Glyphs drawn in CSS** for the two marks that must exist inside primitives: the select chevron (a rotated 1.5px `neutral-400` border box) and the checkbox tick (two 2px `surface` borders). Both live inside their component and take their weight from the border, so they scale with the token.
- **Unicode, sparingly:** `✓` for a completed step and for plan list items, `₹` as the currency prefix. Nothing else.
- **Status is text, never an icon.** Every state carries its label; colour is reinforcement only. Roughly 8% of Indian men have a red-green deficiency and this product's two most important states are green and red.
- **No emoji, ever.**

**Recommended substitution if an icon set is genuinely needed:** [Lucide](https://lucide.dev) at 1.5px stroke, 20px, coloured `neutral-500` for decoration or `currentColor` inside a control — its flat, unrounded, engineered line matches Plex Sans and the institutional register better than a filled or rounded set. **This is a substitution, not brand truth — flagged for your confirmation.** Load it from CDN (`https://unpkg.com/lucide@latest`) rather than hand-rolling SVGs, and keep icons out of the ledger entirely: a computation sheet has no icons.

---

## Index

### Root
| File | What it is |
|---|---|
| `styles.css` | The one stylesheet consumers link. `@import` lines only. |
| `readme.md` | This file. |
| `SKILL.md` | Agent Skills front matter, for use in Claude Code. |
| `thumbnail.html` | Homepage tile. |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css` |
| `assets/imagery/` | The 15 supplied photographs. |
| `assets/logo/` | Circular seal mark (`nritax-seal.svg`) — ink disc, seal ring, mono NT / 2.0. |
| `guidelines/` | 22 specimen cards feeding the Design System tab (Colors, Type, Spacing, Brand). |

### Components

`components/core/` — **Button**, **Card** (+ **CardHeader**), **StatusPill** (+ `FILING_STATUSES`), **StatuteChip**, **EmptyState**
`components/forms/` — **Input**, **MoneyInput** (+ `formatINR`, `amountInWords`), **CharacterBoxInput** (+ `maskAadhaar`), **Select**, **Checkbox**, **RadioGroup**, **Switch**
`components/ledger/` — **LedgerBlock** (+ **LedgerRow**, `formatFigure`), **HeroFigure**, **RegimeComparison**, **DataTable**
`components/filing/` — **FilingProgress** (+ `FILING_STEPS`), **DocumentUpload**, **DeadlineBanner** (+ `deadlineTier`), **TrustBar**, **Acknowledgement**
`components/feedback/` — **Explainer**, **Dialog**, **ExpertPanel**
`components/navigation/` — **AppShell**, **BrandLockup**, **SealMark**, **Wordmark**, **StickyActionBar**

Each directory holds `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` and one `@dsCard` HTML.

**Intentional additions** (defined by the brief's behaviour but not named as components in it): `HeroFigure` (the brief's `figure-xl` refund/payable figure, which appears on four screens), `Acknowledgement` (the brief's stamp moment, which needs a home), `AppShell` / `BrandLockup` / `SealMark` / `Wordmark` / `StickyActionBar` (filing-sheet masthead chrome), `StatuteChip` (the margin reference, used by three other components).

### UI kits
| Kit | Entry | Screens |
|---|---|---|
| Filing application | `ui_kits/filing_app/index.html` | My returns, Your details, Income, Review, File and verify |
| Marketing site | `ui_kits/marketing_site/index.html` | Home (live regime computation), Pricing, Guide article |

Both are click-through and compose the published components. No slide template was provided, so no sample slides exist.

### Governing rules kept in the brief, not restated here
Filing lifecycle status taxonomy (14 states — do not ship a status outside it), deadline tiers, the liability chain, the two statutory roundings, WCAG 2.2 AA targets and the session/accessibility requirements. The brief is the normative document; this system implements it.
