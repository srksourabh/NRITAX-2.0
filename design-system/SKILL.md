---
name: nritax-design
description: Use this skill to generate well-branded interfaces and assets for NRITAX 2.0, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

This folder is the NRITAX 2.0 design system root.

Read `readme.md` in this directory, and explore `tokens/`, `components/`, `guidelines/`, and `ui_kits/`.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code in `web/`, keep tokens here as the source of truth (the app imports them) and follow the Cursor skill at `.cursor/skills/nritax-design/SKILL.md`.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
