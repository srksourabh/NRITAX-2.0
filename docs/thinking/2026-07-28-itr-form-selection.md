# LTP — ITR-2 vs ITR-3 form selection

Date: 2026-07-28  
Method: Logical Thinking Process (Dettmer / Goldratt)

## Phase 1 — Current Reality Tree

**UDE A:** Users pick the wrong form (ITR-2 vs ITR-3) and discover late.

**Causal chain:**

1. IF no reliable question set exists to decide ITR-2 vs ITR-3  
   THEN there is no trustworthy “I’m not sure → clarify” path  

2. IF there is no clarify path  
   THEN the product forces a direct ITR-2 / ITR-3 pick without enough guidance  

3. IF users must pick the form directly without clarifying questions  
   THEN they often choose wrong and discover it late  

**Root cause (confirmed):** No reliable written question set / decision rules for ITR-2 vs ITR-3.

## Phase 2 — Evaporating Cloud

| Box | Content |
| --- | --- |
| **A** | Correct track, minimal rework |
| **B** | Form choice must be accurate |
| **C** | Start must stay fast and light |
| **D** | Clarifying questionnaire (for accuracy) |
| **D′** | Show ITR-2 · ITR-3 · I’m not sure — confident users pick now; I’m not sure starts D |

**Conflict (narrow):** Always run D for everyone vs only run D on “I’m not sure.”

**Injection (accepted):** Three-choice start; clarifying questions **only** via “I’m not sure.”

## Phase 3 — Future Reality Tree

**IF** three choices are offered THEN confident users start fast.  
**IF** unsure users get a clarifying set THEN form choice is fact-driven.  
**IF** form matches facts earlier THEN UDE A shrinks.

**NBR:** Wrong-but-confident users still skip the quiz.

**Trim (accepted — A+C):**

1. After direct pick → one **killer confirmation** question; fail → clarifying set.  
2. Later → AI/form review flags **`wrong_form_suspected`** with warn/flag/block.

## Phase 4 — Prerequisite Tree

| Obstacle | Intermediate objective |
| --- | --- |
| No question set / rules | IO1 — Written decision rules + clarifying + killer |
| Unclear legal edge cases | IO2 — Edge-case table inside IO1 |
| No wrong-form flag in review | IO3 — Review prompt with warn/flag/block |
| Wizard UI is two cards only | IO4 — Three-choice + quiz + killer in FilingWizard |

**Order:** IO1+IO2 → IO3 → IO4

## Phase 5 — Transition Tree

1. Write `docs/itr-form-selection.md`  
2. Upgrade `docs/prompts/itr-ai-full-form-review.md`  
3. Save this LTP record  
4. Wire FilingWizard choose UX  
5. Sync target journey (+ preview note)

## Artifacts

- [`../itr-form-selection.md`](../itr-form-selection.md)
- [`../prompts/itr-ai-full-form-review.md`](../prompts/itr-ai-full-form-review.md)
- [`../user-journey-target.md`](../user-journey-target.md)
