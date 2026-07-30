# Marketing site — UI kit

Generous density (64px section rhythm), `paper` canvas with one full-bleed `ink` band (3px seal border on `SiteNav`) and a `primary-800` footer. Archivo Expanded at `display-xl` and `display-lg`. Primary CTA buttons are seal green.

## Screens

| File | Screen |
|---|---|
| `SiteChrome.jsx` | `SiteNav` (ink + seal border + BrandLockup) and `SiteFooter` (primary-800 with the trust bar) |
| `HomeScreen.jsx` | Hero with a live regime computation, the ledger band, four-step section, acknowledgement proof |
| `PricingScreen.jsx` | Three plans, the s.234F late-fee ledger, questions |
| `GuideScreen.jsx` | A guide article at the 680px reading width |

## Notes

The hero is the product, not a picture of it: the visitor types one figure and a real two-column regime comparison builds in place. The slab arithmetic in `HomeScreen.jsx` is illustrative only — in production the computation engine is a separate pure module and this design system never contains tax logic.

Certification marks show placeholder registration numbers. Replace them with real credentials or remove the mark.
