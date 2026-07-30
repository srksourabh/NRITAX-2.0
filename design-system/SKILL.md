---
name: nritax-design
description: Use this skill to generate well-branded interfaces and assets for NRITAX 2.0, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

This folder is the NRITAX 2.0 design system root.

Read `readme.md` in this directory, and explore `tokens/`, `components/`, `guidelines/`, and `ui_kits/`.

## Filing-sheet non-negotiables

- Brand name is always **NRITAX 2.0** (never NRITAX.AI).
- Core palette: ink `#141C29`, primary/opt `#1B5E9C`, credit/seal `#0D6B5B`, due `#9A6212`, notice `#B3261E`, paper `#F5F6F8`, surface `#FFFFFF`.
- Filled primary CTA = **seal** green (`--seal` / `--seal-2`), radius `--radius-control` (5px).
- Masthead = ink bar + **3px seal bottom border** + circular seal (`assets/logo/nritax-seal.svg` / `SealMark`) + wordmark.
- Quiet/link controls and form focus may use opt blue (`--primary`).
- Mobile-first; no horizontal scroll at 360px.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code in `web/`, keep tokens here as the source of truth (the app imports them) and follow the Cursor skill at `.cursor/skills/nritax-design/SKILL.md`.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
