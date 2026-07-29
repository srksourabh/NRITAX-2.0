# NRITAX.AI 2.0 Frontend Foundation

This folder contains the initial frontend foundation for **NRITAX.AI 2.0**, an NRI income tax filing platform. It is prepared as a clean, standalone React + TypeScript + Tailwind CSS implementation that can later be added to the official GitHub repository after access is available.

No backend code is included.

## Purpose

The goal is to provide the first implementation-ready landing page and basic onboarding flow for NRITAX.AI 2.0.

The page communicates:

- AI-assisted NRI income tax filing
- Simple tax preparation workflow
- Secure and guided filing experience
- Future CA review support
- Future automated filing workflow readiness

## User Flow

1. User lands on the NRITAX.AI 2.0 landing page.
2. User reviews the hero section, trust cards, and workflow steps.
3. User clicks **Start Filing**.
4. User completes a four-step onboarding form:
   - Step 1: Full Name and Country of Residence
   - Step 2: PAN Number
   - Step 3: Tax Regime preference
   - Step 4: Income Tax Department credential availability
5. User sees a frontend-only success summary after submission.
6. Final submission calls mock async service adapters for validation and JSON draft preparation.

## Security Considerations

This implementation follows the important security requirement:

- No password field is created.
- No Income Tax Department password is collected.
- No credential storage is implemented.
- The form only asks whether the user has Income Tax Department login credentials.

Visible user message:

> NRITAX.AI never asks for or stores your Income Tax Department password.

PAN is currently stored only in local React component state. It should not be persisted until backend security, consent, and privacy controls are finalized.

## Components Created

```text
src/
  App.tsx
  main.tsx
  styles.css
  components/
    Navbar.tsx
    Hero.tsx
    Features.tsx
    HowItWorks.tsx
    Trust.tsx
    CTA.tsx
    TaxOnboardingForm.tsx
    Footer.tsx
    form/
      FormField.tsx
      RadioCardGroup.tsx
      SecurityNotice.tsx
      StepProgress.tsx
  services/
    validationService.ts
    jsonGenerationService.ts
  types/
    onboarding.ts
  validation/
    onboardingValidation.ts
```

## Folder Structure

```text
nritax-ai-2-frontend-foundation/
  README.md
  index.html
  package-lock.json
  package.json
  postcss.config.js
  tailwind.config.ts
  tsconfig.json
  src/
    App.tsx
    main.tsx
    styles.css
    components/
      Navbar.tsx
      Hero.tsx
      Features.tsx
      HowItWorks.tsx
      Trust.tsx
      CTA.tsx
      TaxOnboardingForm.tsx
      Footer.tsx
      form/
        FormField.tsx
        RadioCardGroup.tsx
        SecurityNotice.tsx
        StepProgress.tsx
    services/
      validationService.ts
      jsonGenerationService.ts
    types/
      onboarding.ts
    validation/
      onboardingValidation.ts
```

## Installation Instructions

From this folder:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Screenshots Description

Recommended screenshots to capture for review:

1. **Desktop landing page hero**  
   Shows NRITAX.AI 2.0 branding, main heading, CTA, trust stats, and filing journey preview.

2. **Feature and workflow sections**  
   Shows four trust cards and the four-step "How it works" section.

3. **Mobile onboarding form**  
   Shows the responsive multi-step onboarding form at 320px width.

4. **Credential access step**  
   Shows the Income Tax Department credential availability question and the password safety message.

5. **Submission summary**  
   Shows the frontend-only onboarding draft confirmation state.

## Future API Integration Points

The current implementation is frontend-only. Future backend/API work can connect:

- Onboarding profile creation API
- Consent and EULA acceptance API
- PAN validation or masking service
- Country and residency rule lookup
- Tax regime recommendation logic
- Filing session creation API
- Data Validation Engine API
- JSON Preparation Engine API
- Secure document upload workflow
- CA review queue
- ERI filing workflow
- Analytics and funnel tracking

Suggested future endpoint examples:

```text
POST /api/v1/onboarding/profile
POST /api/v1/onboarding/consent
POST /api/v1/validation/onboarding
POST /api/v1/filing-json/drafts
POST /api/v1/filing-sessions
GET  /api/v1/tax-regimes/recommendation
POST /api/v1/ca-review/requests
```

### Mock Service Connection Notes

- `src/services/validationService.ts` currently exposes `validateOnboardingData()` with dummy async data. Replace this function body with Sourabh Sir's Data Validation Engine API call when the backend contract is available.
- `src/services/jsonGenerationService.ts` currently exposes `generateFilingJsonDraft()` with dummy async data. Replace this function body with Sourabh Sir's JSON Preparation Engine API call when the backend contract is available.
- The UI integration point is the final submit handler in `src/components/TaxOnboardingForm.tsx`.

## Implementation Summary

- Built a premium white/blue fintech-style landing page with hero, features, workflow, trust, CTA, and onboarding sections.
- Added reusable React components with TypeScript types.
- Added a clean mobile-first layout with Tailwind CSS.
- Added smooth entrance animations with reduced-motion support.
- Added a four-step onboarding form with typed state.
- Added reusable form components, TypeScript onboarding types, and client-side validation.
- Added mock async validation and JSON generation service adapters.
- Avoided backend implementation and password collection.
- Prepared the project as a Git-ready frontend foundation.

## Assumptions

- This implementation will later be merged into the official NRITAX.AI 2.0 repository after GitHub access is available.
- Backend APIs are not finalized yet.
- PAN handling, consent storage, and taxpayer data persistence require approved backend security and privacy design.
- Tax regime selection is captured as a preference only; no tax calculation logic is included.
