import type { OnboardingData, OnboardingErrors } from "../types/onboarding";

export function validateOnboardingStep(stepIndex: number, data: OnboardingData): OnboardingErrors {
  const errors: OnboardingErrors = {};

  if (stepIndex === 0) {
    if (data.fullName.trim().length < 2) {
      errors.fullName = "Enter the user's full name.";
    }

    if (data.country.trim().length < 2) {
      errors.country = "Enter the country of residence.";
    }

    if (!data.panAvailability) {
      errors.panAvailability = "Select PAN availability.";
    }
  }

  if (stepIndex === 1) {
    if (!data.taxRegime) {
      errors.taxRegime = "Select a tax regime preference.";
    }

    if (data.incomeSources.length === 0) {
      errors.incomeSources = "Select at least one income source.";
    }
  }

  if (stepIndex === 2 && !data.credentialStatus) {
    errors.credentialStatus = "Select whether the user has Income Tax Department portal access.";
  }

  return errors;
}

export function hasValidationErrors(errors: OnboardingErrors) {
  return Object.keys(errors).length > 0;
}
