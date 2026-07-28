# ITR-2 vs ITR-3 — form selection

Source of truth for the choose screen, killer confirmation, and “I’m not sure” clarifying set.

**Assessment year context:** AY 2026-27 · FY 2025-26 (replace `{{FY}}` / `{{AY}}` in copy when the filing year changes).

**Product path:** Individuals and HUFs only (NRITAX Phase 1+). Company / firm returns are out of scope.

---

## Legal pivot

| Form | Use when |
| --- | --- |
| **ITR-3** | The filer has **profits and gains of business or profession** for the FY — including as a **partner** in a firm — or income that must be reported under the PGBP head (including presumptive schemes where applicable). |
| **ITR-2** | Individual / HUF **without** business or profession income. Typical heads: salary, house property, capital gains, other sources (and related schedules). |

Wrong form discovered late is costly. Prefer a short factual quiz over jargon labels when the user is unsure.

---

## Choose screen (three actions)

1. **ITR-2** — “No business or profession income this year.”
2. **ITR-3** — “I had business or profession income (including as a partner).”
3. **I’m not sure** — Opens the clarifying question set (never opens a track directly).

**Copy rules:** Sentence case. Buttons name outcomes. One plain-language gloss if a tax term appears. No emojis. No “AI-powered” framing.

---

## Killer confirmation (after a direct ITR-2 / ITR-3 pick)

Shown once before `openForm`. Plain language:

> In FY {{FY}}, did you have income from a **business or profession in India** (including as a **partner** in a firm)?

| Direct pick | Answer | Result |
| --- | --- | --- |
| ITR-2 | **No** | Pass → open ITR-2 |
| ITR-2 | **Yes** | Fail → clarifying set |
| ITR-2 | **Not sure** | → clarifying set |
| ITR-3 | **Yes** | Pass → open ITR-3 |
| ITR-3 | **No** | Fail → clarifying set |
| ITR-3 | **Not sure** | → clarifying set |

Secondary line under the question:

> Salary, house property, and capital gains alone are not business income. Mutual fund or share gains are usually capital gains, not business — unless you trade as a business.

---

## Clarifying set (“I’m not sure” or killer fail)

Ask in order. **Stop when a hard decision is reached.** Default undecided → keep asking until ITR-2 or ITR-3 is forced, or show a CA nudge if still ambiguous after the set.

### Q1 — Partner

**Did you receive any income as a partner in a firm during FY {{FY}}?**  
Yes → **ITR-3**. No → Q2. Not sure → treat as Yes for routing safety → **ITR-3**, with a flag to confirm with a CA.

### Q2 — Business or profession (PGBP)

**Did you run a business or profession in India this year** (shop, consultancy billed as business, freelancing treated as profession, coaching, agency, etc.)?  
Yes → **ITR-3**. No → Q3. Not sure → Q3 with note.

### Q3 — Presumptive

**Are you reporting (or required to report) income under a presumptive scheme** such as sections 44AD, 44ADA, or 44AE?  
Yes → **ITR-3**. No → Q4.

### Q4 — Speculative / F&O as business

**Did you have speculative business income or futures & options that you treat as business income** (not only as capital gains)?  
Yes → **ITR-3**. No → Q5.

### Q5 — One-time / wind-up still in FY

**Did a business or profession exist at any time in FY {{FY}}**, even if you closed it before year-end?  
Yes → **ITR-3**. No → Q6.

### Q6 — Only salary / HP / CG / OS

**Was your Indian income only from salary, house property, capital gains, and/or other sources** (interest, dividends, etc.) — with **no** business or profession head?  
Yes → **ITR-2**. No → stay on clarifying / recommend CA. Not sure → recommend CA; do not auto-open a track without an explicit pick.

---

## Edge-case table

| Situation | Form | Note |
| --- | --- | --- |
| Partner in firm (any share of profit / remuneration as partner) | ITR-3 | Even with little other Indian income |
| Presumptive 44AD / 44ADA / 44AE | ITR-3 | |
| One-time PGBP in FY then closed | ITR-3 | Still ITR-3 for that FY |
| Pure NRI: Indian salary + MF/share CG only | ITR-2 | |
| Foreign freelancing, no Indian PE / no Indian PGBP | Usually ITR-2 for this product if no Indian business head | Confirm foreign income disclosure rules separately; do not force ITR-3 only because work is “freelance” abroad |
| F&O / intraday treated as business | ITR-3 | If treated only as CG, quiz should not force ITR-3 from Q4 |
| Salary + one professional receipt wrongly called “business” | Quiz + killer | Prefer clarifying set over guessing |

---

## UI states (product)

```
choose
  ├─ pick ITR-2 / ITR-3 → killer confirmation
  │     ├─ pass → openForm(form)
  │     └─ fail / not sure → quiz
  └─ I’m not sure → quiz
        └─ resolve ITR-2 | ITR-3 → openForm(form)
```

Later safety net: AI full-form review may emit `wrong_form_suspected` (see `docs/prompts/itr-ai-full-form-review.md`).

---

## Related

- LTP record: [`thinking/2026-07-28-itr-form-selection.md`](./thinking/2026-07-28-itr-form-selection.md)
- Target journey: [`user-journey-target.md`](./user-journey-target.md)
- Phase 1 spine: [`user-journey-phase-1.md`](./user-journey-phase-1.md)
